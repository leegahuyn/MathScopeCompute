"""Original radial-map correction revalidation with complete source snapshots.

The 1,800-second budget retains the already observed 1,344-second common
physical package execution. The eight mathematical checks are unchanged except
for the required literal original (6.2) equation audit in the physical check.
All original attempts and their runners remain immutable historical evidence.
"""
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
EVIDENCE=BASE/'research/evidence/common-physical-package-20261011'
attempt=int(sys.argv[1])
if attempt<1: raise ValueError('Use a new positive attempt number.')
EVIDENCE.mkdir(parents=True,exist_ok=True)
stem='actual-common-physical-package-source-attempt'+str(attempt)
log=EVIDENCE/(stem+'.log');receipt=EVIDENCE/(stem+'.json');observed=EVIDENCE/(stem+'-process.json')
if any(p.exists() for p in [log,receipt,observed]):raise RuntimeError('Earlier source attempts are immutable.')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
sources=[BASE/p for p in ['actual-common-physical-jet-kernel.mjs','actual-common-band-physical-curl.mjs','actual-common-global-wave-bounds.mjs','actual-common-global-covariance.mjs',
 'actual-background-residual-flatness.mjs','actual-common-band-background-residual.mjs',
 'tests/assert-common-background-residual-source.mjs','tests/actual-common-physical-package-source.test.mjs']]+[Path(__file__).resolve()]
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
for path in sorted(seen):
 target=snapdir/path.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(path.read_bytes());snapshots.append({'original':str(path.relative_to(ROOT)),'path':str(target.relative_to(ROOT)),'sha256':sha(target)})
env=dict(os.environ,M2_COMMON_PHYSICAL_EVIDENCE=str(receipt))
command=['node','--max-old-space-size=4608','--test','--test-reporter=tap',str((BASE/'tests/actual-common-physical-package-source.test.mjs').relative_to(ROOT))]
started=datetime.datetime.now(datetime.timezone.utc).isoformat();tick=time.monotonic();timeout=False
source_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
timeout_seconds=1800
tree_peak=0;individual_high_water=0;sampling_interval=0.25
def sample_tree(pid):
 global tree_peak,individual_high_water
 pending=[pid];seen_pids=set();rss=0
 while pending:
  current=pending.pop()
  if current in seen_pids:continue
  seen_pids.add(current)
  try:
   status=(Path('/proc')/str(current)/'status').read_text()
   resident=re.search(r'^VmRSS:\s+(\d+)\s+kB',status,re.M)
   high_water=re.search(r'^VmHWM:\s+(\d+)\s+kB',status,re.M)
   if resident:rss+=int(resident.group(1))*1024
   if high_water:individual_high_water=max(individual_high_water,int(high_water.group(1))*1024)
   children=(Path('/proc')/str(current)/'task'/str(current)/'children').read_text()
   pending.extend(map(int,children.split()))
  except (FileNotFoundError,ProcessLookupError,PermissionError):pass
 tree_peak=max(tree_peak,rss)
with log.open('wb') as stream:
 child=subprocess.Popen(command,cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
 try:
  while child.poll() is None:
   sample_tree(child.pid)
   remaining=timeout_seconds-(time.monotonic()-tick)
   if remaining<=0:raise subprocess.TimeoutExpired(command,timeout_seconds)
   try:child.wait(timeout=min(sampling_interval,remaining))
   except subprocess.TimeoutExpired:pass
 except subprocess.TimeoutExpired:
  timeout=True;os.killpg(child.pid,signal.SIGTERM)
  try:child.wait(timeout=5)
  except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL);child.wait()
elapsed=time.monotonic()-tick
text=log.read_text(errors='replace');complete=receipt.exists() and json.loads(receipt.read_text()).get('complete') is True
unchanged=all(sha(ROOT/r['path'])==r['sha256'] for r in manifest)
logged_peak=max([0,*map(int,re.findall(r'"rssBytes":(\d+)',text))])
reaped_peak=resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024
record={'schema':'MathScope.ObservedCommonPhysicalPackageProcess/1','startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'command':command,'sourceCommitAtExecution':source_commit,'runnerSHA256AtExecution':sha(__file__),'sourceManifest':{'files':manifest,'unchangedAfterExecution':unchanged},
 'exitCode':child.returncode,'timeout':timeout,'timeoutSeconds':timeout_seconds,'elapsedSeconds':elapsed,'peakRSSBytes':max(reaped_peak,individual_high_water,logged_peak),
 'memoryObservation':{'reapedChildPeakRSSBytes':reaped_peak,'maximumSampledProcessVmHWMBytes':individual_high_water,
  'sampledProcessTreePeakRSSBytes':tree_peak,'maximumSourceLoggedRSSBytes':logged_peak,'samplingIntervalSeconds':sampling_interval,
  'definition':'peakRSSBytes is the largest observed individual-process high-water/RSS value. The separately sampled tree total includes the Node test runner and its descendants. A killed unreaped descendant cannot be reported using only RUSAGE_CHILDREN.'},
 'tests':{'passed':len(re.findall(r'^ok \d+ - ',text,re.M)),'failed':len(re.findall(r'^not ok \d+ - ',text,re.M))},
 'log':{'path':str(log.relative_to(ROOT)),'sha256':sha(log)},'certificate':{'path':str(receipt.relative_to(ROOT)),'exists':receipt.exists(),'complete':complete,'sha256':sha(receipt) if receipt.exists() else None},
 'snapshots':snapshots,'pass':child.returncode==0 and complete and unchanged,'designedNegativeControl':False}
observed.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in record.items() if k not in ['sourceManifest','snapshots']},ensure_ascii=False,indent=2))
sys.exit(0 if record['pass'] else 1)
