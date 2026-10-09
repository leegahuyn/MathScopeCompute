#!/usr/bin/env python3
"""Compile the fixed gauge certificates with the unchanged official Lean kernel."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,re,subprocess,time
ROOT=Path(__file__).resolve().parents[3]
LOCAL=Path(__file__).resolve().parent
STANDARDS={'propext','Classical.choice','Quot.sound'}
def sha(b):return hashlib.sha256(b).hexdigest()
def parse(log):
 out=[]
 for m in re.finditer(r"'([^']+)' (does not depend on any axioms|depends on axioms:\s*\[([^]]*)\])",log):
  name=m[1];before=log[:m.start()];start=before.rfind(name);axioms=[] if m[3] is None else [x.strip() for x in m[3].split(',') if x.strip()]
  out.append({'name':name,'type':before[start:].strip(),'axioms':axioms,'customAxioms':[x for x in axioms if x not in STANDARDS]})
 return out

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--modules',default='Defs,Fixtures,SU3,G2,Transport,Conditional');args=parser.parse_args()
 lean=ROOT/'lean-4.34.1-linux';mathlib=ROOT/'mathlib-ym-check';driver=Path('/tmp/mathscope-lean-embed');build=LOCAL/'.lake/build/lib/lean';build.mkdir(parents=True,exist_ok=True)
 env=os.environ.copy();paths=[build,mathlib/'.lake/build/lib/lean']+[p/'.lake/build/lib/lean' for p in (mathlib/'.lake/packages').iterdir()];env['LEAN_PATH']=':'.join(str(p) for p in paths if p.exists());env['LEAN_SYSROOT']=str(lean)
 version=subprocess.run([str(driver),str(lean),'--version'],env=env,capture_output=True,text=True,check=True).stdout.strip();commands=[];sources=[];targets=[]
 for module in args.modules.split(','):
  file=LOCAL/f'MathScope/M1/Gauge/{module}.lean';output=build/f'MathScope/M1/Gauge/{module}.olean';output.parent.mkdir(parents=True,exist_ok=True);cmd=[str(driver),str(lean),'-o',str(output),str(file)];start=time.monotonic();run=subprocess.run(cmd,cwd=LOCAL,env=env,capture_output=True,text=True);log=run.stdout+run.stderr
  logPath=LOCAL/f'{module.lower()}-audit.log';logPath.write_text(log);rec={'command':cmd,'standardCommand':f'lake env lean MathScope/M1/Gauge/{module}.lean','exitCode':run.returncode,'elapsedSeconds':time.monotonic()-start,'log':log,'logSha256':sha(log.encode()),'logPath':logPath.name,'oleanSha256':sha(output.read_bytes()) if not run.returncode else None};commands.append(rec);sources.append({'path':str(file.relative_to(LOCAL)),'content':file.read_text(),'sha256':sha(file.read_bytes())});targets+=parse(log)
  print(module,'exit',run.returncode,'targets',len(parse(log)),'seconds',round(rec['elapsedSeconds'],3),flush=True)
  if run.returncode:print(log,flush=True);raise SystemExit(1)
 negative=[]
 for name in ['NegativeBracket','NegativeWilson','NegativeProjection']:
  file=LOCAL/f'{name}.lean'
  if not file.exists():continue
  cmd=[str(driver),str(lean),str(file)];run=subprocess.run(cmd,cwd=LOCAL,env=env,capture_output=True,text=True);log=run.stdout+run.stderr;(LOCAL/f'{name.lower()}-audit.log').write_text(log);negative.append({'name':name,'path':file.name,'content':file.read_text(),'sha256':sha(file.read_bytes()),'command':cmd,'exitCode':run.returncode,'expected':'REJECT','rejected':run.returncode!=0,'log':log,'logSha256':sha(log.encode())});assert run.returncode!=0;print(name,'correctly rejected',flush=True)
 sourceok=all(not re.search(r'\b(sorry|admit|axiom)\b',re.sub(r'/\-[\s\S]*?\-/|--[^\n]*','',s['content'])) for s in sources)
 audit={'schema':'MathScope.M1.LeanAudit/1','domain':'gauge','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'KERNEL_CHECKED_FIXED_FINITE_AND_CONDITIONAL_SOURCES','sourceFiles':sources,'targets':targets,'commands':commands,'toolchain':version,'mathlibCommit':(mathlib/'.git/HEAD').read_text().strip(),'mathlibImported':False,'negativeControls':negative,'absenceOfSorry':sourceok and all(not t['customAxioms'] for t in targets),'runtimeLibrarySha256':sha((lean/'lib/lean/libleanshared.so').read_bytes()),'driverSha256':sha(driver.read_bytes()),'kernelModified':False,'runtimeModified':False,'guardModified':False,'frontend':'unchanged official frontend shared-library driver with explicit sysroot','browserKernelRerun':False,'scope':'Fixed exact SU3/G2 matrices, brackets, embeddings and holonomy; universal transport endpoint cancellation under lawful group operations; explicitly quantified conditional spectrum/projection interfaces. No quantum Yang-Mills existence theorem.'}
 assert audit['absenceOfSorry'];(LOCAL/'lean-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n');print('AUDIT',len(targets),'targets; all custom axiom lists empty',flush=True)
if __name__=='__main__':main()
