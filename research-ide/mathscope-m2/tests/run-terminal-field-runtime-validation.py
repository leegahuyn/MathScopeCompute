"""Observe source and built Worker executions without promoting scoped certificates."""
import datetime,hashlib,json,os,resource,signal,subprocess,sys,time
from pathlib import Path
root=Path(__file__).resolve().parents[3]
out=root/'research-ide/mathscope-m2/navier/research/evidence/terminal-field-runtime-20261011'
stem=sys.argv[1]
if not stem.replace('-','').isalnum():raise ValueError('Use a fresh alphanumeric stem.')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
for mode in ['source','worker']:
 log=out/(stem+'-'+mode+'-process.log');receipt=out/(stem+'-'+mode+'-process.json')
 if log.exists() or receipt.exists():raise RuntimeError('Earlier executions are immutable.')
 command=['node','--max-old-space-size=2048','research-ide/mathscope-m2/tests/terminal-field-runtime-case.mjs',mode,stem]
 started=datetime.datetime.now(datetime.timezone.utc).isoformat();tick=time.monotonic();timedout=False
 with log.open('wb') as f:
  child=subprocess.Popen(command,cwd=root,stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
  try:child.wait(timeout=120)
  except subprocess.TimeoutExpired:
   timedout=True;os.killpg(child.pid,signal.SIGTERM);child.wait(timeout=5)
 result=out/(stem+'-'+mode+'-runtime.json')
 data=json.loads(result.read_text()) if result.exists() else {}
 record={'schema':'MathScope.ObservedTerminalFieldRuntime/1','startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':command,'observedExitCode':child.returncode,'timedOut':timedout,'peakRSSBytes':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024,'sourceCommitAtExecution':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'runnerSHA256':sha(__file__),'caseSHA256':sha(root/command[2]),'runtimeResult':{'path':str(result.relative_to(root)),'exists':result.exists(),'sha256':sha(result) if result.exists() else None},'log':{'path':str(log.relative_to(root)),'sha256':sha(log)},'pass':child.returncode==0 and data.get('pass') is True and not timedout,'wholeM2Complete':False}
 receipt.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(record,ensure_ascii=False),flush=True)
 if not record['pass']:sys.exit(1)
