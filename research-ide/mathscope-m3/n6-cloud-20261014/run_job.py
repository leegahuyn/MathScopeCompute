"""Cloud-only bounded computation, complete receipts, and same-run aggregation."""
from __future__ import annotations
import argparse, contextlib, hashlib, importlib.util, json, os, platform, resource
import shutil, subprocess, sys, time, traceback, zipfile
from pathlib import Path, PurePosixPath

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
BASE='c143b5d8093b724d2509f8fc0ab5746c531d9e0c'
PARENT='7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
PRIOR_CODE='297e0ca51780e12670b18e1faf3b13d5d4e6fdb1'
PRIOR=REPO/'research-ide/mathscope-m3/evidence/n6-unconditional-20261014/cloud-38508339662'
PINS={'cartesian':'ee456eb85f63bb1e85fb0395ac143f2d7bfb21f14617feba0e0c5fb44b8a66d2',
      'analytic':'63b93d62b33b542afbfb6089669f7eddf9c6355987024ab121fd3161e593de97',
      'rayleigh':'9470f2e76e2d78285f2ba250de83fcbdd3de6ad83668eaa8b050ba0bdac6a257'}

def read(p):return json.loads(Path(p).read_text(encoding='utf8'))
def write(p,v):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def sha(p):
    h=hashlib.sha256()
    with Path(p).open('rb') as f:
        for b in iter(lambda:f.read(1<<20),b''):h.update(b)
    return h.hexdigest()
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec)
    sys.modules[name]=m;spec.loader.exec_module(m);return m
