#!/usr/bin/env python3
"""Independently check the completed original default-build receipt and inputs.

This does not replace the build, change its guard, or assert an independent
Comparator result. It fails if the actual process did not exit successfully.
"""
from pathlib import Path
import datetime, hashlib, json, subprocess, tomllib

B=Path(__file__).resolve().parent
N=B.parent
A=N/'official-validation'
R=A/'repo'
OLD=N/'followup-20261010-default-build'

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):
            h.update(block)
    return h.hexdigest()
def read(path):return json.loads(path.read_text())
checks=[]
def check(name,value):checks.append({'name':name,'passed':bool(value)})
result=read(B/'result.json')
frozen=read(B/'frozen-v50-inputs.json')
copy=read(B/'controller-copy-check.json')
cleanup=read(B/'cache-cleanup.json')
prior=read(B/'previous-interruption-observation.json')

check('actualFinishedProcess',result['status']=='FINISHED')
check('actualExitCodeZero',result['exitCode']==0)
check('noResourceOrExplicitTermination',result['terminationReason'] is None)
check('reportedDefaultBuildPassed',result['wholeDefaultBuildPassed'] is True)
check('unmodifiedDefaultCommand',result['command']==[str(A/'lean-4.34.0-rc2-linux/bin/lake'),'build'])
check('originalRepositoryCwd',result['cwd']==str(R))
check('resourceGuardUnchanged',result['resourceStopThresholds']=={'minimumFreeDiskBytes':805306368,'oomKillCountMayIncrease':False} and result['guardChanges'] is False)
check('sourceUnmodifiedReceipt',result['sourceChanges'] is False and result['originalInputsUnchanged'] and result['originalTrackedSourcesUnchanged'])
check('allFrozenSnapshotFilesUnchangedReceipt',result['snapshotRuntimeFilesUnchanged'] and result['changedFrozenPaths']==[])
check('actualLogHashMatches',sha(B/'default-build.log')==result['logSHA256'])
changed=[name for name,digest in frozen['files'].items() if not (N/name).is_file() or sha(N/name)!=digest]
check('actualFrozenSnapshotHashesMatch',changed==[])
check('actualOriginalInputHashesMatch',all(sha(R/name)==digest for name,digest in frozen['originalInputs'].items()))
check('pinnedOriginalCommit',subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip()=='f9e8bc5b38b6e212696e8a30e3e91517af887bbd')
check('actualTrackedSourceClean',not subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=R,text=True))
check('pinnedToolchain', (R/'lean-toolchain').read_text().strip()=='leanprover/lean4:v4.34.0-rc2')
check('actualOriginalDefaultTargets',tomllib.loads((R/'lakefile.toml').read_text())['defaultTargets']==['NavierStokes','Euler','ComparatorChallenges'])
check('actualPinnedKernelHash',sha(A/'lean-4.34.0-rc2-linux/lib/lean/libleanshared.so')=='cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5')
check('actualPinnedEntryHash',sha(A/'lean-rc2-entry')=='a187c5263205d221e47724bbaf729cd377f40683b2670a543e3b7e6495108682')
old_controller=(OLD/'run.py').read_text()
expected=old_controller.replace("'previousRun':'../followup-20261009-default-build-resume-1750'","'previousRun':'../followup-20261010-default-build'")
check('controllerOnlyPreviousRunMetadataChanged',(B/'run.py').read_text()==expected and copy['guardChanges'] is False and copy['commandChanges'] is False)
check('controllerHashMatchesCopyReceipt',sha(B/'run.py')==copy['newControllerSHA256'])
check('previousDiskGuardFailurePreserved',read(OLD/'result.json')['exitCode']==-15 and sha(OLD/'result.json')==prior['previousResultSHA256'] and sha(OLD/'default-build.log')==prior['previousLogSHA256'])
check('cleanupKeptActiveArtifacts',cleanup['activeRc2OrKernelOrBuildArtifactsDeleted'] is False and cleanup['protectedFilesUnchanged'] and cleanup['activeLakePathSizeMtimeUnchanged'])
check('oomKillCountDidNotIncrease',result['finalResources']['memoryEvents'].get('oom_kill',0)==result['initialResources']['memoryEvents'].get('oom_kill',0))
inventory={}
for name in ['NavierStokes','Euler','ComparatorChallenges']:
    sources=list((R/name).rglob('*.lean'))
    if (R/(name+'.lean')).exists():sources.append(R/(name+'.lean'))
    missing=[str(p.relative_to(R)) for p in sources if not (R/'.lake/build/lib/lean'/p.relative_to(R)).with_suffix('.olean').exists()]
    inventory[name]={'sourceFiles':len(sources),'missingOleanFiles':missing}
    check('all'+name+'ArtifactsPresent',not missing and len(sources)==result['finalModuleInventory'][name]['sourceFiles'])
check('noComparatorPromotion',result['comparatorCompleted'] is False)
out={
    'schema':'MathScope.OriginalDefaultBuildIndependentCompletion/1',
    'recordedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status':'PASSED' if all(x['passed'] for x in checks) else 'FAILED',
    'passed':sum(x['passed'] for x in checks),'total':len(checks),
    'resultSHA256':sha(B/'result.json'),'logSHA256':sha(B/'default-build.log'),
    'actualExitCode':result['exitCode'],'changedFrozenFiles':changed,
    'actualModuleInventory':inventory,'checks':checks,
    'wholeDefaultBuildPassed':result['exitCode']==0 and all(x['passed'] for x in checks),
    'independentComparatorCompleted':False,
    'numericalLeadingProfileCertified':False,
    'scope':'Actual original default Lake build completion and original-input protection. It does not close independent Comparator, analytic-profile, global outer-cone or browser-kernel gates.',
}
(B/'independent-completion-verification.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'status':out['status'],'actualExitCode':out['actualExitCode'],'passed':out['passed'],'total':out['total'],'failed':[x['name'] for x in checks if not x['passed']]},indent=2))
assert out['status']=='PASSED','Original default build completion or a protected-input condition failed'
