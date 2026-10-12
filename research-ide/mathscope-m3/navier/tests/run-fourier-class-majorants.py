#!/usr/bin/env python3
"""Observe original fixed torus class constants with independent exact algebra.

The Python side interprets each retained scalar bound in Q(sqrt(2)) with
pi as an independent formal positive parameter. It does not numerically
replace the actual source pi or tiny h. Whole-lattice estimates are checked
by exact shell counts and the telescoping integral comparison. Current
source seminorms and the full radial zero moment remain separate premises.
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
    for path in [BASE/'source-fourier-class-majorants.mjs',BASE/'tests/fourier-class-majorants.test.mjs',Path(__file__)]:visit(path)
    return sorted(seen)

def independent(artifact):
    checks=[]
    def check(name,truth):checks.append({'id':name,'pass':bool(truth)})
    c=artifact['certificate'];inputs=artifact['independentInputs'];nodes=c['program']['nodes']
    add=lambda x,y:(x[0]+y[0],x[1]+y[1])
    mul=lambda x,y:(x[0]*y[0]+2*x[1]*y[1],x[0]*y[1]+x[1]*y[0])
    def inv(x):
        n=x[0]**2-2*x[1]**2
        if not n:raise ValueError('Zero quadratic reciprocal in independent interpreter')
        return x[0]/n,-x[1]/n
    def power(x,n):
        if n<0:return power(inv(x),-n)
        z=Q(1),Q(0)
        while n:
            if n%2:z=mul(z,x)
            x=mul(x,x);n//=2
        return z
    for j,row in enumerate(inputs['modes']):
        k0,k1=map(int,row['mode']);u,v=(k1-k0,k0) if row['direction']=='temporal' else (k0+k1,-k1)
        norm=u*u-2*v*v;n=max(abs(k0),abs(k1));reciprocal=inv((Q(u),Q(v)))
        check(f'original-integer-direction-{j}',(str(u),str(v),str(norm))==tuple(row['quadratic'][key] for key in ['u','v','integerNorm']))
        check(f'near-resonant-nonzero-integer-norm-{j}',norm==1 and n>0 and str(n)==row['maxFrequency'])
        check(f'exact-quadratic-reciprocal-{j}',mul((Q(u),Q(v)),reciprocal)==(Q(1),Q(0)))
        check(f'conjugate-all-mode-majorant-{j}',abs(u)<=2*n and abs(v)<=n)
        check(f'wrong-direction-component-rejected-{j}',(u+1,v)!=(u,v))
    for r in [0,1,2,3]:check(f'quadratic-parity-descent-square-residue-{r}',r*r%4 in [0,1])
    for pi in map(Q,inputs['formalPiValues']):
        memo={c['roots']['exactPi']:(pi,Q(0))}
        def evaluate(at):
            if at in memo:return memo[at]
            op,args=nodes[at]['op'],nodes[at]['args']
            if op=='rational':out=Q(int(args[0]),int(args[1])),Q(0)
            elif op=='add':
                out=Q(0),Q(0)
                for child in args:out=add(out,evaluate(child))
            elif op=='multiply':
                out=Q(1),Q(0)
                for child in args:out=mul(out,evaluate(child))
            elif op=='inverse':out=inv(evaluate(args[0]))
            elif op=='integer_power':out=power(evaluate(args[0]),int(args[1]))
            elif op=='sqrt_positive' and evaluate(args[0])==(Q(2),Q(0)):out=Q(0),Q(1)
            else:raise ValueError('Unexpected fixed scalar bound operation '+op)
            memo[at]=out;return out
        for row in c['rows']:
            p=row['inversePower'];d=power((Q(2),Q(1)),p)
            expected=mul((Q(16)/(2*pi)**(2*p+3),Q(0)),d)
            tail=mul((Q(8)/(2*pi)**(2*p+3),Q(0)),d)
            check(f'full-source-constant-p{p}-formal-pi{pi}',evaluate(row['operatorConstant'])==expected)
            check(f'full-omitted-square-tail-p{p}-formal-pi{pi}',evaluate(row['completeTailCoefficient'])==tail)
            wrong=mul((Q(16)/(2*pi)**(2*p+2),Q(0)),d)
            check(f'omitted-2pi-factor-control-p{p}-formal-pi{pi}',evaluate(row['operatorConstant'])!=wrong)
    for n in range(inputs['shellRange'][0],inputs['shellRange'][1]+1):
        shell=sum(1 for i in range(-n,n+1) for j in range(-n,n+1) if max(abs(i),abs(j))==n)
        check(f'complete-square-shell-{n}',shell==8*n)
        check(f'exact-inverse-shell-power-{n}',Q(shell,n**3)==Q(8,n**2))
    for n in range(2,130):
        check(f'whole-series-telescoping-comparison-{n}',Q(1,n*n)<=Q(1,n-1)-Q(1,n))
    for K in [1,2,3,10,37]:
        partial=sum((Q(1,n*n) for n in range(K+1,K+100)),Q(0))
        check(f'complete-tail-upper-by-integral-{K}',0<partial<Q(1,K))
    for j,d in enumerate(inputs['derivativeDemands']):
        m,p=d['outputOrder'],d['inversePower']
        check(f'mixed-total-source-order-{j}',d['torusSourceOrder']==m+p+3)
        check(f'radial-plus-torus-IBP-source-order-{j}',d['radialIBPSourceOrder']==m+2*p+3)
        check(f'fourier-power-cancellation-{j}',-(m+p+3)+p+m==-3 and -(m+p+3)-p+m==-(2*p+3))
        check(f'missing-radial-derivative-control-{j}',m+p+3<m+2*p+3)
    for ell in range(inputs['normalizationEllRange'][0],inputs['normalizationEllRange'][1]+1):
        check(f'exact-shifted-reference-S-ratio-{ell}',Q((ell-2)**2,ell**2)==(1-Q(2,ell))**2<=1)
    for defect in [Q(0),Q(1,4),Q(1,2),Q(999,1000)]:
        check(f'positive-floor-defect-exponent-{defect}',-1<=defect-1<0)
    palette=c['palette']
    check('explicit-reference-band-S-retained',palette['referenceS']=='S_ref=ell_ref^2' and not palette['localContinuousScaleSubstituted'])
    check('one-reference-S-factor-per-temporal-inverse',all(r['addedSPower']==1 and r['inputOrder']==r['order']+4 for r in c['operators']['temporal']['rows']))
    check('finite-program-is-complete',len(nodes)==c['graph']['nodeCount'])
    check('same-exact-h-not-rounded',c['source']['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152')
    check('no-current-norm-or-zero-moment-invented',not artifact['actualCurrentAttachmentExecuted'] and not artifact['actualCurrentInputNormsInvented'] and
          not c['scope']['actualCurrentInputClassNormsCertified'] and not c['scope']['radialInputWeightedZeroMomentCertified'] and not c['scope']['completeN6'])
    return {'schema':'MathScope.N6.IndependentOriginalFourierClassMajorants/1','arithmetic':'Python Fraction, exact Q(sqrt(2)), all-mode shell and derivative identities',
            'checks':checks,'checkCount':len(checks),'pass':all(c['pass'] for c in checks),'actualCurrentClassCertified':False,'completeN6':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,default=1);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Use a new positive attempt number')
    out=BASE/'evidence/source-fourier-class-majorants-20261012'/f'attempt{args.attempt}';out.mkdir(parents=True,exist_ok=False)
    paths=source_paths();before=[digest(p) for p in paths];write(out/'source-before.json',before)
    for p in paths:
        dest=out/'sources'/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes())
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();artifact=out/'fourier-operator.json'
    env=dict(os.environ,MATHSCOPE_FIXED_FOURIER_MAJORANT_ARTIFACT=str(artifact))
    command=['node','--test','--test-reporter=tap','--test-concurrency=1',str(BASE/'tests/fourier-class-majorants.test.mjs')]
    run=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True,timeout=60)
    (out/'node.log').write_text(run.stdout);(out/'node.stderr').write_text(run.stderr)
    counts={name:int(match[1]) if (match:=re.search(r'^# '+name+r' (\d+)$',run.stdout,re.M)) else 0 for name in ['pass','fail','skipped']}
    result={'pass':False,'checkCount':0,'checks':[]}
    try:
        if run.returncode:raise ValueError('Actual source Node gate failed')
        result=independent(json.loads(artifact.read_text()))
    except Exception as error:result['error']=type(error).__name__+': '+str(error)
    write(out/'independent-fraction.json',result)
    after=[digest(p) for p in paths];write(out/'source-after.json',after)
    receipt={'schema':'MathScope.N6.ObservedActualFixedFourierOperatorGate/1','attempt':args.attempt,'startedUTC':started,
             'finishedUTC':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':command,
             'exitCode':run.returncode,'nodeTests':counts,'sourceFileCount':len(paths),'sourceBytesUnchanged':before==after,
             'independentChecks':result['checkCount'],'independentPass':result['pass'],
             'artifacts':[digest(p) for p in sorted(out.iterdir()) if p.is_file()],
             'actualFixedSourceFourierOperatorNormsConstructed':True,'actualCurrentInputClassNormsAuthenticated':False,
             'actualCurrentAttachmentExecuted':False,'completeN6':False,
             'pass':run.returncode==0 and counts['pass']==8 and counts['fail']==0 and counts['skipped']==0 and before==after and result['pass']}
    write(out/'receipt.json',receipt)
    print(json.dumps({'receipt':digest(out/'receipt.json'),'nodeTests':counts,'independentChecks':result['checkCount'],
                     'sourceFilesUnchanged':before==after,'pass':receipt['pass']},indent=2))
    raise SystemExit(0 if receipt['pass'] else 1)

if __name__=='__main__':main()
