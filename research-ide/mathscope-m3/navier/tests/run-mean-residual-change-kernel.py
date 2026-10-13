#!/usr/bin/env python3
"""Observe exact full mean changes and independent whole-box Laurent norms.

The independent Q(sqrt(2)) engine reconstructs both original equations,
then every difference group, and differentiates its own coefficient maps.
No actual-current class authority is obtained from these fixtures.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from functools import reduce
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
ORACLE=BASE/'tests/run-pressure-class-kernel.py'
SPEC=importlib.util.spec_from_file_location('independent_mean_change_laurent',ORACLE)
MODULE=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
Laurent,qa,qn,qm,qsign,ZERO,multiindices=MODULE.Laurent,MODULE.qa,MODULE.qn,MODULE.qm,MODULE.qsign,MODULE.ZERO,MODULE.multiindices

def digest(path):
    raw=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}

def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def source_paths():
    found=set()
    def visit(path):
        path=path.resolve()
        if path in found:return
        if not path.is_relative_to(ROOT) or not path.is_file():raise ValueError('Missing exact repository source')
        found.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for p in [BASE/'tests/mean-residual-change-kernel.test.mjs',ORACLE,Path(__file__)]:visit(p)
    return sorted(found)

def exponent(text):
    if 'kappa_s' not in text:return Q(text)
    m=re.fullmatch(r'([+-]?\d+(?:/\d+)?)?([+-])?(?:(\d+(?:/\d+)?)\*)?kappa_s',text)
    if not m or m[1] and not m[2]:raise ValueError('Invalid source epsilon exponent')
    return Q(m[1] or 0)+(-1 if m[2]=='-' else 1)*Q(m[3] or 1)/100000

def independent(artifact):
    checks=[]
    def check(name,truth):checks.append({'id':name,'pass':bool(truth)})
    source=artifact['source'];f=artifact['fixtures'];g=source['geometry'];x=f['exact']
    P=Laurent(artifact['program']['nodes'],[g['R'],g['Z'],g['T'],*g['Y']]);const=P.constant
    add=lambda *rows:reduce(P.add,rows,{})
    mul=lambda *rows:reduce(P.multiply,rows,const(1))
    neg=lambda a:P.scale(a,-1)
    R=P.read(g['R']);rinv=P.power(R,-1);eps=P.read(g['epsilon']);ci=P.read(g['ci']);a=P.read(g['radialFast'])
    L=lambda u:add(P.derivative(u,3),P.scale(P.derivative(u,4),(Q(1),Q(-1))))
    N=lambda u:add(P.scale(P.derivative(u,3),(Q(-1),Q(1))),P.derivative(u,4))
    Dr=lambda u:add(P.derivative(u,0),mul(a,L(u)))
    Dz=lambda u:mul(eps,P.derivative(u,1))
    Dt=lambda u:add(neg(mul(eps,P.derivative(u,2))),mul(ci,N(u)))
    De=lambda u,e:add(Dr(u),P.scale(mul(rinv,u),e))
    lap=lambda u:add(Dr(Dr(u)),mul(rinv,Dr(u)),Dz(Dz(u)))
    vector=lambda u:add(lap(u),neg(mul(P.power(R,-2),u)))
    bg={k:P.read(v) for k,v in source['background'].items()}
    old={k:P.read(v) for k,v in source['previous'].items()}
    delta={k:P.read(v) for k,v in source['increment'].items()}
    W={k:P.read(v) for k,v in source['covariance'].items()}
    stress=list(map(P.read,source['stress']));pressure=P.read(source['previousPressure']);dp=P.read(source['pressureIncrement'])
    def equation(v,p):
        return {
          'Etheta':add(Dt(v['v']),De(add(mul(bg['b'],v['v']),mul(v['beta'],bg['V']),mul(v['beta'],v['v']),W['rtheta']),2),
            Dz(add(mul(bg['G'],v['v']),mul(bg['V'],v['gamma']),mul(v['gamma'],v['v']),W['thetaz'])),
            neg(mul(eps,vector(v['v']))),neg(De(stress[0],2))),
          'Ez':add(Dt(v['gamma']),De(add(mul(bg['b'],v['gamma']),mul(v['beta'],bg['G']),mul(v['beta'],v['gamma']),W['rz']),1),
            Dz(add(P.scale(mul(bg['G'],v['gamma']),2),mul(v['gamma'],v['gamma']),W['zz'],p)),
            neg(mul(eps,lap(v['gamma']))),neg(De(stress[1],1)))}
    before=equation(old,pressure);updated=equation({k:add(old[k],delta[k]) for k in old},add(pressure,dp))
    products={
      'thetaRadial':{'backgroundRadial':mul(bg['b'],delta['v']),'oldRadial':mul(old['beta'],delta['v']),
        'backgroundAngular':mul(bg['V'],delta['beta']),'oldAngular':mul(old['v'],delta['beta']),'incrementQuadratic':mul(delta['beta'],delta['v'])},
      'thetaAxial':{'backgroundAxial':mul(bg['G'],delta['v']),'oldAxial':mul(old['gamma'],delta['v']),
        'backgroundAngular':mul(bg['V'],delta['gamma']),'oldAngular':mul(old['v'],delta['gamma']),'incrementQuadratic':mul(delta['gamma'],delta['v'])},
      'zRadial':{'backgroundRadial':mul(bg['b'],delta['gamma']),'oldRadial':mul(old['beta'],delta['gamma']),
        'backgroundAxial':mul(bg['G'],delta['beta']),'oldAxial':mul(old['gamma'],delta['beta']),'incrementQuadratic':mul(delta['beta'],delta['gamma'])},
      'zAxial':{'backgroundAxial':P.scale(mul(bg['G'],delta['gamma']),2),'oldAxial':P.scale(mul(old['gamma'],delta['gamma']),2),
        'incrementSquare':mul(delta['gamma'],delta['gamma']),'completePressureChange':dp}}
    all_terms={};slow={};fast={}
    for name,velocity,rk,zk,connection,vectorial in [('Etheta','v','thetaRadial','thetaAxial',2,True),('Ez','gamma','zRadial','zAxial',1,False)]:
        terms={'slowTime':neg(mul(eps,P.derivative(delta[velocity],2))),
          'radial':De(add(*products[rk].values()),connection),'axial':Dz(add(*products[zk].values())),
          'viscous':neg(mul(eps,vector(delta[velocity]) if vectorial else lap(delta[velocity])))}
        all_terms[name]=terms;slow[name]=add(*terms.values());fast[name]=mul(ci,N(delta[velocity]))
        r=next(r for r in x['rows'] if r['name']==name)
        check('independent-original-equation-'+name,P.read(x['oldEquations'][name])==before[name])
        check('independent-updated-equation-'+name,P.read(x['newEquations'][name])==updated[name])
        check('whole-equation-difference-'+name,add(updated[name],neg(before[name]))==add(slow[name],fast[name]))
        check('recorded-full-difference-'+name,P.read(r['direct'])==add(slow[name],fast[name]))
        check('recorded-exact-slow-change-'+name,P.read(r['slowChange'])==slow[name])
        check('recorded-uncancelled-fast-time-'+name,P.read(r['fastTime'])==fast[name] and bool(fast[name]))
        for key,body in terms.items():
            check('independent-complete-term-'+name+'-'+key,P.read(r['terms'][key])==body)
            check('omitted-term-nonzero-'+name+'-'+key,bool(body))
    for key,group in products.items():
        for name,body in group.items():check('independent-retained-flux-product-'+key+'-'+name,P.read(x['productTerms'][key][name])==body and bool(body))
    for row in f['jets']:
        alpha=[0]*5
        for j in row['orders']:alpha[j]+=1
        expected=P.jet(add(slow[row['component']],fast[row['component']]),alpha)
        check('independent-whole-second-jet-'+row['component']+'-'+str(alpha),P.read(row['direct'])==P.read(row['decomposed'])==expected)
    for row in f['omissions']:check('independent-omission-control-'+row['component']+'-'+row['name'],bool(P.read(row['term'])))
    missing=mul(P.derivative(a,0),L(delta['v']))
    check('independent-variable-fast-coefficient-derivative',P.read(f['viscosity']['missing'])==missing and bool(missing))

    def bound(poly):
        result=ZERO
        for orders,c in poly.items():
            if any(n<0 for n in orders[1:]):raise ValueError('Unexpected negative non-radial Laurent power')
            result=qa(result,qm(c if qsign(c)>=0 else qn(c),(Q(2)**max(orders[0],0),Q(0))))
        return result
    def dominated(poly,row):return qsign(qa(P.scalar(P.read(row['constant'])),qn(bound(poly))))>=0
    for category,fields,input_rows in [('background',bg,artifact['inputs']['backgroundRows']),
      ('previous',old,artifact['inputs']['previousRows']),('increment',delta,artifact['inputs']['incrementRows']),
      ('pressure',{'pressure':dp},artifact['inputs']['pressureChangeRows'])]:
        # Each displayed source row is THROUGH-order. Check every order
        # needed by its complete downstream derivative demand on the box.
        for m in range(6):
            for name,poly in fields.items():
                for alpha in multiindices(5,m):check('whole-input-box-'+category+'-'+name+'-'+str(m)+'-'+str(alpha),
                    dominated(P.jet(poly,alpha),input_rows[m][name]))
    for row in f['norms']['rows']:
        m=row['order']
        for name in ['Etheta','Ez']:
            check('exact-source-epsilon-gain-'+name+'-'+str(m),exponent(row[name]['epsilonExponent'])==Q(199997,100000)==Q(row[name]['epsilonExponentExact']))
            check('above-original-mean-residual-1point49-'+name+'-'+str(m),exponent(row[name]['epsilonExponent'])>Q(149,100))
            check('raw-fast-time-retains-original-lower-exponent-'+name+'-'+str(m),exponent(row['uncancelledFastTime'][name]['epsilonExponent'])==Q(99999,100000))
            groups=row['thetaTerms'] if name=='Etheta' else row['zTerms']
            for alpha in multiindices(5,m):
                check('whole-output-box-'+name+'-'+str(m)+'-'+str(alpha),dominated(P.jet(slow[name],alpha),row[name]))
                check('whole-fast-box-'+name+'-'+str(m)+'-'+str(alpha),dominated(P.jet(fast[name],alpha),row['uncancelledFastTime'][name]))
                for key,poly in all_terms[name].items():check('whole-output-term-box-'+name+'-'+key+'-'+str(m)+'-'+str(alpha),
                    dominated(P.jet(poly,alpha),groups[key]))
            check('full-two-radial-viscosity-losses-'+name+'-'+str(m),exponent(groups['viscous']['epsilonExponent'])==Q(199997,100000))
        check('raw-cutoff-is-not-declared-flat-'+str(m),not row['actualCutoffFlatnessInferred'] and not row['fastTimeCancellationApplied'])
    for d in f['demands']:
        m=d['order'];check('exact-finite-derivative-demand-'+str(m),d['requiredIncrementVelocityOrder']==m+2 and
          d['requiredPreviousVelocityOrder']==m+1 and d['requiredBackgroundOrder']==m+1 and d['requiredPressureChangeOrder']==m+1)
    check('fixture-and-arithmetic-do-not-authenticate-actual-source',not artifact['sourceAuthenticated'] and
      not artifact['actualPrivateMeanClassAttachmentExecuted'] and not artifact['completeInitialTupleClassCertified'] and not artifact['completeN6'] and
      not f['norms']['sourceAuthenticated'] and not f['norms']['actualSourceClassPremisesEstablished'])
    return checks

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,required=True);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Use a new positive attempt')
    dest=BASE/'evidence/source-mean-residual-change-20261012'/('attempt'+str(args.attempt))
    if dest.exists():raise ValueError('An observed attempt must never be overwritten')
    dest.mkdir(parents=True);start=time.monotonic();started=datetime.now(timezone.utc).isoformat()
    paths=source_paths();before=[digest(p) for p in paths];write(dest/'source-before.json',before)
    for p in paths:
        target=dest/'sources'/p.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
    command=['node','--max-old-space-size=384','--test','--test-reporter=tap',str(BASE/'tests/mean-residual-change-kernel.test.mjs')]
    env=dict(os.environ);env['MATHSCOPE_MEAN_CHANGE_DIRECTORY']=str(dest);timed_out=False
    with (dest/'node.log').open('w') as log:
        try:result=subprocess.run(command,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=60,check=False)
        except subprocess.TimeoutExpired:result=None;timed_out=True
    log=(dest/'node.log').read_text();tests=re.search(r'# tests (\d+)',log);passed=re.search(r'# pass (\d+)',log)
    checks=[];error=None;artifact={}
    try:artifact=json.loads((dest/'mean-residual-change-kernel.json').read_text());checks=independent(artifact)
    except Exception as exc:error=str(exc)
    write(dest/'independent-exact.json',{'schema':'MathScope.N6.IndependentMeanResidualChangeLaurentChecks/1',
      'oracle':'Independent full Q(sqrt(2)) Laurent equations, exact coefficient identities, mixed through-order whole-box norms and Fraction epsilon arithmetic.',
      'checks':checks,'error':error,'actualSourceClassesInferred':False})
    after=[digest(p) for p in paths];write(dest/'source-after.json',after)
    success=result is not None and result.returncode==0 and tests and passed and tests[1]==passed[1]=='8' and checks and all(c['pass'] for c in checks) and error is None and before==after
    receipt={'schema':'MathScope.N6.MeanResidualChangeObservedReceipt/1','status':'PASS' if success else 'FAIL',
      'startedAt':started,'finishedAt':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-start,
      'node':{'command':command,'exitCode':None if result is None else result.returncode,'tests':int(tests[1]) if tests else None,
        'passed':int(passed[1]) if passed else None,'timedOut':timed_out,'wallLimitSeconds':60,'maxOldSpaceMiB':384,
        'selfReportedMemory':artifact.get('memory'),'maxRSSBytes':512*1024**2},
      'independent':{'status':'PASS' if checks and all(c['pass'] for c in checks) and error is None else 'FAIL',
        'passed':sum(c['pass'] for c in checks),'total':len(checks),'error':error},
      'source':{'files':len(paths),'unchanged':before==after,'snapshotDirectory':'sources'},
      'artifacts':[digest(p) for p in sorted(dest.iterdir()) if p.is_file()],
      'scope':{'completeOriginalMeanDifferenceKernelsExecuted':True,'all19FluxProductsAnd4SlowGroupsRetained':True,
        'allFixtureNormsIndependentlyChecked':True,'actualPrivateMeanClassAttachmentExecuted':False,
        'liveInitializedSourceAuthorityPositiveCaseExecuted':False,'completeInitialTupleClassCertified':False,'completeN6':False}}
    write(dest/'receipt.json',receipt);print(json.dumps(receipt,ensure_ascii=False,indent=2));raise SystemExit(0 if success else 1)

if __name__=='__main__':main()
