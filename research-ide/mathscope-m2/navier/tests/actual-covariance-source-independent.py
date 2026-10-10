#!/usr/bin/env python3
"""Independent source-covariance arithmetic.

Fraction Gaussian elimination checks the original augmented pressure system.
Decimal arithmetic verifies the moving frame against its independently
constructed derivative; a multivariate Fraction polynomial integrator checks
all finite Volterra terms. No source field is replaced by the small fixtures.
"""
from __future__ import annotations
import argparse, hashlib, json, subprocess
from collections import Counter
from decimal import Decimal, localcontext
from fractions import Fraction as F
from pathlib import Path

HERE=Path(__file__).resolve().parent
COUNTS=Counter()
def check(ok,message,category):
    if not ok: raise AssertionError(message)
    COUNTS[category]+=1

def plus(a,b):
    c=dict(a)
    for k,v in b.items():
        c[k]=c.get(k,F(0))+v
        if not c[k]:del c[k]
    return c

def product(a,b):
    c={}
    for ma,va in a.items():
        for mb,vb in b.items():
            d=dict(ma)
            for k,n in mb:d[k]=d.get(k,0)+n
            key=tuple(sorted(d.items()));c[key]=c.get(key,F(0))+va*vb
    return {k:v for k,v in c.items() if v}

def power(a,n):
    r={():F(1)}
    for _ in range(n):r=product(r,a)
    return r

def poly_integral(body,var,left,right):
    r={}
    for mon,c in body.items():
        d=dict(mon);n=d.pop(var,0)+1;base={tuple(sorted(d.items())):c/F(n)}
        boundary=plus(power(right,n),{k:-v for k,v in power(left,n).items()})
        r=plus(r,product(base,boundary))
    return r

def polynomial(nodes,id,cache):
    if id in cache:return cache[id]
    op,a=nodes[id]['op'],nodes[id]['args']
    if op=='rational':r={():F(a[0])/F(a[1])} if F(a[0]) else {}
    elif op=='coordinate':r={((id,1),):F(1)}
    elif op=='add':r=plus(polynomial(nodes,a[0],cache),polynomial(nodes,a[1],cache))
    elif op=='multiply':r=product(polynomial(nodes,a[0],cache),polynomial(nodes,a[1],cache))
    elif op=='integer_power':r=power(polynomial(nodes,a[0],cache),a[1])
    elif op=='inverse':
        p=polynomial(nodes,a[0],cache)
        if set(p)!={()}:raise AssertionError('nonconstant polynomial inverse')
        r={():1/p[()]}
    elif op=='definite_integral':r=poly_integral(polynomial(nodes,a[0],cache),a[1],polynomial(nodes,a[2],cache),polynomial(nodes,a[3],cache))
    else:raise AssertionError('unexpected polynomial opcode '+op)
    cache[id]=r;return r

def pvalue(p,env):
    return sum((v*__import__('functools').reduce(lambda x,kn:x*env[kn[0]]**kn[1],mon,F(1)) for mon,v in p.items()),F(0))

def qvalue(nodes,id,env,cache):
    if id in cache:return cache[id]
    op,a=nodes[id]['op'],nodes[id]['args'];v=lambda i:qvalue(nodes,i,env,cache)
    if op=='rational':r=F(a[0])/F(a[1])
    elif op=='coordinate':r=env[id]
    elif op=='add':r=sum(map(v,a),F(0))
    elif op=='multiply':r=__import__('functools').reduce(lambda x,i:x*v(i),a,F(1))
    elif op=='inverse':r=1/v(a[0])
    elif op=='integer_power':r=v(a[0])**a[1]
    elif op=='definite_integral':r=pvalue(polynomial(nodes,id,{}),env)
    else:raise AssertionError('unexpected rational opcode '+op)
    cache[id]=r;return r

def dec(x):
    x=F(x);return Decimal(x.numerator)/Decimal(x.denominator)

