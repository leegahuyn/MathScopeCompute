"""Refresh edition hashes from a reviewed sparse Git index without hydration.

All baseline blobs must stay unchanged. Full ordinary byte/metadata validation
is still required in cloud CI after committing the generated manifest.
"""
from pathlib import Path,PurePosixPath
import hashlib,json,subprocess
REPO=Path(__file__).resolve().parents[3]
BASE='bd93e3ee24212eb68c8ed3b6017c234758bd48f5'
TARGET='research-ide/SOURCE_TRANSLATION_MANIFEST.json'
ALLOWED=['research-ide/mathscope-m3/certification-20261014/','research-ide/mathscope-m3/evidence/n6-certification-20261014/']
SKIP_DIRS={'.git','.lake','.venv','venv','node_modules','__pycache__','dist','runs','m1-output'}
def git(*args):return subprocess.run(['git',*args],cwd=REPO,check=True,stdout=subprocess.PIPE).stdout
def main():
    # Work-tree sparse deletions do not enter this index-based publication.
    changed=git('diff','--cached','--name-only',BASE).decode().splitlines()
    if any(path!=TARGET and not path.startswith(tuple(ALLOWED+['.github/workflows/m3-n6-certification.yml'])) for path in changed):raise ValueError('Unexpected baseline change in reviewed source index')
    manifest=json.loads(git('show',BASE+':'+TARGET));rows={r['path']:r for r in manifest['editionArtifacts']}
    staged=git('ls-files','-z','--cached','--','research-ide').decode().split('\0')
    visible=set()
    for name in staged:
        if not name:continue
        relative=name[len('research-ide/'):];p=PurePosixPath(relative)
        if p.parts[0] in {'mathscope-m0','mathscope-m1','mathscope-extension','archive-members'} or any(part in SKIP_DIRS for part in p.parts[:-1]) or relative in ['SOURCE_TRANSLATION_MANIFEST.json','ENGLISH_PACKAGE_MANIFEST.json'] or p.name.endswith(('.pyc','.tmp','.zip','.zip.sha256')):continue
        visible.add(relative)
        if name in changed or relative not in rows:
            if not name.startswith(tuple(ALLOWED)):raise ValueError('Unreviewed new edition source '+name)
            raw=git('show',':'+name);rows[relative]={'path':relative,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'category':'ENGLISH_GUIDE_TOOL_OR_RELEASE_PROVENANCE'}
    if set(rows)-visible:raise ValueError('Existing edition member deleted')
    manifest['editionArtifacts']=[rows[k] for k in sorted(visible)];manifest['editionArtifactCount']=len(visible)
    path=REPO/TARGET;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(json.dumps({'editionArtifactCount':len(visible),'baselineSourceFilesChanged':False,'fullCloudByteValidationRequired':True,'manifestSHA256':hashlib.sha256(path.read_bytes()).hexdigest()}))
if __name__=='__main__':main()
