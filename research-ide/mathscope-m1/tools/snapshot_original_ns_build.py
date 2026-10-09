#!/usr/bin/env python3
"""Freeze observed original-build evidence without stopping a live compiler.

This never changes proof sources, the toolchain, manifests, guards, or a build
process. The copied progress log is a prefix captured during the stated interval,
not a claim that a still-running command has succeeded.
"""
from pathlib import Path
import argparse
import datetime as dt
import hashlib
import json
import os
import subprocess
import time

ROOT=Path(__file__).resolve().parents[2]
N=ROOT/'mathscope-m1/navier'
A=N/'official-validation'
R=A/'repo'

def now():return dt.datetime.now(dt.timezone.utc).isoformat()
def sha(data):return hashlib.sha256(data).hexdigest()
def stable_json(path):
    for _ in range(5):
        data=path.read_bytes()
        try:return data,json.loads(data)
        except json.JSONDecodeError:time.sleep(.025)
    raise ValueError('Could not capture one complete JSON record: '+str(path))
def put_json(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def process_inventory(active):
    out=[]
    for p in Path('/proc').iterdir():
        if not p.name.isdecimal():continue
        try:
            comm=(p/'comm').read_text().strip()
            if comm not in {'python','python3','lake'}:continue
            args=[x.decode(errors='replace') for x in (p/'cmdline').read_bytes().split(b'\0') if x]
            is_controller=comm in {'python','python3'} and any(x.endswith(str(active.relative_to(ROOT)/'run.py')) for x in args)
            is_build=comm=='lake' and args==[str(A/'lean-4.34.0-rc2-linux/bin/lake'),'build']
            if not is_controller and not is_build:continue
            status=(p/'status').read_text().splitlines()
            out.append({'role':'controller' if is_controller else 'lake-build','hostProcId':int(p.name),
                        'namespacePidChain':next((l.split()[1:] for l in status if l.startswith('NSpid:')),[]),
                        'state':next((l for l in status if l.startswith('State:')),None),'command':args})
        except OSError:pass
    return out
def module_inventory():
    result={}
    for name in ['NavierStokes','Euler','ComparatorChallenges']:
        paths=list((R/name).rglob('*.lean'));main=R/(name+'.lean')
        if main.exists():paths.append(main)
        present=sum((R/'.lake/build/lib/lean'/p.relative_to(R)).with_suffix('.olean').exists() for p in paths)
        result[name]={'sourceFiles':len(paths),'oleanArtifactsPresent':present,'oleanArtifactsMissing':len(paths)-present}
    return result

parser=argparse.ArgumentParser()
parser.add_argument('--active',default='mathscope-m1/navier/followup-20261009-default-build-resume-1750')
args=parser.parse_args()
active=(ROOT/args.active).resolve()
if not active.is_relative_to(N):raise ValueError('The active evidence directory must be inside navier.')
started=now();tag=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
out=N/'original-build-release-snapshots'/tag
out.mkdir(parents=True,exist_ok=False)
files=[]
def copy(path,relative):
    data=path.read_bytes();target=out/relative;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
    files.append({'sourcePath':str(path.relative_to(ROOT)),'snapshotPath':relative,'bytes':len(data),'sha256':sha(data)})
def copy_json(path,relative):
    data,obj=stable_json(path);target=out/relative;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
    files.append({'sourcePath':str(path.relative_to(ROOT)),'snapshotPath':relative,'bytes':len(data),'sha256':sha(data)})
    return obj

historical_names=[
 'official-audit-summary.json','audit-files.json','pinned-source-inventory.json',
 'pinned-entry-kernel-controls.json','lean-version.log','lake-version.log',
 'toolchain-download.json','official-release.json','wrapper-layout.json',
 'lake-build-ns-priority-pinned.log','ns-pinned-declarations.log','PinnedDeclarations.lean',
 'PinnedKernelPositive.log','PinnedKernelNegative.log',
 'full-pinned-command-results.json','lake-build-full-pinned.log','priority-transition.json',
 'comparator-pinned-guarded.json','comparator-pinned-guarded.log',
 'comparator-systemd-preflight.json','comparator-systemd-preflight.log',
 'comparator-environment-independent.json','comparator-environment-independent.md',
]
for name in historical_names:copy(A/name,'historical-official/'+name)
copy_json(N/'followup-20261009-default-build/interruption-observation-1750.json','previous-run/interruption-observation.json')
copy(N/'followup-20261009-default-build/default-build.log','previous-run/default-build.log')
copy_json(N/'followup-20261009-default-build/current-stage.json','previous-run/original-current-stage.json')
copy_json(N/'followup-20261009-default-build/resource-progress.json','previous-run/resource-progress.json')
stage=copy_json(active/'current-stage.json','active-run/current-stage.json')
resources=copy_json(active/'resource-progress.json','active-run/resource-progress.json')
frozen=copy_json(active/'frozen-v50-inputs.json','active-run/frozen-inputs.json')
copy(active/'default-build.log','active-run/default-build.log')
copy(active/'run.py','active-run/run.py.txt')
result=copy_json(active/'result.json','active-run/result.json') if (active/'result.json').exists() else None

env=dict(os.environ);env['GIT_OPTIONAL_LOCKS']='0'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,env=env,text=True).strip()
tracked=subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=R,env=env,text=True)
inputs={name:sha((R/name).read_bytes()) for name in ['lean-toolchain','lakefile.toml','lake-manifest.json']}
for name in inputs:copy(R/name,'original-inputs/'+name)
actual_kernel=sha((A/'lean-4.34.0-rc2-linux/lib/lean/libleanshared.so').read_bytes())
actual_entry=sha((A/'lean-rc2-entry').read_bytes())
history=json.loads((A/'official-audit-summary.json').read_text())
processes=process_inventory(active);inventory=module_inventory()
runtime_changes=[]
for name,old in frozen['files'].items():
    p=N/name
    if not p.exists() or sha(p.read_bytes())!=old:runtime_changes.append(name)
