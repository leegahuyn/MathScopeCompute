"""Prepare an additive Git tree and transport oversized files without publishing."""
import argparse, gzip, hashlib, json, os, subprocess
from pathlib import Path

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def git(repo,args,**kw):return subprocess.check_output(['git','-C',str(repo),*args],**kw)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--payload',type=Path,required=True);ap.add_argument('--repo',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);ap.add_argument('--prefix',required=True);ap.add_argument('--site-gzip',type=Path,required=True);a=ap.parse_args()
    payload=a.payload.resolve();repo=a.repo.resolve();out=a.out.resolve();out.mkdir(parents=True,exist_ok=False)
    base='1d4449517ac1217415e67e39c822aeea97325c21'
    assert git(repo,['rev-parse','HEAD']).decode().strip()==base
    assert git(repo,['remote','get-url','origin']).decode().strip()=='https://github.com/leegahuyn/MathScopeCompute.git'
    assert not git(repo,['ls-tree',base,a.prefix]).strip(),'Destination prefix exists'
    known=set()
    for row in git(repo,['ls-tree','-r',base]).decode().splitlines():known.add(row.split()[2])
    idx=json.loads((payload/'FINAL_FILE_INDEX.json').read_text())
    mapping={f['path']:payload/f['path'] for f in idx['files']}
    mapping['FINAL_FILE_INDEX.json']=payload/'FINAL_FILE_INDEX.json'
    for f in idx['files']:assert sha(mapping[f['path']])==f['sha256'] and mapping[f['path']].stat().st_size==f['size_bytes'],f['path']
    transport=[]
    source='work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz'
    original=mapping.pop(source);parts=[]
    with original.open('rb') as stream:
        k=0
        while b:=stream.read(8*1024*1024):
            rel=f'git_transport/source.part{k:04d}';p=out/f'source.part{k:04d}';p.write_bytes(b);mapping[rel]=p
            parts.append({'path':rel,'size_bytes':len(b),'sha256':sha(p)});k+=1
    transport.append({'target':source,'operation':'concatenate','size_bytes':original.stat().st_size,'sha256':sha(original),'inputs':parts})
    site='recovered/base/work/web_intake/source/v0.3.1.html';original=mapping.pop(site)
    assert gzip.decompress(a.site_gzip.read_bytes())==original.read_bytes()
    mapping['git_transport/original-site.html.gz']=a.site_gzip.resolve()
    transport.append({'target':site,'operation':'gunzip','size_bytes':original.stat().st_size,'sha256':sha(original),'inputs':[{'path':'git_transport/original-site.html.gz','size_bytes':a.site_gzip.stat().st_size,'sha256':sha(a.site_gzip)}]})
    manifest=out/'GIT_TRANSPORT.json';manifest.write_text(json.dumps({'schema':'MathScope.ExactGitTransport/1','scope':'Reconstruct two exact FINAL_FILE_INDEX payload files before replay. No mathematical evaluation.','files':transport},indent=2)+'\n');mapping[manifest.name]=manifest
    restore=out/'RESTORE_GIT_TRANSPORT.py'
    restore.write_text('''"""Restore exact indexed bytes from local Git transport objects; no network."""
import gzip,hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parent
def check(p,size,digest):
    data=p.read_bytes()
    if len(data)!=size or hashlib.sha256(data).hexdigest()!=digest:raise ValueError(str(p))
    return data
for item in json.loads((root/'GIT_TRANSPORT.json').read_text())['files']:
    target=root/item['target']
    if target.exists():check(target,item['size_bytes'],item['sha256']);continue
    chunks=[check(root/f['path'],f['size_bytes'],f['sha256']) for f in item['inputs']]
    data=b''.join(chunks) if item['operation']=='concatenate' else gzip.decompress(chunks[0])
    if len(data)!=item['size_bytes'] or hashlib.sha256(data).hexdigest()!=item['sha256']:raise ValueError(item['target'])
    target.parent.mkdir(parents=True,exist_ok=True)
    with target.open('xb') as stream:stream.write(data)
    print('Restored',item['target'],len(data))
print('Exact Git transport verified. Now run REPRO_RECOVERY.py.')
''');mapping[restore.name]=restore
    instructions=out/'GIT_REPLAY.md';instructions.write_text('This directory is the complete recovery payload except two large files transported without byte changes. Run `python RESTORE_GIT_TRANSPORT.py` first, then the README replay command. FINAL_FILE_INDEX.json covers the reconstructed payload, while GIT_TRANSPORT.json pins transport inputs. The ZIP already contains both original files. Original repository assets remain unchanged.\n');mapping[instructions.name]=instructions
    env=dict(os.environ,GIT_INDEX_FILE=str(out/'git.index'))
    git(repo,['read-tree',base],env=env)
    entries=[];index_rows=[]
    for rel,p in sorted(mapping.items()):
        blob=git(repo,['hash-object','-w','--no-filters',str(p)]).decode().strip()
        path=a.prefix.rstrip('/')+'/'+rel
        size=p.stat().st_size
        try: content=p.read_bytes().decode('utf-8') if size<=100000 and blob not in known else None
        except UnicodeDecodeError:content=None
        kind='reuse' if blob in known else 'inline' if content is not None else 'upload'
        entries.append({'path':path,'local_path':str(p),'sha':blob,'sha256':sha(p),'size_bytes':size,'kind':kind})
        index_rows.append(f'100644 {blob}\t{path}\n')
    git(repo,['update-index','--index-info'],input=''.join(index_rows).encode(),env=env)
    tree=git(repo,['write-tree','--missing-ok'],env=env).decode().strip()
    fields=git(repo,['diff','--cached',base,'--name-status','-z'],env=env).decode().split('\0')
    assert fields[-1]==''
    fields=fields[:-1];assert len(fields)==2*len(entries)
    pairs=list(zip(fields[::2],fields[1::2]))
    assert all(status=='A' and path.startswith(a.prefix.rstrip('/')+'/') for status,path in pairs)
    diff=''.join(status+'\t'+path+'\n' for status,path in pairs)
    (out/'ADDITIVE_DIFF.txt').write_text(diff)
    plan={'base_commit':base,'base_tree':git(repo,['rev-parse',base+'^{tree}']).decode().strip(),'expected_tree':tree,'repository':'leegahuyn/MathScopeCompute','branch':'mathscope-m3-n6-cloud-20261014','prefix':a.prefix,'entries':entries,'counts':{k:sum(e['kind']==k for e in entries) for k in ['reuse','inline','upload']},'original_paths_modified_or_deleted':0}
    (out/'GIT_UPLOAD_PLAN.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:plan[k] for k in ['expected_tree','counts','original_paths_modified_or_deleted']}))

if __name__=='__main__':main()
