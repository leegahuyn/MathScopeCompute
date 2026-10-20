"""Assemble the additive recovery handoff; no mathematical producer is run."""
import argparse, difflib, hashlib, json, shutil, zipfile
from pathlib import Path

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def excluded(path):
    return any(x.startswith('.') or x=='__pycache__' or 'sqlite' in x.lower() for x in path.parts) or path.suffix=='.pyc'

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--source-root',type=Path,default=Path.cwd());ap.add_argument('--output',type=Path,required=True);ap.add_argument('--zip',action='store_true');a=ap.parse_args()
    if a.output.is_symlink():raise FileExistsError('Output symlink is not allowed')
    src=a.source_root.resolve();out=a.output.resolve()
    if out==src or src in out.parents and any(p in ('recovered','work') for p in out.relative_to(src).parts):raise ValueError('Output must be isolated under deliverables')
    if out.exists() or out.is_symlink():raise FileExistsError('Use a new output directory')
    out.mkdir(parents=True)
    selected=[]
    base_index=json.loads((src/'recovered/base/FILE_INDEX.json').read_text())
    for f in base_index['files']:
        p=src/'recovered/base'/f['path']
        assert p.stat().st_size==f['size_bytes'] and sha(p)==f['sha256'],f['path']
    for r in [f['path'] for f in base_index['files']]+['FILE_INDEX.json']:
        rel=Path('recovered/base')/r;target=out/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src/rel,target);selected.append(rel.as_posix())
    for prefix in ('work/prune_recovery','work/recovery_git/recovered'):
        for p in sorted((src/prefix).rglob('*')):
            if p.is_file() and not excluded(p.relative_to(src)):
                rel=p.relative_to(src);target=out/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target);selected.append(rel.as_posix())
    for name in ('REPRO_RECOVERY.py','reproPS_RECOVERY.ps1'):
        shutil.copyfile(src/'work/prune_recovery/packaging'/name,out/name);selected.append(name)
    readme='''# MathScope recovery handoff

M3 remains **62/64**. N7-06 and N8-05 remain OPEN. Initial 1260/1260 is inherited only in its original scope. No M4 acceptance or website update is claimed.

Read work/prune_recovery/RECOVERY_STATUS_KO.md and CURRENT_ID_LEDGER.json first. The original handoff is preserved under recovered/base. New recovery source, proofs, independent reviews and execution logs are under work/prune_recovery. Original source recovered from Git is under work/recovery_git/recovered.

Use Python 3.12+ and Node.js. From this extracted directory:

    python REPRO_RECOVERY.py --package-root . --work-dir ../MathScope_fresh_replay --report-dir ../MathScope_replay_report

PowerShell: see reproPS_RECOVERY.ps1. The fresh work directory must not exist. The runner verifies indexed bytes before copying, runs only this recovery's scoped checks, and records each exit code. It does not rerun the historical Windows or 1700-second finite-cycle job. A successful replay is not M3 64/64 certification.

FINAL_FILE_INDEX.json authenticates every payload file except itself. WORKSPACE_RECOVERY_RECEIPT.json records the automatic scratch loss and distinguishes unrecovered earlier observations from the newly rebuilt implementations. SQLite caches are transient, excluded and regenerated only in the fresh replay copy.
'''
    (out/'README.md').write_text(readme);selected.append('README.md')
    patch=[]
    for rel in selected:
        p=out/rel
        if rel.startswith('work/prune_recovery/') and p.suffix in ('.py','.mjs','.ps1'):
            patch.extend(difflib.unified_diff([],p.read_text().splitlines(True),fromfile='/dev/null',tofile='b/'+rel))
    (out/'NEW_RECOVERY_CODE.patch').write_text(''.join(patch));selected.append('NEW_RECOVERY_CODE.patch')
    selection={'schema':'MathScope.RecoveryPayloadSelection/1','base_commit':'1d4449517ac1217415e67e39c822aeea97325c21','sources':['recovered/base','work/prune_recovery','work/recovery_git/recovered'],'excluded':['SQLite/cache files','__pycache__ and pyc','hidden transient files','Git clone','signed transfer material'],'originals_modified':False,'new_acceptance_count':0,'M3_completed':62,'M3_total':64,'M4_current_accepted':None,'website_updated':False,'replay_scope':'New recovery only; original finished jobs not rerun'}
    (out/'PAYLOAD_SELECTION.json').write_text(json.dumps(selection,indent=2)+'\n');selected.append('PAYLOAD_SELECTION.json')
    files=[{'path':r,'size_bytes':(out/r).stat().st_size,'sha256':sha(out/r)} for r in sorted(set(selected))]
    idx={'schema':'MathScope.RecoveryFileIndex/1','files':files,'file_count':len(files),'total_bytes':sum(f['size_bytes'] for f in files),'self_excluded':True}
    (out/'FINAL_FILE_INDEX.json').write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n')
    assert {p.relative_to(out).as_posix() for p in out.rglob('*') if p.is_file()}==set(selected)|{'FINAL_FILE_INDEX.json'}
    result={'payload':str(out),'indexed_files':len(files),'total_bytes':idx['total_bytes'],'index_sha256':sha(out/'FINAL_FILE_INDEX.json')}
    if a.zip:
        zpath=out.with_suffix('.zip')
        if zpath.exists() or zpath.is_symlink():raise FileExistsError('Use a new ZIP name')
        with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
            for r in [f['path'] for f in files]+['FINAL_FILE_INDEX.json']:z.write(out/r,r)
        with zipfile.ZipFile(zpath) as z:
            assert z.testzip() is None
            assert set(z.namelist())=={f['path'] for f in files}|{'FINAL_FILE_INDEX.json'}
            for f in files:
                b=z.read(f['path']);assert len(b)==f['size_bytes'] and hashlib.sha256(b).hexdigest()==f['sha256'],f['path']
        result.update(zip_path=str(zpath),zip_bytes=zpath.stat().st_size,zip_sha256=sha(zpath),reopened_all_indexed_hashes_passed=True)
    print(json.dumps(result))

if __name__=='__main__':main()