def implementation():
    files={p.relative_to(REPO).as_posix():sha(p) for p in sorted(HERE.rglob('*'))
            if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc'}
    workflow=REPO/'.github/workflows/m3-n6-cloud.yml'
    files[workflow.relative_to(REPO).as_posix()]=sha(workflow)
    return files
def receipt(folder,metadata):
    write(folder/'execution.json',metadata)
    members=[{'path':p.relative_to(folder).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
             for p in sorted(folder.rglob('*')) if p.is_file() and p!=folder/'receipt.json']
    write(folder/'receipt.json',{'sourceCommit':metadata['sourceCommit'],
          'executionStatus':metadata['executionStatus'],'members':members})
def old_runner():return module('n6_prior_runner',HERE.parent/'n6-unconditional-20261014/run_job.py')
def extract_prior(kind,destination):
    archive=PRIOR/f'n6-independent-{kind}-38508339662.zip'
    if sha(archive)!=PINS[kind]:raise ValueError('Prior archive digest mismatch')
    with zipfile.ZipFile(archive) as z:
        names=z.namelist()
        if len(names)!=len(set(names)) or sum(i.file_size for i in z.infolist())>512*1024**2:
            raise ValueError('Unsafe archive size or duplicate member')
        for n in names:
            p=PurePosixPath(n)
            if p.is_absolute() or '..' in p.parts or '\\' in n or ':' in n:raise ValueError('Unsafe member')
        for i in z.infolist():
            if not i.is_dir():
                p=destination/i.filename;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(i))
    return old_runner().verify_receipt(destination,PRIOR_CODE)
def prepare(out,resume=None):
    old=old_runner();protected=old.verify_pins()
    if resume and resume.exists():
        previous=list(resume.glob('n6-cloud-prepare-*/prepared'))
        if len(previous)==1:
            prior=context(previous[0]);manifest=read(previous[0]/'checkpoint-manifest.json')
            if manifest['implementation']==implementation() and prior['protectedSources']==protected:
                shutil.copytree(previous[0],out/'prepared')
                write(out/'prepare-summary.json',{'status':'VERIFIED_CHECKPOINT_RESUMED','checkpointSHA256':prior['checkpointSHA256'],
                     'sourceRun':previous[0].parent.name,'wholeParentRecomputed':False})
                return
    inherited=module('n6_inherited_runner',HERE.parent/'n6-continuation-20261014/run_job.py')
    root=out/'prepared';root.mkdir(parents=True,exist_ok=True)
    archives=inherited.verify_archives(root/'inputs',kinds=['inputs','residual'])
    priors={k:extract_prior(k,root/k) for k in PINS}
    matrix=REPO/'research-ide/mathscope-m3/evidence/n6-unconditional-20261014/OBLIGATION_MATRIX_SCOPED.json'
    if sha(matrix)!='2f8541f5050a97dbafd3495b695c042f5e4bf4c8106a0d3c5b09af3bd733448a':
        raise ValueError('Original scoped matrix bytes changed')
    data=read(matrix)
    if data['parentNodesSHA256']!=PARENT or len(data['originalIndependentCartesianRequests'])!=393 or len(data['originalIndependentCartesianDomainGuards'])!=94:
        raise ValueError('Wrong original matrix')
    result=read(root/'cartesian/cartesian-closure-result.json')
    if result['remainingUnresolvedCartesianJets']!=365 or result['totalReducedNumeratorTerms']!=1020:
        raise ValueError('Wrong prior frontier')
    shutil.copyfile(matrix,root/'matrix.json')
    context={'schema':'MathScope.N6Cloud.Prepared/1','baseCommit':BASE,'parentNodesSHA256':PARENT,
             'matrixSHA256':sha(matrix),'priorArchiveSHA256':PINS,'priorReceipts':priors,
             'protectedSources':protected,'inheritedArchives':archives,
             'wholeParentRecomputed':False,'originalJets':393,'previouslyClosedJets':28,
             'targetJets':365,'targetResidualTerms':[169,197,654],'targetGuards':94}
    write(root/'context.json',context)
    members=[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
             for p in sorted(root.rglob('*')) if p.is_file()]
    write(root/'checkpoint-manifest.json',{'schema':'MathScope.N6Cloud.Checkpoint/1','members':members,
           'parentNodesSHA256':PARENT,'implementation':implementation()})
    write(out/'prepare-summary.json',{**context,'checkpointSHA256':sha(root/'checkpoint-manifest.json'),
          'preparedFiles':len(members),'preparedBytes':sum(p['bytes'] for p in members)})
def context(prepared):
    root=Path(prepared)
    m=read(root/'checkpoint-manifest.json')
    actual={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
    if actual!={r['path'] for r in m['members']}|{'checkpoint-manifest.json'}:raise ValueError('Checkpoint members missing or added')
    for r in m['members']:
        p=root/r['path']
        if p.is_symlink() or p.stat().st_size!=r['bytes'] or sha(p)!=r['sha256']:raise ValueError('Checkpoint changed '+r['path'])
    c=read(root/'context.json')
    if c['parentNodesSHA256']!=PARENT:raise ValueError('Checkpoint wrong original source')
    if sha(root/'matrix.json')!=c['matrixSHA256']:raise ValueError('Changed matrix')
    c.update(repo=str(REPO),inputs=str(root/'inputs'),baseline=str(root/'cartesian'),
             analytic=str(root/'analytic'),rayleigh=str(root/'rayleigh'),matrix_path=str(root/'matrix.json'),
             checkpointSHA256=sha(root/'checkpoint-manifest.json'))
    return c
def resume_worker(previous,kind,shard,c,out,meta):
    if previous is None or not previous.exists():return False
    folders=list(previous.glob(f'n6-cloud-{kind}-{shard}-*'))
    if len(folders)!=1:return False
    folder=folders[0]
    if not (folder/'execution.json').exists() or not (folder/'receipt.json').exists():return False
    e=read(folder/'execution.json')
    old_runner().verify_receipt(folder,e['sourceCommit'])
    if e['implementation']!=implementation() or e.get('checkpointSHA256')!=c['checkpointSHA256']:
        return False
    for path in folder.iterdir():
        if path.name in {'receipt.json','execution.json','started.json','stdout.log','stderr.log'}:continue
        target=out/path.name
        if path.is_dir():shutil.copytree(path,target)
        else:shutil.copyfile(path,target)
    shutil.copyfile(folder/'receipt.json',out/'resume-source-receipt.json')
    meta['resumedFrom']={'artifact':folder.name,'sourceCommit':e['sourceCommit'],'receiptSHA256':sha(folder/'receipt.json')}
    return True
def main():
    p=argparse.ArgumentParser();p.add_argument('--kind',required=True,choices=['prepare','jet','residual','guard','bounds','controls','acceptance'])
    p.add_argument('--output',required=True,type=Path);p.add_argument('--prepared',type=Path)
    p.add_argument('--results',type=Path);p.add_argument('--shard',type=int,default=0)
    p.add_argument('--resume',type=Path);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
    start=time.monotonic();status='SUCCESS';code=0
    # Hard job budget; children inherit both caps. Timed out work remains in artifacts.
    resource.setrlimit(resource.RLIMIT_AS,(5*1024**3,5*1024**3))
    resource.setrlimit(resource.RLIMIT_CPU,(840,860))
    meta={'schema':'MathScope.N6Cloud.Execution/1','sourceCommit':os.environ['GITHUB_SHA'],
          'kind':a.kind,'shard':a.shard,'runId':os.environ['GITHUB_RUN_ID'],
          'runAttempt':os.environ.get('GITHUB_RUN_ATTEMPT'),'implementation':implementation(),
          'pythonVersion':platform.python_version(),'nodeVersion':subprocess.check_output(['node','--version'],text=True).strip(),
          'pythonBinarySHA256':sha(Path(sys.executable).resolve()),'nodeBinarySHA256':sha(shutil.which('node')),
          'runnerImageOS':os.environ.get('ImageOS'),'runnerImageVersion':os.environ.get('ImageVersion'),
          'fullHostedImageCryptographicDigestAvailable':False,
          'osRelease':Path('/etc/os-release').read_text(),'cpuCount':os.cpu_count(),
          'memoryLimitBytes':5*1024**3,'cpuLimitSeconds':840,'paidLargerRunner':False,
          'wholeParentRecomputed':False,'original56Of64Changed':False,'publicDeploymentPerformed':False}
    write(a.output/'started.json',meta)
    with (a.output/'stdout.log').open('w',encoding='utf8') as log,(a.output/'stderr.log').open('w',encoding='utf8') as err:
        with contextlib.redirect_stdout(log),contextlib.redirect_stderr(err):
            try:
                actual_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()
                dirty=subprocess.check_output(['git','status','--porcelain'],cwd=REPO,text=True).strip()
                if actual_commit!=meta['sourceCommit'] or dirty:raise ValueError('Execution must use exact clean workflow commit')
                meta['codeIsExactCleanCommit']=True
                protected=old_runner().verify_pins()
                if a.kind=='prepare':prepare(a.output,a.resume)
                else:
                    c=context(a.prepared);meta['checkpointSHA256']=c['checkpointSHA256']
                    if a.kind in {'jet','residual','guard'} and resume_worker(a.resume,a.kind,a.shard,c,a.output,meta):pass
                    elif a.kind=='jet':module('jet_worker',HERE/'jet_worker.py').run(c,a.output,shard=a.shard,shards=4)
                    elif a.kind=='residual':module('residual_worker',HERE/'residual_worker.py').run(c,a.output,component=a.shard)
                    elif a.kind=='guard':module('guard_worker',HERE/'guard_worker.py').run(c,a.output)
                    elif a.kind=='bounds':module('global_bounds',HERE/'global_bounds.py').run(c,a.output)
                    elif a.kind=='controls':
                        run=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s',str(HERE),'-p','test_*.py','-v'],stdout=log,stderr=err,timeout=600)
                        if run.returncode:raise ValueError('Negative control/test failure')
                        write(a.output/'controls-result.json',{'status':'SUCCESS','testReturnCode':run.returncode})
                    elif a.kind=='acceptance':
                        from aggregate import aggregate
                        aggregate(c,a.results,a.output)
                if protected!=old_runner().verify_pins():raise ValueError('Protected sources changed')
                if meta['implementation']!=implementation():raise ValueError('Implementation changed during run')
                meta['protectedSourcesUnchanged']=True
            except Exception as e:
                status='RESOURCE_LIMIT' if isinstance(e,(MemoryError,subprocess.TimeoutExpired)) else 'IMPLEMENTATION_FAILURE'
                meta['failure']={'type':type(e).__name__,'message':str(e)};traceback.print_exc();code=1
    meta.update(executionStatus=status,elapsedSeconds=time.monotonic()-start,
                maxRSSKiB=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                childMaxRSSKiB=resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss)
    receipt(a.output,meta)
    if code:
        # Diagnosis stays in GitHub logs; large artifacts never need to be
        # downloaded to the user's notebook to investigate a worker failure.
        error_lines=(a.output/'stderr.log').read_text(encoding='utf8').splitlines()
        print('\n'.join(error_lines[-80:]))
    if a.kind=='acceptance' and (a.output/'verification-summary.json').is_file():
        print(json.dumps(read(a.output/'verification-summary.json'),ensure_ascii=False))
    print(json.dumps({'kind':a.kind,'shard':a.shard,'status':status,'elapsedSeconds':meta['elapsedSeconds'],'failure':meta.get('failure')}))
    return code
if __name__=='__main__':sys.exit(main())
