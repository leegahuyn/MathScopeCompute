#!/usr/bin/env python3
"""Bounded replay of the genuine failed-CI run's fully saved forced stages.

The 35-minute constructor remains a failed run. This independent process
does not rerun it or restore its private source authority. It checks all
saved bytes, every inverse/curl and all ten full coefficient comparisons.
"""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import re
import resource
import signal
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
INPUT=BASE/'evidence/global-forced-current-20261012/attempt382884203291'
RECEIPT_SHA='d17bc42fcfaf8000d014977d4725f325dbdb73849a43c71c36d20ea63ef14684'
TIMEOUT=900
MAX_RSS=4*1024**3
MAX_AS=5*1024**3
V8_MIB=3072

def digest(raw): return hashlib.sha256(raw).hexdigest()
def file_row(path):
    raw=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)),'bytes':len(raw),'sha256':digest(raw)}
def write(path,value): path.write_text(json.dumps(value,indent=2)+'\n')
def require(value,message):
    if not value: raise ValueError(message)

def source_paths():
    seen=set()
    def visit(path):
        path=path.resolve()
        require(path.is_relative_to(ROOT) and path.is_file(),'Missing replay source '+str(path))
        if path in seen:return
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):
                visit(path.parent/ref)
    for p in [Path(__file__),BASE/'tests/replay-forced-current-snapshots.mjs',BASE/'tests/run-global-forced-current.py']:
        visit(p)
    return sorted(seen)

def verify_inputs():
    raw=(INPUT/'receipt.json').read_bytes()
    require(digest(raw)==RECEIPT_SHA,'Original failed-CI receipt changed')
    r=json.loads(raw)
    require(r['pass'] is False and r['stoppedReason']=='OBSERVED_EXECUTION_TIME_LIMIT' and
            r['sourceFilesUnchanged'] and r['sourceFileCount']==155 and r['timeoutSeconds']==2100,
            'The original35minute failed execution must remain unchanged')
    files=[file_row(INPUT/'receipt.json')]
    for row in r['artifacts']:
        p=ROOT/row['path']; require(file_row(p)==row,'Changed original CI artifact '+row['path']);files.append(row)
    before=json.loads((INPUT/'source-bytes-before.json').read_text())
    captured=json.loads((INPUT/'source-bytes.json').read_text())
    require(captured['unchanged'] and captured['before']==captured['after']==before['files'] and before['fileCount']==155,
            'Original frozen source inventory mismatch')
    for row in before['files']:
        p=INPUT/'sources'/row['path'];raw=p.read_bytes()
        require(digest(raw)==row['sha256'] and len(raw)==row['bytes'],'Changed original source snapshot '+row['path'])
        require(file_row(ROOT/row['path'])==row,'Current frozen source differs from the exact saved constructor '+row['path'])
        files.append(file_row(p))
    return {'schema':'MathScope.N6.SavedForcedReplayInputVerification/1','originalReceipt':files[0],
            'files':files,'originalSourceFileCount':155,'originalSourceBytesUnchanged':True,
            'originalConstructorPass':False,'constructorOutcomeRewritten':False,'pass':True}

