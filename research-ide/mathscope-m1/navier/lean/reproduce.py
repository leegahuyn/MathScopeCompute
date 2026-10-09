#!/usr/bin/env python3
"""Narrow kernel checks with unchanged pinned external component source files."""
from pathlib import Path
import os,json,hashlib,subprocess,time,re,datetime
ROOT=Path(__file__).resolve().parents[3]
LOCAL=ROOT/'mathscope-m1/navier/lean'
BASE=ROOT/'mathscope-m1/navier'
OUT=BASE/'evidence'
BUILD=LOCAL/'.lake/build/lib/lean'
LEAN=ROOT/'lean-4.34.1-linux'
MATHLIB=ROOT/'mathlib-ym-check'
DRIVER=Path('/tmp/mathscope-lean-embed')
REPO=BASE/'sources/official-repo'
OUT.mkdir(parents=True,exist_ok=True);BUILD.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
paths=[BUILD,MATHLIB/'.lake/build/lib/lean']+[x/'.lake/build/lib/lean' for x in sorted((MATHLIB/'.lake/packages').iterdir())]
env=os.environ.copy();env['LEAN_PATH']=':'.join(str(p) for p in paths if p.exists());env['LEAN_SYSROOT']=str(LEAN)
modules=[('NavierStokes.Flatness',REPO/'NavierStokes/Flatness.lean'),('NavierStokes.ProblemStatement',REPO/'NavierStokes/ProblemStatement.lean'),('MathScope.Navier.Analytic',LOCAL/'MathScope/Navier/Analytic.lean'),('MathScope.Navier.Finite',LOCAL/'MathScope/Navier/Finite.lean'),('MathScope.Navier.SourceAdapter',LOCAL/'MathScope/Navier/SourceAdapter.lean')]
records=[]
for name,source in modules:
 out=BUILD/(name.replace('.','/')+'.olean');out.parent.mkdir(parents=True,exist_ok=True)
 cmd=[str(DRIVER),str(LEAN),'-o',str(out),str(source)]
 started=time.monotonic();run=subprocess.run(cmd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=100)
 log=run.stdout;logfile=OUT/('lean-'+name.split('.')[-1]+'.log');logfile.write_text(log)
 targets=[]
 for m in re.finditer(r"'([^']+)' (does not depend on any axioms|depends on axioms:\s*\[([^]]*)\])",log):
  ax=[] if m[3] is None else [x.strip() for x in m[3].split(',') if x.strip()]
  before=log[:m.start()];start=before.rfind(m[1]);targets.append({'target':m[1],'targetType':before[start:].strip() if start>=0 else None,'axioms':ax,'customAxioms':[x for x in ax if x not in ['propext','Classical.choice','Quot.sound']]})
 records.append({'module':name,'sourceFile':str(source.relative_to(BASE)),'sourceSha256':sha(source.read_bytes()),'command':cmd,'exitCode':run.returncode,'logFile':logfile.name,'logSha256':sha(log.encode()),'log':log,'targets':targets,'executionMetrics':{'elapsedSeconds':time.monotonic()-started},'oleanSha256':sha(out.read_bytes()) if out.exists() and run.returncode==0 else None,'externalSourceUnchanged':name.startswith('NavierStokes.')})
 print(name,run.returncode,flush=True)
 if run.returncode: print(log,flush=True)
 if run.returncode and 'does not exist' in log: break
negative=[]
if all(r['exitCode']==0 for r in records) and len(records)==len(modules):
 for name in ['NegativeFalse','NegativeQuadratic']:
  source=LOCAL/(name+'.lean');cmd=[str(DRIVER),str(LEAN),str(source)];run=subprocess.run(cmd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=60)
  logfile=OUT/(name+'.log');logfile.write_text(run.stdout);negative.append({'name':name,'sourceSha256':sha(source.read_bytes()),'exitCode':run.returncode,'rejected':run.returncode!=0,'logFile':logfile.name,'logSha256':sha(run.stdout.encode()),'log':run.stdout})
commit=subprocess.check_output(['git','-C',str(REPO),'rev-parse','HEAD'],text=True).strip()
status='KERNEL_CHECKED_COMPONENTS' if len(records)==len(modules) and all(r['exitCode']==0 for r in records) and all(n['rejected'] for n in negative) else 'BLOCKED_COMPONENT_BUILD'
result={'schemaVersion':1,'status':status,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'environment':{'leanVersion':subprocess.check_output([str(DRIVER),str(LEAN),'--version'],env=env,text=True).strip(),'mathlibCommit':subprocess.check_output(['git','-C',str(MATHLIB),'rev-parse','HEAD'],text=True).strip(),'driverSha256':sha(DRIVER.read_bytes()),'runtimeLibrarySha256':sha((LEAN/'lib/lean/libleanshared.so').read_bytes()),'kernelModified':False,'runtimeModified':False,'verifierGuardModified':False},'external':{'repository':'https://github.com/openai/NavierStokesAndEuler','commit':commit,'originalToolchain':(REPO/'lean-toolchain').read_text().strip(),'componentValidationToolchain':'Lean/mathlib 4.34.1','fullOriginalBuildPerformed':False,'comparatorMainTheoremsKernelChecked':False},'records':records,'negativeControls':negative,'scope':'Exact selected source files and adapter types only. Full C/D proof, B.2 analytic hypotheses and complete Theorem 4.6 numeric instantiation are not certified.'}
(OUT/'lean-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(status,flush=True)
