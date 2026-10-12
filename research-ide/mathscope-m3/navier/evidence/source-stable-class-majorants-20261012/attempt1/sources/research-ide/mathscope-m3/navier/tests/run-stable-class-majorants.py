#!/usr/bin/env python3
"""Observe the exact mixed derivative algebra for source class operators.

The actual private primary/forced attachments have their own source gate.
This small gate verifies all finite counts, stable propagator identities,
coefficient majorants and nonzero controls; it does not invent input norms.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from itertools import product
from math import comb
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

def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def source_paths():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT):raise ValueError('A source dependency escaped the repository')
        seen.add(path)
        if path.suffix in ['.js','.mjs']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for path in [BASE/'source-forced-class-majorants.mjs',BASE/'source-primary-class-majorants.mjs',
                 BASE/'tests/stable-class-majorants.test.mjs',Path(__file__)]:visit(path)
    return sorted(seen)

def independent(artifact):
    checks=[]
    def check(identity,value):checks.append({'id':identity,'pass':bool(value)})
    f=artifact['forced'][-1];mmax=f['order'];B=2
    def bound(p):return 0 if p is None else B**p
    def leibniz(a,b,m):return sum(comb(m,j)*a[j]*b[m-j] for j in range(m+1))
    for row in artifact['independent']:
        if row['kind']=='multiindex':
            alpha=row['alpha'];total=sum(alpha);counts=[0]*(total+1)
            for beta in product(*(range(a+1) for a in alpha)):
                c=1
                for a,b in zip(alpha,beta):c*=comb(a,b)
                counts[sum(beta)]+=c
            check('full-mixed-binomial-'+str(alpha),counts==list(map(int,row['counts']))==[comb(total,j) for j in range(total+1)])
    # Use exact values at the declared derivative upper bounds. These
    # sums are computed as integers, not inferred from the stored max/log
    # degree bookkeeping.
    n=list(map(bound,f['n']));inv_n=list(map(bound,f['invN']));normal_square=[leibniz(n,n,m) for m in range(mmax+1)]
    projection=[int(m==0)+3*leibniz(normal_square,inv_n,m) for m in range(mmax+1)]
    for m in range(mmax+1):check(f'complete-three-dimensional-projection-majorant-{m}',projection[m]<=bound(f['projection'][m]))
    P=list(map(bound,f['P']));inverse_p=[1]
    for m in range(1,mmax+1):
        inverse_p.append(sum(comb(m,j)*P[j]*inverse_p[m-j] for j in range(1,m+1)))
        check(f'full-positive-P-reciprocal-majorant-{m}',inverse_p[m]<=bound(f['inverseP'][m]))
    path=[bound(p) for p in f['sourcePathPullbackPowers']]
    projected=[leibniz(projection,path,m) for m in range(mmax+1)]
    frame=[leibniz(list(map(bound,f['leftFrame'])),projected,m) for m in range(mmax+1)]
    forcing=[leibniz(inverse_p,frame,m) for m in range(mmax+1)]
    for m in range(mmax+1):check(f'full-projected-frame-source-and-envelope-majorant-{m}',forcing[m]<=bound(f['forcing'][m]))
    W,L=3,2;matrix=list(map(bound,f['matrix']));source=list(map(bound,f['forcing']));w=[W*L*source[0]]
    check('zero-order-stable-Duhamel-bound',w[0]<=W*bound(f['w'][0]))
    for m in range(1,mmax+1):
        slow=W*L*(source[m]+sum(comb(m,j)*matrix[j]*w[m-j] for j in range(1,m+1)))
        fast=source[m-1]+sum(comb(m-1,j)*matrix[j]*w[m-1-j] for j in range(m))
        w.append(max(slow,fast));check(f'complete-stable-slow-and-fast-recursion-{m}',w[m]<=W**(m+1)*bound(f['w'][m]))
        row=f['recurrence'][m]
        check(f'exact-mixed-forced-dependency-coverage-{m}',[(t['matrixOrder'],t['solutionOrder'],int(t['binomial'])) for t in row['slowTerms']]==
              [(j,m-j,comb(m,j)) for j in range(1,m+1)] and
              [(t['matrixOrder'],t['solutionOrder'],int(t['binomial'])) for t in row['fastTerms']]==[(j,m-1-j,comb(m-1,j)) for j in range(m)])
    for m in range(mmax+1):
        check(f'actual-requested-background-order-{m}',artifact['forced'][m]['backgroundPrefix']['requiredBackgroundDerivativeOrder']==m+2 and
              artifact['primary'][m]['derivativeOrders']['background']==m+3)
        check(f'lower-order-prefix-preserved-{m}',artifact['forced'][m]['w']==f['w'][:m+1])
    for ell in [8,9,17,101]:
        for delta in [-2,-1,0,1,2]:
            for b in [0,1,2,7]:
                check(f'original-reference-S-comparison-{ell}-{delta}-{b}',(ell+delta)**(2*b)<=4**b*ell**(2*b))
                if delta>0 and b>0:check(f'missing-input-neighbor-factor-rejected-{ell}-{delta}-{b}',(ell+delta)**(2*b)>ell**(2*b))
    # Exact Laurent algebra in independent formal exponential values.
    # Exponent derivatives are independently propagated as rational dual
    # numbers at several points, so no transcendental rounding is used.
    def add(a,b):
        out=dict(a)
        for k,v in b.items():out[k]=out.get(k,Q(0))+v
        return {k:v for k,v in out.items() if v}
    def mul(a,b):
        out={}
        for ka,va in a.items():
            for kb,vb in b.items():
                key=tuple(sorted(ka+kb));out[key]=out.get(key,Q(0))+va*vb
        return {k:v for k,v in out.items() if v}
    def scale(a,c):return {k:v*c for k,v in a.items() if v*c}
    def dual(nodes,coordinates,variable):
        memo={}
        def run(at):
            if at in memo:return memo[at]
            op,args=nodes[at]['op'],nodes[at]['args']
            if op=='rational':out=({():Q(int(args[0]),int(args[1]))},{})
            elif op=='coordinate':out=({():coordinates[at]},{():Q(1)} if at==variable else {})
            elif op=='add':
                a,b={},{}
                for child in args:
                    x,y=run(child);a,b=add(a,x),add(b,y)
                out=a,b
            elif op=='multiply':
                a,b={():Q(1)},{}
                for child in args:
                    x,y=run(child);a,b=mul(a,x),add(mul(b,x),mul(a,y))
                out=a,b
            elif op=='integer_power':
                n=int(args[1]);x,y=run(args[0]);a,b={():Q(1)},{}
                if n<0:raise ValueError('Unexpected negative power in independent dissipative control')
                for _ in range(n):a,b=mul(a,x),add(mul(b,x),mul(a,y))
                out=a,b
            elif op=='exp':
                _,derivative=run(args[0]);value={(at,):Q(1)};out=value,mul(value,derivative)
            else:raise ValueError('Unexpected independent exact control operation '+op)
            memo[at]=out;return out
        return run
    c=artifact['propagatorControl'];v,u=c['coordinates']['v'],c['coordinates']['u']
    for left,right in [(Q(0),Q(1,3)),(Q(2,5),Q(7,5)),(Q(3),Q(9,2))]:
        ev=dual(c['nodes'],{u:left,v:right},v)
        check('positive-original-damping-'+str((left,right)),2+3*right>0)
        for row in c['rows']:
            for j,at in enumerate(row['values']):
                value,derivative=ev(at);matrix=ev(row['matrix'][j])[0]
                check(f'original-m{row["m"]}-diagonal{j}-exact-propagator-{left}',derivative==mul(matrix,value))
                wrong=add(matrix,ev(c['d'])[0]);check(f'missing-one-damping-control-{row["m"]}-{j}-{left}',derivative!=mul(wrong,value))
    for row in artifact['independent']:
        if row['kind']!='angular-covariance':continue
        ev=dual(row['nodes'],{},-1)
        for r in row['rows']:
            check(f'full-two-sided-angular-convolution-{r["j"]}-{r["k"]}',ev(r['zeroMode'])[0]==ev(r['expected'])[0])
            check(f'omitted-curl-square-negative-{r["j"]}-{r["k"]}',bool(ev(r['omission'])[0]))
    check('common-reference-input-not-silently-converted',not f['inputNormalization']['localInputNormAutomaticallyConverted'])
    check('negative-zero-data-Duhamel-sign',f['recurrence'][0]['identity'].startswith('w(v)=-integral'))
    check('no-generic-artifact-grants-current-class-authority',not artifact['actualPrivatePrimaryNormAttachmentExecuted'] and
          not artifact['actualPrivateForcedClassAttachmentExecuted'] and not artifact['actualCompleteInitialClassCertified'] and not artifact['completeN6'])
    return {'schema':'MathScope.N6.IndependentStableClassMajorantAlgebra/1','arithmetic':'Python integers, Fraction, complete mixed multi-indices, formal exponential dual algebra',
            'checks':checks,'checkCount':len(checks),'pass':all(row['pass'] for row in checks),'actualSourceClassAttachmentExecuted':False,'completeN6':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,default=1);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Use a new positive attempt number')
    out=BASE/'evidence/source-stable-class-majorants-20261012'/f'attempt{args.attempt}';out.mkdir(parents=True,exist_ok=False)
    paths=source_paths();before=[digest(p) for p in paths];write(out/'source-before.json',before)
    for p in paths:
        target=out/'sources'/p.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(p.read_bytes())
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();artifact=out/'stable-class-algebra.json'
    command=['node','--test','--test-reporter=tap','--test-concurrency=1',str(BASE/'tests/stable-class-majorants.test.mjs')]
    run=subprocess.run(command,cwd=ROOT,env=dict(os.environ,MATHSCOPE_STABLE_CLASS_ARTIFACT=str(artifact)),capture_output=True,text=True,timeout=60)
    (out/'node.log').write_text(run.stdout);(out/'node.stderr').write_text(run.stderr)
    counts={name:int(match[1]) if (match:=re.search(r'^# '+name+r' (\d+)$',run.stdout,re.M)) else 0 for name in ['pass','fail','skipped']}
    result={'pass':False,'checkCount':0,'checks':[]}
    try:
        if run.returncode:raise ValueError('Node stable class algebra checks failed')
        result=independent(json.loads(artifact.read_text()))
    except Exception as error:result['error']=type(error).__name__+': '+str(error)
    write(out/'independent-fraction.json',result);after=[digest(p) for p in paths];write(out/'source-after.json',after)
    receipt={'schema':'MathScope.N6.ObservedStableClassMajorantAlgebraGate/1','attempt':args.attempt,'startedUTC':started,
             'finishedUTC':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':command,'exitCode':run.returncode,
             'nodeTests':counts,'sourceFileCount':len(paths),'sourceBytesUnchanged':before==after,'independentChecks':result['checkCount'],
             'independentPass':result['pass'],'artifacts':[digest(p) for p in sorted(out.iterdir()) if p.is_file()],
             'actualPrivatePrimaryNormAttachmentExecuted':False,'actualPrivateForcedClassAttachmentExecuted':False,'completeN6':False,
             'pass':run.returncode==0 and counts=={'pass':10,'fail':0,'skipped':0} and before==after and result['pass']}
    write(out/'receipt.json',receipt)
    print(json.dumps({'receipt':digest(out/'receipt.json'),'nodeTests':counts,'independentChecks':result['checkCount'],
                     'sourceFilesUnchanged':before==after,'pass':receipt['pass']},indent=2))
    raise SystemExit(0 if receipt['pass'] else 1)

if __name__=='__main__':main()
