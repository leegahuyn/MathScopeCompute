#!/usr/bin/env python3
"""Observe full radial-force calculus and source norm composition controls.

The independent oracle parses the generated scalar graph into Laurent
polynomials over Q(sqrt(2)), differentiates its own coefficient maps,
and proves complete box majorants without sampling a physical source.
It separately checks the exact original floor-index exponent identity
over seven independent algebraic symbols. No fixture norm authenticates
the actual M3 current; that binding is a subsequent private source gate.
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
import signal
import subprocess
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
ZERO=(Q(0),Q(0))
ONE=(Q(1),Q(0))

def qa(a,b):return (a[0]+b[0],a[1]+b[1])
def qn(a):return (-a[0],-a[1])
def qm(a,b):return (a[0]*b[0]+2*a[1]*b[1],a[0]*b[1]+a[1]*b[0])
def qi(a):
    d=a[0]*a[0]-2*a[1]*a[1]
    if not d:raise ValueError('Zero quadratic-field denominator')
    return (a[0]/d,-a[1]/d)
def qp(a,n):
    if n<0:return qp(qi(a),-n)
    out=ONE
    while n:
        if n&1:out=qm(out,a)
        a=qm(a,a);n//=2
    return out
def qsign(a):
    x,y=a
    if not x:return (y>0)-(y<0)
    if not y:return (x>0)-(x<0)
    if x>0 and y>0:return 1
    if x<0 and y<0:return -1
    if x>0:return ((x*x-2*y*y)>0)-((x*x-2*y*y)<0)
    return ((2*y*y-x*x)>0)-((2*y*y-x*x)<0)

class Laurent:
    """Independent finite maps; inverse accepts exact monomials only."""
    def __init__(self,nodes,variables,atoms=None):
        self.nodes=nodes;self.variables=list(variables);self.dim=len(variables)
        self.zero=(0,)*self.dim;self.memo={};self.atoms=atoms or {}
    def constant(self,c):
        if not isinstance(c,tuple):c=(Q(c),Q(0))
        return {} if c==ZERO else {self.zero:c}
    def variable(self,i):
        e=[0]*self.dim;e[i]=1;return {tuple(e):ONE}
    def add(self,a,b):
        out=dict(a)
        for e,c in b.items():out[e]=qa(out.get(e,ZERO),c)
        return {e:c for e,c in out.items() if c!=ZERO}
    def scale(self,a,c):
        if not isinstance(c,tuple):c=(Q(c),Q(0))
        return {e:qm(v,c) for e,v in a.items() if qm(v,c)!=ZERO}
    def multiply(self,a,b):
        out={}
        for e,c in a.items():
            for f,d in b.items():
                g=tuple(x+y for x,y in zip(e,f));out[g]=qa(out.get(g,ZERO),qm(c,d))
        return {e:c for e,c in out.items() if c!=ZERO}
    def power(self,a,n):
        if n<0:
            if len(a)!=1:raise ValueError('The exact fixture inverse must be a monomial')
            e,c=next(iter(a.items()));return {tuple(v*n for v in e):qp(c,n)}
        out=self.constant(1)
        while n:
            if n&1:out=self.multiply(out,a)
            a=self.multiply(a,a);n//=2
        return out
    def derivative(self,a,i):
        out={}
        for e,c in a.items():
            if e[i]:
                f=list(e);f[i]-=1;out[tuple(f)]=qm(c,(Q(e[i]),Q(0)))
        return out
    def jet(self,a,orders):
        for i,n in enumerate(orders):
            for _ in range(n):a=self.derivative(a,i)
        return a
    def scalar(self,a):
        if not a:return ZERO
        if set(a)!={self.zero}:raise ValueError('An exact constant is not constant')
        return a[self.zero]
    def read(self,at):
        if at in self.memo:return self.memo[at]
        if at in self.atoms:out=self.variable(self.atoms[at])
        else:
            op,args=self.nodes[at]['op'],self.nodes[at]['args']
            if op=='rational':out=self.constant(Q(int(args[0]),int(args[1])))
            elif op=='coordinate':
                if at not in self.variables:raise ValueError('Unbound independent coefficient coordinate')
                out=self.variable(self.variables.index(at))
            elif op=='add':
                out={}
                for child in args:out=self.add(out,self.read(child))
            elif op=='multiply':
                out=self.constant(1)
                for child in args:out=self.multiply(out,self.read(child))
            elif op=='inverse':out=self.power(self.read(args[0]),-1)
            elif op=='integer_power':out=self.power(self.read(args[0]),int(args[1]))
            elif op=='sqrt_positive':
                x=self.scalar(self.read(args[0]))
                if x==(Q(2),Q(0)):out=self.constant((Q(0),Q(1)))
                elif x[1]==0 and x[0]>=0:
                    a,b=isqrt(x[0].numerator),isqrt(x[0].denominator)
                    if a*a!=x[0].numerator or b*b!=x[0].denominator:raise ValueError('Unknown exact square root')
                    out=self.constant(Q(a,b))
                else:raise ValueError('Unknown exact quadratic square root')
            else:raise ValueError('Unrecognized independent algebraic operation '+op)
        self.memo[at]=out;return out

def multiindices(dim,order):
    if dim==1:
        for n in range(order+1):yield (n,)
    else:
        for n in range(order+1):
            for rest in multiindices(dim-1,order-n):yield (n,)+rest

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
    for path in [BASE/'source-pressure-class-kernel.mjs',BASE/'source-global-pressure-class-majorants.mjs',
                 BASE/'tests/pressure-class-kernel.test.mjs',Path(__file__)]:visit(path)
    return sorted(seen)

def independent(artifact):
    checks=[]
    def check(name,truth):checks.append({'id':name,'pass':bool(truth)})
    f=artifact['fixtures'];nodes=artifact['program']['nodes'];force=f['force']
    coords=force['coordinates'];variables=[coords['R'],coords['Z'],coords['T']]+coords['Y'];P=Laurent(nodes,variables)
    W={key:P.read(value) for key,value in force['W'].items()};a=P.read(force['radialFast']);eps=P.read(force['epsilon'])
    invR=P.power(P.read(coords['R']),-1);vr=[P.constant(1),P.constant((Q(1),Q(-1)))]
    fast=P.multiply(a,P.add(P.derivative(W['rr'],3),P.multiply(vr[1],P.derivative(W['rr'],4))))
    reference=P.add(P.scale(P.derivative(W['rr'],0),-1),P.scale(fast,-1))
    reference=P.add(reference,P.scale(P.multiply(invR,W['rr']),-1))
    reference=P.add(reference,P.scale(P.multiply(eps,P.derivative(W['rz'],1)),-1))
    reference=P.add(reference,P.multiply(invR,W['thetatheta']))
    check('independent-complete-source-gr-coefficient-map',P.read(force['value'])==reference)
    check('both-original-irrational-L-coefficients',P.read(force['vr'][0])==vr[0] and P.read(force['vr'][1])==vr[1])
    for row in f['jets']:
        label=','.join(map(str,row['orders']));expected=P.jet(reference,row['orders'])
        check('direct-generated-versus-independent-full-gr-jet-'+label,P.read(row['direct'])==expected)
        check('complete-Leibniz-versus-independent-full-gr-jet-'+label,P.read(row['decomposed'])==expected)
        for term in row['radialRows']:
            j=term['coefficientRadialOrder'];alpha=row['orders'];rest=tuple(term['remainingOrders'])
            check('binomial-and-remaining-index-'+label+'-'+str(j),int(term['binomial'])==comb(alpha[0],j) and
                  rest==(alpha[0]-j,*alpha[1:]))
            check('actual-full-fast-coefficient-jet-'+label+'-'+str(j),P.read(term['aJet'])==P.jet(a,(j,0,0,0,0)))
            check('actual-inverse-radius-coefficient-jet-'+label+'-'+str(j),P.read(term['inverseRadiusJet'])==P.jet(invR,(j,0,0,0,0)))
    for j,row in enumerate(f['negatives']):
        check('genuine-omitted-term-negative-'+str(j),P.read(row['difference'])!={} and P.read(row['value'])!=reference)

    # An exact L1 coefficient bound on the ENTIRE fixture box. This is
    # independent of the requested graph majorant and of point sampling.
    def norm(poly):
        return sum(((abs(c[0])+2*abs(c[1]))*Q(2)**max(e[0],0) for e,c in poly.items()),Q(0))
    inputNorm=P.scalar(P.read(f['normDomain']['inputNorm']))
    check('fixture-input-norm-is-an-exact-positive-rational',inputNorm[0]>0 and inputNorm[1]==0)
    for alpha in multiindices(5,5):
        for name,w in W.items():
            check('whole-box-covariance-norm-'+name+'-'+','.join(map(str,alpha)),norm(P.jet(w,alpha))<=inputNorm[0])
    for row in f['majorants']:
        m=row['order'];bound=P.scalar(P.read(row['constant']))
        for alpha in multiindices(5,m):
            upper=norm(P.jet(reference,alpha))
            check('whole-box-complete-gr-majorant-m'+str(m)+'-'+','.join(map(str,alpha)),qsign(qa(bound,(-upper,Q(0))))>=0)
        check('unimproved-epsilon-exponent-and-no-new-S-power-'+str(m),row['outputEpsilonExponent']=='1-kappa_s' and row['addedSPower']==0)
        check('full-three-factor-product-count-'+str(m),sum(comb(m,j)*comb(m-j,k) for j in range(m+1) for k in range(m-j+1))==3**m)

    # Parse the ACTUAL generated logarithmic factorization as a Laurent
    # identity in seven independent variables. A floor symbol is retained;
    # no relation between its numeric value and the source is assumed.
    phase=f['phase'];ell=phase['ell'];h=phase['h'];node_by_sig={(n['op'],tuple(n['args'])):j for j,n in enumerate(nodes)
        if n['op'] in ['rational','log_positive','ceiling']}
    rational_two=node_by_sig[('rational',('2','1'))]
    log2=node_by_sig[('log_positive',(rational_two,))]
    logL=node_by_sig[('log_positive',(phase['Lambda'],))]
    logTg=node_by_sig[('log_positive',(phase['Tg'],))]
    logBase=node_by_sig[('log_positive',(phase['baseEll'],))]
    # phase.index is -ceiling(-indexArgument); use that retained node as
    # the seventh independent symbol itself, without a new atom equation.
    atoms={ell:0,h:1,log2:2,logL:3,logTg:4,logBase:5,phase['index']:6}
    A=Laurent(nodes,list(atoms),atoms)
    check('actual-floor-index-logarithmic-factorization-independent',A.read(phase['logMOverEpsilonInverseKappa'])==A.read(phase['factorizedLog']))
    check('all-three-nonpositive-factor-roots-retained',len(phase['factors'])==3 and
          A.add(A.add(A.read(phase['factors'][0]),A.read(phase['factors'][1])),A.read(phase['factors'][2]))==A.read(phase['factorizedLog']))
    for d in f['demands']:
        m,p=d['order'],d['ibpOrder'];expected=m+1 if not p else m+2*p+4
        check('complete-source-demand-'+str(m)+'-'+str(p),d['requiredCommonYCovarianceOrder']==expected and
              d['requiredBackgroundSlowOrder']==expected+3 and d['requiredTargetWeightedOrder']==expected+1 and
              d['cutoffRemainderInputGrOrder']==(None if not p else m+2*p+3))

    # Structural comparison is alpha invariant. Every definite integral's
    # body, variable and both endpoints must occur in the copied program.
    copied=f['copy'];other=copied['targetProgram']['nodes']
    def fingerprint(graph,at,bindings=None):
        bindings=bindings or {};n=graph[at];op,args=n['op'],n['args']
        if op=='coordinate':
            if at not in bindings:raise ValueError('A copied fixed norm leaked a free coordinate')
            return ('bound',bindings[at])
        if op in ['rational','source_parameter']:return (op,tuple(args))
        if op=='definite_integral':
            scoped=dict(bindings);scoped[args[1]]=len(scoped)
            return (op,fingerprint(graph,args[0],scoped),fingerprint(graph,args[2],bindings),fingerprint(graph,args[3],bindings))
        if op in ['integer_power','source_step_derivative']:
            return (op,fingerprint(graph,args[0],bindings),args[1])
        return (op,tuple(fingerprint(graph,x,bindings) for x in args))
    for j,(a,b) in enumerate(zip(copied['sourceRoots'],copied['targetRoots'])):
        check('alpha-invariant-complete-fixed-norm-copy-'+str(j),fingerprint(nodes,a)==fingerprint(other,b))
    for j,row in enumerate(copied['identities']):
        check('every-copied-node-operation-retained-'+str(j),nodes[row['from']]['op']==row['operation'] and
              other[row['to']]['op']==row['operation'])
    check('actual-fixed-radial-copy-executed-without-current-class-promotion',f['actualFixedCopy']['copiedNodes']>50 and
          not f['actualFixedCopy']['actualCurrentAttachmentExecuted'] and not f['actualFixedCopy']['sourceClassAuthority'])
    check('fixture-and-current-source-authority-remain-separate',artifact['sourceAuthenticated'] is False and
          artifact['actualCurrentAttachmentExecuted'] is False and artifact['completeN6'] is False)
    return {'schema':'MathScope.N6.PressureClassIndependentExact/1','status':'PASS' if all(c['pass'] for c in checks) else 'FAIL',
            'arithmetic':'Exact Fraction Laurent maps over Q(sqrt2), complete mixed differentiation, coefficientwise whole-box bounds, and alpha-invariant integral copying.',
            'checks':checks,'passed':sum(c['pass'] for c in checks),'total':len(checks),
            'physicalSourceSamplesUsed':False,'sourceClassAuthorityGrantedToFixtures':False,
            'actualPrivateCurrentAttachmentExecuted':False}

def owned_rss(root_pid):
    processes={}
    for entry in Path('/proc').iterdir():
        if not entry.name.isdigit():continue
        try:
            raw=(entry/'status').read_text();parent=int(re.search(r'^PPid:\s+(\d+)',raw,re.M)[1]);rss=int(re.search(r'^VmRSS:\s+(\d+)',raw,re.M)[1])*1024
            processes[int(entry.name)]=(parent,rss)
        except (OSError,TypeError,ValueError):continue
    owned={root_pid};changed=True
    while changed:
        added={pid for pid,(parent,_) in processes.items() if parent in owned and pid not in owned};changed=bool(added);owned|=added
    return sum(processes.get(pid,(0,0))[1] for pid in owned)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
    out=Path(args.output).resolve()
    if out.exists():raise SystemExit('An observed attempt directory must not be overwritten')
    out.mkdir(parents=True);started=datetime.now(timezone.utc).isoformat();clock=time.monotonic()
    paths=source_paths();before=[digest(p) for p in paths];write(out/'source-before.json',before)
    for path in paths:
        dest=out/'source-snapshot'/path.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(path.read_bytes())
    env=dict(os.environ);env['MATHSCOPE_PRESSURE_CLASS_DIRECTORY']=str(out)
    command=['node','--max-old-space-size=384','--test',str(BASE/'tests/pressure-class-kernel.test.mjs')]
    peak=0;resource_failure=None
    with (out/'node.log').open('w') as log:
        process=subprocess.Popen(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
        node_start=time.monotonic()
        while process.poll() is None:
            peak=max(peak,owned_rss(process.pid))
            if peak>512*1024**2 or time.monotonic()-node_start>60:
                resource_failure='OWNED_RSS_LIMIT' if peak>512*1024**2 else 'WALL_TIME_LIMIT'
                os.killpg(process.pid,signal.SIGKILL);break
            time.sleep(.025)
        code=process.wait()
    oracle=None;error=None
    if code==0:
        try:oracle=independent(json.loads((out/'pressure-class-kernel.json').read_text()))
        except Exception as exc:error=repr(exc)
    if oracle is not None:write(out/'independent-exact.json',oracle)
    after=[digest(p) for p in paths];write(out/'source-after.json',after);unchanged=before==after
    text=(out/'node.log').read_text();tests=int(re.search(r'(?:#|ℹ) tests (\d+)',text)[1]) if re.search(r'(?:#|ℹ) tests (\d+)',text) else None
    passed=int(re.search(r'(?:#|ℹ) pass (\d+)',text)[1]) if re.search(r'(?:#|ℹ) pass (\d+)',text) else None
    status='PASS' if code==0 and oracle and oracle['status']=='PASS' and unchanged else 'FAIL'
    artifacts=[digest(p) for p in sorted(out.iterdir()) if p.is_file()]
    receipt={'schema':'MathScope.N6.PressureClassKernelObservedReceipt/1','status':status,'startedAt':started,
      'finishedAt':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-clock,
      'node':{'command':command,'exitCode':code,'tests':tests,'passed':passed,'maxOldSpaceMiB':384,
              'ownedProcessTreeRSSLimitBytes':512*1024**2,'wallLimitSeconds':60,'observedOwnedProcessTreePeakRSSBytes':peak,
              'resourceFailure':resource_failure},
      'independent':{'status':oracle['status'] if oracle else 'NOT_COMPLETED','passed':oracle['passed'] if oracle else 0,
                     'total':oracle['total'] if oracle else 0,'error':error},
      'source':{'files':len(paths),'unchanged':unchanged,'snapshotDirectory':'source-snapshot'},'artifacts':artifacts,
      'scope':{'genericExactKernelExecuted':True,'originalFixedRadialConstantCopyExecuted':code==0,
               'actualPrivateCurrentAttachmentExecuted':False,'actualCurrentGrClassCertified':False,
               'completeN6':False,'newLeanExecuted':False}}
    write(out/'receipt.json',receipt)
    print(json.dumps({'status':status,'tests':tests,'passed':passed,'independent':receipt['independent'],
                      'sourceFiles':len(paths),'unchanged':unchanged,'elapsedSeconds':receipt['elapsedSeconds'],
                      'receipt':str(out/'receipt.json'),'receiptSHA256':digest(out/'receipt.json')['sha256']}))
    return 0 if status=='PASS' else 1

if __name__=='__main__':raise SystemExit(main())
