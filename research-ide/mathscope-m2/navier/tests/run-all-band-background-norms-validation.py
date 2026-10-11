import datetime
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m2/navier'
EVIDENCE=BASE/'research/evidence/all-band-background-norms-20261011'
attempt=int(sys.argv[1])
if attempt<1: raise ValueError('Use a new positive attempt number.')
EVIDENCE.mkdir(parents=True,exist_ok=True)
stem='actual-all-band-background-norms-source-attempt'+str(attempt)
log=EVIDENCE/(stem+'.log'); receipt=EVIDENCE/(stem+'.json'); process=EVIDENCE/(stem+'-process.json')
if any(x.exists() for x in (log,receipt,process)): raise RuntimeError('Earlier attempts are immutable.')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
files=[BASE/'actual-all-band-background-norm-kernel.mjs',BASE/'actual-all-band-background-norms.mjs',BASE/'tests/actual-all-band-background-norm-kernel.test.mjs',BASE/'tests/actual-all-band-background-norms-source.test.mjs',Path(__file__).resolve()]
before={str(p.relative_to(ROOT)):sha(p) for p in files};snapdir=EVIDENCE/('attempt'+str(attempt)+'-snapshots');snapdir.mkdir()
snapshots=[]
for p in files:
 t=snapdir/(p.name+'.txt');t.write_bytes(p.read_bytes());snapshots.append({'original':str(p.relative_to(ROOT)),'path':str(t.relative_to(ROOT)),'sha256':sha(t)})
env=dict(os.environ,MATHSCOPE_ALL_BAND_NORM_EVIDENCE_DIR=str(EVIDENCE),MATHSCOPE_ALL_BAND_NORM_RECEIPT_STEM=stem)
command=['node','--max-old-space-size=3072','--test','--test-reporter=tap',str((BASE/'tests/actual-all-band-background-norms-source.test.mjs').relative_to(ROOT))]
started=datetime.datetime.now(datetime.timezone.utc).isoformat();tick=time.monotonic();timeout=False
with log.open('wb') as out:
 child=subprocess.Popen(command,cwd=ROOT,env=env,stdout=out,stderr=subprocess.STDOUT,start_new_session=True)
 try: child.wait(timeout=180)
 except subprocess.TimeoutExpired:
  timeout=True;os.killpg(child.pid,signal.SIGTERM)
  try: child.wait(timeout=5)
  except subprocess.TimeoutExpired: os.killpg(child.pid,signal.SIGKILL);child.wait()
source=json.loads(receipt.read_text()) if receipt.exists() else None
record={'schema':'MathScope.ObservedAllBandNormSourceProcess/1','startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':command,
 'runnerSHA256AtExecution':before[str(Path(__file__).resolve().relative_to(ROOT))],'sourceSHA256AtExecution':before,'sourceUnchangedAfterRun':all(sha(ROOT/p)==h for p,h in before.items()),
 'exitCode':child.returncode,'timeout':timeout,'timeoutSeconds':180,'wallElapsedMs':1000*(time.monotonic()-tick),'peakRSSBytes':source.get('peakRSSBytes') if source else None,
 'log':{'path':str(log.relative_to(ROOT)),'sha256':sha(log)},'sourceReceipt':{'path':str(receipt.relative_to(ROOT)),'exists':receipt.exists(),'sha256':sha(receipt) if receipt.exists() else None},
 'snapshots':snapshots,'pass':child.returncode==0 and source is not None and source.get('pass') is True,'designedNegativeControl':False}
process.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');print(json.dumps(record,ensure_ascii=False,indent=2))
sys.exit(0 if record['pass'] else 1)
