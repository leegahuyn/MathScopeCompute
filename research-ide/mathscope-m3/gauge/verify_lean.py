#!/usr/bin/env python3
"""Fresh small Y7 kernel audits. Does not alter any M1/M2 source or old receipt."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,re,shutil,subprocess,time

HERE=Path(__file__).resolve().parent
IDE=HERE.parents[1]
STANDARD={'propext','Classical.choice','Quot.sound'}
def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def save(p,j): Path(p).write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
def targets(log):
    return [{'name':m[1],'axioms':[] if m[3] is None else [a.strip() for a in m[3].split(',')],
             'customAxioms':[] if m[3] is None else [a.strip() for a in m[3].split(',') if a.strip() not in STANDARD]}
            for m in re.finditer(r"'([^']+)' (does not depend on any axioms|depends on axioms:\s*\[([^]]*)\])",log)]
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--toolchain',type=Path,required=True);parser.add_argument('--driver',type=Path);parser.add_argument('--legacy-input',type=Path);args=parser.parse_args()
    build=HERE/'lean'/'build';build.mkdir(parents=True,exist_ok=True)
    evidence=HERE/'evidence'/'lean';evidence.mkdir(parents=True,exist_ok=True)
    legacy=HERE/'legacy';legacy.mkdir(exist_ok=True)
    if args.legacy_input:
        blob=json.loads(args.legacy_input.read_text())
        for name,key in [('MathScopeConditionalYM_Core.lean','coreSource'),('MathScopeConditionalYM.lean','mathlibSource'),('MathScopeSelectedScenario.lean','scenarioSource')]:
            (legacy/name).write_text(blob[key])
        save(legacy/'original-validation.json',blob['validation'])
    env=os.environ.copy();env['LEAN_PATH']=str(build);env['LEAN_SYSROOT']=str(args.toolchain)
    command=[str(args.driver),str(args.toolchain)] if args.driver else [str(args.toolchain/'bin'/'lean')]
    version=subprocess.run(command+['--version'],capture_output=True,text=True,env=env,check=True).stdout.strip()
    runs=[]
    def run(source,name,module=None,negative=False):
        dest=build/((module or name).replace('.','/')+'.olean');dest.parent.mkdir(parents=True,exist_ok=True)
        cmd=command+([] if negative else ['-o',str(dest)])+[str(source)]
        started=time.monotonic();proc=subprocess.run(cmd,cwd=source.parents[3] if module and module.startswith('MathScope.M1.') else source.parent,env=env,capture_output=True,text=True,timeout=60)
        log=proc.stdout+proc.stderr;logfile=evidence/(name+'.log');logfile.write_text(log)
        actual={'id':name,'sourcePath':str(source.relative_to(IDE)),'sourceSha256':digest(source),'command':cmd,'exitCode':proc.returncode,'elapsedSeconds':time.monotonic()-started,'logPath':str(logfile.relative_to(IDE)),'logSha256':digest(logfile),'expected':'REJECT' if negative else 'PASS','expectedOutcomeObserved':proc.returncode!=0 if negative else proc.returncode==0,'targets':targets(log)}
        if not negative and proc.returncode==0: actual['oleanSha256']=digest(dest)
        runs.append(actual);print(name,proc.returncode,flush=True)
        if not actual['expectedOutcomeObserved']: print(log);raise RuntimeError('Unexpected kernel result: '+name)
        return actual
    run(HERE/'lean'/'FiniteSpectral.lean','finite-spectral','FiniteSpectral')
    m1=IDE/'mathscope-m1'/'gauge'/'lean'
    for module in ['Defs','Fixtures','SU3','G2','Transport','Conditional']:
        run(m1/'MathScope'/'M1'/'Gauge'/(module+'.lean'),'m1-'+module.lower(),'MathScope.M1.Gauge.'+module)
    if (legacy/'MathScopeConditionalYM_Core.lean').exists():
        run(legacy/'MathScopeConditionalYM_Core.lean','legacy-core','MathScopeConditionalYM_Core')
    for name in ['NegativeVacuum','NegativeRatio','NegativeTime','NegativeAssumptionRemoval','NegativeWeight','NegativeEmbeddingIndex','NegativeJacobi']:
        run(HERE/'lean'/(name+'.lean'),name,negative=True)
    for name in ['NegativeBracket','NegativeWilson','NegativeProjection']:
        run(m1/(name+'.lean'),'m1-'+name,negative=True)
    inherited=[]
    if (legacy/'original-validation.json').exists():
        previous=json.loads((legacy/'original-validation.json').read_text())
        for key,name in [('core','MathScopeConditionalYM_Core.lean'),('mathlib','MathScopeConditionalYM.lean'),('defaultScenario','MathScopeSelectedScenario.lean')]:
            old=previous.get(key) or previous.get('scenario' if key=='defaultScenario' else key)
            if not old: continue
            file=legacy/name;matched=digest(file)==old.get('sourceSha256')
            inherited.append({'kind':key,'sourcePath':str(file.relative_to(IDE)),'sourceSha256':digest(file),'recordedSha256':old.get('sourceSha256'),'sourceMatchesPriorKernelAudit':matched,'status':'INHERITED_SOURCE_BOUND_KERNEL_RESULT' if matched else 'UNVERIFIED_SOURCE_MISMATCH','newKernelRun':key=='core','legacyStatus':old.get('status'),'legacyCheckedAt':previous.get('checkedAt'),'axiomAudit':old.get('customAxioms'), 'toolchain':old.get('toolchain')})
    verified=[r for r in runs if r['expected']=='PASS'];finite=[t for r in verified if r['id']!='legacy-core' for t in r['targets']]
    report={'schema':'MathScope.M3.GaugeLeanAudit/1','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'FRESH_KERNEL_FINITE_AND_EXPLICIT_CONDITIONAL_PASS','toolchain':version,'runtimeLibrarySha256':digest(args.toolchain/'lib'/'lean'/'libleanshared.so'),'driverSha256':digest(args.driver) if args.driver else digest(args.toolchain/'bin'/'lean'),'kernelModified':False,'runtimeModified':False,'guardModified':False,'commands':runs,'inheritedLegacySources':inherited,'noSorry':all(not re.search(r'\b(sorry|admit)\b',re.sub(r'/\-[\s\S]*?\-/|--[^\n]*','', (IDE/r['sourcePath']).read_text())) for r in runs),'newFiniteCustomAxiomCount':sum(len(t['customAxioms']) for t in finite),'scope':{'newFiniteSpectral':'Nonnegative integer weights and exact rational geometric transfer factors, all natural time steps; full displayed finite vacuum eigenspace. No Real.exp/log bridge was kernel-checked.','algebra':'Freshly recompiled exact protected M1 SU3/G2 fixtures and universal group path cancellation.','legacyCore':'Exact previous abstract energy-order source recompiled; its ten generic lemmas and custom-axiom corollary are separated.','mathlib':'Previous exact-source audit is inherited if hashes match; no new mathlib execution in this invocation.','continuum':'OPEN_CONTINUUM'}}
    assert report['noSorry'] and report['newFiniteCustomAxiomCount']==0
    save(HERE/'evidence'/'lean-audit.json',report)
    print('AUDIT',len(runs),'runs,',len(finite),'finite targets',flush=True)
if __name__=='__main__': main()
