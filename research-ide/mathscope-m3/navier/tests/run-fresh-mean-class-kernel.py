#!/usr/bin/env python3
"""Observe complete fresh P/J and nonlinear five-map seminorm controls.

The independent path rebuilds the ORIGINAL full mean equations from
Laurent coefficient maps over Q(sqrt(2)), differentiates its own maps,
and compares all mixed jets on an entire compact fixture box. It also
checks exact epsilon gains, the Jz radial pressure moment, and the fixed
five-map derivative demand. Fixtures never grant actual source authority.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import re
import resource
import shutil
import subprocess
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
ORACLE=BASE/'tests/run-pressure-class-kernel.py'
SPEC=importlib.util.spec_from_file_location('independent_pressure_laurent',ORACLE)
ORACLE_MODULE=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ORACLE_MODULE)
Laurent=ORACLE_MODULE.Laurent
qa,qn,qm,qsign=ORACLE_MODULE.qa,ORACLE_MODULE.qn,ORACLE_MODULE.qm,ORACLE_MODULE.qsign
ZERO=ORACLE_MODULE.ZERO
multiindices=ORACLE_MODULE.multiindices

def exponent(text):
    if 'kappa_s' not in text:return Q(text)
    hit=re.fullmatch(r'([+-]?\d+(?:/\d+)?)?([+-])?(?:(\d+(?:/\d+)?)\*)?kappa_s',text)
    if not hit or hit[1] and not hit[2]:raise ValueError('Invalid exact affine source exponent')
    return Q(hit[1] or 0)+(-1 if hit[2]=='-' else 1)*Q(hit[3] or 1)/100000

def digest(path):
    raw=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}

def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def source_paths():
    found=set()
    def visit(path):
        path=path.resolve()
        if path in found:return
        if not path.is_relative_to(ROOT):raise ValueError('A source path escaped the repo')
        found.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for path in [BASE/'source-fresh-mean-class-kernel.mjs',BASE/'tests/fresh-mean-class-kernel.test.mjs',Path(__file__),ORACLE]:visit(path)
    return sorted(found)

def independent(artifact):
    checks=[]
    def check(name,truth):checks.append({'id':name,'pass':bool(truth)})
    f=artifact['fixtures'];s=f['source'];g=s['geometry'];nodes=artifact['program']['nodes']
    P=Laurent(nodes,[g['R'],g['Z'],g['T'],*g['Y']]);const=P.constant
    add=lambda *items:__import__('functools').reduce(P.add,items,{})
    mul=lambda *items:__import__('functools').reduce(P.multiply,items,const(1))
    neg=lambda x:P.scale(x,-1)
    R=P.read(g['R']);rInv=P.power(R,-1);a=P.read(g['radialFast']);eps=P.read(g['epsilon']);ci=P.read(g['ci'])
    L=lambda x:add(P.derivative(x,3),P.scale(P.derivative(x,4),(Q(1),Q(-1))))
    N=lambda x:add(P.scale(P.derivative(x,3),(Q(-1),Q(1))),P.derivative(x,4))
    Dr=lambda x:add(P.derivative(x,0),mul(a,L(x)))
    Dz=lambda x:mul(eps,P.derivative(x,1))
    Dt=lambda x:add(neg(mul(eps,P.derivative(x,2))),mul(ci,N(x)))
    De=lambda x,e:add(Dr(x),P.scale(mul(rInv,x),e))
    lap=lambda x:add(Dr(Dr(x)),mul(rInv,Dr(x)),Dz(Dz(x)))
    vectorLap=lambda x:add(lap(x),neg(mul(P.power(R,-2),x)))
    bg={k:P.read(v) for k,v in s['background'].items()}
    old={k:P.read(v) for k,v in s['previous'].items()}
    delta={k:P.read(v) for k,v in s['increment'].items()}
    W={k:P.read(v) for k,v in s['covariance'].items()}
    def full(v):
        grTerms={
          'time':neg(Dt(v['beta'])),
          'radial':neg(De(add(P.scale(mul(bg['b'],v['beta']),2),mul(v['beta'],v['beta']),W['rr']),1)),
          'axial':neg(Dz(add(mul(bg['b'],v['gamma']),mul(bg['G'],v['beta']),mul(v['beta'],v['gamma']),W['rz']))),
          'centrifugal':mul(rInv,add(P.scale(mul(bg['V'],v['v']),2),mul(v['v'],v['v']),W['thetatheta'])),
          'viscous':mul(eps,vectorLap(v['beta']))}
        theta=mul(P.power(R,2),add(mul(bg['G'],v['v']),mul(bg['V'],v['gamma']),mul(v['gamma'],v['v']),W['thetaz']))
        axial=mul(R,add(P.scale(mul(bg['G'],v['gamma']),2),mul(v['gamma'],v['gamma']),W['zz']))
        return {'gr':add(*grTerms.values()),'fluxTheta':theta,'fluxZ':axial},grTerms
    original,terms=full(old);updated,_=full({k:add(old[k],delta[k]) for k in old})
    rest={
      'time':neg(Dt(delta['beta'])),
      'radial':neg(De(add(P.scale(mul(bg['b'],delta['beta']),2),P.scale(mul(old['beta'],delta['beta']),2),mul(delta['beta'],delta['beta'])),1)),
      'axial':neg(Dz(add(mul(bg['b'],delta['gamma']),mul(bg['G'],delta['beta']),mul(old['beta'],delta['gamma']),
                        mul(old['gamma'],delta['beta']),mul(delta['beta'],delta['gamma'])))),
      'angular':mul(rInv,add(P.scale(mul(old['v'],delta['v']),2),mul(delta['v'],delta['v']))),
      'viscous':mul(eps,vectorLap(delta['beta']))}
    rem={'Rg':add(*rest.values()),
         'JthetaIntegrand':mul(P.power(R,2),add(mul(old['gamma'],delta['v']),mul(old['v'],delta['gamma']),mul(delta['gamma'],delta['v']))),
         'JzVelocityIntegrand':mul(R,add(P.scale(mul(old['gamma'],delta['gamma']),2),mul(delta['gamma'],delta['gamma'])))}
    for k,v in original.items():check('whole-original-full-mean-'+k,P.read(s['fresh'][k])==v)
    for k,v in updated.items():check('whole-updated-full-mean-'+k,P.read(s['next'][k])==v)
    for k,v in rem.items():check('whole-independent-five-remainder-'+k,P.read(s['remainder'][k])==v)
    for k,v in rest.items():
        check('every-nonlinear-remainder-group-'+k,P.read(s['remainder']['terms'][k])==v)
        check('omitted-remainder-group-is-detectable-'+k,bool(v) and add(rem['Rg'],neg(v))!=rem['Rg'])
    linear=P.scale(mul(bg['V'],delta['v'],rInv),2)
    check('independent-full-updated-gr-linear-and-remainder-identity',add(updated['gr'],neg(original['gr']),neg(linear))==rem['Rg'])
    check('independent-retained-known-linear-only',P.read(s['remainder']['linear']['PIntegrand'])==linear and bool(linear))
    for j in [3,4]:check('full-mean-really-depends-on-torus-'+str(j),bool(P.derivative(original['gr'],j)))
    check('both-original-L-components',P.scalar(P.read(g['vr'][0]))==(Q(1),Q(0)) and P.scalar(P.read(g['vr'][1]))==(Q(1),Q(-1)))
    check('both-original-N-components',P.scalar(P.read(g['vt'][0]))==(Q(-1),Q(1)) and P.scalar(P.read(g['vt'][1]))==(Q(1),Q(0)))

    def bound(poly):
        total=ZERO
        for orders,c in poly.items():
            if any(k<0 for k in orders[1:]):raise ValueError('Fixture has nonradial negative powers')
            total=qa(total,qm(c if qsign(c)>=0 else qn(c),(Q(2)**max(orders[0],0),Q(0))))
        return total
    def norm_value(row):return P.scalar(P.read(row['constant']))
    def dominated(poly,row):return qsign(qa(norm_value(row),qn(bound(poly))))>=0
    for key,fields,sourceRows in [('background',bg,artifact['inputs']['backgroundRows']),
                                ('velocity',old,artifact['inputs']['velocityRows']),
                                ('increment',delta,artifact['inputs']['velocityRows']),
                                ('covariance',W,artifact['inputs']['covarianceRows'])]:
        for m in range(5):
            for name,poly in fields.items():
                for alpha in multiindices(5,m):
                    check('whole-fixture-input-norm-'+key+'-'+name+'-'+str(m)+'-'+','.join(map(str,alpha)),
                          dominated(P.jet(poly,alpha),sourceRows[m][name]))
    for m in range(4):
        limit=P.scalar(P.read(artifact['inputs']['fixed']['radialDerivativeBounds'][m]))
        for j in range(m+1):check('whole-fixed-a-through-order-'+str(m)+'-'+str(j),
            qsign(qa(limit,qn(bound(P.jet(a,(j,0,0,0,0))))))>=0)

    freshPolys={**original,'weightedGr':mul(P.power(R,2),original['gr'])}
    remPolys={**rem,'weightedRg':mul(P.power(R,2),rem['Rg'])}
    for label,product,polys in [('fresh',f['fresh'],freshPolys),('remainder',f['remainder'],remPolys)]:
        for row in product['rows']:
            m=row['order']
            for name,poly in polys.items():
                for alpha in multiindices(5,m):check('whole-output-box-norm-'+label+'-'+name+'-'+str(m)+'-'+','.join(map(str,alpha)),
                    dominated(P.jet(poly,alpha),row[name]))
            groups=terms if label=='fresh' else rest
            normGroups=row['grTerms'] if label=='fresh' else row['terms']
            for name,poly in groups.items():
                for alpha in multiindices(5,m):check('whole-output-term-box-'+label+'-'+name+'-'+str(m)+'-'+','.join(map(str,alpha)),
                    dominated(P.jet(poly,alpha),normGroups[name]))
            grKey='gr' if label=='fresh' else 'Rg'
            thetaKey='fluxTheta' if label=='fresh' else 'JthetaIntegrand'
            axialKey='fluxZ' if label=='fresh' else 'JzVelocityIntegrand'
            weightKey='weightedGr' if label=='fresh' else 'weightedRg'
            for alpha in multiindices(5,m):
                # The normalized unit Haar mass and radial interval length1
                # turn whole-box bounds into complete integral bounds.
                check('whole-P-integral-'+label+'-'+str(m)+'-'+str(alpha),dominated(P.jet(polys[grKey],alpha),row['defects']['P']))
                check('whole-Jtheta-integral-'+label+'-'+str(m)+'-'+str(alpha),dominated(P.jet(polys[thetaKey],alpha),row['defects']['Jtheta']))
                total=qa(bound(P.jet(polys[axialKey],alpha)),qm((Q(1,2),Q(0)),bound(P.jet(polys[weightKey],alpha))))
                check('whole-Jz-pressure-and-flux-integrals-'+label+'-'+str(m)+'-'+str(alpha),qsign(qa(norm_value(row['defects']['Jz']),qn(total)))>=0)
            check('all-three-source-moments-kept-'+label+'-'+str(m),set(row['defects'])=={'P','Jtheta','Jz'})
            check('exact-epsilon-fresh-or-new-defect-'+label+'-'+str(m),
                  exponent(row[grKey]['epsilonExponent'])==(1-Q(1,100000) if label=='fresh' else 2-Q(2,100000)))
            check('exact-epsilon-fraction-output-'+label+'-'+str(m),Q(row[grKey]['epsilonExponentExact'])==exponent(row[grKey]['epsilonExponent']))
    for row in f['fresh']['rows']:
        check('full-viscosity-two-radial-losses-'+str(row['order']),exponent(row['grTerms']['viscous']['epsilonExponent'])==3-Q(3,100000))
        check('fresh-Jz-pressure-part-nonzero-'+str(row['order']),qsign(norm_value(row['JzParts']['pressureMoment']))>0)
        check('fresh-Jz-two-positive-parts-'+str(row['order']),norm_value(row['defects']['Jz'])==qa(norm_value(row['JzParts']['axialMoment']),norm_value(row['JzParts']['pressureMoment'])))
    for row in f['remainder']['rows']:
        check('five-current-gain-above-original-C0-'+str(row['order']),exponent(row['Rg']['epsilonExponent'])>Q(6,5))
        check('five-current-gain-above-stated-conservative-minimum-'+str(row['order']),exponent(row['Rg']['epsilonExponent'])>=Q(19,10)-Q(3,100000))
        check('five-exact-cancellation-still-required-'+str(row['order']),row['exactCurrentDefectsEqualTheseRemaindersRequiresActualFiveRows'])
        changed=f['changedOldMean']['rows'][row['order']]
        check('actual-old-mean-norm-is-never-ignored-'+str(row['order']),
              qsign(qa(norm_value(changed['terms']['angular']),qn(norm_value(row['terms']['angular']))))>0)
    for row in f['five']['rows']:
        m=row['order'];source=f['fiveInput']['defectRows'][m+1]['defects'];op=f['fiveInput']['operatorRows'][m]
        combined=qa(qa(norm_value(source['P']),norm_value(source['Jtheta'])),norm_value(source['Jz']))
        check('fixed-five-needs-actual-m-plus-one-target-'+str(m),row['inputOrder']==m+1 and row['fixedOperator']['requiredTargetDerivativeOrder']==m+1)
        check('fixed-five-complete-three-source-target-norms-'+str(m),norm_value(row['combinedInput'])==combined)
        for name in ['v','gamma','psi','beta']:
            coefficient=P.scalar(P.read(op['componentBounds']['betaOverEpsilon' if name=='beta' else name]))
            check('fixed-five-full-original-component-product-'+str(m)+'-'+name,norm_value(row['fields'][name])==qm(combined,coefficient))
            check('fixed-five-original-component-epsilon-'+str(m)+'-'+name,
                  exponent(row['fields'][name]['epsilonExponent'])==(2 if name=='beta' else 1)-Q(1,100000))
            check('fixed-five-original-compact-weight-'+str(m)+'-'+name,row['fields'][name]['weight']=='zeta' and row['fields'][name]['pole']==0)
    for d in f['demands']:
        m=d['order']
        check('finite-complete-derivative-demand-'+str(m),d['requiredVelocityOrder']==m+2 and d['requiredBackgroundOrder']==m+1 and
              d['requiredCovarianceOrder']==m+1 and d['requiredPreFiveVelocityOrder']==m+5 and
              d['requiredInitializedInputDefectOrder']==m+3 and d['requiredFiveMapInputDefectOrder']==m+1)
    for name in ['fresh','remainder','five']:
        check('fixture-has-no-actual-current-authority-'+name,not f[name]['sourceAuthenticated'] and not f[name]['originalProp9_5Certified'] and not f[name]['completeN6'])
    check('artifact-has-no-whole-source-authority',not artifact['sourceAuthenticated'] and not artifact['actualCurrentAttachmentExecuted'] and not artifact['completeN6'])
    return checks

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,required=True);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Positive new attempt required')
    dest=BASE/'evidence/source-fresh-mean-class-kernel-20261012'/('attempt'+str(args.attempt))
    if dest.exists():raise ValueError('An observed attempt cannot be overwritten')
    dest.mkdir(parents=True);started=datetime.now(timezone.utc).isoformat();start=time.monotonic()
    sources=source_paths();before=[digest(p) for p in sources];write(dest/'source-before.json',before)
    for p in sources:
        target=dest/'sources'/p.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
    env=dict(os.environ);env['MATHSCOPE_FRESH_MEAN_CLASS_DIRECTORY']=str(dest)
    command=['node','--max-old-space-size=384','--test',str(BASE/'tests/fresh-mean-class-kernel.test.mjs')]
    timed_out=False
    with (dest/'node.log').open('w') as log:
        try:result=subprocess.run(command,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=60,check=False)
        except subprocess.TimeoutExpired:timed_out=True;result=None
    log=(dest/'node.log').read_text();tests=re.search(r'(?:#|ℹ) tests (\d+)',log);passed=re.search(r'(?:#|ℹ) pass (\d+)',log)
    checks=[];error=None
    try:
        artifact=json.loads((dest/'fresh-mean-class-kernel.json').read_text());checks=independent(artifact)
    except Exception as exc:error=str(exc)
    write(dest/'independent-exact.json',{'schema':'MathScope.N6.FreshMeanIndependentLaurentChecks/1','checks':checks,'error':error,
      'oracle':'Complete independent Q(sqrt(2)) Laurent equations and all mixed box derivatives; exact Fraction exponent and full integral bounds.',
      'actualCurrentSourceClassCertified':False})
    after=[digest(p) for p in sources];write(dest/'source-after.json',after)
    success=result is not None and result.returncode==0 and tests and passed and tests[1]==passed[1]=='9' and checks and all(c['pass'] for c in checks) and error is None and before==after
    receipt={'schema':'MathScope.N6.FreshMeanClassKernelObservedReceipt/1','status':'PASS' if success else 'FAIL',
      'startedAt':started,'finishedAt':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-start,
      'node':{'command':command,'exitCode':None if result is None else result.returncode,'tests':int(tests[1]) if tests else None,
        'passed':int(passed[1]) if passed else None,'wallLimitSeconds':60,'maxOldSpaceMiB':384,'timedOut':timed_out,
        'observedChildResourceMaxRSSBytes':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024},
      'independent':{'status':'PASS' if checks and all(c['pass'] for c in checks) and error is None else 'FAIL',
        'passed':sum(c['pass'] for c in checks),'total':len(checks),'error':error},
      'source':{'files':len(sources),'unchanged':before==after,'snapshotDirectory':'sources'},
      'artifacts':[digest(p) for p in sorted(dest.iterdir()) if p.is_file()],
      'scope':{'fullFreshMeanAndFiveRemainderKernelsExecuted':True,'originalAllTermCoefficientIdentitiesExecuted':True,
        'wholeFixtureMixedNormsIndependentlyBounded':True,'actualPrivateCurrentAttachmentExecuted':False,
        'actualSourceInputClassCertified':False,'originalProp9_5Certified':False,'completeN6':False}}
    write(dest/'receipt.json',receipt);print(json.dumps(receipt,ensure_ascii=False,indent=2))
    raise SystemExit(0 if success else 1)

if __name__=='__main__':main()
