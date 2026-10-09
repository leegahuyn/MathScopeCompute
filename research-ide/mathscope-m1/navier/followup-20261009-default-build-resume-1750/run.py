#!/usr/bin/env python3
"""Resume the interrupted original pinned default Lake build in a new evidence directory.

Only the existing isolated repository's untracked build products and this new
follow-up directory are written. The original source, manifest, kernel, driver,
proof guards and v50 runtime/evidence files remain unchanged.
"""
from pathlib import Path
import datetime,hashlib,json,os,shutil,signal,subprocess,time

B=Path(__file__).resolve().parent
N=B.parent
A=N/'official-validation'
R=A/'repo'
T=A/'lean-4.34.0-rc2-linux'
P=A/'lean-entry-layout'

def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def write(name,value):
    (B/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def resource():
    root=Path('/sys/fs/cgroup')
    read=lambda name:(root/name).read_text().strip() if (root/name).exists() else None
    events={k:int(v) for k,v in (line.split() for line in (read('memory.events') or '').splitlines())}
    stat={k:int(v) for k,v in (line.split() for line in (read('memory.stat') or '').splitlines())}
    return {'recordedUTC':now(),'disk':shutil.disk_usage(B)._asdict(),
            'memoryCurrentBytes':int(read('memory.current') or 0),
            'memoryMax':read('memory.max'),'memoryEvents':events,
            'memoryAnonBytes':stat.get('anon'),'memoryFileBytes':stat.get('file'),
            'cpuMax':read('cpu.max')}
def trackInventory():
    out={}
    for name in ['NavierStokes','Euler','ComparatorChallenges']:
        paths=list((R/name).rglob('*.lean'))
        if (R/(name+'.lean')).exists():paths.append(R/(name+'.lean'))
        present=sum((R/'.lake/build/lib/lean'/p.relative_to(R)).with_suffix('.olean').exists() for p in paths)
        out[name]={'sourceFiles':len(paths),'oleanArtifactsPresent':present,'oleanArtifactsMissing':len(paths)-present}
    return out

if (B/'result.json').exists() or (B/'default-build.log').exists():
    raise RuntimeError('This follow-up already has a run; preserve its record instead of overwriting it.')
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip()
status=subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=R,text=True)
if commit!='f9e8bc5b38b6e212696e8a30e3e91517af887bbd' or status:
    raise RuntimeError('Original pinned source integrity gate failed.')
if digest(A/'lean-rc2-entry')!='a187c5263205d221e47724bbaf729cd377f40683b2670a543e3b7e6495108682':
    raise RuntimeError('Pinned explicit-path entry hash changed.')
if digest(T/'lib/lean/libleanshared.so')!='cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5':
    raise RuntimeError('Original rc2 shared kernel hash changed.')

frozen=[]
for parent in [N,A,N/'evidence']:
    frozen.extend(p for p in parent.iterdir() if p.is_file() and p.suffix in ['.mjs','.json','.md','.log','.lean','.diff','.py','.c'])
frozen.extend((N/'lean/MathScope/Navier').glob('*.lean'))
before={str(p.relative_to(N)):digest(p) for p in frozen}
inputBefore={name:digest(R/name) for name in ['lean-toolchain','lakefile.toml','lake-manifest.json']}
write('frozen-v50-inputs.json',{'recordedUTC':now(),'files':before,'originalInputs':inputBefore,
                              'scope':'Hash snapshot only. No v50 ledger or runtime file is written by this runner.'})

env=dict(os.environ)
env.update(PATH=str(P/'bin')+os.pathsep+env.get('PATH',''),LEAN_SYSROOT=str(P),
           LAKE_HOME=str(A/'lake-home'),MATHLIB_CACHE_DIR=str(A/'mathlib-cache'),
           LAKE_CACHE_DIR=str(A/'lake-cache'))
env.pop('LEAN_PATH',None);env.pop('LEAN_SRC_PATH',None)
command=[str(T/'bin/lake'),'build']
initial=resource()
record={'schema':'MathScope.OriginalDefaultFollowup/1','status':'RUNNING','previousRun':'../followup-20261009-default-build','previousInterruptionReceipt':'../followup-20261009-default-build/interruption-observation-1750.json',
        'startedUTC':now(),'command':command,'cwd':str(R),'repositoryCommit':commit,
        'toolchain':'leanprover/lean4:v4.34.0-rc2',
        'defaultTargets':['NavierStokes','Euler','ComparatorChallenges'],
        'executionProfile':'Unchanged original default Lake target selection using the previously audited official rc2 shell entry with explicit installation path.',
        'environment':{k:env[k] for k in ['PATH','LEAN_SYSROOT','LAKE_HOME','MATHLIB_CACHE_DIR','LAKE_CACHE_DIR']},
        'guardChanges':False,'sourceChanges':False,'snapshotRuntimeFilesMayChangeDuringFollowup':True,
        'initialResources':initial,'initialModuleInventory':trackInventory(),
        'resourceStopThresholds':{'minimumFreeDiskBytes':805306368,'oomKillCountMayIncrease':False},
        'terminationReason':None}
write('current-stage.json',record)
record['controllerPID']=os.getpid()
write('current-stage.json',record)
print('Starting original default build follow-up at',record['startedUTC'],flush=True)
start=time.monotonic();lastProgress=-60;reason=None
log=B/'default-build.log'
samples=[]
with log.open('w') as output:
    process=subprocess.Popen(command,cwd=R,env=env,stdout=output,stderr=subprocess.STDOUT,start_new_session=True)
    record['buildPID']=process.pid
    write('current-stage.json',record)
    while process.poll() is None:
        elapsed=time.monotonic()-start
        if elapsed-lastProgress>=30:
            r=resource();samples.append(r)
            write('resource-progress.json',samples)
            if r['disk']['free']<805306368:reason='Resource guard: less than 768 MiB free disk remains.'
            if r['memoryEvents'].get('oom_kill',0)>initial['memoryEvents'].get('oom_kill',0):
                reason='Resource guard: cgroup OOM kill count increased.'
            lastProgress=elapsed
        if (B/'STOP_REQUESTED').exists():reason='Explicit parent follow-up stop request.'
        if reason:
            os.killpg(process.pid,signal.SIGTERM)
            break
        time.sleep(1)
    exitCode=process.wait(timeout=60)
after={name:digest(N/name) for name in before}
inputAfter={name:digest(R/name) for name in inputBefore}
trackedStatus=subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=R,text=True)
record.update(status='FINISHED',exitCode=exitCode,completedUTC=now(),elapsedSeconds=time.monotonic()-start,
              terminationReason=reason,wholeDefaultBuildPassed=exitCode==0,
              log='default-build.log',logSHA256=digest(log),finalResources=resource(),
              finalModuleInventory=trackInventory(),snapshotRuntimeFilesUnchanged=before==after,
              changedFrozenPaths=[p for p in before if before[p]!=after[p]],
              originalInputsUnchanged=inputBefore==inputAfter,originalTrackedSourcesUnchanged=not trackedStatus,
              comparatorCompleted=False,
              scope='A successful default build is not the independent guarded Comparator, not a new browser kernel run, and not certification of the numerical leading-profile candidate.')
write('result.json',record);write('current-stage.json',record)
record['controllerPID']=os.getpid()
write('current-stage.json',record)
print('Original default follow-up exit',exitCode,'at',record['completedUTC'],flush=True)
print(log.read_text(errors='replace')[-5000:],flush=True)
