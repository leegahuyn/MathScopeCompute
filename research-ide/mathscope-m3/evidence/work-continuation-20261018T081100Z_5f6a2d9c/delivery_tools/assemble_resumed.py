import argparse,difflib,hashlib,json,shutil,zipfile
from pathlib import Path

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,required=True);ap.add_argument('--zip',action='store_true');a=ap.parse_args();root=Path.cwd();out=a.out
    if out.exists() or out.is_symlink():raise ValueError('New output required')
    out.mkdir(parents=True)
    baseline='MathScope_Recovery_Final_20261018T072604Z_b479c2d1.zip';src=root/'deliverables'/baseline
    assert sha(src)=='6db01bbf3d07048e7ee2cd8411b8b4a38d9c64ee5516898935f32f8b2228cad8'
    (out/'baseline').mkdir();shutil.copyfile(src,out/'baseline'/baseline)
    for prefix,destprefix in [('work/resumed_continuation','work/resumed_continuation'),('work/resumed_delivery_tools','delivery_tools')]:
        for p in sorted((root/prefix).rglob('*')):
            if p.is_file() and '__pycache__' not in p.parts and 'sqlite' not in p.name.lower() and not p.name.startswith('.'):
                dest=out/destprefix/p.relative_to(root/prefix);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
    for name in ['REPRO_RESUMED.py','reproPS_RESUMED.ps1','CONTINUATION_JOBS.json','README_KO.md','CURRENT_ID_LEDGER.json']:
        shutil.copyfile(root/'work/resumed_delivery_tools'/name,out/name)
    receipt=root/'work/git_delivery_final_20261018T072604Z'
    for name in ['DELIVERY_COMMIT_RECEIPT.json','FINAL_ATTACHMENT_VERIFICATION.json','REMOTE_TREE_VERIFIED.json','GIT_TRANSPORT_REPLAY.json','GIT_TRANSPORT_REPLAY.stdout.log','GIT_TRANSPORT_REPLAY.stderr.log','GIT_TRANSPORT_REPLAY.exit.txt']:
        dest=out/'checkpoint_delivery'/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(receipt/name,dest)
    patch=[]
    for p in sorted((out/'work/resumed_continuation').rglob('*')):
        if p.is_file() and p.suffix in ['.py','.mjs']:
            patch.extend(difflib.unified_diff([],p.read_text().splitlines(True),fromfile='/dev/null',tofile='b/'+p.relative_to(out).as_posix()))
    (out/'NEW_CONTINUATION_CODE.patch').write_text(''.join(patch))
    rows=[{'path':p.relative_to(out).as_posix(),'size_bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]
    index={'schema':'MathScope.ResumedDeliveryIndex/1','files':rows,'file_count':len(rows),'nested_baseline':{'path':'baseline/'+baseline,'indexed_members':1230,'sha256':sha(src)},'M3_completed':62,'new_M3_closures':0}
    (out/'CONTINUATION_FILE_INDEX.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
    result={'directory':str(out.resolve()),'indexed_files':len(rows),'index_sha256':sha(out/'CONTINUATION_FILE_INDEX.json')}
    if a.zip:
        zp=out.with_suffix('.zip')
        if zp.exists():raise ValueError('New ZIP required')
        with zipfile.ZipFile(zp,'w') as z:
            for p in sorted(out.rglob('*')):
                if p.is_file():z.write(p,p.relative_to(out).as_posix(),compress_type=zipfile.ZIP_STORED if p.suffix=='.zip' else zipfile.ZIP_DEFLATED,compresslevel=None if p.suffix=='.zip' else 6)
        with zipfile.ZipFile(zp) as z:
            assert z.testzip() is None
            assert set(z.namelist())=={r['path'] for r in rows}|{'CONTINUATION_FILE_INDEX.json'}
            for r in rows:
                b=z.read(r['path']);assert len(b)==r['size_bytes'] and hashlib.sha256(b).hexdigest()==r['sha256'],r['path']
        result.update(zip_path=str(zp.resolve()),zip_sha256=sha(zp),zip_size_bytes=zp.stat().st_size,outer_reopened_all_hashes_passed=True)
    print(json.dumps(result))
if __name__=='__main__':main()