log=(out/'active-run/default-build.log').read_text(errors='replace').splitlines()
record={
 'schema':'MathScope.OriginalBuildReleaseSnapshot/1','captureStartedUTC':started,'captureCompletedUTC':now(),
 'snapshotPath':str(out.relative_to(ROOT)),'activeEvidencePath':str(active.relative_to(ROOT)),
 'captureSemantics':'Immutable copies captured over this interval while the compiler continued. The log is an observed prefix, not an atomic global checkpoint or final command receipt.',
 'source':{'repository':history['sourceRepository'],'commit':commit,'expectedCommit':history['sourceCommit'],
           'commitMatches':commit==history['sourceCommit'],'trackedSourceStatus':tracked,'originalTrackedSourcesUnchanged':tracked=='',
           'inputSHA256':inputs,'originalInputHashesMatch':inputs==frozen['originalInputs']},
 'toolchain':{'name':history['toolchain'],'kernelCommit':history['kernelCommit'],
              'archiveSHA256':history['toolchainArchiveSHA256'],'sharedKernelSHA256':actual_kernel,
              'sharedKernelMatchesOriginal':actual_kernel==history['executionProfile']['officialSharedLibrarySHA256'],
              'entrySHA256':actual_entry,'entryMatchesAuditedProfile':actual_entry==history['executionProfile']['driverSHA256'],
              'profile':history['executionProfile'],'repeatedKernelInvocationDuringCapture':False},
 'selectedTarget':history['nsSubmissionBuild'],
 'submittedDeclarations':{k:v for k,v in history['submittedDeclarations'].items() if k!='typesAndAxiomsOutput'},
 'independentComparator':history['comparator'],
 'wholeDefaultBuild':{'status':result['status'] if result else 'RUNNING_AT_CAPTURE',
                     'passed':bool(result and result.get('wholeDefaultBuildPassed')),
                     'exitCode':result.get('exitCode') if result else None,'completedUTC':result.get('completedUTC') if result else None,
                     'command':stage['command'],'startedUTC':stage['startedUTC'],'targets':stage['defaultTargets'],
                     'resourceStopThresholds':stage['resourceStopThresholds'],'latestRecordedResource':resources[-1],
                     'moduleInventory':inventory,'logTail':log[-12:],'errorLinesObserved':[x for x in log if x.startswith(('error:','✖'))],
                     'processesAtCapture':processes,'toolSessionId':58554,
                     'resilience':'Lake has start_new_session=True and writes stdout/stderr to its own log. The Python controller updates resource progress every 30 seconds inside an execution session. Persistence through a future message-stream/session teardown is not guaranteed. No automatic restart loop is installed.',
                     'priorInterruption':'previous-run/interruption-observation.json'},
 'applicationRuntimeSnapshot':{'changedPathsSinceThisBuildStarted':runtime_changes,
                               'sourceOfChanges':'Concurrent authorized MathScope application updates; distinct from unchanged original proof repository and kernel.'},
 'liveMutatingFilesToExcludeFromArchive':[(active/x).relative_to(ROOT).as_posix() for x in ['current-stage.json','resource-progress.json','default-build.log','result.json']],
 'proofBoundary':'Selected C/D kernel acceptance, whole-default build completion and independent guarded Comparator equivalence are separate. This snapshot does not certify the numerical leading-profile candidate.',
}
if not (record['source']['commitMatches'] and record['source']['originalTrackedSourcesUnchanged'] and record['source']['originalInputHashesMatch'] and record['toolchain']['sharedKernelMatchesOriginal'] and record['toolchain']['entryMatchesAuditedProfile']):
    record['integrityGatePassed']=False
else:record['integrityGatePassed']=True
put_json(out/'snapshot.json',record)
files.append({'sourcePath':'generated observation','snapshotPath':'snapshot.json','bytes':(out/'snapshot.json').stat().st_size,'sha256':sha((out/'snapshot.json').read_bytes())})
put_json(out/'SNAPSHOT_MANIFEST.json',{'schema':'MathScope.ImmutableReleaseSnapshotManifest/1','captureStartedUTC':started,'captureCompletedUTC':record['captureCompletedUTC'],'files':files,'filesMayBeUpdatedAfterCreation':False,'selfExcluded':True})
print(json.dumps({'path':str(out),'snapshotSHA256':sha((out/'snapshot.json').read_bytes()),'manifestSHA256':sha((out/'SNAPSHOT_MANIFEST.json').read_bytes()),'files':len(files),'integrityGatePassed':record['integrityGatePassed'],'status':record['wholeDefaultBuild']['status'],'inventory':inventory,'sourceRuntimeChanges':runtime_changes},ensure_ascii=False))
