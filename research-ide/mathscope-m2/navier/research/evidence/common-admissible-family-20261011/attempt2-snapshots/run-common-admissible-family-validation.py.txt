import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import signal
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m2/navier'
EVIDENCE=BASE/'research/evidence/common-admissible-family-20261011'
attempt=int(sys.argv[1])
if attempt<1: raise ValueError('Use a new positive attempt number.')
EVIDENCE.mkdir(parents=True,exist_ok=True)
stem='actual-common-admissible-family-source-attempt'+str(attempt)
log=EVIDENCE/(stem+'.log');receipt=EVIDENCE/(stem+'.json');observed=EVIDENCE/(stem+'-process.json')
if any(p.exists() for p in [log,receipt,observed]):raise RuntimeError('Earlier source attempts are immutable.')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
sources=[BASE/'actual-compact-all-band-background-norms.mjs',BASE/'actual-common-admissible-family.mjs',BASE/'actual-common-admissible-band.mjs',BASE/'actual-common-target-weighted-norms.mjs',
 BASE/'tests/actual-common-admissible-family-kernel.test.mjs',BASE/'tests/actual-common-admissible-family-source.test.mjs',Path(__file__).resolve()]
seen=set()
def closure(path):
 path=path.resolve()
 if path in seen:return
 seen.add(path)
 if path.suffix!='.mjs':return
 for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):closure(path.parent/spec)
for path in sources:closure(path)
manifest=[{'path':str(p.relative_to(ROOT)),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(seen)]
snapdir=EVIDENCE/('attempt'+str(attempt)+'-snapshots');snapdir.mkdir();snapshots=[]
for path in sources:
 target=snapdir/(path.name+'.txt');target.write_bytes(path.read_bytes());snapshots.append({'original':str(path.relative_to(ROOT)),'path':str(target.relative_to(ROOT)),'sha256':sha(target)})
env=dict(os.environ,M2_COMMON_FAMILY_EVIDENCE=str(receipt))
command=['node','--max-old-space-size=4096','--test','--test-reporter=tap',str((BASE/'tests/actual-common-admissible-family-source.test.mjs').relative_to(ROOT))]
started=datetime.datetime.now(datetime.timezone.utc).isoformat();tick=time.monotonic();timeout=False
with log.open('wb') as stream:
 child=subprocess.Popen(command,cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
 try:child.wait(timeout=360)
 except subprocess.TimeoutExpired:
  timeout=True;os.killpg(child.pid,signal.SIGTERM)
  try:child.wait(timeout=5)
  except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL);child.wait()
elapsed=time.monotonic()-tick
text=log.read_text(errors='replace')
record={'schema':'MathScope.ObservedCommonAdmissibleFamilyProcess/1','startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'command':command,'runnerSHA256AtExecution':sha(__file__),'sourceManifest':{'files':manifest,'unchangedAfterExecution':all(sha(ROOT/r['path'])==r['sha256'] for r in manifest)},
 'exitCode':child.returncode,'timeout':timeout,'timeoutSeconds':360,'elapsedSeconds':elapsed,'peakRSSBytes':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024,
 'tests':{'passed':len(re.findall(r'^ok \d+ - ',text,re.M)),'failed':len(re.findall(r'^not ok \d+ - ',text,re.M))},
 'log':{'path':str(log.relative_to(ROOT)),'sha256':sha(log)},'certificate':{'path':str(receipt.relative_to(ROOT)),'exists':receipt.exists(),'sha256':sha(receipt) if receipt.exists() else None},
 'snapshots':snapshots,'pass':child.returncode==0 and receipt.exists(),'designedNegativeControl':False}
observed.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in record.items() if k not in ['sourceManifest','snapshots']},ensure_ascii=False,indent=2))
sys.exit(0 if record['pass'] else 1)