def dvalue(nodes,id,env,cache):
    if id in cache:return cache[id]
    op,a=nodes[id]['op'],nodes[id]['args'];v=lambda i:dvalue(nodes,i,env,cache)
    if op=='rational':r=Decimal(a[0])/Decimal(a[1])
    elif op=='coordinate':r=env[id]
    elif op=='add':r=sum(map(v,a),Decimal(0))
    elif op=='multiply':r=__import__('functools').reduce(lambda x,i:x*v(i),a,Decimal(1))
    elif op=='inverse':r=1/v(a[0])
    elif op=='integer_power':r=v(a[0])**a[1]
    elif op=='sqrt_positive':r=v(a[0]).sqrt()
    elif op=='exp':r=v(a[0]).exp()
    elif op=='log_positive':r=v(a[0]).ln()
    else:raise AssertionError('unexpected decimal opcode '+op)
    cache[id]=r;return r

def dot(a,b):return sum((x*y for x,y in zip(a,b)),0)
def matmul(a,b):return [[dot(row,col) for col in zip(*b)] for row in a]
def mv(a,v):return [dot(row,v) for row in a]
def solve(a,b):
    m=[list(row)+[v] for row,v in zip(a,b)];n=len(m)
    for j in range(n):
        p=next(i for i in range(j,n) if m[i][j]);m[j],m[p]=m[p],m[j];v=m[j][j];m[j]=[x/v for x in m[j]]
        for i in range(n):
            if i!=j:
                v=m[i][j];m[i]=[x-v*y for x,y in zip(m[i],m[j])]
    return [row[-1] for row in m]

def independent_frame(p,v,sign):
    one=Decimal(1);n=[p['x0']-v*p['HR'],p['p']/p['R'],p['pz']-p['epsilon']*v*p['HZ']]
    nd=[-p['HR'],Decimal(0),-p['epsilon']*p['HZ']];nt=(n[1]**2+n[2]**2).sqrt();ntd=(n[1]*nd[1]+n[2]*nd[2])/nt
    ka=[n[1]/nt,n[2]/nt];kad=[(nd[j+1]-ka[j]*ntd)/nt for j in range(2)];na=[ka[1],-ka[0]];nad=[kad[1],-kad[0]]
    sa=n[0]/nt;sad=(nd[0]-sa*ntd)/nt;s=sign*p['u']*(Decimal('.5')+v/p['Ls']);sd=sign*p['u']/p['Ls'];root=(1+s*s).sqrt();cc=p['c0']*root;ccd=p['c0']*s*sd/root
    B=[[one,one]];Bd=[[Decimal(0),Decimal(0)]]
    for j in range(2):
        B.append([-sa*ka[j]+cc*na[j],-sa*ka[j]-cc*na[j]])
        Bd.append([-sad*ka[j]-sa*kad[j]+ccd*na[j]+cc*nad[j],-sad*ka[j]-sa*kad[j]-ccd*na[j]-cc*nad[j]])
    return B,Bd

