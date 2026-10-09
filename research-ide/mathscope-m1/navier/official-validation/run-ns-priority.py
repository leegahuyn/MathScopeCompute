#!/usr/bin/env python3
"""Sequential official NS submission target and its printed declaration audit."""
from pathlib import Path
import datetime, hashlib, json, os, signal, subprocess, time

B=Path(__file__).resolve().parent
T=B/'lean-4.34.0-rc2-linux'
P=B/'lean-entry-layout'
R=B/'repo'
recordPath=B/'full-pinned-command-results.json'
records=json.loads(recordPath.read_text())
old=next(x for x in records if x['stage']=='lake-build-full-pinned')
if old.get('status')!='FINISHED':raise RuntimeError('Original default build has not stopped; do not run simultaneous build writes.')
env=dict(os.environ)
env.update(PATH=str(P/'bin')+os.pathsep+env.get('PATH',''),
           LEAN_SYSROOT=str(P),LAKE_HOME=str(B/'lake-home'),
           MATHLIB_CACHE_DIR=str(B/'mathlib-cache'),LAKE_CACHE_DIR=str(B/'lake-cache'))
env.pop('LEAN_PATH',None)
env.pop('LEAN_SRC_PATH',None)
for name,args,bound in [
    ('lake-build-ns-priority-pinned',[str(T/'bin/lake'),'build','NavierStokes.ComparatorSolution'],7200),
    ('ns-pinned-declarations',[str(T/'bin/lake'),'env','lean','--root',str(B),str(B/'PinnedDeclarations.lean')],1200),
]:
    start=time.monotonic()
    log=B/(name+'.log')
    rec={'stage':name,'command':args,'cwd':str(R),'status':'RUNNING',
         'startedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
         'environment':{k:env[k] for k in ['PATH','LEAN_SYSROOT','LAKE_HOME','MATHLIB_CACHE_DIR','LAKE_CACHE_DIR']},
         'originalRepositoryCommit':'f9e8bc5b38b6e212696e8a30e3e91517af887bbd',
         'originalToolchain':'leanprover/lean4:v4.34.0-rc2',
         'executionProfile':'Official rc2 Lean shell entry with explicit installation path; unchanged standard Lake target selection.',
         'boundSeconds':bound}
    (B/'full-current-stage.json').write_text(json.dumps(rec,indent=2)+'\n')
    print('Starting',name,flush=True)
    reason=None
    with log.open('w') as output:
        p=subprocess.Popen(args,cwd=R,env=env,stdout=output,stderr=subprocess.STDOUT,start_new_session=True)
        while p.poll() is None:
            if (B/'STOP_NS_PRIORITY_REQUESTED').exists():reason='Explicit NS priority stop request'
            elif time.monotonic()-start>bound:reason='Recorded bounded stage timeout'
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
    recordPath.write_text(json.dumps(records,indent=2)+'\n')
    (B/'full-current-stage.json').write_text(json.dumps(rec,indent=2)+'\n')
    print(name,'exit',code,flush=True)
    print(log.read_text(errors='replace')[-3800:],flush=True)
    if reason:break
