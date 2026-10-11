#!/usr/bin/env python3
import datetime,hashlib,json,os,re,resource,signal,subprocess,sys,time
from pathlib import Path
nav=Path(__file__).resolve().parents[1];repo=nav.parents[2];out=nav/'research/evidence/leading-global-stress-bridge-20261011';out.mkdir(exist_ok=True)
a=sys.argv[1] if len(sys.argv)>1 else '1'
if not a.isdigit():raise SystemExit('Use a positive attempt number.')
stem='source-attempt-'+a;owned=[nav/'actual-leading-global-stress-bridge.mjs',nav/'tests/actual-leading-global-stress-bridge-source.test.mjs',Path(__file__).resolve()]
snap=out/(stem+'-source');snap.mkdir(exist_ok=False)
for p in owned:(snap/p.name).write_bytes(p.read_bytes())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def imports():
 todo=owned[:2];seen=set()
 while todo:
  p=todo.pop().resolve()
  if p in seen:continue
  seen.add(p)
  for s in re.findall(r'(?:from\s*|import\s*)[\'\"](\.[^\'\"]+)[\'\"]',p.read_text()):
   n=(p.parent/s).resolve()
   if n.is_file():todo.append(n)
 return {str(p.relative_to(repo)):sha(p) for p in sorted(seen)}
before=imports();env=os.environ.copy();env['M2_LEADING_STRESS_EVIDENCE']=str(out/(stem+'-certificate.json'));start=time.monotonic();utc=datetime.datetime.now(datetime.timezone.utc).isoformat();cmd=['node','--max-old-space-size=3072','--test','--test-reporter=tap','tests/actual-leading-global-stress-bridge-source.test.mjs'];timed=False
with (out/(stem+'.tap')).open('w') as f:
 p=subprocess.Popen(cmd,cwd=nav,env=env,stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
 try:code=p.wait(timeout=180)
 except subprocess.TimeoutExpired:
  timed=True;os.killpg(p.pid,signal.SIGTERM)
  try:code=p.wait(timeout=5)
  except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);code=p.wait()
after=imports();r={'schema':'MathScope.ActualLeadingGlobalStressBridgeProcess/1','attempt':int(a),'command':cmd,'startedAt':utc,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-start,'exitCode':code,'timedOut':timed,'heapLimitMiB':3072,'timeoutSeconds':180,'childPeakRSSBytes':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024,'peakRSSQualification':'Whole completed child measurement; after timeout this may record supervisor only.','dependencySHA256Before':before,'dependencySHA256After':after,'dependenciesUnchanged':before==after,'tapSHA256':sha(out/(stem+'.tap')),'runnerSHA256':sha(Path(__file__).resolve())}
(out/(stem+'-process.json')).write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({k:v for k,v in r.items() if not k.startswith('dependencySHA')}));raise SystemExit(0 if code==0 and not timed else 1)