def matrix_audit(fixture):
    nodes=fixture['nodes']
    for case in fixture['matrixCases']:
        p={k:F(v) for k,v in case['request'].items()};v=F(case['vValue']);env={case['vNode']:v};cache={};rv=lambda id:qvalue(nodes,id,env,cache)
        frame=case['frame'];n=[p['x0']-v*p['HR'],p['p']/p['R'],p['pz']-p['epsilon']*v*p['HZ']];np=[-p['HR'],F(0),-p['epsilon']*p['HZ']]
        K=[[0,-2*p['F'],0],[2*p['F']+p['R']*p['FR'],0,0],[p['GR'],0,0]]
        for name,expected in [('n',n),('nPrime',np)]:
            for root,value in zip(frame[name],expected):check(rv(root)==value,name,'source_formula')
        A=[[rv(root) for root in row] for row in frame['Aphi']]
        for j in range(3):check(dot(n,[A[i][j] for i in range(3)])+np[j]==0,'moving constraint','rational_constraint')
        # Independent four-by-four solve for tprime and real pressure factor.
        n2=dot(n,n);t=[np[i]-n[i]*dot(n,np)/n2 for i in range(3)];d=p['epsilon']*p['k']**2*n2
        aug=[[F(i==j) for j in range(3)]+[-p['k']*n[i]] for i in range(3)]+[n+[F(0)]]
        rhs=[-dot(K[i],t)-d*t[i] for i in range(3)]+[-dot(np,t)];sol=solve(aug,rhs)
        actual=[dot(A[i],t)-d*t[i] for i in range(3)]+[dot([rv(x) for x in frame['pressureImaginaryRow']],t)]
        for x,y in zip(sol,actual):check(x==y,'augmented original equation','augmented_pressure')
        bad=[[-K[i][j]+n[i]*sum(n[k]*K[k][j] for k in range(3))/n2 for j in range(3)] for i in range(3)]
        check(dot(n,mv(bad,t))+dot(np,t)!=0,'omitted moving normal detected','negative_controls')
        with localcontext() as ctx:
            ctx.prec=90;de={case['vNode']:dec(v)};dcache={};dv=lambda id:dvalue(nodes,id,de,dcache)
            B=[[dv(x) for x in row] for row in frame['B']];Bd=[[dv(x) for x in row] for row in frame['BPrime']];left=[[dv(x) for x in row] for row in frame['Bleft']]
            ref,refd=independent_frame({k:dec(x) for k,x in p.items()},dec(v),case['sign'])
            for actualRow,refRow in zip(B,ref):
                for x,y in zip(actualRow,refRow):check(abs(x-y)<Decimal('1e-70'),'source frame value','decimal_frame')
            for actualRow,refRow in zip(Bd,refd):
                for x,y in zip(actualRow,refRow):check(abs(x-y)<Decimal('1e-70'),'independent moving derivative','decimal_derivative')
            lb=matmul(left,B)
            for i in range(2):
                for j in range(2):check(abs(lb[i][j]-Decimal(i==j))<Decimal('1e-70'),'left inverse','decimal_left_inverse')
            zz=[Decimal(3)/5,Decimal(1)/7];dd=dec(d);AA=[[dec(a) for a in row] for row in A]
            actualCoefficient=matmul(left,[[x-y for x,y in zip(ra,rb)] for ra,rb in zip(matmul(AA,B),Bd)])
            zd=[x-dd*z for x,z in zip(mv(actualCoefficient,zz),zz)];tt=mv(B,zz);td=[x+y for x,y in zip(mv(Bd,zz),mv(B,zd))]
            expected=[x-dd*y for x,y in zip(mv(AA,tt),tt)]
            for x,y in zip(td,expected):check(abs(x-y)<Decimal('1e-65'),'original reconstructed ODE','decimal_full_ode')
            omitted=matmul(left,matmul(AA,B));wrong=[x-dd*z for x,z in zip(mv(omitted,zz),zz)]
            badtd=[x+y for x,y in zip(mv(Bd,zz),mv(B,wrong))]
            check(max(abs(x-y) for x,y in zip(badtd,expected))>Decimal('1e-8'),'omitted Bprime detected','negative_controls')

