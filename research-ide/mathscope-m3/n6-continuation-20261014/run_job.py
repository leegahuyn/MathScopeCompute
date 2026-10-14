"""Continue byte-pinned completed research; command success is not N6 proof."""
from __future__ import annotations
import argparse, hashlib, json, os, platform, shutil, subprocess, sys, time, zipfile
from pathlib import Path, PurePosixPath

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
ARCHIVES=REPO/'research-ide/mathscope-m3/evidence/mean-equivalence-20261014/cloud-38500114302'
BASE='ba87dc9c09567c9a486d424ffb3e63a7eb04a12d'
LIMIT=1200
command_deadline=None

def sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        while chunk:=f.read(1<<20):h.update(chunk)
    return h.hexdigest()

def safe_member(name):
    p=PurePosixPath(name)
    if not name or '\\' in name or p.is_absolute() or '..' in p.parts or ':' in name:
        raise ValueError('Unsafe ZIP member')
    return p

def verify_archives(destination=None,kinds=None):
    lock=json.loads((HERE/'ARCHIVE_LOCK.json').read_text(encoding='utf8'))
    receipt=[]
    for item in lock['archives']:
        path=ARCHIVES/item['path']
        if sha(path)!=item['sha256'] or path.stat().st_size!=item['bytes']:
            raise ValueError('Changed original cloud archive '+item['path'])
        with zipfile.ZipFile(path) as z:
            names=z.namelist()
            if len(names)!=len(set(names)):raise ValueError('Duplicate ZIP member')
            total=sum(x.file_size for x in z.infolist())
            if total>512*1024*1024:raise ValueError('Archive exceeds bounded extraction budget')
            for name in names:safe_member(name)
            src=json.loads(z.read('receipt.json'))
            if src['sourceCommit']!=BASE:raise ValueError('Wrong inherited source commit')
            expected={x['path']:x for x in src['members']}
            files={x.filename for x in z.infolist() if not x.is_dir()}
            if files!=set(expected)|{'receipt.json'}:raise ValueError('Incomplete or extra inherited receipt member')
            extract=destination is not None and (kinds is None or item['kind'] in kinds)
            for name in sorted(files):
                data=z.read(name)
                if name!='receipt.json':
                    m=expected[name]
                    if len(data)!=m['bytes'] or hashlib.sha256(data).hexdigest()!=m['sha256']:
                        raise ValueError('Changed inherited receipt member '+name)
                if extract:
                    target=Path(destination)/item['name']/name
                    if not target.resolve().is_relative_to(Path(destination).resolve()):raise ValueError('Unsafe extraction target')
                    target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
            receipt.append({'archive':item['path'],'sha256':item['sha256'],'sourceCommit':src['sourceCommit'],'executionStatus':src['executionStatus'],'membersVerified':len(files),'extractedForNewAudit':extract})
    return receipt

def protected():
    lock=json.loads((HERE/'ARCHIVE_LOCK.json').read_text(encoding='utf8'))
    found={path:sha(REPO/path) for path in lock['protectedSources']}
    if found!=lock['protectedSources']:raise ValueError('Original producer or progress bytes changed')
    return found

def execute(command,out,name):
    remaining=LIMIT if command_deadline is None else max(1,int(command_deadline-time.monotonic()))
    with (out/name).open('w',encoding='utf8') as log:
        result=subprocess.run(command,cwd=REPO,stdout=log,stderr=subprocess.STDOUT,timeout=min(LIMIT,remaining))
    if result.returncode:raise RuntimeError(f'Command exit {result.returncode}: {name}')

