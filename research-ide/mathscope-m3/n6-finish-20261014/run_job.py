"""Execute only the remaining original obligations on standard hosted runners."""
from __future__ import annotations
import argparse, contextlib, hashlib, importlib.util, json, os, platform, resource
import shutil, signal, subprocess, sys, time, traceback
from pathlib import Path
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
CLOUD=HERE.parent/'n6-cloud-20261014'
sys.path.insert(1,str(CLOUD))
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec)
    sys.modules[name]=m;spec.loader.exec_module(m);return m
cloud=module('prior_cloud_controller',CLOUD/'run_job.py')
read,write,sha=cloud.read,cloud.write,cloud.sha
def implementation():
    rows={p.relative_to(REPO).as_posix():sha(p) for p in sorted(HERE.rglob('*'))
          if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc'}
    rows.update(cloud.implementation())
    path=REPO/'.github/workflows/m3-n6-finish.yml';rows[path.relative_to(REPO).as_posix()]=sha(path)
    return rows
def prepare(out):
    cloud.prepare(out)
    root=out/'prepared';lock=read(HERE/'INPUT_LOCK.json')
    path=REPO/lock['currentMatrixPath']
    if sha(path)!=lock['currentMatrixSHA256']:raise ValueError('Changed latest verified frontier matrix')
    current=read(path)
    if current['cloudExecution']['sourceCommit']!=lock['currentCodeCommit'] or current['cloudExecution'].get('strictInputValidation')!='PASSED':
        raise ValueError('Previous frontier did not pass strict original-source validation')
    if current['parentNodesSHA256']!=cloud.PARENT:raise ValueError('Different original parent')
    shutil.copyfile(path,root/'current_matrix.json')
    c=read(root/'context.json');c['remainingSourceLock']=lock
    write(root/'context.json',c)
    members=[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
             for p in sorted(root.rglob('*')) if p.is_file() and p.name!='checkpoint-manifest.json']
    write(root/'checkpoint-manifest.json',{'members':members,'parentNodesSHA256':cloud.PARENT,
          'implementation':cloud.implementation(),'finishImplementation':implementation()})
    write(out/'prepare-summary.json',{'status':'VERIFIED_PRIOR_INPUTS_AND_REMAINING_FRONTIER',
          'currentSource':lock,'currentCounts':current['cloudExecution'],
          'checkpointSHA256':sha(root/'checkpoint-manifest.json'),'wholeParentRecomputed':False})
def context(root):
    c=cloud.context(root)
    if read(Path(root)/'checkpoint-manifest.json')['finishImplementation']!=implementation():
        raise ValueError('Worker implementation differs from prepared implementation')
    c['current_matrix_path']=str(Path(root)/'current_matrix.json')
    if sha(c['current_matrix_path'])!=c['remainingSourceLock']['currentMatrixSHA256']:
        raise ValueError('Remaining-frontier checkpoint changed')
    return c
def main():
    p=argparse.ArgumentParser();p.add_argument('--kind',choices=['prepare','jet','pde','guard','controls','acceptance'],required=True)
    p.add_argument('--output',type=Path,required=True);p.add_argument('--prepared',type=Path)
    p.add_argument('--results',type=Path);p.add_argument('--shard',type=int,default=0);a=p.parse_args()
    a.output.mkdir(parents=True,exist_ok=True);start=time.monotonic();code=0;status='SUCCESS'
    resource.setrlimit(resource.RLIMIT_AS,(5*1024**3,5*1024**3));resource.setrlimit(resource.RLIMIT_CPU,(840,860))
    def cpu_limit(_sig,_frame):raise TimeoutError('Hosted worker CPU budget840s exhausted; partial outputs retained')
    signal.signal(signal.SIGXCPU,cpu_limit)
    meta={'schema':'MathScope.N6Remaining.Execution/1','sourceCommit':os.environ['GITHUB_SHA'],
          'runId':os.environ['GITHUB_RUN_ID'],'runAttempt':os.environ.get('GITHUB_RUN_ATTEMPT'),
          'kind':a.kind,'shard':a.shard,'implementation':implementation(),
          'python':platform.python_version(),'pythonBinarySHA256':sha(sys.executable),
          'node':subprocess.check_output(['node','--version'],text=True).strip(),'nodeBinarySHA256':sha(shutil.which('node')),
          'runnerImageOS':os.environ.get('ImageOS'),'runnerImageVersion':os.environ.get('ImageVersion'),
          'fullHostedImageCryptographicDigestAvailable':False,
          'memoryLimitBytes':5*1024**3,'cpuLimitSeconds':840,'paidLargerRunner':False,
          'original56Of64Changed':False,'publicDeploymentPerformed':False}
    write(a.output/'started.json',meta)
    with (a.output/'stdout.log').open('w',encoding='utf8') as log,(a.output/'stderr.log').open('w',encoding='utf8') as err:
        with contextlib.redirect_stdout(log),contextlib.redirect_stderr(err):
            try:
                head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()
                dirty=subprocess.check_output(['git','status','--porcelain'],cwd=REPO,text=True).strip()
                if head!=meta['sourceCommit'] or dirty:raise ValueError('Worker needs exact clean workflow commit')
                before=cloud.old_runner().verify_pins()
                if a.kind=='prepare':prepare(a.output)
                else:
                    c=context(a.prepared);meta['checkpointSHA256']=c['checkpointSHA256']
                    if a.kind=='jet':module('jet_solve',HERE/'jet_solve.py').run(c,a.output,shard=a.shard,shards=4)
                    elif a.kind=='pde':module('pde_solve',HERE/'pde_solve.py').run(c,a.output,component=a.shard)
                    elif a.kind=='guard':module('guard_solve',HERE/'guard_solve.py').run(c,a.output)
                    elif a.kind=='controls':
                        test=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s',str(HERE),'-p','test_*.py','-v'],stdout=log,stderr=err,timeout=600)
                        if test.returncode:raise ValueError('Remaining-obligation proof controls failed')
                        write(a.output/'controls-result.json',{'status':'SUCCESS'})
                    elif a.kind=='acceptance':module('finish_aggregate',HERE/'aggregate.py').run(c,a.results,a.output)
                if before!=cloud.old_runner().verify_pins():raise ValueError('Original protected source changed')
                if meta['implementation']!=implementation():raise ValueError('Proof implementation changed during calculation')
                meta['protectedSourcesUnchanged']=True
            except Exception as error:
                code=1;status='RESOURCE_LIMIT' if isinstance(error,(MemoryError,TimeoutError,subprocess.TimeoutExpired)) else 'IMPLEMENTATION_FAILURE'
                meta['failure']={'type':type(error).__name__,'message':str(error)};traceback.print_exc()
    meta.update(executionStatus=status,elapsedSeconds=time.monotonic()-start,
          maxRSSKiB=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    cloud.receipt(a.output,meta)
    if code:print('\n'.join((a.output/'stderr.log').read_text(encoding='utf8').splitlines()[-80:]))
    if (a.output/'verification-summary.json').is_file():print(json.dumps(read(a.output/'verification-summary.json'),ensure_ascii=False))
    print(json.dumps({'kind':a.kind,'shard':a.shard,'status':status,'elapsedSeconds':meta['elapsedSeconds'],'failure':meta.get('failure')}))
    return code
if __name__=='__main__':sys.exit(main())