def volterra_audit(fixture):
    nodes=fixture['nodes']
    for case in fixture['volterraCases']:
        var=case['vNode'];x={((var,1),):F(1)};matrix=[[{((var,j),) if j else ():F(c) for j,c in enumerate(p) if F(c)} for p in row] for row in case['matrixPolynomials']]
        term=[{():F(1)},{}];sums=[dict(term[0]),{}]
        for row in case['rows']:
            n=row['terms']
            if n:
                term=[poly_integral(plus(product(r[0],term[0]),product(r[1],term[1])),var,{},x) for r in matrix]
                sums=[plus(a,b) for a,b in zip(sums,term)]
            for root,expected in zip(row['values'],sums):
                actual=polynomial(nodes,root,{})
                check(actual==expected,'exact time-ordered polynomial','volterra_exact_polynomial')
                check(pvalue(actual,{var:F(case['vValue'])})==pvalue(expected,{var:F(case['vValue'])}),'finite term rational value','volterra_exact_values')
            z=dec(F(case['norm'])*F(case['length']))
            with localcontext() as ctx:
                ctx.prec=70;actual=dvalue(nodes,row['tail'],{},{});expected=z.exp()*z**(n+1)/Decimal(__import__('math').factorial(n+1))
                check(abs(actual-expected)<Decimal('1e-60'),'factorial tail formula','volterra_tail')
                check(actual>0,'no zero remainder','volterra_tail')
        # Nonconstant-matrix term2 must differ from freezing at a single endpoint.
        if len(case['matrixPolynomials'][0][0])>1:
            endpoint=F(case['vValue']);M=[[sum(F(c)*endpoint**j for j,c in enumerate(p)) for p in row] for row in case['matrixPolynomials']]
            frozen=[F(1),F(0)];m1=mv(M,frozen);m2=mv(M,m1)
            frozen=[a+endpoint*b+endpoint**2*c/2 for a,b,c in zip(frozen,m1,m2)]
            actual=[qvalue(nodes,r,{var:endpoint},{}) for r in case['rows'][2]['values']]
            check(actual!=frozen,'frozen-coefficient substitution fails','negative_controls')