def main():
    global command_deadline
    p=argparse.ArgumentParser();p.add_argument('--kind',choices=['prepare','mean','initial','pde','controls','analytic'],required=True);p.add_argument('--output',required=True);p.add_argument('--mean-output');a=p.parse_args()
    out=Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True)
    start=time.monotonic();command_deadline=start+LIMIT;code=0;before={}
    env={'schema':'MathScope.N6Continuation.Execution/1','sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip(),'inheritedSourceCommit':BASE,'inheritedRun':38500114302,'kind':a.kind,'python':platform.python_version(),'node':subprocess.check_output(['node','--version'],text=True).strip(),'platform':platform.platform(),'cpuCount':os.cpu_count(),'diskFreeBytes':shutil.disk_usage(REPO).free,'memory':Path('/proc/meminfo').read_text() if Path('/proc/meminfo').exists() else None,'commandTimeoutSeconds':LIMIT,'nodeHeapMiB':8192,'paidLargerRunnerUsed':False,'startedAtUTC':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'heavyPassedMeanReplayRequested':False,'originalN601Complete':False,'originalN602Complete':False}
    (out/'started.json').write_text(json.dumps(env,indent=2)+'\n',encoding='utf8')
    try:
        before=protected()
        env['protectedSourcesBefore']=before
        kinds={'mean':['mean','inputs'],'initial':['initial','mean','inputs'],'pde':['residual','inputs'],'analytic':['mean','inputs','residual','natural','initial']}.get(a.kind)
        scratch=out/'inherited-inputs'
        receipts=verify_archives(scratch if kinds else None,kinds)
        (out/'inherited-verification.json').write_text(json.dumps({'sourceCommit':BASE,'run':38500114302,'archives':receipts,'integrityIsNotAnalyticProof':True},indent=2)+'\n',encoding='utf8')
        if a.kind=='mean':execute(['node',str(HERE/'mean_capture_run.mjs'),'--artifacts',str(scratch),'--output',str(out)],out,'mean.log')
        elif a.kind=='initial':execute([sys.executable,'-B',str(HERE/'initial_source_lemmas.py'),'--artifacts',str(scratch),'--output',str(out)],out,'initial.log')
        elif a.kind=='pde':execute([sys.executable,'-B',str(HERE/'pde_replay.py'),'--artifacts',str(scratch),'--output',str(out)],out,'pde.log')
        elif a.kind=='analytic':
            if not a.mean_output:raise ValueError('Same-run mean inventory required for analytic continuation')
            mean_dir=Path(a.mean_output);mr=json.loads((mean_dir/'receipt.json').read_text(encoding='utf8'))
            member=next((x for x in mr['members'] if x['path']=='mean-capture-result.json'),None)
            if mr['sourceCommit']!=env['sourceCommit'] or not member or member['sha256']!=sha(mean_dir/member['path']):
                raise ValueError('Analytic inventory not linked to this exact source-run mean receipt')
            env['sameRunMeanReceiptSHA256']=sha(mean_dir/'receipt.json')
            execute([sys.executable,'-B',str(HERE/'analytic_primitives.py'),'--mean-output',str(mean_dir),'--output',str(out)],out,'analytic-primitives.log')
            execute([sys.executable,'-B',str(HERE/'analytic_initial_source.py'),'--artifacts',str(scratch),'--output',str(out)],out,'analytic-initial.log')
            execute([sys.executable,'-B',str(HERE/'analytic_mean_run.py'),'--artifacts',str(scratch),'--output',str(out)],out,'analytic-mean.log')
            execute([sys.executable,'-B',str(HERE/'analytic_pde_cutoff.py'),'--artifacts',str(scratch),'--output',str(out)],out,'analytic-pde.log')
        elif a.kind=='controls':
            tests=sorted(str(x) for x in HERE.glob('*.test.mjs'))
            if tests:execute(['node','--test',*tests],out,'node-controls.tap')
            pytests=sorted(HERE.glob('test_*.py'))
            if pytests:execute([sys.executable,'-B','-m','unittest','discover','-s',str(HERE),'-p','test_*.py'],out,'python-controls.log')
            if not tests and not pytests:raise ValueError('Missing new independent controls')
        env['protectedSourcesBefore']=before
        env['protectedSourcesAfter']=protected()
        if env['protectedSourcesAfter']!=before:raise ValueError('Original source changed during audit')
        env['executionStatus']='SUCCESS'
    except Exception as error:
        code=1;env['executionStatus']='RESOURCE_LIMIT' if isinstance(error,subprocess.TimeoutExpired) else 'IMPLEMENTATION_FAILURE';env['failure']=str(error)
    finally:
        # Extracted inherited archives already have permanent SHA-pinned copies.
        # Keep only new outputs and receipts in this run's success/failure artifact.
        scratch=out/'inherited-inputs'
        if scratch.exists() and scratch.resolve().is_relative_to(out):shutil.rmtree(scratch)
        try:
            env['protectedSourcesAfter']=protected()
            env['originalProtectedSourcesUnchanged']=bool(before) and before==env['protectedSourcesAfter']
        except Exception as integrity_error:
            code=1;env['originalProtectedSourcesUnchanged']=False
            env['sourceIntegrityVerificationError']=str(integrity_error)
            env['executionStatus']='ORIGINAL_SOURCE_INTEGRITY_FAILURE'
        env['elapsedSeconds']=time.monotonic()-start
        env['newImplementationInputs']=[{'path':str(x.relative_to(REPO)).replace('\\','/'),'sha256':sha(x),'bytes':x.stat().st_size} for x in sorted(HERE.iterdir()) if x.is_file()]
        (out/'execution.json').write_text(json.dumps(env,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        files=[{'path':str(x.relative_to(out)).replace('\\','/'),'bytes':x.stat().st_size,'sha256':sha(x)} for x in sorted(out.rglob('*')) if x.is_file() and x.name!='receipt.json']
        (out/'receipt.json').write_text(json.dumps({'sourceCommit':env['sourceCommit'],'executionStatus':env['executionStatus'],'members':files},indent=2)+'\n',encoding='utf8')
    print(json.dumps({'kind':a.kind,'executionStatus':env['executionStatus'],'elapsedSeconds':env['elapsedSeconds'],'originalN601Complete':False,'originalN602Complete':False}))
    return code

if __name__=='__main__':sys.exit(main())
