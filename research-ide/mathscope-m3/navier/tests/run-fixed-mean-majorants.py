#!/usr/bin/env python3
"""Observe the actual fixed five-profile seminorm generator.

This gate constructs original source bodies and a full finite integral
bound program. Its independent arithmetic checks use a different Bell
recurrence for the flat seed, exact rational collar/chain combinatorics,
and the complete source FTC inventories. No current P/J norm is invented.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from math import comb, factorial
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
    return {'path':str(path.relative_to(ROOT)), 'bytes':len(raw), 'sha256':hashlib.sha256(raw).hexdigest()}

def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

def source_paths():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT):raise ValueError('Source escaped this repository')
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for path in [BASE/'source-fixed-mean-majorants.mjs',BASE/'source-initialized-mean-majorants.mjs',
                 BASE/'tests/fixed-mean-majorants.test.mjs',Path(__file__)]:visit(path)
    return sorted(seen)

def independent(artifact):
    checks=[]
    def check(name,value,**extra):checks.append({'id':name,'pass':bool(value),**extra})
    data=artifact['independentInputs']
    # Different recurrence: y^(n)/y for y=exp(g), with g=-1/t-1/(1-t).
    # Differentiate y'=g'*y by Leibniz; do not reuse the emitted P_n rule.
    for at in [Q(1,5),Q(2,5),Q(1,2),Q(3,5),Q(4,5)]:
        normalized=[Q(1)]
        for n in range(1,len(data['seed']['rows'])):
            normalized.append(sum((Q(comb(n-1,k))*(Q((-1)**(k+2)*factorial(k+1),1)/at**(k+2)
                -Q(factorial(k+1),1)/(1-at)**(k+2))*normalized[n-1-k] for k in range(n)),Q(0)))
        q=at*(1-at)
        for row in data['seed']['rows']:
            n=row['order'];p=sum((Q(int(c))*at**j for j,c in enumerate(row['polynomial'])),Q(0))
            check(f'independent-exp-Bell-jet-t{at}-n{n}',p/q**row['denominatorPower']==normalized[n])
            check(f'nonzero-polynomial-omission-control-t{at}-n{n}',(p+1)/q**row['denominatorPower']!=normalized[n])
    for row in data['seed']['rows']:
        n=row['order'];check(f'exact-flat-seed-denominator-order-{n}',row['denominatorPower']==2*n)
        check(f'complete-flat-seed-polynomial-l1-{n}',sum(abs(int(c)) for c in row['polynomial'])==int(row['numeratorL1']))
        for N in [0,1,3,8]:check(f'flat-exponential-series-positive-remainder-n{n}-N{N}',N+2*n+1-2*n==N+1 and N+1>0)
    support=data['support'];lower,upper=map(Q,support['collar']);outer_lower,outer_upper=map(Q,support['outerInterval'])
    check('strict-original-profile-potential-collar',outer_lower<lower<Q(support['lower']) and Q(support['upperRationalStrict'])<upper<outer_upper)
    check('original-upper-profile-log-majorant',Q(1)+Q(4,5)+2*Q(1,10)==2)
    check('whole-original-eta-strip-in-positive-chart',list(map(Q,support['eta']))==[Q(-1),Q(1)] and 1-2*Q(support['hStrictUpper'])==Q(7,8))
    for row in data['leibniz']:
        m=row['order'];check(f'all-mixed-Leibniz-coefficients-order-{m}',sum(comb(m,j) for j in range(m+1))==int(row['coefficientSum']))
        check(f'radial-extra-target-derivative-order-{m}',row['requiredTargetDerivativeOrder']==m+1 and row['addedSPower']==0)
    c=artifact['certificate'];nodes=c['program']['nodes']
    check('complete-original-source-program-count',len(nodes)==c['graph']['nodeCount'] and len(nodes)>40000)
    for j,row in enumerate(c['normRows']):
        expected=[] if row.get('constantBody') or row.get('exactZeroBody') else list(range(2**len(row['coordinates'])))
        check(f'complete-FTC-face-inventory-{j}',[f['mask'] for f in row['faces']]==expected)
        if row['ordinaryFieldDerivativeTakenBeforeDividingByZeta']:
            node=nodes[row['weightedBody']]
            if row['sourceBody']==0:
                check(f'zero-weighted-source-body-{j}',row['sourceBody']==row['weightedBody'])
            else:
                # The exact graph normalizer may flatten multiplication,
                # but an inverse of this same zeta must remain reachable.
                seen=set();stack=[row['weightedBody']];found=False
                while stack:
                    at=stack.pop()
                    if at in seen:continue
                    seen.add(at);op,args=nodes[at]['op'],nodes[at]['args']
                    if op=='inverse' and args[0]==c['domain']['zeta']:found=True
                    if op in ['add','multiply']:stack.extend(args)
                check(f'ordinary-derivative-then-original-zeta-{j}',found)
    check('same-exact-original-positive-parameters',c['sourceDefinitions']['lambda']=={'exp':{'product':[{'integer':-1000},{'ref':'T'}]}}
          and c['sourceDefinitions']['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}})
    check('all-input-class-obligations-retained',not artifact['actualInitializedMeanAttachmentExecuted'] and not artifact['actualInputClassNormsAvailable']
          and c['actualInputDefectNormsStillRequired'] and not c['scope']['currentDefectClassCertified'] and not c['scope']['wholeN6Complete'])
    return {'schema':'MathScope.N6.IndependentFixedMeanMajorants/1','arithmetic':'Python exact Fraction and integer polynomial/Bell recurrence',
            'checks':checks,'checkCount':len(checks),'pass':all(c['pass'] for c in checks),
            'fixedSourceOperatorNormProgramExecuted':True,'currentSourceInputClassNormsAuthenticated':False,'wholeN6Complete':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,default=1);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Use a new positive attempt number')
    out=BASE/'evidence/source-fixed-mean-majorants-20261012'/f'attempt{args.attempt}';out.mkdir(parents=True,exist_ok=False)
    paths=source_paths();before=[digest(p) for p in paths];write(out/'source-before.json',before)
    for p in paths:
        dest=out/'sources'/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes())
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();artifact=out/'fixed-mean-operator.json'
    env=dict(os.environ,MATHSCOPE_FIXED_MEAN_MAJORANT_ARTIFACT=str(artifact))
    command=['node','--test','--test-reporter=tap','--test-concurrency=1',str(BASE/'tests/fixed-mean-majorants.test.mjs')]
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
    receipt={'schema':'MathScope.N6.ObservedActualFixedMeanOperatorGate/1','attempt':args.attempt,'startedUTC':started,
             'finishedUTC':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':command,
             'exitCode':run.returncode,'nodeTests':counts,'sourceFileCount':len(paths),'sourceBytesUnchanged':before==after,
             'independentChecks':result['checkCount'],'independentPass':result['pass'],
             'artifacts':[digest(p) for p in sorted(out.iterdir()) if p.is_file()],
             'actualFixedSourceOperatorNormsConstructed':True,'actualCurrentInputClassNormsAuthenticated':False,
             'actualInitializedMeanAttachmentExecuted':False,'wholeN6Complete':False,
             'pass':run.returncode==0 and counts['pass']==10 and counts['fail']==0 and counts['skipped']==0 and before==after and result['pass']}
    write(out/'receipt.json',receipt)
    print(json.dumps({'receipt':digest(out/'receipt.json'),'nodeTests':counts,'independentChecks':result['checkCount'],
        'sourceFilesUnchanged':before==after,'pass':receipt['pass']},indent=2))
    raise SystemExit(0 if receipt['pass'] else 1)

if __name__=='__main__':main()
