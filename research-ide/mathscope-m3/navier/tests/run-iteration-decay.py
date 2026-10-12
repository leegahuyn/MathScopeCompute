#!/usr/bin/env python3
"""Observe original all-j degree implications with independent Fraction algebra.

This gate verifies the class implications and exact physical losses. The
actual source class premises and finite current constructors are separate.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
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
    data=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def source_paths():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT):raise ValueError('Dependency escaped the repository')
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for path in [BASE/'source-iteration-decay.mjs',BASE/'tests/iteration-decay.test.mjs',Path(__file__)]:visit(path)
    return sorted(seen)

def independent(a):
    checks=[]
    def check(name,value):checks.append({'id':name,'pass':bool(value)})
    def pair(c=0,s=0):return Q(c),Q(s)
    def add(*xs):return tuple(sum(x[i] for x in xs) for i in range(2))
    def times(x,k):return tuple(v*Q(k) for v in x)
    def sub(x,y):return add(x,times(y,-1))
    def unpack(x):return Q(x['constant']),Q(x['slope'])
    def at(x,t):return x[0]+x[1]*t
    k=pair('1/100000');half=pair('1/2');B=pair('7/10','1/10');C=pair('6/5','1/10')
    H=sub(C,times(k,2));gain=pair('1/10');rem=pair('17/25');expected={}
    def want(name,l,r,strict=False):expected[name]=(l,r,strict)
    for name,l,r in [
        ('linear',sub(pair(1),times(k,3)),pair('7/10')),
        ('nonlinear',sub(pair(1),k),pair('7/10')),
        ('covariance-after-radial-loss',sub(pair('3/2'),times(k,2)),pair('149/100')),
        ('axial-pressure',sub(pair(2),k),pair('149/100')),
        ('temporal-remainder',sub(pair(2),times(k,3)),pair('149/100')),
        ('retained-averaged-mean',pair('149/100'),pair('6/5')),
        ('five-nonlinear-defect',sub(pair('9/5'),k),pair('6/5')),
        ('wave-mean-interaction',sub(pair(1),k),pair('7/10'))]:
        suffix='at-least-'+('B0' if r==pair('7/10') else '1.49' if r==pair('149/100') else 'C0')
        want('initial-'+name+'-'+suffix,l,r)
    want('initial-curl-above-cumulative-remainder',sub(pair(1),k),rem)
    want('initial-mean-above-cumulative-mean',sub(pair(1),k),pair('9/10'))
    want('initial-radial-mean-above-cumulative-radial',sub(pair(2),k),pair('19/10'))
    forced={'linear':sub(add(B,half),times(k,3)),'old-wave-cross':sub(add(B,half),k),
            'self-quadratic':sub(times(B,2),k),'total-mean-cross':add(B,pair('2/5'))}
    for name,l in forced.items():want('forced-'+name,l,add(B,pair('2/5')))
    signed={'linear':sub(add(B,half),times(k,4)),'total-mean-cross':sub(add(B,pair('2/5')),k),
            'old-wave-cross':sub(add(B,half),times(k,2)),'self-quadratic':sub(times(B,2),times(k,3))}
    for name,l in signed.items():want('signed-'+name,l,sub(add(B,pair('2/5')),k))
    covariance={'old-wave-minus-primary':sub(add(B,rem),times(k,2)),
                'full-curl-remainder':sub(add(C,half),times(k,3)),
                'signed-self-quadratic':sub(times(B,2),times(k,3))}
    for name,l in covariance.items():want('signed-mean-'+name,l,add(C,pair('17/100')),True)
    for name in ['signed-retained-weighted-moment','signed-axial-and-pressure-changes']:
        want(name,sub(add(C,pair(1)),times(k,1 if 'moment' in name else 2)),add(C,pair('17/100')),True)
    temporal={'slow-time':add(H,pair(1)),'radial-flux':sub(add(H,pair(1)),k),
              'axial-flux':add(H,pair(1)),'viscosity':sub(add(H,pair(1)),times(k,2))}
    for name,l in temporal.items():want('temporal-'+name,l,sub(add(H,pair(1)),times(k,2)))
    for name,l,r in [
        ('retained-mean-gain-closes-cycle',add(C,pair('17/100')),add(C,gain)),
        ('new-temporal-mean-gain-closes-cycle',sub(add(H,pair(1)),times(k,2)),add(C,gain)),
        ('five-new-defects-close-cycle',sub(add(H,pair('9/10')),times(k,2)),add(C,gain)),
        ('mean-interaction-closes-wave-cycle',H,add(B,gain)),
        ('forced-errors-close-wave-cycle',add(B,pair('2/5')),add(B,gain)),
        ('signed-errors-close-wave-cycle',sub(add(B,pair('2/5')),k),add(B,gain)),
        ('all-signed-increments-preserve-old-remainder',sub(B,k),rem),
        ('all-forced-increments-preserve-old-remainder',B,rem),
        ('all-new-mean-and-pressure-increments-preserve-cumulative-class',H,pair('9/10')),
        ('all-new-radial-increments-preserve-cumulative-class',add(H,pair(1)),pair('19/10'))]:want(name,l,r,True)
    for name,l in [('forced',sub(B,gain)),('signed',sub(sub(B,gain),k)),('mean-and-pressure',sub(H,gain)),('radial',add(sub(H,gain),pair(1)))]:
        want('physical-cycle-j-'+name+'-minimum',l,pair(0,'1/10'))
    rows=a['decay']['checks'];check('entire-original-inequality-index-set',set(expected)=={r['id'] for r in rows} and len(rows)==len(expected))
    for row in rows:
        name=row['id'];l,r,strict=expected[name];margin=sub(l,r)
        check('exact-original-affine-coefficients-'+name,unpack(row['left'])==l and unpack(row['right'])==r and unpack(row['margin'])==margin)
        check('all-j-nonnegative-with-original-strictness-'+name,margin[1]>=0 and (margin[0]>0 if strict else margin[0]>=0) and row['strict']==strict)
    check('original-initial-B0-C0',a['decay']['originalInitialOrders']=={'B0':'7/10','C0Star':'6/5'})
    check('one-tenth-sigma-gain',unpack(a['decay']['sigma'])==pair('1/5','1/10'))
    for p in a['physical']:
        m=p['order'];ell=pair(m+2,Q(3*m+7,2));K=pair(m+Q(7,2),Q(3*m+10,2));ellprime=add(pair(m+3,Q(3*m+10,2)),pair(m+1))
        check(f'exact-stage-independent-ell-K-ellprime-{m}',unpack(p['ell'])==ell and unpack(p['K'])==K and unpack(p['ellPrime'])==ellprime)
        for row in p['checks']:
            l,r=unpack(row['left']),unpack(row['right']);delta=sub(l,r)
            check(f'whole-h-interval-{m}-{row["id"]}',unpack(row['difference'])==delta and at(delta,Q(0))>=0 and at(delta,Q(1,16))>=0)
    nodes=a['dependency']['nodes'];seen=set()
    for node in nodes:
        check('acyclic-exact-dependency-'+node['id'],node['id'] not in seen and all(e['input'] in seen for e in node['inputs']))
        seen.add(node['id'])
    check('actual-class-authority-not-invented',not a['sourceClassPremisesDischarged'] and not a['actualInitialClassConstructed'] and
          not a['allFiniteActualFieldsConstructed'] and not a['completeN6'] and not a['decay']['sourceClassPremisesDischarged'])
    return {'schema':'MathScope.N6.IndependentOriginalIterationDecay/1','arithmetic':'Python Fraction exact affine polynomial coefficients; every j>=0 and the whole h interval',
            'checks':checks,'checkCount':len(checks),'pass':all(r['pass'] for r in checks),'actualSourceClassesCertified':False,'completeN6':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,default=1);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Use a positive unused attempt')
    out=BASE/'evidence/iteration-decay-20261012'/f'attempt{args.attempt}';out.mkdir(parents=True,exist_ok=False)
    paths=source_paths();before=[digest(p) for p in paths];write(out/'source-before.json',before)
    for p in paths:
        target=out/'sources'/p.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(p.read_bytes())
    tick=time.monotonic();started=datetime.now(timezone.utc).isoformat();artifact=out/'iteration-decay-algebra.json'
    command=['node','--test','--test-reporter=tap','--test-concurrency=1',str(BASE/'tests/iteration-decay.test.mjs')]
    run=subprocess.run(command,cwd=ROOT,env=dict(os.environ,MATHSCOPE_ITERATION_DECAY_ARTIFACT=str(artifact)),capture_output=True,text=True,timeout=60)
    (out/'node.log').write_text(run.stdout);(out/'node.stderr').write_text(run.stderr)
    counts={name:int(match[1]) if (match:=re.search(r'^# '+name+r' (\d+)$',run.stdout,re.M)) else 0 for name in ['pass','fail','skipped']}
    result={'pass':False,'checkCount':0,'checks':[]}
    try:
        if run.returncode:raise ValueError('Node iteration checks failed')
        result=independent(json.loads(artifact.read_text()))
    except Exception as error:result['error']=type(error).__name__+': '+str(error)
    write(out/'independent-fraction.json',result);after=[digest(p) for p in paths];write(out/'source-after.json',after)
    receipt={'schema':'MathScope.N6.ObservedOriginalIterationDecayGate/1','attempt':args.attempt,'startedUTC':started,
      'finishedUTC':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':command,'exitCode':run.returncode,
      'nodeTests':counts,'sourceFileCount':len(paths),'sourceBytesUnchanged':before==after,'independentChecks':result['checkCount'],'independentPass':result['pass'],
      'artifacts':[digest(p) for p in sorted(out.iterdir()) if p.is_file()],
      'actualInitialClassConstructed':False,'allFiniteActualFieldsConstructed':False,'completeN6':False,
      'pass':run.returncode==0 and counts=={'pass':5,'fail':0,'skipped':0} and before==after and result['pass']}
    write(out/'receipt.json',receipt);print(json.dumps({'receipt':digest(out/'receipt.json'),'nodeTests':counts,'independentChecks':result['checkCount'],
      'sourceBytesUnchanged':before==after,'pass':receipt['pass'],'error':result.get('error')},indent=2))
    raise SystemExit(0 if receipt['pass'] else 1)

if __name__=='__main__':main()
