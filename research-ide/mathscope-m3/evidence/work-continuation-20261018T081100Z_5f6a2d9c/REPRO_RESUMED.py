"""Replay only post-checkpoint work in a new copy; original 22 jobs are reused."""
import argparse, hashlib, json, os, shutil, subprocess, sys, time, uuid, zipfile
from pathlib import Path, PurePosixPath

BASE_INDEX='b08f307e1e740d7db7351b7449504a7e9a86ad11f7186913531b26d5dc3fa0cb'

def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def checked(root, rel):
    p=PurePosixPath(rel)
    if not rel or p.is_absolute() or '..' in p.parts or '\\' in rel or ':' in rel:raise ValueError('Unsafe path')
    out=root.joinpath(*p.parts)
    if root not in out.resolve().parents:raise ValueError('Path escapes root')
    return out

def write(p,j):p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def verify(root, rows, skip=None):
    found=[]
    for row in rows:
        if row['path']==skip:continue
        p=checked(root,row['path']);h=sha(p)
        if p.stat().st_size!=row['size_bytes'] or h!=row['sha256']:raise ValueError(row['path'])
        found.append({'path':row['path'],'size_bytes':p.stat().st_size,'sha256':h})
    return found

def baseline_copy(package, config, dest, supplied):
    if supplied:
        root=supplied.resolve();ip=root/'FINAL_FILE_INDEX.json'
        if sha(ip)!=BASE_INDEX:raise ValueError('Changed baseline index')
        idx=json.loads(ip.read_bytes());verify(root,idx['files'])
        for row in idx['files']:
            target=checked(dest,row['path']);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(checked(root,row['path']),target)
        shutil.copyfile(ip,dest/'FINAL_FILE_INDEX.json')
    else:
        path=package/config['baseline_zip']
        if sha(path)!=config['baseline_sha256']:raise ValueError('Changed baseline ZIP')
        with zipfile.ZipFile(path) as z:
            raw=z.read('FINAL_FILE_INDEX.json')
            if hashlib.sha256(raw).hexdigest()!=BASE_INDEX:raise ValueError('Changed baseline index')
            idx=json.loads(raw)
            for row in idx['files']:
                target=checked(dest,row['path']);target.parent.mkdir(parents=True,exist_ok=True)
                info=z.getinfo(row['path'])
                if (info.external_attr>>16)&0o170000==0o120000:raise ValueError('ZIP symlink')
                with z.open(info) as source,target.open('xb') as output:shutil.copyfileobj(source,output)
                if target.stat().st_size!=row['size_bytes'] or sha(target)!=row['sha256']:raise ValueError(row['path'])
            (dest/'FINAL_FILE_INDEX.json').write_bytes(raw)
    verify(dest,idx['files'])
    return idx['files']

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--package-root',type=Path,default=Path(__file__).resolve().parent);ap.add_argument('--work-dir',type=Path,required=True);ap.add_argument('--report-dir',type=Path,required=True);ap.add_argument('--base-directory',type=Path);a=ap.parse_args()
    if sys.version_info<(3,12):ap.error('Python3.12+ required')
    if a.work_dir.is_symlink() or a.work_dir.exists():ap.error('Work directory must be new')
    package=a.package_root.resolve();work=a.work_dir.resolve();reports=a.report_dir.resolve()
    if work==package or package in work.parents or reports==package or package in reports.parents:ap.error('Work and reports must be outside package')
    if not shutil.which('node'):ap.error('Node is required')
    config=json.loads((package/'CONTINUATION_JOBS.json').read_bytes());index_path=package/'CONTINUATION_FILE_INDEX.json';index_sha=sha(index_path);rows=json.loads(index_path.read_bytes())['files']
    skip=config['baseline_zip'] if a.base_directory else None
    before=verify(package,rows,skip)
    report=reports/('continuation-'+uuid.uuid4().hex[:12]);report.mkdir(parents=True);logs=report/'logs';logs.mkdir();work.mkdir(parents=True)
    summary={'schema':'MathScope.ResumedPortableReplay/1','baseline_22_jobs_repeated':False,'original_long_producers_repeated':False,'python':sys.version,'jobs':[],'M3_completed':62,'N706_closed':False,'N805_closed':False,'actual_global_last_resolved_tau':None,'input_file_count':len(before),'baseline_mode':'verified_directory' if a.base_directory else 'nested_verified_zip','package_index_sha256':index_sha}
    write(report/'PACKAGE_BEFORE.json',before);start=time.monotonic();code=0
    try:
        base_rows=baseline_copy(package,config,work,a.base_directory)
        for row in rows:
            if row['path'].startswith('work/resumed_continuation/'):
                target=checked(work,row['path'])
                if target.exists():raise ValueError('Overlay would replace original '+row['path'])
                target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(checked(package,row['path']),target)
        env=dict(os.environ,PYTHONUTF8='1',PYTHONUNBUFFERED='1',PYTHONDONTWRITEBYTECODE='1');env.pop('PYTHONPATH',None)
        for number,job in enumerate(config['jobs'],1):
            args=[sys.executable if job['runtime']=='python' else shutil.which('node'),*job['args']]
            name=f'{number:02d}-{job["id"]}';print(name,flush=True);stamp=time.monotonic()
            with (logs/(name+'.stdout.log')).open('wb') as out,(logs/(name+'.stderr.log')).open('wb') as err:r=subprocess.run(args,cwd=work,env=env,stdout=out,stderr=err)
            (logs/(name+'.exit.txt')).write_text(str(r.returncode)+'\n');summary['jobs'].append({'id':job['id'],'argv':args,'exit_code':r.returncode,'elapsed_seconds':round(time.monotonic()-stamp,3)})
            write(report/'SUMMARY.json',summary)
            if r.returncode:raise ValueError(name+' failed')
        verify(work,base_rows);summary['baseline_files_unchanged']=True
        outputs=[]
        for p in sorted((work/'work/resumed_continuation').rglob('*')):
            if p.is_file() and '__pycache__' not in p.parts and 'sqlite' not in p.name.lower():
                rel=p.relative_to(work).as_posix();h=sha(p);old=package/rel
                row={'path':rel,'size_bytes':p.stat().st_size,'sha256':h,'same_as_archived_output':old.is_file() and sha(old)==h};outputs.append(row)
                if not row['same_as_archived_output']:
                    target=report/'generated_outputs'/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
        write(report/'OUTPUT_HASHES.json',outputs)
    except Exception as exc:code=1;summary['error']=str(exc)
    after=verify(package,rows,skip);summary['original_package_unchanged']=before==after and sha(index_path)==index_sha
    if not summary['original_package_unchanged']:code=1
    write(report/'PACKAGE_AFTER.json',after);summary.update(exit_code=code,status='PASS' if code==0 else 'FAILED',elapsed_seconds=round(time.monotonic()-start,3));write(report/'SUMMARY.json',summary);(report/'EXIT.txt').write_text(str(code)+'\n');print(json.dumps({'status':summary['status'],'report':str(report),'jobs':len(summary['jobs'])}),flush=True)
    return code

if __name__=='__main__':raise SystemExit(main())