def bound_audit(fixture):
    audit=fixture['powerAudit'];saved={}
    mx=lambda *a:max((x for x in a if x is not None),default=None)
    add=lambda a,b:None if a is None or b is None else a+b
    for row in audit['rows']:
        name=row['label'];inputs=[saved[x] for x in row['inputs']];v,e,d=row['v'],row['e'],row['d'];rule=row['rule']
        if rule.startswith('triangle'):
            nn=[x for x in inputs if x['v'] is not None];reserve=(len(nn)-1).bit_length();expected=(mx(*(x['v'] for x in nn))+reserve,add(mx(*(x['e'] for x in nn)),reserve),add(mx(*(x['d'] for x in nn)),reserve))
            check((v,e,d)==expected,name,'power_ledger')
        elif rule.startswith('two-term'):
            a,b=inputs;expected=(add(a['v'],b['v']),add(mx(add(a['e'],b['v']),add(a['v'],b['e'])),1),add(mx(add(a['d'],b['v']),add(a['v'],b['d'])),1))
            check((v,e,d)==expected,name,'power_ledger')
        elif rule.startswith('both actual'):
            a=inputs[0];check(e==add(a['e'],2*v) and d==add(a['d'],2*v),name,'power_ledger')
        elif rule.startswith('positive square'):
            import re
            m=int(re.search(r'B\^-(\d+)',rule).group(1));a=inputs[0];check(v==(a['v']+1)//2 and e==add(a['e'],m) and d==add(a['d'],m),name,'power_ledger')
        elif rule.startswith('actual v derivative'):
            a=inputs[0];check((v,e,d)==(a['d'],a['d'],None),name,'power_ledger')
        saved[name]=row
    check(audit['computed']=={'operatorError':69,'dampingError':21,'unitFrameError':29,'slopeError':29},'computed non-declared budgets','power_output')
    for key,value in audit['computed'].items():check(value<256,key,'power_output')
    for row in fixture['scalarAudit']['checks']:
        a,b=F(row['left']),F(row['right']);op=row['relation'];ok={'<':a<b,'<=':a<=b,'>':a>b,'=':a==b}[op];check(ok,row['id'],'exact_scalar')
    palette=fixture['palette'];M=int(palette['modulus']);P=palette['paletteSize']
    for delta in range(1,5):
        j21=int(palette['matrixPowers'][delta][1][0]);nearest=min(min((j21*i)%M,(-j21*i)%M) for i in range(1,P+1))
        check(nearest>=1,'all ordered center pairs','exact_palette');check(str(nearest)==palette['allOrderedCenterConstraints']['positiveDeltas'][delta-1]['minimumVerticalIntegerDistanceNumerator'],'palette witness','exact_palette')
    J=[[3,1],[1,5]];powerJ=[[1,0],[0,1]]
    for delta in range(1,5):
        powerJ=matmul(powerJ,J)
        for i in range(2):
            for j in range(2):check(powerJ[i][j]==int(palette['matrixPowers'][delta][i][j]),'independent exact J power','exact_palette')
    maxrow=max(sum(abs(x) for x in row) for row in powerJ)
    check(int(palette['enlargedRectangleSeparation']['maxCoveringRowNorm'])==maxrow,'actual maximum cover row','exact_palette')
    check(3*(maxrow+1)<16384,'strict enlarged support separation','exact_palette')

def source_audit(receipt):
    check(receipt['pass'] and all(x['pass'] for x in receipt['checks']),'all actual producer checks','source_receipt')
    check(receipt['scope']['originalN506Complete'],'uniform original acceptance','source_receipt')
    for key in ['certifiedBandMembership','determinantNonzeroForThisMemberCertified','positivityOfThisMemberCertified']:
        check(receipt['exercisedMember'][key] is False,key,'source_scope')
    check(receipt['uniformFamily']['global730']['exactResidual']==['0','0'],'exact covariance residual','source_scope')
    check(receipt['uniformFamily']['columns']['physicalDeterminantSign']=='negative','physical determinant orientation','source_scope')
    check(receipt['uniformFamily']['columns']['actualMassLowerRoot']==receipt['graph']['rootIds']['actualColumnMassLower'],'full H mass lower root','source_scope')
    rows=receipt['partitionRows'];check(len(rows)==81 and len({r['key'] for r in rows})==81,'complete distinct boxes','actual_labels')
    for row in rows:
        check(row['countInGlobalSum']==1 and row['signColumns']==[1,-1],'once per box','actual_labels')
        check(len(row['actualLabel']['grid'])==3 and len(row['actualLabel']['colors'])==2,'same actual labels','actual_labels')
    # Exact original coordinate and scale identities, independent rational boxes.
    for ratio in [F(1,8),F(1,2),F(1),F(2),F(8)]:
        for R in [F(1,2),F(2),F(7,3)]:
            for s in [F(1,2),F(1),F(2)]:
                check(R*R*ratio/(2*s*ratio)==R*R/(2*s),'band-invariant X','source_chart_algebra')
    for x in [F(k,16) for k in range(-96,97)]:
        n=(x+F(1,2)).numerator//(x+F(1,2)).denominator;o=x-n
        check(F(-1,2)<=o<F(1,2),'actual floor offset','source_chart_algebra')
    for h in [F(1,100),F(1,1000000),F(1,2**300)]:
        A=F(1,2)+h;check(-2*A+h+A+F(1,2)==0,'Q cancellation with h nonzero','source_chart_algebra')
    check(receipt['sourceProofs']['actualPartitionCoordinates']['bands'] and len(receipt['sourceProofs']['actualPartitionCoordinates']['bands'])==3,'all actual band charts retained','source_receipt')


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--fixture');parser.add_argument('--source',default='/tmp/actual-covariance-default.json');parser.add_argument('--output');args=parser.parse_args()
    fixture=json.loads(Path(args.fixture).read_text()) if args.fixture else json.loads(subprocess.check_output(['node',str(HERE/'actual-covariance-source-fixture.mjs')],text=True))
    matrix_audit(fixture);volterra_audit(fixture);bound_audit(fixture)
    receipt=json.loads(Path(args.source).read_text());source_audit(receipt)
    result={'schema':'MathScope.ActualCovarianceSourceIndependentAudit/1','pass':True,'checks':sum(COUNTS.values()),'categories':dict(sorted(COUNTS.items())),
            'sourceGraphSHA256':receipt['graph']['sha256'],'sourceParameterSHA256':receipt['sourceBinding']['parameterExpressionSHA256'],
            'scope':'Independent Fraction/Decimal operator, integral, source label and receipt checks; uniform source proof remains tied to the actual retained graph, not these finite numeric fixtures.',
            'fixtureSHA256':hashlib.sha256(json.dumps(fixture,sort_keys=True,separators=(',',':')).encode()).hexdigest()}
    if args.output:Path(args.output).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))
if __name__=='__main__':main()
