#!/usr/bin/env python3
"""Independent exact initial E pair and temporal norm calculus controls.

Actual source class authority remains the responsibility of the private
adapters. The fixture derivatives are checked as complete Laurent maps
over Q(sqrt2); no physical source value or norm is sampled.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from math import comb
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import re
import signal
import subprocess
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
ORACLE=BASE/'tests/run-pressure-class-kernel.py'
spec=importlib.util.spec_from_file_location('independent_pressure_laurent',ORACLE)
oracle=importlib.util.module_from_spec(spec);spec.loader.exec_module(oracle)
Laurent,qa,qm,qsign=oracle.Laurent,oracle.qa,oracle.qm,oracle.qsign

def digest(path):
    raw=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}

def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def source_paths():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT) or not path.is_file():raise ValueError('Every dependency must have complete repository source bytes')
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for path in [BASE/'tests/initial-temporal-class-kernel.test.mjs',Path(__file__),ORACLE]:visit(path)
    return sorted(seen)

def independent(artifact):
    f=artifact['fixtures'];nodes=artifact['program']['nodes'];s=f['initial'];c=s['coordinates']
    variables=[c['R'],c['Z'],c['T'],*c['Y']];P=Laurent(nodes,variables)
    checks=[]
    def check(name,value):checks.append({'id':name,'pass':bool(value)})
    a=P.read(s['radialFast']);eps=P.read(s['epsilon']);invR=P.power(P.read(c['R']),-1)
    v1=P.constant((Q(1),Q(-1)));W={k:P.read(v) for k,v in s['W'].items()}
    stresses=[P.read(v) for v in s['stress']];pressureZ=P.read(s['pressureZ'])
    def Dr(w):return P.add(P.derivative(w,0),P.multiply(a,P.add(P.derivative(w,3),P.multiply(v1,P.derivative(w,4)))))
    def De(w,e):return P.add(Dr(w),P.scale(P.multiply(invR,w),e))
    references={}
    for name,rad,ax,e,stress in [('Etheta','rtheta','thetaz',2,stresses[0]),('Ez','rz','zz',1,stresses[1])]:
        reference=P.add(P.add(De(W[rad],e),P.multiply(eps,P.derivative(W[ax],1))),P.scale(De(stress,e),-1))
        if name=='Ez':reference=P.add(reference,P.multiply(eps,pressureZ))
        references[name]=reference
        check('independent-complete-'+name,P.read(s['roots'][name])==reference)
    for jet in f['jets']:
        alpha=jet['orders'];label=','.join(map(str,alpha))
        for row in jet['rows']:
            expected=P.jet(references[row['name']],alpha)
            check('complete-direct-'+row['name']+'-'+label,P.read(row['direct'])==expected)
            check('complete-Leibniz-'+row['name']+'-'+label,P.read(row['decomposed'])==expected)
        for t in jet['coefficients']:
            j=t['radialOrder'];check('full-binomial-'+label+'-'+str(j),int(t['binomial'])==comb(alpha[0],j) and
                t['remainingOrders']==[alpha[0]-j,*alpha[1:]])
            check('actual-fast-coefficient-jet-'+label+'-'+str(j),P.read(t['aJet'])==P.jet(a,(j,0,0,0,0)))
            check('actual-inverse-radius-jet-'+label+'-'+str(j),P.read(t['inverseRadiusJet'])==P.jet(invR,(j,0,0,0,0)))
    for i,r in enumerate(f['negatives']):
        check('all-omitted-source-negatives-'+str(i),P.read(r['difference'])!={} and P.read(r['value'])!=references[r['component']])
    changed=f['changedStress'];changed_fast=changed['rows'][0]['terms']['stressFastRadial']
    check('auxiliary-stress-cannot-use-original-independence',not changed['originalStressAuxiliaryIndependent'] and P.read(changed_fast)!={})
    def norm(poly):return sum(((abs(q[0])+2*abs(q[1]))*Q(2)**max(e[0],0) for e,q in poly.items()),Q(0))
    domain=f['normDomain'];sup=P.scalar(P.read(domain['covarianceNorm']))[0]
    all_sources={**W,'Sigma_theta':stresses[0],'Sigma_z':stresses[1],'pressure':P.read(domain['pressureBody'])}
    for alpha in oracle.multiindices(5,5):
        label=','.join(map(str,alpha))
        for name,poly in all_sources.items():check('entire-box-source-norm-'+name+'-'+label,norm(P.jet(poly,alpha))<=sup)
    for row in f['majorants']:
        for name,r in row['fields'].items():
            bound=P.scalar(P.read(r['constant']))
            for alpha in oracle.multiindices(5,row['order']):
                upper=norm(P.jet(references[name],alpha))
                check('entire-box-'+name+'-majorant-m'+str(row['order'])+'-'+','.join(map(str,alpha)),qsign(qa(bound,(-upper,Q(0))))>=0)
        check('pressure-extra-epsilon-kept-'+str(row['order']),row['originalPressureContributionExponent']=='2-kappa_s' and
              row['outputEpsilonExponent']=='1-kappa_s' and row['originalStressContributionExponent']=='1')
    for d in f['initialDemands']:
        m=d['order'];check('initial-derivative-demand-'+str(m),d['requiredPressureOrder']==m+1 and
            d['requiredCommonYCovarianceOrder']==m+2 and d['requiredPrimaryOrder']==m+2 and
            d['requiredBackgroundSlowOrder']==m+5 and d['requiredTargetWeightedOrder']==m+3)
    for d in f['temporalDemands']:
        m,p=d['order'],d['ibpOrder'];n=m+5 if not p else m+2*p+8
        check('temporal-complete-derivative-demand-'+str(m)+'-'+str(p),d['requiredResidualPairOrder']==n and
            d['requiredDesiredVelocityOrder']==n-4 and d['requiredFixedFourierOrder']==n-4 and
            d['requiredFixedRadialOutputOrder']==m+1 and d['requiredCutoffDerivativeOrder']==m+2)
    ci=f['ci'];signatures={(n['op'],tuple(n['args'])):j for j,n in enumerate(nodes) if n['op'] in ['rational','log_positive']}
    two=signatures[('rational',('2','1'))];log2=signatures[('log_positive',(two,))]
    logTg=signatures[('log_positive',(ci['Tg'],))];logBase=signatures[('log_positive',(ci['baseEll'],))]
    atoms={ci['ell']:0,ci['h']:1,log2:2,logTg:3,logBase:4,ci['index']:5};A=Laurent(nodes,list(atoms),atoms)
    check('actual-floor-ci-factorization-independent',A.read(ci['logCi'])==A.read(ci['factorizedLog']))
    check('all-three-ci-factor-roots-retained',len(ci['factors'])==3 and
          A.add(A.add(A.read(ci['factors'][0]),A.read(ci['factors'][1])),A.read(ci['factors'][2]))==A.read(ci['factorizedLog']))
    for d in f['rawCutoff']:
        expected=(Q(3)**d['order']*2*3*5*7*11*13,Q(0))
        check('full-unimproved-A1-six-constant-product-'+str(d['order']),P.scalar(P.read(d['constant']))==expected and
              int(d['productCoefficientSum'])==3**d['order'] and not d['positiveIBPGainUsed'])
    for r in f['temporal']['rows']:
        j=r['order'];fields=r['fields'];label=str(j);desired=f['temporalInputs']['desiredRows'];radial=f['temporalInputs']['radialRows']
        vc=P.scalar(P.read(desired[j]['v']['constant']));gc=P.scalar(P.read(desired[j]['gammaDesired']['constant']))
        pc=P.scalar(P.read(radial[j]['primitiveConstant']));ac=P.scalar(P.read(radial[j]['rawCutoffConstant']))
        next_v=P.scalar(P.read(desired[j+1]['v']['constant']));next_g=P.scalar(P.read(desired[j+1]['gammaDesired']['constant']))
        next_p=P.scalar(P.read(radial[j+1]['primitiveConstant']));next_a=P.scalar(P.read(radial[j+1]['rawCutoffConstant']))
        expected={'v':vc,'gammaDesired':gc,'psi':qm(gc,pc),'cutoffA1':qm(gc,ac),'gamma':qa(gc,qm(gc,ac)),
            'beta':qm(next_g,next_p),'slowTimeAngular':next_v,'slowTimeAxial':qa(next_g,qm(next_g,next_a)),
            'fastTimeAxialCutoff':qm((Q(0),Q(1)),qm(next_g,next_a))}
        for name,e in expected.items():check('complete-temporal-'+name+'-m'+label,P.scalar(P.read(fields[name]['constant']))==e)
        check('radial-and-both-slow-extra-epsilon-'+label,all(fields[k]['epsilonExponent']=='2-kappa_s' for k in ['beta','slowTimeAngular','slowTimeAxial']))
        check('fast-A1-not-zero-or-flat-promoted-'+label,fields['fastTimeAxialCutoff']['epsilonExponent']=='1-kappa_s' and
              not r['rawCutoffDeclaredZero'] and r['fullGammaIsDesiredMinusActualA1'])
    check('source-authority-not-conferred-on-fixtures',not artifact['sourceAuthenticated'] and
          not artifact['actualPrivateCurrentAttachmentExecuted'] and not artifact['completeInitialTupleClass'] and not artifact['completeN6'])
    return {'schema':'MathScope.N6.InitialTemporalClassIndependentExact/1','checks':checks,'checkCount':len(checks),
        'pass':all(c['pass'] for c in checks),'arithmetic':'Exact Fraction Laurent maps over Q(sqrt2); complete mixed derivatives and entire-box coefficient bounds.',
        'physicalSourceSamplesUsed':False,'actualPrivateCurrentAttachmentExecuted':False,'completeN6':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,required=True);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Use a new positive attempt')
    out=BASE/'evidence/source-initial-temporal-class-kernel-20261012'/f'attempt{args.attempt}';out.mkdir(parents=True,exist_ok=False)
    paths=source_paths();before=[digest(p) for p in paths];write(out/'source-before.json',before)
    for p in paths:
        target=out/'sources'/p.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(p.read_bytes())
    env=dict(os.environ);env['MATHSCOPE_INITIAL_TEMPORAL_CLASS_DIRECTORY']=str(out)
    cmd=['node','--max-old-space-size=384','--test','--test-reporter=tap',str(BASE/'tests/initial-temporal-class-kernel.test.mjs')]
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();peak=0;reason=None
    with (out/'node.log').open('w') as log:
        p=subprocess.Popen(cmd,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
        while p.poll() is None:
            peak=max(peak,oracle.owned_rss(p.pid))
            if peak>512*1024**2 or time.monotonic()-tick>60:
                reason='OWNED_RSS_LIMIT' if peak>512*1024**2 else 'WALL_TIME_LIMIT';os.killpg(p.pid,signal.SIGKILL);break
            time.sleep(.025)
        exit_code=p.wait()
    after=[digest(p) for p in paths];write(out/'source-after.json',after)
    try:checks=independent(json.loads((out/'initial-temporal-class-kernel.json').read_bytes()))
    except Exception as error:checks={'schema':'MathScope.N6.InitialTemporalClassIndependentExact/1','pass':False,'checkCount':0,'error':str(error)}
    write(out/'independent-source-checks.json',checks);log=(out/'node.log').read_text()
    number=lambda key:int(re.search(r'^# '+key+r' (\d+)$',log,re.M)[1]) if re.search(r'^# '+key+r' (\d+)$',log,re.M) else 0
    count={key:number(key) for key in ['tests','pass','fail','skipped']}
    passed=exit_code==0 and reason is None and count=={'tests':10,'pass':10,'fail':0,'skipped':0} and before==after and checks['pass']
    receipt={'schema':'MathScope.N6.ObservedInitialTemporalClassKernelGate/1','attempt':args.attempt,'startedUTC':started,
        'finishedUTC':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':cmd,
        'exitCode':exit_code,'stoppedReason':reason,'nodeTests':count,'expectedNodeTests':10,
        'sourceFileCount':len(before),'sourceBytesUnchanged':before==after,'independentChecks':checks['checkCount'],
        'independentPass':checks['pass'],'observedOwnedProcessRSSBytes':peak,'resourceLimits':{'rssBytes':512*1024**2,'nodeOldSpaceMiB':384,'nodeSeconds':60},
        'artifacts':[digest(p) for p in sorted(out.iterdir()) if p.is_file()],
        'actualPrivateCurrentAttachmentExecuted':False,'completeInitialTupleClassCertified':False,'completeN6':False,'pass':passed}
    write(out/'receipt.json',receipt);print(json.dumps(receipt,indent=2));return 0 if passed else 1

if __name__=='__main__':raise SystemExit(main())
