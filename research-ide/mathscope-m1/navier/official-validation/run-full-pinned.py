#!/usr/bin/env python3
"""Run the unmodified pinned defaults after the original cache has stopped.

This is orchestration only. It does not replace proof sources, guards, kernel,
options, manifest pins, or cache hash verification. The previously audited
explicit-path Lean shell entry is used through a separate toolchain layout.
"""
from pathlib import Path
import datetime, hashlib, json, os, signal, subprocess, time

B=Path(__file__).resolve().parent
T=B/'lean-4.34.0-rc2-linux'
P=B/'lean-entry-layout'
R=B/'repo'
env=dict(os.environ)
env.update(PATH=str(P/'bin')+os.pathsep+env.get('PATH',''),
           LEAN_SYSROOT=str(P),LAKE_HOME=str(B/'lake-home'),
           MATHLIB_CACHE_DIR=str(B/'mathlib-cache'),LAKE_CACHE_DIR=str(B/'lake-cache'))
env.pop('LEAN_PATH',None)
env.pop('LEAN_SRC_PATH',None)
records=[]
def persist(record):
    (B/'full-current-stage.json').write_text(json.dumps(record,indent=2)+'\n')
    (B/'full-pinned-command-results.json').write_text(json.dumps(records,indent=2)+'\n')

waitStart=time.monotonic()
persist({'stage':'WAITING_FOR_CACHE','status':'RUNNING',
         'reason':'Avoid simultaneous cache decompression and build writes to isolated .lake.'})
while True:
    info=json.loads((B/'cache-context-result.json').read_text())
    if info.get('status')=='FINISHED':break
    if time.monotonic()-waitStart>2100:raise RuntimeError('Cache did not reach a recorded terminal state; build not started.')
    if (B/'STOP_FULL_REQUESTED').exists():raise RuntimeError('Stopped before build by explicit request')
    time.sleep(2)
print('Cache finished with exit',info['exitCode'],'starting original pinned defaults',flush=True)

def runStage(name,args,maxSeconds=14400):
    start=time.monotonic()
    log=B/(name+'.log')
    rec={'stage':name,'command':args,'cwd':str(R),'status':'RUNNING',
         'startedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
         'environment':{k:env[k] for k in ['PATH','LEAN_SYSROOT','LAKE_HOME','MATHLIB_CACHE_DIR','LAKE_CACHE_DIR']},
         'originalRepositoryCommit':'f9e8bc5b38b6e212696e8a30e3e91517af887bbd',
         'originalToolchain':'leanprover/lean4:v4.34.0-rc2',
         'executionProfile':'Official rc2 Lean shell entry with explicit installation path; vanilla CLI failures separately recorded.'}
    persist(rec)
    reason=None
    with log.open('w') as output:
        p=subprocess.Popen(args,cwd=R,env=env,stdout=output,stderr=subprocess.STDOUT,start_new_session=True)
        while p.poll() is None:
            if (B/'STOP_FULL_REQUESTED').exists():reason='Explicit stop request'
            elif time.monotonic()-start>maxSeconds:reason='Recorded bounded stage timeout'
            if reason:
                os.killpg(p.pid,signal.SIGTERM)
                break
            time.sleep(1)
        code=p.wait(timeout=60)
    rec.update(status='FINISHED',exitCode=code,
               completedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),
               elapsedSeconds=time.monotonic()-start,terminationReason=reason,
               logFile=log.name,logSHA256=hashlib.sha256(log.read_bytes()).hexdigest())
    records.append(rec)
    persist(rec)
    print(name,'exit',code,flush=True)
    print(log.read_text(errors='replace')[-2400:],flush=True)
    return rec

full=runStage('lake-build-full-pinned',[str(T/'bin/lake'),'build'])
if full['terminationReason'] is None:
    # Continue the exact C/D target if an unrelated default (e.g. Euler) failed.
    if full['exitCode']!=0:
        runStage('lake-build-ns-submission-pinned',
                 [str(T/'bin/lake'),'build','NavierStokes.ComparatorSolution'])
    runStage('ns-pinned-declarations',
             [str(T/'bin/lake'),'env','lean','--root',str(B),str(B/'PinnedDeclarations.lean')],
             maxSeconds=1200)