def independent(source,replay):
    spec=importlib.util.spec_from_file_location('original_forced_polynomials',BASE/'tests/run-global-forced-current.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    result=module.independent();checks=result['checks']
    def check(name,value):checks.append({'id':name,'pass':bool(value)})
    matrices=[r['matrix'] for r in result['branches']]
    rows=source['templates'];modes=[-2,-1,1,2];generated=list(range(-4,5))
    check('actual-saved-source-all-ten-original-lifts',len(rows)==10 and len({r['key'] for r in rows})==10)
    for t in rows:
        tag=t['key'];p=next((r for r in replay['remainderChecks'] if r['key']==tag),None)
        check('actual-saved-full-integer-cover-matrices-'+tag,t['lift']['matrix']['matrices']==matrices)
        check('actual-saved-all-nonzero-input-coefficients-'+tag,[r['m'] for r in t['originalSourceRows']]==modes)
        check('actual-saved-all-possible-quadratic-harmonics-'+tag,t['sourceFiniteInventory']==
              {'solved':modes,'updatedVelocity':modes,'nextResidual':generated,'discarded':[]})
        check('actual-saved-every-direct-pde-comparison-'+tag,p is not None and p['pass'] and len(p['checks'])==54 and
              p['modes']==generated and p['actualDirectMinusDecomposedRecomputed'] and
              p['declaredZeroDefectNeverTrusted'] and not p['extraSourceRelationsAssumed'] and
              p['finiteAngularModesDiscarded']==[])
        for f in t['forced']:
            m=f['m'];inv=f['inverse'];path=f['path'];mapped=f['mapped']
            check(f'actual-saved-positive-negative-complete-source-{tag}-{m}',m in [1,2] and inv['input']['m']==m and
                  f['inputRoots']==next(r for r in t['originalSourceRows'] if r['m']==m)['value'] and
                  [s['m'] for s in f['signedSolutions']]==[m,-m] and
                  f['signedSolutions'][1]['exactConjugateOfSystem']==inv['system'])
            check(f'actual-saved-whole-original-Hw-path-{tag}-{m}',path['levelDifference']==t['levelDifference'] and
                  not path['preimagesIdentified'] and all(c['pass'] for c in path['checks']) and
                  f['sourcePathInvariance']['independentParameterDerivativeNotDropped'])
            check(f'actual-saved-cutoff-inside-complete-curl-{tag}-{m}',mapped['mapping']['pathValueSubstitutedBeforeSpatialDerivative'] and
                  mapped['identities']['fullComplexPotentialCurled'] and mapped['identities']['everyCommonYChainTermRetained'] and
                  mapped['identities']['allCylindricalConnectionsRetained'] and mapped['scope']['fullCurlRemainderRetained'] and
                  not mapped['identities']['finitePartialSumSubstituted'])
            check(f'actual-saved-order-preserving-limit-and-full-pressure-{tag}-{m}',inv['scope']['completeComplexSourceUsed'] and
                  inv['scope']['exactZeroDataForcedSolutionDefined'] and inv['scope']['algebraicPressureConstructed'] and
                  inv['scope']['actualOrderedIntegralAndTailProducers'] and not inv['scope']['matrixCommutationAssumed'] and
                  inv['limit']['allActualMatrixSourceAndTimeDerivativeBodiesGenerated'] and not inv['limit']['numericalIntegralEvaluated'])
    check('actual-saved-all162-complete-covariance-fields',len(source['covarianceFields'])==6 and
          all(f['contributions']==162 for f in source['covarianceFields'].values()))
    check('failed-constructor-and-no-private-current-recovery-remain-explicit',replay['originalCombinedSourceRunPass'] is False and
          replay['wholeCurrentCertificateRecovered'] is False and replay['privateSourceAuthorityHydrated'] is False and
          replay['initializedJ0'] is False and replay['completeN6'] is False and replay['wholeM3Complete'] is False)
    result.update({'schema':'MathScope.N6.IndependentSavedActualForcedStageBinding/1',
                   'actualSourceCertificateBound':False,'actualSavedSourceStageBound':True,'checkCount':len(checks),
                   'pass':all(c['pass'] for c in checks),'originalFailedConstructorPromoted':False})
    return result

def memory(pid):
    pending=[pid];seen=set();rss=0;asize=0
    while pending:
        here=pending.pop()
        if here in seen:continue
        seen.add(here)
        try:
            raw=Path(f'/proc/{here}/status').read_text()
            r=re.search(r'^VmRSS:\s+(\d+) kB$',raw,re.M);a=re.search(r'^VmSize:\s+(\d+) kB$',raw,re.M)
            rss+=int(r[1])*1024 if r else 0;asize=max(asize,int(a[1])*1024 if a else 0)
            pending.extend(int(x) for x in Path(f'/proc/{here}/task/{here}/children').read_text().split())
        except (FileNotFoundError,ProcessLookupError):pass
    return rss,asize

def main():
    require(len(sys.argv)==2 and re.fullmatch(r'[1-9][0-9]*',sys.argv[1]),'Usage: run-forced-snapshot-replay.py NEW_ATTEMPT')
    paths=source_paths();before=[file_row(p) for p in paths]
    out=BASE/'evidence/forced-snapshot-replay-20261012'/('attempt'+sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
    for p in paths:
        target=out/'sources'/p.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(p.read_bytes())
    write(out/'source-before.json',before)
    verified=verify_inputs();write(out/'input-verification.json',verified)
    command=['node',f'--max-old-space-size={V8_MIB}','--expose-gc',str(BASE/'tests/replay-forced-current-snapshots.mjs'),
             str(INPUT),str(out/'replay.json')]
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();stopped=None;peak=0;peak_as=0
    def limit():resource.setrlimit(resource.RLIMIT_AS,(MAX_AS,MAX_AS))
    with (out/'node.log').open('wb') as log:
        child=subprocess.Popen(command,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,start_new_session=True,preexec_fn=limit)
        while child.poll() is None:
            rss,asize=memory(child.pid);peak=max(peak,rss);peak_as=max(peak_as,asize)
            if rss>MAX_RSS:stopped='OBSERVED_REPLAY_RSS_LIMIT'
            elif time.monotonic()-tick>TIMEOUT:stopped='OBSERVED_REPLAY_TIME_LIMIT'
            if stopped:
                os.killpg(child.pid,signal.SIGTERM)
                try:child.wait(timeout=5)
                except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL)
                break
            time.sleep(.2)
        code=child.wait()
    elapsed=time.monotonic()-tick;after=[file_row(p) for p in paths];write(out/'source-after.json',after)
    result=json.loads((out/'replay.json').read_text()) if (out/'replay.json').is_file() else None
    source=json.loads((INPUT/'forced-inverses-pressure-construction.json').read_text())
    if result:
        independent_result=independent(source,result);write(out/'independent.json',independent_result)
    else:independent_result={'pass':False,'checkCount':0,'actualSavedSourceStageBound':False}
    success=(code==0 and stopped is None and before==after and result is not None and result['pass'] and
             result['actualCoefficientComparisons']==540 and len(result['negativeControls'])==4 and
             independent_result['pass'] and independent_result['actualSavedSourceStageBound'] and peak<=MAX_RSS and peak_as<=MAX_AS)
    receipt={'schema':'MathScope.N6.SavedForcedSnapshotReplayObservedExecution/1','attempt':int(sys.argv[1]),
             'startedAt':started,'finishedAt':datetime.now(timezone.utc).isoformat(),'command':command,
             'exitCode':code,'stoppedReason':stopped,'elapsedSeconds':elapsed,'timeoutSeconds':TIMEOUT,
             'observedWorkerRSSBytes':peak,'observedMaximumASBytes':peak_as,'workerRSSLimitBytes':MAX_RSS,
             'perProcessASLimitBytes':MAX_AS,'v8OldSpaceMiB':V8_MIB,'sourceFileCount':len(before),
             'sourceFilesUnchanged':before==after,'originalConstructorReceiptSHA256':RECEIPT_SHA,
             'originalConstructorPass':False,'originalConstructorOutcomeRewritten':False,
             'all155OriginalSourceBytesAndArtifactsVerified':verified['pass'],
             'actualCoefficientComparisons':result['actualCoefficientComparisons'] if result else 0,
             'actualScalarIdentities':result['scalarIdentityCount'] if result else 0,
             'independentChecks':independent_result['checkCount'],'independentPass':independent_result['pass'],
             'actualSavedSourceStageBound':independent_result['actualSavedSourceStageBound'],
             'negativeControls':len(result['negativeControls']) if result else 0,
             'artifacts':[file_row(p) for p in sorted(out.iterdir()) if p.is_file()],
             'privateSourceAuthorityHydrated':False,'wholeCurrentCertificateRecovered':False,
             'originalN602Complete':False,'initializedJ0':False,'completeN6':False,'wholeM3Complete':False,'pass':bool(success)}
    write(out/'receipt.json',receipt)
    print(json.dumps({'receipt':file_row(out/'receipt.json'),'pass':bool(success),'coefficientComparisons':receipt['actualCoefficientComparisons'],
                      'scalarIdentities':receipt['actualScalarIdentities'],'independentChecks':receipt['independentChecks'],
                      'elapsedSeconds':elapsed,'stoppedReason':stopped},indent=2))
    return 0 if success else 1

if __name__=='__main__':sys.exit(main())
