#!/usr/bin/env python3
"""Observe the original shifted-radial class operator with exact controls.

The independent interpreter uses Fraction polynomial maps, exact formal
Taylor jets, and Q(sqrt(2),i) Fourier integration by parts. Formal seed
values test the complete quotient calculus; they do not replace a source
exponential or supply a current seminorm. The Gaussian induction is
checked coefficientwise for every positive symbolic exponent.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from functools import lru_cache
from math import comb, factorial, isqrt
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import subprocess
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'

def digest(path):
    raw=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}

def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

def source_paths():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT):raise ValueError('Source escaped the repository')
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for path in [BASE/'source-radial-class-kernel.mjs',BASE/'source-radial-class-majorants.mjs',
                 BASE/'tests/radial-class-majorants.test.mjs',Path(__file__)]:visit(path)
    return sorted(seen)

def sadd(a,b):return [x+y for x,y in zip(a,b)]
def sscale(a,b):return [x*b for x in a]
def smul(a,b):return [sum((a[k]*b[n-k] for k in range(n+1)),Q(0)) for n in range(len(a))]
def sinv(a):
    if not a[0]:raise ValueError('Zero formal Taylor denominator')
    out=[1/a[0]]
    for n in range(1,len(a)):out.append(-sum((a[k]*out[n-k] for k in range(1,n+1)),Q(0))/a[0])
    return out
def spow(a,n):
    if n<0:return spow(sinv(a),-n)
    out=[Q(1)]+[Q(0)]*(len(a)-1)
    while n:
        if n%2:out=smul(out,a)
        a=smul(a,a);n//=2
    return out
def sexp0(a):
    if a[0]:raise ValueError('Formal exponential must have zero constant term')
    out=[Q(1)]
    for n in range(1,len(a)):out.append(sum((k*a[k]*out[n-k] for k in range(1,n+1)),Q(0))/n)
    return out

class Polynomial:
    """Sparse multivariate polynomials, independent of source AD/FTC."""
    def __init__(self,nodes,variables):
        self.nodes=nodes;self.variables=variables;self.dim=len(variables);self.zero=(0,)*self.dim;self.memo={}
    def constant(self,q):return {} if not q else {self.zero:Q(q)}
    def add(self,a,b):
        out=dict(a)
        for e,c in b.items():out[e]=out.get(e,Q(0))+c
        return {e:c for e,c in out.items() if c}
    def scale(self,a,c):return {e:x*c for e,x in a.items() if x*c}
    def mul(self,a,b):
        out={}
        for e,c in a.items():
            for f,d in b.items():
                g=tuple(x+y for x,y in zip(e,f));out[g]=out.get(g,Q(0))+c*d
        return {e:c for e,c in out.items() if c}
    def power(self,a,n):
        if n<0:
            if set(a)!={self.zero}:raise ValueError('A polynomial denominator must be constant')
            return self.constant(a[self.zero]**n)
        out=self.constant(1)
        while n:
            if n%2:out=self.mul(out,a)
            a=self.mul(a,a);n//=2
        return out
    def derivative(self,a,index):
        out={}
        for e,c in a.items():
            if e[index]:
                f=list(e);f[index]-=1;out[tuple(f)]=c*e[index]
        return out
    def substitute(self,a,index,value):
        out={}
        for e,c in a.items():
            f=list(e);n=f[index];f[index]=0
            out=self.add(out,self.mul({tuple(f):c},self.power(value,n)))
        return out
    def integral(self,a,index,left,right):
        anti={}
        for e,c in a.items():
            f=list(e);f[index]+=1;anti[tuple(f)]=c/f[index]
        return self.add(self.substitute(anti,index,right),self.scale(self.substitute(anti,index,left),-1))
    def read(self,at):
        if at in self.memo:return self.memo[at]
        op,args=self.nodes[at]['op'],self.nodes[at]['args']
        if op=='rational':out=self.constant(Q(int(args[0]),int(args[1])))
        elif op=='coordinate':
            if at not in self.variables:raise ValueError('Unexpected polynomial coordinate')
            e=[0]*self.dim;e[self.variables.index(at)]=1;out={tuple(e):Q(1)}
        elif op=='add':
            out={}
            for child in args:out=self.add(out,self.read(child))
        elif op=='multiply':
            out=self.constant(1)
            for child in args:out=self.mul(out,self.read(child))
        elif op=='inverse':out=self.power(self.read(args[0]),-1)
        elif op=='integer_power':out=self.power(self.read(args[0]),int(args[1]))
        elif op=='definite_integral':out=self.integral(self.read(args[0]),self.variables.index(args[1]),self.read(args[2]),self.read(args[3]))
        else:raise ValueError('Unexpected independent polynomial operation '+op)
        self.memo[at]=out;return out

def independent(artifact):
    checks=[]
    def check(name,truth):checks.append({'id':name,'pass':bool(truth)})
    c=artifact['certificate'];data=artifact['independent'];nodes=data['program']['nodes'];f=data['fixtures']
    def scalar_reader(graph,overrides):
        memo=dict(overrides)
        def read(at):
            if at in memo:return memo[at]
            op,args=graph[at]['op'],graph[at]['args']
            if op=='rational':out=Q(int(args[0]),int(args[1]))
            elif op=='add':out=sum(map(read,args),Q(0))
            elif op=='multiply':
                out=Q(1)
                for child in args:out*=read(child)
            elif op=='inverse':out=1/read(args[0])
            elif op=='integer_power':out=read(args[0])**int(args[1])
            elif op=='maximum':out=max(map(read,args))
            elif op=='smooth_piecewise':out=read(args[3] if read(args[0])<=read(args[1]) else args[5] if read(args[0])>=read(args[2]) else args[4])
            else:raise ValueError('Unexpected exact scalar operation '+op)
            memo[at]=out;return out
        return read

    # Full step quotient: the formal seeds have the original differential
    # equations, while their initial values are independent exact symbols.
    step=f['step'];n=step['order']
    for point in data['cutoffFormalPoints']:
        x0,a0,b0=map(Q,point);x=[x0,Q(1)]+[Q(0)]*(n-1);one=[Q(1)]+[Q(0)]*n
        y=sadd(one,sscale(x,-1));ex=sscale(spow(x,-2),-1);ey=sscale(spow(y,-2),-1);ex[0]=ey[0]=Q(0)
        a=sscale(sexp0(ex),a0);b=sscale(sexp0(ey),b0);quotient=smul(a,sinv(sadd(a,b)))
        read=scalar_reader(nodes,{step['x']:x0,step['leftJets'][0]:a0,step['rightJets'][0]:b0})
        for j,row in enumerate(step['rows']):
            check(f'full-original-quotient-Taylor-{point[0]}-order{j}',read(row['interior'])==factorial(j)*quotient[j])
            check(f'both-seed-derivatives-{point[0]}-order{j}',read(step['leftJets'][j])==factorial(j)*a[j] and read(step['rightJets'][j])==factorial(j)*b[j])
            if j:check(f'reciprocal-and-quotient-term-inventory-{point[0]}-order{j}',len(row['terms'])==j+1 and len(step['reciprocalRows'][j]['terms'])==j)
        check(f'dropped-seed-denominator-control-{point[0]}',read(step['rows'][1]['interior'])!=factorial(1)*a[1]/(a0+b0))
    activation=step['source']['activation'];poly={0:1};seed_bounds=[]
    for j,row in enumerate(activation['seedDerivatives']):
        actual={r['power']:int(r['coefficient']) for r in row['polynomial']}
        check(f'all-order-original-square-seed-polynomial-{j}',actual==poly)
        bound=sum(abs(v)*max(1,(k+1)//2)**max(1,(k+1)//2) for k,v in poly.items());seed_bounds.append(bound)
        check(f'all-order-source-seed-bound-{j}',bound==int(row['ordinaryDerivativeUpper']))
        nxt={}
        for k,v in poly.items():
            nxt[k+3]=nxt.get(k+3,0)+2*v
            if k:nxt[k+1]=nxt.get(k+1,0)-k*v
        poly={k:v for k,v in nxt.items() if v}
    reciprocal=[64]
    for j in range(1,n+1):reciprocal.append(64*sum(comb(j,k)*2*seed_bounds[k]*reciprocal[j-k] for k in range(1,j+1)))
    sigma=[1]+[sum(comb(j,k)*seed_bounds[k]*reciprocal[j-k] for k in range(j+1)) for j in range(1,n+1)]
    check('complete-original-step-all-order-bound-recurrence',list(map(int,activation['ordinaryDerivativeBounds']))==sigma and list(map(int,activation['reciprocalOrdinaryDerivativeBounds']))==reciprocal)
    check('original-positive-denominator-bound',11**4<64*4**4)
    for j,row in enumerate(step['rows']):
        op,args=nodes[row['exactQuotientDerivative']]['op'],nodes[row['exactQuotientDerivative']]['args']
        read=scalar_reader(nodes,{})
        check(f'literal-flat-step-exterior-branches-{j}',op=='smooth_piecewise' and read(args[3])==0 and read(args[5])==(1 if j==0 else 0))

    # Independent complete polynomial chain rule and fixed-endpoint FTC.
    bell=f['bell'];P=Polynomial(nodes,[bell['x'],bell['y']]);inner=P.read(bell['inner']);outer=P.read(bell['outer'])
    direct=P.substitute(outer,1,inner)
    for j in range(7):
        if j:direct=P.derivative(direct,0)
        check(f'complete-Bell-polynomial-{j}',P.read(bell['composed'][j])==direct==P.read(bell['direct'][j]))
    for row in bell['bell']['rows']:
        check(f'Bell-binomial-recurrence-n{row["order"]}-k{row["outerDerivativeOrder"]}',all(int(t['binomial'])==comb(row['order']-1,t['innerOrder']-1) for t in row['terms']))
    shift=f['shift'];z=shift['input'];coords=[z['U'],z['u'],*z['Y'],*z['slow']];P=Polynomial(nodes,coords)
    shifted=P.read(shift['shifted']);M=P.read(z['M']);vr=[P.read(k) for k in z['vr']]
    def transport(a):return P.add(P.derivative(a,0),P.mul(M,P.add(P.mul(vr[0],P.derivative(a,2)),P.mul(vr[1],P.derivative(a,3)))))
    span=P.read(z['span']);minus=P.integral(shifted,1,P.scale(span,-1),P.constant(0));plus=P.integral(shifted,1,P.constant(0),span)
    chi=P.read(z['chi']);compact=P.add(P.mul(P.add(P.constant(1),P.scale(chi,-1)),minus),P.scale(P.mul(chi,plus),-1))
    check('full-shift-transport-integrand',transport(shifted)==P.derivative(shifted,1)==P.read(shift['directIntegrand']))
    check('both-independent-finite-half-line-integrals',minus==P.read(shift['minus']) and plus==P.read(shift['plus']))
    check('literal-complete-shifted-primitive',compact==P.read(shift['compact']))
    check('full-cutoff-and-both-FTC-endpoints',transport(compact)==P.read(shift['expected'])==P.read(shift['beforeFTC']['compact']))
    for d in range(1,4):
        compact=P.derivative(compact,4);expected=P.read(shift['expected'])
        for _ in range(d):expected=P.derivative(expected,4)
        check(f'complete-slow-derivative-FTC-{d}',transport(compact)==expected)
    check('nonzero-cutoff-error-control',bool(P.read(shift['cutoffRemainder'])))
    check('nonzero-both-endpoint-control',bool(P.read(shift['endpoints']['rawEndpoints'])))

    # The Gaussian moment recurrence is a positive polynomial in 1/a,
    # covering every a>0, without numerically sampling its exponential.
    a_id=f['gaussian']['a'];P=Polynomial(nodes,[a_id])
    def univariate_add(a,b):return [((a[k] if k<len(a) else Q(0))+(b[k] if k<len(b) else Q(0))) for k in range(max(len(a),len(b)))]
    def cpoly(n):return [Q(factorial(n+1)*comb(n+2,k)) for k in range(n+3)]
    for row in f['gaussian']['rows']:
        pole=row['pole'];moment=max(0,pole-2)
        check(f'Gaussian-endpoint-power-{pole}',row['gaussianMomentOrder']==moment and max(moment-1,0)<=pole)
        for r in row['rows']:
            j=r['power'];actual=cpoly(j)
            rhs=[Q(0),Q(1,2)]
            if j>=2:rhs=univariate_add(rhs,[Q(0)]+[Q(j-1,2)*v for v in cpoly(j-2)])
            difference=univariate_add(actual,[-v for v in rhs])
            check(f'Gaussian-positive-exponent-induction-pole{pole}-moment{j}',all(v>=0 for v in difference))
        for a in [Q(1,100),Q(1),Q(7,3)]:
            read=scalar_reader(nodes,{a_id:a})
            check(f'Gaussian-retained-exact-constant-pole{pole}-a{a}',read(row['constant'])==factorial(moment+1)*(1+1/a)**(moment+2))

    # Every recorded falling product and change-of-variable constant is
    # checked at exact positive power-compatible rational fixtures.
    change=f['change'];dr=Q(5,2)
    def falling(a,n):
        out=Q(1)
        for j in range(n):out*=a-j
        return out
    for rootR in [Q(1),Q(3,2),Q(5,4)]:
        R=rootR**2;U=rootR**5
        overrides={change['R']:R,change['U']:U,change['inverseBody']:R,change['directBody']:U}
        for e in change['exponents']:
            overrides[e['sourceBody']]=R**e['e']/(dr*rootR**3)
            overrides[e['outputBody']]=R**(-e['e'])
        read=scalar_reader(nodes,overrides)
        for j,row in enumerate(change['inverseRows']):
            expected=R*U**(-j)*falling(1/dr,j)
            check(f'inverse-power-falling-body-R{R}-order{j}',read(row['actualDerivative'])==expected and abs(expected)<=read(row['bound']))
        for j,row in enumerate(change['directRows']):
            expected=U*R**(-j)*falling(dr,j)
            check(f'direct-power-falling-body-R{R}-order{j}',read(row['actualDerivative'])==expected and abs(expected)<=read(row['bound']))
        for e in change['exponents']:
            alpha=(e['e']+1)/dr-1
            check(f'weighted-radial-prefactor-exponent-R{R}-e{e["e"]}',read(e['sourceExponent'])==alpha)
            for j,row in enumerate(e['sourceRows']):
                expected=overrides[e['sourceBody']]*U**(-j)*falling(alpha,j)
                check(f'weighted-source-falling-body-R{R}-e{e["e"]}-order{j}',read(row['actualDerivative'])==expected and abs(expected)<=read(row['bound']))
            for j,row in enumerate(e['outputRows']):
                expected=R**(-e['e']-j)*falling(-e['e'],j)
                check(f'weighted-output-falling-body-R{R}-e{e["e"]}-order{j}',read(row['actualDerivative'])==expected and abs(expected)<=read(row['bound']))

    # Full-line p-fold IBP in Q(sqrt(2),i), retaining original v_r.k.
    qa=lambda a,b:(a[0]+b[0],a[1]+b[1])
    qm=lambda a,b:(a[0]*b[0]+2*a[1]*b[1],a[0]*b[1]+a[1]*b[0])
    qneg=lambda a:(-a[0],-a[1])
    def qi(a):
        norm=a[0]**2-2*a[1]**2
        if not norm:raise ValueError('Zero exact original quadratic divisor')
        return a[0]/norm,-a[1]/norm
    ZQ=(Q(0),Q(0));OQ=(Q(1),Q(0));cz=(ZQ,ZQ);co=(OQ,ZQ)
    ca=lambda a,b:(qa(a[0],b[0]),qa(a[1],b[1]))
    cm=lambda a,b:(qa(qm(a[0],b[0]),qneg(qm(a[1],b[1]))),qa(qm(a[0],b[1]),qm(a[1],b[0])))
    def ci(a):
        denominator=qi(qa(qm(a[0],a[0]),qm(a[1],a[1])))
        return qm(a[0],denominator),qneg(qm(a[1],denominator))
    def cpow(a,n):
        if n<0:return cpow(ci(a),-n)
        out=co
        while n:
            if n%2:out=cm(out,a)
            a=cm(a,a);n//=2
        return out
    cscale=lambda a,q:cm(a,((Q(q),Q(0)),ZQ))
    def polyder(p):return {k-1:k*v for k,v in p.items() if k}
    def endpoint_integral(p,c):
        out=[cz,cz];j=0
        while p:
            factor=cscale(cpow(c,-j-1),(-1)**j)
            for side,t in enumerate([Q(1),Q(-1)]):
                value=sum((v*t**k for k,v in p.items()),Q(0))
                out[side]=ca(out[side],cscale(factor,value*(1 if side==0 else -1)))
            p=polyder(p);j+=1
        return out
    for p in data['ibpOrders']:
        amplitude={2*j:Q((-1)**j*comb(p+1,j)) for j in range(p+2)};derived=dict(amplitude)
        for j in range(p):
            check(f'full-line-flat-endpoint-before-IBP-p{p}-j{j}',all(sum((v*t**k for k,v in derived.items()),Q(0))==0 for t in [Q(-1),Q(1)]))
            derived=polyder(derived)
        for k0,k1 in [(2,1),(-1,2),(0,-1)]:
            # Formal pi=3 is only an exact algebra fixture; the source
            # constant program retains the original exact pi expression.
            nu=(Q(6*(k0+k1)),Q(-6*k1));L=(ZQ,nu);M=Q(3,2);cphase=cscale(L,M)
            left=endpoint_integral(amplitude,cphase);right=endpoint_integral(derived,cphase)
            multiplier=cscale(cpow(L,-p),(-1)**p/M**p)
            transformed=[cm(multiplier,x) for x in right]
            check(f'original-radial-full-line-IBP-p{p}-mode{k0},{k1}',left==transformed)
            wrong=[cm(cscale(cpow(L,-p),(-1)**p),x) for x in right]
            check(f'missing-radial-scale-control-p{p}-mode{k0},{k1}',left!=wrong)
            if p%2:check(f'IBP-sign-control-p{p}-mode{k0},{k1}',left!=[cscale(x,-1) for x in transformed])
        whole=sum((Q(2)*v/(k+1) for k,v in amplitude.items()),Q(0))
        check(f'whole-zero-mode-not-invertible-p{p}',whole>0)
        # A separate odd radial zero mode has exactly zero whole moment;
        # no inverse of the zero Fourier multiplier is introduced.
        odd={k+1:v for k,v in amplitude.items()}
        check(f'zero-mode-whole-radial-moment-p{p}',sum((v*(Q(1)**(k+1)-Q(-1)**(k+1))/(k+1) for k,v in odd.items()),Q(0))==0)

    # Same rho seed recurrence and full chart Leibniz count, using the
    # actual fixed source inventory, not an imposed current bound.
    seed=c['rho']['seedJets'];previous=[1]
    for row in seed['rows']:
        j=row['order'];actual=list(map(int,row['polynomial']))
        while len(previous)>1 and previous[-1]==0:previous.pop()
        while len(actual)>1 and actual[-1]==0:actual.pop()
        check(f'actual-rho-flat-seed-polynomial-{j}',actual==previous)
        # q=u(1-u); P_(j+1)=q^2 P'_j-2j q q' P_j+q' P_j.
        nxt=[0]*(len(previous)+4)
        for k,v in enumerate(previous):
            if k:
                for a,w in [(2,1),(3,-2),(4,1)]:nxt[k-1+a]+=k*v*w
            for a,w in [(1,1),(2,-3),(3,2)]:nxt[k+a]+=-2*j*v*w
            nxt[k]+=v;nxt[k+1]+=-2*v
        previous=nxt
        check(f'actual-rho-all-mixed-profile-count-{j}',len(c['rho']['profileRows'][j]['derivatives'])==(j+1)*(j+2)//2)
        check(f'full-chart-Leibniz-count-{j}',int(c['chart']['throughOrder'][j]['coordinateDirectionCount'])==3**j and int(c['chart']['throughOrder'][j]['leibnizCount'])==2**(j*(j-1)//2))
    check('positive-rho-mass-exact-collar-proof',Q(1,4)*(1-Q(1,4))==Q(3,16) and Q(1,10)*Q(1,2)==Q(1,20))
    for e in c['rows']:
        for row in e['orders']:
            for r in row['remainderRows']:
                p=r['ibpOrder'];m=row['order']
                check(f'full-radial-and-torus-source-demand-e{e["e"]}-m{m}-p{p}',r['demand']['flatRemainderInputOrder']==m+2*p+3 and r['demand']['extraRadialOrder']==p and r['demand']['extraTorusOrder']==p+3)
    check('complete-pressure-input-inventory-sealed-and-exported',len(c['pressureInput'])==c['request']['order']+2*c['request']['ibpOrder']+4)
    check('source-constant-program-complete',len(c['program']['nodes'])==c['graph']['nodeCount'])
    check('source-step-derivative-demand-separated',c['cutoff']['requestedDerivativeOrder']==c['request']['order']+1 and c['rho']['requestedDerivativeOrder']==c['request']['order']+2*c['request']['ibpOrder']+3)
    check('source-operator-not-a-current-norm',not artifact['actualCurrentAttachmentExecuted'] and not artifact['actualCurrentInputNormsInvented'] and not artifact['completeN6'] and
          not c['scope']['actualCurrentInputMClassNormsCertified'] and not c['scope']['allOrderCurrentClassCertified'])
    return {'schema':'MathScope.N6.IndependentOriginalRadialClassMajorants/1',
            'arithmetic':'Python Fraction sparse polynomials, exact Taylor jets, coefficientwise positive Gaussian induction, and Q(sqrt(2),i) full-line Fourier calculus',
            'checks':checks,'checkCount':len(checks),'pass':all(r['pass'] for r in checks),
            'actualCurrentInputClassNormsCertified':False,'completeN6':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,default=1);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Use a new positive attempt number')
    out=BASE/'evidence/source-radial-class-majorants-20261012'/f'attempt{args.attempt}';out.mkdir(parents=True,exist_ok=False)
    paths=source_paths();before=[digest(p) for p in paths];write(out/'source-before.json',before)
    for p in paths:
        dest=out/'sources'/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes())
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();artifact=out/'radial-operator.json'
    env=dict(os.environ,MATHSCOPE_FIXED_RADIAL_MAJORANT_ARTIFACT=str(artifact))
    command=['node','--max-old-space-size=384','--test','--test-reporter=tap','--test-concurrency=1',str(BASE/'tests/radial-class-majorants.test.mjs')]
    peak=0;timed_out=False
    with (out/'node.log').open('w') as stdout,(out/'node.stderr').open('w') as stderr:
        process=subprocess.Popen(command,cwd=ROOT,env=env,stdout=stdout,stderr=stderr)
        while process.poll() is None:
            try:
                status=Path(f'/proc/{process.pid}/status').read_text();match=re.search(r'^VmRSS:\s+(\d+) kB$',status,re.M)
                if match:peak=max(peak,int(match[1])*1024)
            except FileNotFoundError:pass
            if time.monotonic()-tick>60:timed_out=True;process.kill();break
            time.sleep(.02)
        exit_code=process.wait()
    stdout=(out/'node.log').read_text()
    counts={name:int(match[1]) if (match:=re.search(r'^# '+name+r' (\d+)$',stdout,re.M)) else 0 for name in ['pass','fail','skipped']}
    result={'pass':False,'checkCount':0,'checks':[]}
    try:
        if exit_code:raise ValueError('Actual fixed-source Node gate failed')
        result=independent(json.loads(artifact.read_text()))
    except Exception as error:result['error']=type(error).__name__+': '+str(error)
    write(out/'independent-fraction.json',result)
    after=[digest(p) for p in paths];write(out/'source-after.json',after)
    receipt={'schema':'MathScope.N6.ObservedActualFixedRadialOperatorGate/1','attempt':args.attempt,'startedUTC':started,
             'finishedUTC':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':command,
             'exitCode':exit_code,'timedOut':timed_out,'nodeTests':counts,'sourceFileCount':len(paths),'sourceBytesUnchanged':before==after,
             'independentChecks':result['checkCount'],'independentPass':result['pass'],'observedNodeLauncherPeakRSSBytes':peak,
             'resources':{'nodeOldSpaceMiB':384,'nodeWallSeconds':60},
             'artifacts':[digest(p) for p in sorted(out.iterdir()) if p.is_file()],
             'actualFixedSourceRadialOperatorNormsConstructed':exit_code==0,'actualCurrentInputClassNormsAuthenticated':False,
             'actualCurrentAttachmentExecuted':False,'completeN6':False,
             'pass':exit_code==0 and counts['pass']==12 and counts['fail']==0 and counts['skipped']==0 and before==after and result['pass']}
    write(out/'receipt.json',receipt)
    print(json.dumps({'receipt':digest(out/'receipt.json'),'nodeTests':counts,'independentChecks':result['checkCount'],
                     'sourceFilesUnchanged':before==after,'peakNodeLauncherRSSBytes':peak,'pass':receipt['pass']},indent=2))
    raise SystemExit(0 if receipt['pass'] else 1)

if __name__=='__main__':main()
