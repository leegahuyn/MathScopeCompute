#!/usr/bin/env python3
"""Rebuild arithmetic theorem sources with the pinned, unchanged Lean kernel.
This script writes only this arithmetic subproject. It never edits runtime guards.
"""
from pathlib import Path
import argparse, datetime, hashlib, importlib.util, json, os, re, subprocess, sys, time
sys.dont_write_bytecode = True

MODULES=['Algebra','Prime','Precision']
NEGATIVES=['NegativeWeight','NegativePrecision','NegativePrime','NegativeFalse']
STANDARD={'propext','Classical.choice','Quot.sound'}
def sha(b): return hashlib.sha256(b).hexdigest()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--workspace',type=Path,default=Path(__file__).resolve().parents[3]);parser.add_argument('--driver',type=Path,default=Path('/tmp/mathscope-lean-embed'));args=parser.parse_args()
    root=args.workspace.resolve();local=root/'mathscope-m1/arithmetic/lean';ev=local.parent/'evidence';build=local/'.lake/build/lib/lean';build.mkdir(parents=True,exist_ok=True);ev.mkdir(parents=True,exist_ok=True)
    lean=root/'lean-4.34.1-linux';mathlib=root/'mathlib-ym-check';packages=sorted((mathlib/'.lake/packages').iterdir());paths=[build,mathlib/'.lake/build/lib/lean']+[p/'.lake/build/lib/lean' for p in packages]
    env=os.environ.copy();env['LEAN_SYSROOT']=str(lean);env['LEAN_PATH']=':'.join(str(p) for p in paths if p.exists())
    spec=importlib.util.spec_from_file_location('m0_lean_audit_helpers',root/'mathscope-m0/lean/reproduce.py');helpers=importlib.util.module_from_spec(spec);spec.loader.exec_module(helpers)
    version=subprocess.run([str(args.driver),str(lean),'--version'],env=env,capture_output=True,text=True,check=True).stdout.strip()
    builds=[];sources=[];targets=[]
    for name in MODULES:
        source=local/f'MathScope/M1/Arithmetic/{name}.lean';out=build/f'MathScope/M1/Arithmetic/{name}.olean';out.parent.mkdir(parents=True,exist_ok=True)
        text=source.read_text();digest=sha(source.read_bytes());relative=str(source.relative_to(local.parent));sources.append({'path':relative,'content':text,'sha256':digest,'role':'CHECKED_THEOREM_SOURCE'})
        command=[str(args.driver),str(lean),'-o',str(out),str(source)];start=time.monotonic();run=subprocess.run(command,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True);log=ev/f'lean-{name.lower()}-audit.log';log.write_text(run.stdout)
        record={'module':f'MathScope.M1.Arithmetic.{name}','sourceFile':relative,'sourceSha256':digest,'command':command,'exitCode':run.returncode,'seconds':round(time.monotonic()-start,6),'logFile':str(log.relative_to(local.parent)),'log':run.stdout,'logSha256':sha(run.stdout.encode()),'warnings':[x for x in run.stdout.splitlines() if 'warning:' in x],'oleanSha256':sha(out.read_bytes()) if out.exists() and run.returncode==0 else None};builds.append(record)
        print(name,'exit',run.returncode,flush=True)
        if run.returncode: print(run.stdout);raise SystemExit('Arithmetic Lean source failed; no PASS audit emitted.')
        if re.search(r'\b(?:sorry|admit|axiom)\b',helpers.strip_comments(text)):raise SystemExit('Forbidden proof placeholder or user axiom in source')
        for t in helpers.parse_targets(run.stdout):
            if t['axioms']['custom'] or t['sorry']:raise SystemExit('Unexpected theorem axiom: '+repr(t))
            targets.append({'name':t['target'],'type':t['targetType'],'axioms':t['axioms']['all'],'standardAxioms':t['axioms']['standard'],'customAxioms':[],'sourceFile':relative,'sourceSha256':digest,'scope':'FINITE_FIXTURE' if any(x in t['target'] for x in ['pi_ten','pi_hundred','controls','fixture','counterexample','zero_differential']) else 'UNIVERSAL_WITH_PRINTED_HYPOTHESES'})
    negative=[]
    for name in NEGATIVES:
        source=local/f'{name}.lean';text=source.read_text();command=[str(args.driver),str(lean),str(source)];start=time.monotonic();run=subprocess.run(command,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True);log=ev/f'lean-{name.lower()}-audit.log';log.write_text(run.stdout)
        sources.append({'path':str(source.relative_to(local.parent)),'content':text,'sha256':sha(source.read_bytes()),'role':'EXPECTED_REJECTION_CONTROL'})
        negative.append({'name':name,'sourceFile':str(source.relative_to(local.parent)),'sourceSha256':sha(source.read_bytes()),'command':command,'exitCode':run.returncode,'expectedRejected':True,'rejected':run.returncode!=0,'seconds':round(time.monotonic()-start,6),'logFile':str(log.relative_to(local.parent)),'log':run.stdout,'logSha256':sha(run.stdout.encode())});print(name,'expected reject',run.returncode,flush=True)
        if run.returncode==0:raise SystemExit('Negative control compiled unexpectedly')
    roots=[local,mathlib,lean/'src/lean']+packages;artifacts=paths+[lean/'lib/lean'];pending=[f'MathScope.M1.Arithmetic.{x}' for x in MODULES];closure={};missing=[]
    while pending:
        module=pending.pop()
        if module in closure:continue
        rel=Path(*module.split('.'));source=next(((r/rel).with_suffix('.lean') for r in roots if (r/rel).with_suffix('.lean').exists()),None);artifact=next(((r/rel).with_suffix('.olean') for r in artifacts if (r/rel).with_suffix('.olean').exists()),None)
        if not source or not artifact:missing.append(module);closure[module]={'module':module,'missing':True};continue
        imports=helpers.imports(source.read_text());compiled=[]
        for ext in ['.olean','.olean.private','.ir']:
            p=artifact.with_suffix(ext)
            if p.exists():compiled.append({'kind':ext,'sha256':sha(p.read_bytes())})
        closure[module]={'module':module,'sourceSha256':sha(source.read_bytes()),'imports':imports,'compiledArtifacts':compiled};pending.extend(imports)
    closure_data={'modules':[closure[k] for k in sorted(closure)],'unresolved':missing};closure_path=ev/'lean-import-closure.json';closure_path.write_text(json.dumps(closure_data,ensure_ascii=False,indent=2)+'\n')
    if missing:raise SystemExit('Unresolved import closure: '+repr(missing))
    environment={'leanVersion':version,'leanCommit':'5045d0056413266e57c625dcd7c365b10e377c52','mathlibCommit':(mathlib/'.git/HEAD').read_text().strip(),'mathlibManifestSha256':sha((mathlib/'lake-manifest.json').read_bytes()),'driverSha256':sha(args.driver.read_bytes()),'driverSourceSha256':sha((root/'lean-embed-check.c').read_bytes()),'runtimeLibrarySha256':sha((lean/'lib/lean/libleanshared.so').read_bytes()),'importClosureFile':str(closure_path.relative_to(local.parent)),'importClosureSha256':sha(closure_path.read_bytes()),'importedModuleCount':len(closure),'kernelModified':False,'runtimeModified':False,'guardModified':False,'frontend':'Official shared-library frontend with explicit installation root','LEAN_PATH':env['LEAN_PATH']}
    data={'schema':'MathScope.ArithmeticLeanAudit/1','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'KERNEL_CHECKED_EXPLICIT_SCOPES','sourceFiles':sources,'targets':targets,'builds':builds,'commands':[b['command'] for b in builds],'environment':environment,'negativeControls':negative,'absenceOfSorry':True,'customAxioms':[],'externalComparisons':[{'source':'S02, Theorem 3.6/Corollary 3.8','status':'THEOREM_REFERENCE','leanImport':None},{'source':'S01, Theorem 1.8(1)','status':'THEOREM_REFERENCE','leanImport':None}],'scope':'Universal commutative-ring Laurent contractions and Frobenius identities, restricted-family closure, finite P1 matrix homotopy, exact prime and p-adic precision theorems. No imported crystalline/prismatic geometry theorem, no native prismatic site, no E-infinity formality.'}
    (ev/'lean-audit.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print('TARGETS',len(targets),'IMPORTS',len(closure),'NEGATIVES',len(negative),flush=True)

if __name__=='__main__':main()
