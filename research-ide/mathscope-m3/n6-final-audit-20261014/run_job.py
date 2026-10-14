"""Recheck the repaired guard auditor without repeating completed PDE work."""
import argparse, contextlib, importlib.util, json, os, platform, resource
import shutil, subprocess, sys, time, traceback
from pathlib import Path
HERE=Path(__file__).resolve().parent;REPO=HERE.parents[2]
def module(name,path):
    sys.path.insert(0,str(path.parent))
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec)
    sys.modules[name]=m;spec.loader.exec_module(m);return m
finish=module('frozen_finish_controller',HERE.parent/'n6-finish-20261014/run_job.py')
read,write,sha=finish.read,finish.write,finish.sha
def implementation():
    rows=finish.implementation()
    for folder in [HERE,HERE.parent/'n6-guard-followup-20261014']:
        for p in sorted(folder.rglob('*')):
            if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc':rows[p.relative_to(REPO).as_posix()]=sha(p)
    p=REPO/'.github/workflows/m3-n6-final-audit.yml';rows[p.relative_to(REPO).as_posix()]=sha(p)
    return rows
def checked(path,digest):
    if sha(path)!=digest:raise ValueError('Immutable source frontier changed: '+str(path))
    return read(path)
def main():
    p=argparse.ArgumentParser();p.add_argument('--prepared',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    out=a.output;out.mkdir(parents=True,exist_ok=True);start=time.monotonic();code=0;lock=read(HERE/'INPUT_LOCK.json')
    resource.setrlimit(resource.RLIMIT_AS,(5*1024**3,5*1024**3));resource.setrlimit(resource.RLIMIT_CPU,(840,860))
    meta={'schema':'MathScope.N6.FinalGuardAuditExecution/1','sourceCommit':os.environ['GITHUB_SHA'],'runId':os.environ['GITHUB_RUN_ID'],
        'executionStatus':'RUNNING','implementation':implementation(),'python':platform.python_version(),'pythonBinarySHA256':sha(sys.executable),
        'node':subprocess.check_output(['node','--version'],text=True).strip(),'nodeBinarySHA256':sha(shutil.which('node')),
        'runnerImageOS':os.environ.get('ImageOS'),'runnerImageVersion':os.environ.get('ImageVersion'),
        'fullHostedImageCryptographicDigestAvailable':False,'paidLargerRunner':False,
        'resourceScope':'per-process inherited5GiB address-space/840CPU seconds,job18min; source index360s and audit300s separate elapsed budgets',
        'sourceBodyDerivativesRecomputed':False,'completedPDEAlgebraRepeated':False,'original56Of64Changed':False,'publicDeploymentPerformed':False}
    write(out/'started.json',meta)
    with (out/'stdout.log').open('w',encoding='utf8') as log,(out/'stderr.log').open('w',encoding='utf8') as err:
      with contextlib.redirect_stdout(log),contextlib.redirect_stderr(err):
       try:
        if subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()!=meta['sourceCommit'] or subprocess.check_output(['git','status','--porcelain'],cwd=REPO,text=True).strip():raise ValueError('Exact clean workflow source required')
        protected=finish.cloud.old_runner().verify_pins();c=finish.context(a.prepared)
        if c['checkpointSHA256']!=lock['sourceCheckpointSHA256']:raise ValueError('Different authenticated source checkpoint')
        checked(REPO/lock['sourceMatrixPath'],lock['sourceMatrixSHA256'])
        prior=checked(REPO/lock['algebraSummaryPath'],lock['algebraSummarySHA256'])
        checked(REPO/lock['algebraMatrixPath'],lock['algebraMatrixSHA256'])
        if prior['sourceCommit']!=lock['algebraCodeCommit'] or prior['verifiedConditionalComponents']!=[0,1,2] or prior['originalTermsRechecked']!=1020:raise ValueError('Completed PDE proof frontier changed')
        folder=HERE.parent/'n6-guard-followup-20261014'
        test=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s',str(folder),'-p','test_*.py','-v'],stdout=log,stderr=err,timeout=120)
        if test.returncode:raise ValueError('Repaired native-domain/derivative-scale negative controls failed')
        meta['allGuardProofControlsPassed']=True
        c['finish_matrix_path']=str(REPO/lock['sourceMatrixPath'])
        module('final_exact_guard_auditor',folder/'guard_followup.py').run(c,out)
        if protected!=finish.cloud.old_runner().verify_pins() or meta['implementation']!=implementation():raise ValueError('Proof/source changed during audit')
        meta.update(executionStatus='SUCCESS',protectedSourcesUnchanged=True,checkpointSHA256=c['checkpointSHA256'])
       except Exception as error:
        meta.update(executionStatus='IMPLEMENTATION_OR_RESOURCE_FAILURE',failure={'type':type(error).__name__,'message':str(error)})
        traceback.print_exc();code=1
    meta.update(elapsedSeconds=time.monotonic()-start,maxPythonRSSKiB=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    finish.cloud.receipt(out,meta)
    print(json.dumps({k:v for k,v in meta.items() if k!='implementation'}))
    if (out/'guard-followup-result.json').exists():
        r=read(out/'guard-followup-result.json');print(json.dumps({k:r[k] for k in ['newGloballyClosedGuards','remainingGlobalGuards','negativeControls']}))
    if code:print((out/'stderr.log').read_text(encoding='utf8')[-6000:])
    return code
if __name__=='__main__':sys.exit(main())
