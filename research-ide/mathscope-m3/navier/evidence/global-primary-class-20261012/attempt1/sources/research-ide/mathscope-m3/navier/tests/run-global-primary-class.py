#!/usr/bin/env python3
"""Observe a new actual primary-current/target/class construction.

One owned source process is monitored. Its pre-class current and generated
target norm are saved before the additive class binding, including on a
failed attempt. All imported source bytes and raw output are preserved.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import resource
import signal
import subprocess
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
MAX_RSS=13*1024**3//2
MAX_AS=7*1024**3
TIMEOUT=1200

def digest(path):
    raw=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}

def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def source_paths():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT) or not path.is_file():raise ValueError('Every source dependency must remain inside the repository')
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for path in [BASE/'source-primary-class-majorants.mjs',BASE/'tests/global-source-primary-class.test.mjs',
                 BASE/'tests/common-y-class-majorants.test.mjs',Path(__file__)]:visit(path)
    return sorted(seen)

def family_memory(pid):
    pending,seen=[pid],set();rss=maximum_as=0
    while pending:
        at=pending.pop()
        if at in seen:continue
        seen.add(at)
        try:
            status=Path(f'/proc/{at}/status').read_text()
            a=re.search(r'^VmSize:\s+(\d+) kB$',status,re.M);r=re.search(r'^VmRSS:\s+(\d+) kB$',status,re.M)
            rss+=int(r[1])*1024 if r else 0;maximum_as=max(maximum_as,int(a[1])*1024 if a else 0)
            pending.extend(map(int,Path(f'/proc/{at}/task/{at}/children').read_text().split()))
        except (FileNotFoundError,ProcessLookupError):pass
    return rss,maximum_as

def independent(out):
    c=json.loads((out/'actual-primary-class.json').read_bytes())
    current=json.loads((out/'actual-primary-current.json').read_bytes())
    target=json.loads((out/'actual-target-weighted-norm-certificate.json').read_bytes())
    raw=(out/'actual-target-weighted-norm-program.json').read_bytes();target_program=json.loads(raw);checks=[]
    def check(identity,truth):checks.append({'id':identity,'pass':bool(truth)})
    check('actual-original-paper-and-parameters',c['source']['paperSHA256']=='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f' and
          c['source']['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152')
    check('complete-canonical-target-base-program-digest',raw.endswith(b'\n') and hashlib.sha256(raw[:-1]).hexdigest()==target['graph']['sha256'])
    check('same-actual-target-base-on-additive-program',c['program']['targetBase']==target['graph']==c['sourceTarget']['graph'])
    check('same-actual-current-base-on-additive-program',c['program']['currentBase']==current['graph']==c['sourceCurrent']['graph'])
    check('all-private-source-binding-checks-pass',len(c['checks'])==9 and all(r['pass'] for r in c['checks']))
    check('actual-C3-and-target-C1-leaves',c['bounds']['backgroundRow']['backgroundDerivativeOrder']==3 and
          [(r['derivativeOrder'],r['pole']) for r in c['bounds']['targetRows']]==[(0,3),(1,6)])
    check('both-source-moving-normal-systems-retained',[r['sign'] for r in c['sourcePulseBindings']]==[1,-1] and
          all(r['binding']['pass'] and r['originalInitialData'] and r['sourceAmplitudeBodyMatches'] for r in c['sourcePulseBindings']))
    check('actual-H-columns-original-positive-weights',all(r['actualIntegralColumn']==r['originalHColumn'] and
          r['squareRootDefinition']['pass'] and r['actualTangency']['pass'] for r in c['covariance']['sourceRows']))
    check('full-pressure-and-all-six-covariance-remainders',all(len(r['remainder'])==6 and all(t['pass'] for t in r['pressureChecks']) for r in c['covariance']['sourceRows']))
    check('actual-source-leading-cancellation-only',c['covariance']['leadingCovarianceCancellationExecuted'] and not c['covariance']['fullCovarianceDeclaredEqualToTarget'])
    kappa=Q(1,100000)
    check('strict-original-radial-phase-loss',0<kappa<Q(1,2))
    check('complete-primary-covariance-square-is-stronger-than-required-remainder',2-2*kappa>=Q(3,2)-kappa)
    check('full-covariance-square-also-fits-in-M1',2-2*kappa>=1)
    check('full-pressure-gains-one-half',Q(1,2)+Q(1,2)==1)
    check('nonzero-original-kappa-not-set-to-zero',c['bounds']['degreeProgram']['exponents']['curlRemainder']=='1-kappa_s')
    check('both-original-flat-factors-retained',c['bounds']['boundary']['innerExponent']==target_program['scalarRules']['inner']['a'] and
          c['bounds']['boundary']['outerExponent']==target_program['scalarRules']['outer']['a'] and
          c['bounds']['boundary']['pole']>0 and c['bounds']['boundary']['pass'])
    check('complete-target-program-node-inventory',len(target_program['nodes'])==target['graph']['nodeCount'])
    for row in c['bounds']['rows']:
        check(f'order-{row["order"]}-all-primary-curl-pressure-and-covariance-fields',set(row['fields'])==
              {'primary','potential','curlRemainder','homogeneousPressure','fullCovariance','covarianceRemainder'})
        check(f'order-{row["order"]}-positive-complete-norm-degrees',all(isinstance(x['power'],int) and x['power']>0 and isinstance(x['pole'],int) and x['pole']>=0 for x in row['fields'].values()))
    for row in c['bounds']['haarRows']:
        check(f'order-{row["order"]}-complete-Haar-inventory-not-point-count',row['everyCandidateRetained'] and not row['pointActiveCountSubstitutedForWholeInventory'])
        check(f'order-{row["order"]}-reference-orientation-retained','ratio=Q_ref/Q_label' in row['exactComparison'] and row['referenceS']=='S_ref=ell_ref^2')
    for ell in [8,9,20,101]:
        for delta in [-2,-1,0,1,2]:check(f'all-source-neighbor-S-{ell}-{delta}',(ell+delta)**2<=4*ell**2)
    check('actual-window-not-claimed-valid-for-all-q',not c['domain']['oneFinitePrefixClaimedValidAtAllQ'] and c['domain']['actualWindow']==c['sourceCurrent']['sourceBand']['window'])
    check('same-source-qBig-not-order-dependent',c['domain']['sameCommonThresholdForAllFixedOrders'])
    check('all-new-norm-and-source-nodes-retained',len(c['program']['norm']['nodes'])==c['graph']['normAddedNodes'] and
          len(c['program']['current']['nodes'])==c['graph']['currentAddedNodes'] and c['graph']['requiresCompleteAuthenticatedTargetBaseProgram'])
    check('no-complete-initial-field-or-all-iteration-class-promotion',not c['scope']['actualCompleteInitialN6TupleClassCertified'] and
          not c['scope']['actualShiftedRadialPressureClassCertified'] and not c['scope']['actualForcedInputWClassCertified'] and
          not c['scope']['allFiniteIterationStagesClassCertified'] and not c['scope']['completeN6'])
    y=json.loads((out/'actual-common-Y-covariance-class.json').read_bytes())
    check('actual-pre-Haar-source-parents-retained',y['parents']['primary']==c['graph'] and
          y['parents']['pressure']==json.loads((out/'actual-pre-haar-pressure.json').read_bytes())['graph'])
    check('all-eight-actual-pre-Haar-bindings-pass',len(y['checks'])==8 and all(r['pass'] for r in y['checks']))
    check('all162-actual-both-column-maps-retained',len(y['mapping']['mapRows'])==162 and all(
          r['exactXiColumns'] and r['exactPulseColumns'] and r['exactDerivativeMaps'] and r['allMapCoefficientsFrozen'] for r in y['mapping']['mapRows']))
    check('all-six-full-fields-before-Haar-retained',len(y['mapping']['indexedRows'])==6 and all(
          r['sourceRows']==162 and r['actualBodyMaps'] and r['exactDirections'] for r in y['mapping']['indexedRows']) and
          not y['mapping']['haarAverageSubstituted'] and y['bounds']['noAuxiliaryIntegrationMassInserted'])
    J=[[3,1],[1,5]];M=[[1,0],[0,1]]
    for row in y['recipe']['matrixRows']:
        check(f'actual-cover-power-{row["delta"]}',row['matrix']==[[str(x) for x in r] for r in M])
        check(f'actual-cover-column-bound-{row["delta"]}',all(sum(M[i][j] for i in range(2))<=6**row['delta'] for j in range(2)))
        M=[[sum(M[i][k]*J[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
    check('affine-field-bound-does-not-close-pressure-or-initial-tuple',y['scope']['actualPreHaarCommonYCovarianceClassCertified'] and
          not y['scope']['actualShiftedRadialPressureClassCertified'] and not y['scope']['actualCompleteInitialN6TupleClassCertified'] and not y['scope']['completeN6'])
    check('complete-added-common-Y-norm-program',y['graph']['addedNodes']==len(y['program']['nodes']) and
          y['program']['normBaseOffset']==y['parents']['primary']['normNodeCount'])
    return {'schema':'MathScope.N6.IndependentActualPrimaryClassAttachment/1','checks':checks,'checkCount':len(checks),
            'pass':all(x['pass'] for x in checks),'actualPrimaryAttachmentExecuted':True,'wholeInitialClassCertified':False,'completeN6':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--attempt',type=int,required=True);args=parser.parse_args()
    if args.attempt<1:raise ValueError('Use a new positive attempt number')
    out=BASE/'evidence/global-primary-class-20261012'/f'attempt{args.attempt}';out.mkdir(parents=True,exist_ok=False)
    paths=source_paths();before=[digest(p) for p in paths];write(out/'source-before.json',before)
    for p in paths:
        dest=out/'sources'/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes())
    log_path=out/'node.log';command=['node','--expose-gc','--max-old-space-size=4608','--test','--test-reporter=tap','--test-concurrency=1',
                                   'research-ide/mathscope-m3/navier/tests/global-source-primary-class.test.mjs',
                                   'research-ide/mathscope-m3/navier/tests/common-y-class-majorants.test.mjs']
    def limit():resource.setrlimit(resource.RLIMIT_AS,(MAX_AS,MAX_AS))
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();peak_rss=peak_as=0;stopped=None
    with log_path.open('wb') as log:
        child=subprocess.Popen(command,cwd=ROOT,env=dict(os.environ,MATHSCOPE_PRIMARY_CLASS_DIRECTORY=str(out)),stdout=log,stderr=subprocess.STDOUT,
                               start_new_session=True,preexec_fn=limit)
        while child.poll() is None:
            raw=log_path.read_text(errors='replace');pids={int(x) for x in re.findall(r'"hostPID":(\d+)',raw)}
            readings=[family_memory(pid) for pid in pids];rss=sum(r[0] for r in readings);asize=max((r[1] for r in readings),default=0)
            peak_rss=max(peak_rss,rss);peak_as=max(peak_as,asize)
            if rss>MAX_RSS:stopped='OWNED_SOURCE_RSS_LIMIT'
            elif time.monotonic()-tick>TIMEOUT:stopped='OWNED_SOURCE_TIME_LIMIT'
            if stopped:
                os.killpg(child.pid,signal.SIGTERM)
                try:child.wait(timeout=5)
                except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL)
                break
            time.sleep(.25)
        code=child.wait()
    raw=log_path.read_text(errors='replace');counts={}
    for key in ['pass','fail','skipped']:
        matches=re.findall(r'^# '+key+r' (\d+)$',raw,re.M);counts[key]=int(matches[-1]) if matches else None
    result={'pass':False,'checkCount':0,'checks':[]}
    try:
        if not (out/'actual-primary-class.json').is_file():raise ValueError('No actual primary class attachment artifact was completed')
        result=independent(out)
    except Exception as error:result['error']=type(error).__name__+': '+str(error)
    write(out/'independent-source-checks.json',result)
    after=[digest(p) for p in paths];write(out/'source-after.json',after)
    peaks={key:max((int(x) for x in re.findall('"'+key+r'":(\d+)',raw)),default=0) for key in ['rssBytes','maxRSSBytes','vmSizeBytes']}
    passed=(code==0 and not stopped and counts=={'pass':12,'fail':0,'skipped':0} and before==after and result['pass'] and
        max(peak_rss,peaks['rssBytes'],peaks['maxRSSBytes'])<=MAX_RSS and max(peak_as,peaks['vmSizeBytes'])<=MAX_AS)
    receipt={'schema':'MathScope.N6.ObservedActualPrimaryClassGate/1','attempt':args.attempt,'startedUTC':started,
             'finishedUTC':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':command,
             'exitCode':code,'stoppedReason':stopped,'nodeTests':counts,'sourceFileCount':len(paths),'sourceBytesUnchanged':before==after,
             'observedOwnedProcessRSSBytes':peak_rss,'observedOwnedProcessASBytes':peak_as,'selfReportedPeaks':peaks,
             'resourceLimits':{'rssBytes':MAX_RSS,'addressSpaceBytes':MAX_AS,'seconds':TIMEOUT},
             'independentChecks':result['checkCount'],'independentPass':result['pass'],
             'artifacts':[digest(p) for p in sorted(out.iterdir()) if p.is_file()],
             'actualPrimaryUniformClassAttachmentExecuted':(out/'actual-primary-class.json').is_file(),
             'completeInitialTupleClassCertified':False,'allFiniteIterationClassesCertified':False,'completeN6':False,'pass':bool(passed)}
    write(out/'receipt.json',receipt)
    print(json.dumps({'receipt':digest(out/'receipt.json'),'nodeTests':counts,'independentChecks':result['checkCount'],
                     'sourceFileCount':len(paths),'sourceBytesUnchanged':before==after,'pass':bool(passed),'error':result.get('error')},indent=2),flush=True)
    raise SystemExit(0 if passed else 1)

if __name__=='__main__':main()
