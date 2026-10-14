"""Reverify immutable cloud circuits without rerunning source-body derivatives."""
from __future__ import annotations
import argparse,contextlib,hashlib,importlib.util,json,os,platform,resource,shutil,subprocess,sys,time,traceback
from pathlib import Path
HERE=Path(__file__).resolve().parent;REPO=HERE.parents[2];FINISH=HERE.parent/'n6-finish-20261014'
sys.path.insert(1,str(FINISH))
def module(name,path):
    s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);sys.modules[name]=m;s.loader.exec_module(m);return m
finish=module('immutable_finish_controller',FINISH/'run_job.py')
read,write,sha=finish.read,finish.write,finish.sha
def implementation():
    rows=finish.implementation()
    for folder in [HERE,HERE.parent/'n6-clock-bridge-20261014',HERE.parent/'n6-guard-followup-20261014']:
        for p in folder.rglob('*'):
            if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc':rows[p.relative_to(REPO).as_posix()]=sha(p)
    p=REPO/'.github/workflows/m3-n6-algebra.yml';rows[p.relative_to(REPO).as_posix()]=sha(p)
    return rows
def main():
    a=argparse.ArgumentParser();a.add_argument('--component',type=int,required=True,choices=[0,1,2]);a.add_argument('--prior',type=Path,required=True)
    a.add_argument('--prepared',type=Path,required=True);a.add_argument('--output',type=Path,required=True);a.add_argument('--guard-audit',type=Path);x=a.parse_args()
    out=x.output;out.mkdir(parents=True,exist_ok=True);start=time.monotonic();lock=read(HERE/'INPUT_LOCK.json');code=0
    resource.setrlimit(resource.RLIMIT_AS,(5*1024**3,5*1024**3));resource.setrlimit(resource.RLIMIT_CPU,(840,860))
    meta={'sourceCommit':os.environ['GITHUB_SHA'],'runId':os.environ['GITHUB_RUN_ID'],'executionStatus':'RUNNING','component':x.component,
        'implementation':implementation(),'sourceRun':lock['sourceRun'],'sourceCodeCommit':lock['sourceCodeCommit'],
        'python':platform.python_version(),'pythonBinarySHA256':sha(sys.executable),'node':subprocess.check_output(['node','--version'],text=True).strip(),
        'nodeBinarySHA256':sha(shutil.which('node')),'runnerImageOS':os.environ.get('ImageOS'),'runnerImageVersion':os.environ.get('ImageVersion'),
        'fullHostedImageCryptographicDigestAvailable':False,'paidLargerRunner':False,
        'resourceScope':'per-process5GiB address-space/840CPU seconds,Node2GiB heap/840s wall timeout,job18min',
        'sourceBodyDerivativeRecomputed':False,'original56Of64Changed':False,'publicDeploymentPerformed':False}
    write(out/'started.json',meta)
    with (out/'stdout.log').open('w',encoding='utf8') as log,(out/'stderr.log').open('w',encoding='utf8') as err:
      with contextlib.redirect_stdout(log),contextlib.redirect_stderr(err):
       try:
        if subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()!=meta['sourceCommit'] or subprocess.check_output(['git','status','--porcelain'],cwd=REPO,text=True).strip():raise ValueError('Exact clean source commit required')
        protected=finish.cloud.old_runner().verify_pins()
        c=finish.context(x.prepared)
        if c['checkpointSHA256']!=lock['sourceCheckpointSHA256']:raise ValueError('Original prepared checkpoint changed')
        prior=read(x.prior/'execution.json')
        receipt=finish.cloud.old_runner().verify_receipt(x.prior,lock['sourceCodeCommit'],require_success=False)
        if prior['sourceCommit']!=lock['sourceCodeCommit'] or prior['runId']!=lock['sourceRun'] or prior['kind']!='pde' or prior['shard']!=x.component or prior['implementation']!=finish.implementation():raise ValueError('Different source-body computation or implementation')
        meta['priorReceipt']=receipt;meta['priorExecutionStatus']=prior['executionStatus']
        source_matrix=REPO/lock['sourceMatrixPath']
        if sha(source_matrix)!=lock['sourceMatrixSHA256']:raise ValueError('Latest accepted jet/guard frontier changed')
        if x.component==0 and x.guard_audit and (x.guard_audit/'receipt.json').is_file():
            gr=finish.cloud.old_runner().verify_receipt(x.guard_audit,lock['sourceCodeCommit'])
            ge=read(x.guard_audit/'execution.json')
            if ge['runId']!=lock['sourceRun'] or ge['kind']!='guard' or ge['implementation']!=finish.implementation():raise ValueError('Different original guard audit')
            gp=x.guard_audit/'actual-all-indexed-row-domain-audit.json';audit=read(gp)
            write(out/'original-guard-row-obstructions.json',{'sourceRun':lock['sourceRun'],'sourceAuditSHA256':sha(gp),
                'sourceReceipt':gr,'summary':{k:v for k,v in audit.items() if k!='rows'},
                'failedRows':[r for r in audit['rows'] if not r.get('verified')],
                'globalImageOrSourceExistencePromoted':False})
        if x.component==0:
            c['finish_matrix_path']=str(source_matrix)
            extra=HERE.parent/'n6-guard-followup-20261014/guard_followup.py'
            if extra.is_file():module('remaining_guard_followup',extra).run(c,out)
            clock=HERE.parent/'n6-clock-bridge-20261014/source_clock_bridge.py'
            if clock.is_file():module('intrinsic_clock_bridge',clock).run(c,out)
        path=x.prior/f'pde-solve-component-{x.component}-circuit.json';evidence=read(path)
        pde=module('immutable_pde_source_calculus',FINISH/'pde_solve.py');verify=module('immutable_pde_source_verifier',FINISH/'pde_solve_verify.py')
        original,terms,source,definitions,pins=pde.load_inputs(c,x.component)
        if evidence['originalRoots']!={'direct':[3825257,3825259,3825261][x.component],'assembled':[3825348,3825349,3825350][x.component]}:raise ValueError('Different exact original PDE roots')
        for key in ['priorComponentSHA256','sourceCheckpointSHA256','originalSourceNodesSHA256','sourcePrototypeSHA256']:
            if evidence['sourceBindings'][key]!=pins[key]:raise ValueError('Original circuit binding changed: '+key)
        for atom in evidence['atomAttempts']:
            if source.get(atom['sourceNode'])!=atom['actualNode']:raise ValueError('Actual original residual atom changed')
        coverage=verify.verify_original_coverage(terms,evidence);controls=verify.negative_source_controls(terms,evidence)
        write(out/'original-source-coverage.json',{'coverage':coverage,'negativeSourceControls':controls,'sourceCircuitSHA256':sha(path),'sourceBindings':pins})
        oldlog=x.prior/f'pde-solve-component-{x.component}-algebra.log'
        if oldlog.exists():(out/'prior-algebra-stderr-tail.log').write_text(oldlog.read_text(encoding='utf8')[-12000:],encoding='utf8')
        if x.component==0:
            for folder in [HERE,HERE.parent/'n6-clock-bridge-20261014',HERE.parent/'n6-guard-followup-20261014']:
                if folder.is_dir():
                    test=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s',str(folder),'-p','test_*.py','-v'],stdout=log,stderr=err,timeout=120)
                    if test.returncode:raise ValueError('Supplemental exact proof/denominator controls failed: '+folder.name)
            meta['supplementalProofControlsPassed']=True
        result_path=out/'exact-algebra.json'
        cmd=['node','--disable-wasm-trap-handler','--max-old-space-size=2048',str(HERE/'reverify.mjs'),'--input',str(path),'--output',str(result_path),'--repo',str(REPO)]
        try:
            proc=subprocess.run(cmd,capture_output=True,text=True,encoding='utf8',timeout=840)
            (out/'algebra-stdout.log').write_text(proc.stdout,encoding='utf8');(out/'algebra-stderr.log').write_text(proc.stderr,encoding='utf8');returncode=proc.returncode
        except subprocess.TimeoutExpired as error:
            returncode=None;(out/'algebra-stderr.log').write_text('840s timeout; partial exact stage retained\n'+str(error),encoding='utf8')
        algebra=read(result_path) if result_path.exists() else {'verified':False,'verificationPhase':'NO_COMPLETE_OUTPUT'}
        certified=returncode==0 and algebra.get('verified') is True
        result={'schema':'MathScope.N6.TargetedPDEAlgebra/1','component':x.component,'originalInputTerms':len(terms),
            'sourceRun':lock['sourceRun'],'sourceCircuitSHA256':sha(path),'sourceBodyDerivativeRecomputed':False,
            'sourceCoverage':coverage,'negativeSourceControls':controls,'nodeExitCode':returncode,
            'verificationPhase':algebra.get('verificationPhase'),'exactConditionalAlgebraVerified':certified,
            'verifiedConditionalNumeratorTerms':algebra.get('normalizedNumeratorTerms') if certified else None,
            'candidateNumeratorTerms':algebra.get('normalizedNumeratorTerms'),'remainingStop':algebra.get('stop'),
            'conditionalFunctionalResidualZero':algebra.get('conditionalFunctionalResidualZero') if certified else None,
            'strictOriginalTermZeros':sum(bool(r['originalTermZeroOnLeafDefinedDomain']) for r in evidence['allOriginalTerms']),
            'originalAnalyticEqualityProved':False,'analyticallyDischargedOriginalPDETerms':0,
            'allInactiveOperandAndDenominatorDefinednessPremisesRetained':True,'originalParentSHA256':lock['originalParentSHA256']}
        write(out/'result.json',result)
        if source.db is not None:source.db.close()
        if protected!=finish.cloud.old_runner().verify_pins() or meta['implementation']!=implementation():raise ValueError('Source implementation changed during verification')
        meta['executionStatus']='SUCCESS' if certified else 'EXACT_ALGEBRA_STOP';code=0 if certified else 1
       except Exception as error:
        meta['executionStatus']='IMPLEMENTATION_OR_RESOURCE_FAILURE';meta['failure']={'type':type(error).__name__,'message':str(error)};traceback.print_exc();code=1
    meta.update(elapsedSeconds=time.monotonic()-start,maxPythonRSSKiB=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    finish.cloud.receipt(out,meta)
    if (out/'result.json').exists():print(json.dumps(read(out/'result.json'),ensure_ascii=False))
    for name,keys in [('guard-followup-result.json',['attemptedGuards','newGloballyClosedGuards','remainingGlobalGuards']),
        ('native-pressure-amplitude-clock-bridge.json',['nativePressureEqualsLeanNewPressureProved','nativeGEqualsLeanRealAmplitudeProved','nativeB_rhoNormBoundProved','preciseSourceBindingStop'])]:
        if (out/name).is_file():print(json.dumps({'supplementalCertificate':name,**{k:v for k,v in read(out/name).items() if k in keys}},ensure_ascii=False))
    print(json.dumps(meta.get('failure',{'status':meta['executionStatus'],'elapsedSeconds':meta['elapsedSeconds']})))
    if code:print('\n'.join((out/'stderr.log').read_text(encoding='utf8').splitlines()[-30:]));print((out/'algebra-stderr.log').read_text(encoding='utf8')[-6000:] if (out/'algebra-stderr.log').exists() else '')
    return code
if __name__=='__main__':sys.exit(main())
