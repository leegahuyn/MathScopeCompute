#!/usr/bin/env python3
"""Observe private fresh-mean contracts and complete fixed-source copying.

This finite gate does not execute the large private mean current. It
checks the exact operator body copy, all target products, recipe margins
and rejection paths needed by that later same-source attachment.
"""
from datetime import datetime,timezone
from fractions import Fraction as Q
from functools import lru_cache
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import resource
import shutil
import subprocess
import time

ROOT=Path(__file__).resolve().parents[4];BASE=ROOT/'research-ide/mathscope-m3/navier'

def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def digest(path):
    b=path.read_bytes();return {'path':str(path.relative_to(ROOT)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}

def sources():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT):raise ValueError('Source escaped repo')
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for path in [BASE/'source-global-fresh-mean-class-majorants.mjs',BASE/'tests/fresh-mean-private-contract.test.mjs',Path(__file__)]:visit(path)
    return sorted(seen)

def independent(data):
    checks=[]
    def check(name,truth):checks.append({'id':name,'pass':bool(truth)})
    f=data['fixtures'];copy=f['fixedCopy'];original=data['originalFixedOperator'];A=original['program']['nodes'];B=data['program']['nodes']
    mapping={r['from']:r['to'] for r in copy['identities']}
    check('complete-no-duplicate-source-copy-map',len(mapping)==len(copy['identities']))
    supported={'rational','source_parameter','coordinate','add','multiply','inverse','integer_power','exp','log_positive',
               'sqrt_positive','maximum','ceiling','source_step_derivative','sine','cosine','smooth_piecewise','definite_integral'}
    for row in copy['identities']:
        left=A[row['from']];right=B[row['to']];op=left['op'];args=left['args']
        good=op in supported and right['op']==op and row['operation']==op
        if op=='coordinate':good=good and len(right['args'])==1 and right['args'][0]!=args[0]
        elif op in ['rational','source_parameter']:good=good and right['args']==args
        elif op in ['integer_power','source_step_derivative']:good=good and right['args']==[mapping[args[0]],args[1]]
        else:
            expected=[mapping[i] for i in args]
            if op in ['add','multiply']:expected.sort()
            good=good and right['args']==expected
        check('complete-original-fixed-operator-node-copy-'+str(row['from']),good)
    @lru_cache(None)
    def free(at):
        op,args=B[at]['op'],B[at]['args']
        if op=='coordinate':return frozenset([at])
        if op in ['rational','source_parameter']:return frozenset()
        if op=='definite_integral':return (free(args[0])-{args[1]})|free(args[2])|free(args[3])
        children=args[:1] if op in ['integer_power','source_step_derivative'] else args
        if op not in supported:raise ValueError('Unknown operation in copied complete fixed constant '+op)
        out=set()
        for child in children:out.update(free(child))
        return frozenset(out)
    for n,row in enumerate(copy['roots']):
        check('copied-fixed-root-namespaces-'+str(n),mapping[row['sourceRoot']]==row['targetRoot'])
        check('copied-entire-fixed-constant-is-closed-'+str(n),not free(row['targetRoot']))
    check('same-original-source-profile-signature',copy['sourceParameterSHA256']==data['program']['source']['parameterExpressionSHA256'])
    check('same-exact-original-h-definition',data['program']['source']['parametersExactExpressions']['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}})
    check('same-exact-original-lambda-definition',data['program']['source']['parametersExactExpressions']['lambda']=={'exp':{'product':[{'integer':-1000},{'ref':'T'}]}})
    actual=f['actualFixedProducts'];rows=actual['product']['rows'];rational=lambda id:Q(*map(int,B[id]['args'])) if B[id]['op']=='rational' else None
    for m,row in enumerate(rows):
        source=actual['defectRows'][m+1]['defects'];old=original['byOrder'][m];op=actual['operatorRows'][m]
        check('fixed-original-maximum-root-copied-'+str(m),mapping[old['maximum']]==op['maximum'])
        total=sum(rational(source[k]['constant']) for k in ['P','Jtheta','Jz'])
        check('all-three-fresh-input-bounds-added-'+str(m),rational(row['combinedInput']['constant'])==total)
        check('beta-actual-target-derivative-order-'+str(m),row['inputOrder']==m+1 and op['requiredTargetDerivativeOrder']==m+1)
        for name in ['v','gamma','psi','beta']:
            key='betaOverEpsilon' if name=='beta' else name;constant=op['componentBounds'][key];field=row['fields'][name]
            check('same-fixed-source-component-root-'+str(m)+'-'+name,mapping[old['componentBounds'][key]]==constant)
            check('complete-source-norm-times-all-targets-'+str(m)+'-'+name,
                  B[field['constant']]=={'op':'multiply','args':sorted([constant,row['combinedInput']['constant']])})
            check('full-source-weight-and-epsilon-'+str(m)+'-'+name,field['weight']=='zeta' and field['pole']==0 and
                  field['epsilonExponent']==('2-kappa_s' if name=='beta' else '1-kappa_s'))
        check('new-Jz-norm-really-changes-both-components-'+str(m),m>0 or all(f['changedJz']['result']['rows'][0]['fields'][name]['constant']!=row['fields'][name]['constant'] for name in ['v','beta']))
    recipe=f['recipe'];k=Q(1,100000);margins=recipe['exactLowerBounds']
    check('exact-cumulative-tangential-source-margin',Q(margins['cumulativeTangentialMargin'])==1-k-Q(9,10)>0)
    check('exact-cumulative-radial-source-margin',Q(margins['cumulativeRadialMargin'])==2-k-Q(19,10)>0)
    check('exact-new-defects-above-original-C0',Q(margins['newDefectsAboveC0Star'])==2-2*k-Q(6,5)>0)
    check('closed-full-operator-producer-inventory',set(recipe['producers'])=={'demand','fullGrAndDefects','fixedFive','newNonlinearDefects','radial','fixedFiveConstants','finitePostTemporalAttachment','finiteInitializedAttachment'})
    check('actual-source-input-norm-authority-still-required',not recipe['actualSourceClassAuthoritySupplied'] and not actual['product']['actualCurrentInputClassCertified'])
    check('unmaterialized-source-rows-not-reported-as-executed',not recipe['unmaterializedDerivativeRowsDeclaredExecuted'])
    check('private-current-not-executed-by-this-light-gate',not data['actualPrivateCurrentAttachmentExecuted'] and not data['actualCurrentInputSourceClassCertified'] and not data['originalProp9_5Certified'] and not data['completeN6'])
    return checks

def main():
    p=argparse.ArgumentParser();p.add_argument('--attempt',type=int,required=True);a=p.parse_args()
    if a.attempt<1:raise ValueError('Positive new attempt required')
    dest=BASE/'evidence/source-fresh-mean-private-contract-20261012'/('attempt'+str(a.attempt))
    if dest.exists():raise ValueError('An observed attempt cannot be overwritten')
    dest.mkdir(parents=True);start=time.monotonic();started=datetime.now(timezone.utc).isoformat();paths=sources()
    before=[digest(p) for p in paths];write(dest/'source-before.json',before)
    for path in paths:
        target=dest/'sources'/path.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,target)
    env=dict(os.environ);env['MATHSCOPE_FRESH_MEAN_PRIVATE_DIRECTORY']=str(dest)
    cmd=['node','--max-old-space-size=384','--test',str(BASE/'tests/fresh-mean-private-contract.test.mjs')]
    with (dest/'node.log').open('w') as out:
        result=subprocess.run(cmd,env=env,stdout=out,stderr=subprocess.STDOUT,timeout=60,check=False)
    log=(dest/'node.log').read_text();nt=re.search(r'(?:#|ℹ) tests (\d+)',log);np=re.search(r'(?:#|ℹ) pass (\d+)',log)
    checks=[];error=None
    try:checks=independent(json.loads((dest/'fresh-mean-private-contract.json').read_text()))
    except Exception as exc:error=str(exc)
    write(dest/'independent-exact.json',{'schema':'MathScope.N6.FreshMeanPrivateContractIndependent/1','checks':checks,'error':error,
      'oracle':'Complete closed fixed-source operator copy, both namespaces, all FTC integrands/endpoints, exact Fraction exponent margins and source-constant target products.',
      'actualPrivateCurrentAttachmentExecuted':False})
    after=[digest(p) for p in paths];write(dest/'source-after.json',after)
    success=result.returncode==0 and nt and np and nt[1]==np[1]=='5' and checks and all(c['pass'] for c in checks) and error is None and before==after
    receipt={'schema':'MathScope.N6.FreshMeanPrivateContractObservedReceipt/1','status':'PASS' if success else 'FAIL',
      'startedAt':started,'finishedAt':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-start,
      'node':{'command':cmd,'exitCode':result.returncode,'tests':int(nt[1]) if nt else None,'passed':int(np[1]) if np else None,
        'maxOldSpaceMiB':384,'wallLimitSeconds':60,'observedChildResourceMaxRSSBytes':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024},
      'independent':{'status':'PASS' if checks and all(c['pass'] for c in checks) and error is None else 'FAIL','passed':sum(c['pass'] for c in checks),'total':len(checks),'error':error},
      'source':{'files':len(paths),'unchanged':before==after,'snapshotDirectory':'sources'},
      'artifacts':[digest(p) for p in sorted(dest.iterdir()) if p.is_file()],
      'scope':{'actualFixedOperatorAndCompleteCopyExecuted':True,'genericTargetNormCompositionExecuted':True,
        'actualPrivateCurrentAttachmentExecuted':False,'actualCurrentInputSourceClassCertified':False,'originalProp9_5Certified':False,'completeN6':False}}
    write(dest/'receipt.json',receipt);print(json.dumps(receipt,ensure_ascii=False,indent=2));raise SystemExit(0 if success else 1)

if __name__=='__main__':main()
