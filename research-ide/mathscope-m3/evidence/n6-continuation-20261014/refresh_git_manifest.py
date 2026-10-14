"""Refresh edition membership from exact indexed Git blobs, after review.

On Windows, this avoids recording checkout newline conversions as new source
bytes. Every existing manifest entry must remain byte-identical. Only genuinely
new edition files may be added; the original-source, addon and math criteria
sections are retained verbatim. Stage new deliverables before running.
"""
import hashlib,importlib.util,json,subprocess,tempfile
from pathlib import Path

REPO=Path(__file__).resolve().parents[4]
ROOT=REPO/'research-ide'
spec=importlib.util.spec_from_file_location('edition_verifier',ROOT/'tools/verify_english_release.py')
verifier=importlib.util.module_from_spec(spec)
import sys
sys.path.insert(0,str(ROOT/'tools'));spec.loader.exec_module(verifier)
target=ROOT/verifier.MANIFEST
manifest=json.loads(target.read_text(encoding='utf8'))
old={x['path']:x for x in manifest['editionArtifacts']}
files=verifier.edition_files()
index={}
for row in subprocess.check_output(['git','ls-files','--stage','-z','--','research-ide'],cwd=REPO).split(b'\0'):
    if not row:continue
    info,path=row.split(b'\t',1);mode,oid,stage=info.split()
    if stage!=b'0':raise ValueError('Unmerged source index')
    index[path.decode().removeprefix('research-ide/')]=oid.decode()
if set(files)-set(index):raise ValueError('Stage all new edition evidence before manifest refresh')
names=sorted(files)
rows=[]
with tempfile.TemporaryFile(dir=REPO.parent) as requests:
    requests.write(''.join(index[n]+'\n' for n in names).encode());requests.seek(0)
    process=subprocess.Popen(['git','cat-file','--batch'],cwd=REPO,stdin=requests,stdout=subprocess.PIPE)
    for name in names:
        size=int(process.stdout.readline().split()[-1]);remaining=size;digest=hashlib.sha256()
        while remaining:
            chunk=process.stdout.read(min(1<<20,remaining))
            if not chunk:raise ValueError('Truncated immutable Git blob')
            digest.update(chunk);remaining-=len(chunk)
        if process.stdout.read(1)!=b'\n':raise ValueError('Malformed Git blob boundary')
        row={'path':name,'bytes':size,'sha256':digest.hexdigest(),'category':'ENGLISH_GUIDE_TOOL_OR_RELEASE_PROVENANCE'}
        if name in old and row!=old[name]:raise ValueError('Refuse changed existing edition artifact: '+name)
        rows.append(row)
    if process.wait()!=0:raise ValueError('Git blob stream failed')
if set(old)-set(files):raise ValueError('Refuse removed existing edition artifact')
manifest['editionArtifactCount']=len(rows);manifest['editionArtifacts']=rows
target.write_bytes((json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode())
print(json.dumps({'priorEditionArtifacts':len(old),'newEditionArtifacts':len(rows)-len(old),'existingEditionBytesPreserved':True,'originalSourceAndAddonSectionsPreserved':True}))
