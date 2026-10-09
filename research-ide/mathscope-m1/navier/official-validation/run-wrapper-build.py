#!/usr/bin/env python3
from pathlib import Path
import os,json,subprocess,time,hashlib,datetime,signal
B=Path(__file__).resolve().parent;T=B/'lean-4.34.0-rc2-linux';P=B/'lean-entry-layout';REPO=B/'repo'
env=os.environ.copy();env['PATH']=str(P/'bin')+':'+env['PATH'];env['LEAN_SYSROOT']=str(P);env['LAKE_HOME']=str(B/'lake-home');env['MATHLIB_CACHE_DIR']=str(B/'mathlib-cache');env['LAKE_CACHE_DIR']=str(B/'lake-cache');env.pop('LEAN_PATH',None);env.pop('LEAN_SRC_PATH',None)
record=[]
for name,args in [('lake-cache-get-wrapper',[str(T/'bin/lake'),'exe','cache','get']),('lake-build-wrapper',[str(T/'bin/lake'),'build'])]:
 start=time.monotonic();log=B/(name+'.log');current={'stage':name,'command':args,'cwd':str(REPO),'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'environment':{k:env.get(k) for k in ['PATH','LEAN_SYSROOT','LAKE_HOME','MATHLIB_CACHE_DIR','LAKE_CACHE_DIR']},'status':'RUNNING'};(B/'wrapper-current-stage.json').write_text(json.dumps(current,indent=2)+'\n');print('Starting',name,flush=True)
 with log.open('w') as f:
  p=subprocess.Popen(args,cwd=REPO,env=env,stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
  reason=None
  while p.poll() is None:
   if (B/'STOP_REQUESTED').exists():reason='Explicit stop request';os.killpg(p.pid,signal.SIGTERM);break
   if time.monotonic()-start>18000:reason='Five-hour bounded build limit';os.killpg(p.pid,signal.SIGTERM);break
   time.sleep(1)
  code=p.wait(timeout=60)
 current.update(status='FINISHED',exitCode=code,elapsedSeconds=time.monotonic()-start,logFile=log.name,logSha256=hashlib.sha256(log.read_bytes()).hexdigest(),terminationReason=reason)
 record.append(current);(B/'official-wrapper-command-results.json').write_text(json.dumps(record,indent=2)+'\n');(B/'wrapper-current-stage.json').write_text(json.dumps(current,indent=2)+'\n');print(name,'exit',code,log.read_text()[-1800:],flush=True)
 if reason:break
