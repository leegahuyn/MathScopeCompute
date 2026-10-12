"""Observe the three finite calculus kernels; never grants source authority."""
from pathlib import Path
import datetime, hashlib, json, os, signal, subprocess, sys, time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m2/navier'
OUT=BASE/'research/evidence/common-wave-calculus-20261011'
attempt=int(sys.argv[1]); assert attempt>0
OUT.mkdir(parents=True,exist_ok=True)
stem='common-wave-kernels-attempt'+str(attempt)
log=OUT/(stem+'.log'); receipt=OUT/(stem+'.json'); snapshots=OUT/(stem+'-snapshots')
if any(p.exists() for p in (log,receipt,snapshots)): raise RuntimeError('Previous attempts are immutable.')
snapshots.mkdir()
modules=['actual-all-order-gaussian-jet-kernel','actual-physical-residual-algebra','actual-global-wave-bound-kernel']
files=[BASE/(m+'.mjs') for m in modules]+[BASE/'tests'/(m+'.test.mjs') for m in modules]+[Path(__file__).resolve()]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
before={str(p.relative_to(ROOT)):sha(p) for p in files}; copies=[]
for p in files:
 t=snapshots/(p.name+'.txt'); t.write_bytes(p.read_bytes());copies.append({'path':str(t.relative_to(ROOT)),'sha256':sha(t)})
command=['node','--max-old-space-size=768','--test','--test-concurrency=1','--test-reporter=tap']+[str((BASE/'tests'/(m+'.test.mjs')).relative_to(ROOT)) for m in modules]
start=datetime.datetime.now(datetime.timezone.utc).isoformat();tick=time.monotonic();timedout=False
with log.open('wb') as stream:
 process=subprocess.Popen(command,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
 try: process.wait(timeout=45)
 except subprocess.TimeoutExpired:
  timedout=True;os.killpg(process.pid,signal.SIGTERM);process.wait(timeout=5)
text=log.read_text()
totals={}
for line in text.splitlines():
 for key in ('tests','pass','fail','cancelled','skipped','todo'):
  if line.startswith('# '+key+' '): totals[key]=int(line.rsplit(' ',1)[1])
r={'schema':'MathScope.ObservedCommonWaveGenericKernels/1','startedAt':start,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'command':command,'exitCode':process.returncode,'timeout':timedout,'wallElapsedMs':1000*(time.monotonic()-tick),'testTotals':totals,
 'sourceSHA256AtExecution':before,'sourceUnchangedAfterRun':all(sha(ROOT/p)==h for p,h in before.items()),'snapshots':copies,
 'log':{'path':str(log.relative_to(ROOT)),'sha256':sha(log)},'actualSourceAuthenticated':False,'wholeM2Complete':False,
 'pass':process.returncode==0 and totals.get('fail')==0 and totals.get('tests',0)>0}
receipt.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print(json.dumps(r,ensure_ascii=False,indent=2))
sys.exit(0 if r['pass'] else 1)
