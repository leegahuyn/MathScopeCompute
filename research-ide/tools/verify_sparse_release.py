"""Audit a reviewed Git index without materializing its large historical artifacts.

All authoring inputs must be staged first. The original v54 source/translation
checks still run unchanged. Only edition/addon byte reads use exact index blobs.
The full-checkout validator in CI then checks the same manifest against files.
"""
import argparse,hashlib,importlib.util,json,subprocess
from pathlib import Path,PurePosixPath

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('original_validator',ROOT/'tools/verify_english_release.py')
validator=importlib.util.module_from_spec(spec);spec.loader.exec_module(validator)

class IndexReader:
    def __init__(self):
        data=subprocess.check_output(['git','ls-files','--stage','-z','--','.'],cwd=ROOT)
        self.entries={}
        for record in data.decode().split('\0'):
            if not record:continue
            meta,name=record.split('\t',1);mode,blob,stage=meta.split()
            if stage!='0' or mode not in ('100644','100755') or name in self.entries:raise ValueError('Unmerged, symlink or duplicate index entry: '+name)
            self.entries[name]=blob
        untracked=subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z','--','.'],cwd=ROOT)
        if untracked:raise ValueError('Stage all Git-visible authoring files before index auditing.')
        self.batch=subprocess.Popen(['git','cat-file','--batch'],cwd=ROOT,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
        self.reads=0
    def read(self,name):
        blob=self.entries[name];self.batch.stdin.write((blob+'\n').encode());self.batch.stdin.flush()
        header=self.batch.stdout.readline().decode().strip().split()
        if len(header)!=3 or header[0]!=blob or header[1]!='blob':raise ValueError('Invalid Git blob response')
        size=int(header[2])
        if size>256*1024*1024:raise ValueError('Historical artifact exceeds 256 MiB audit budget: '+name)
        data=self.batch.stdout.read(size)
        if len(data)!=size or self.batch.stdout.read(1)!=b'\n':raise ValueError('Truncated Git blob')
        self.reads+=1;return data
    def close(self):
        self.batch.stdin.close();self.batch.wait(timeout=10)

class IndexArtifact:
    def __init__(self,reader,name):self.reader=reader;self.name=name
    def read_bytes(self):return self.reader.read(self.name)

def excluded(name):
    pure=PurePosixPath(name)
    if pure.is_absolute() or '..' in pure.parts or str(pure)!=name:raise ValueError('Unsafe index path')
    return any(x in validator.SKIP_DIRS for x in pure.parts[:-1]) or name in validator.SKIP_FILES or pure.name.endswith(('.pyc','.tmp','.zip','.zip.sha256'))

def bind_index_source_selection(expected,reader):
    # Original source/translation validation still checks the working files.
    # The release byte binding must describe the reviewed bytes shipped to
    # Linux, including metadata read directly by expected_manifest rather
    # than via edition_files/addon_files. Reject unstaged semantic changes.
    name='provenance/source-selection.json'
    raw=reader.read(name)
    if json.loads(raw)!=validator.read_json(name):
        raise ValueError('Source-selection content differs from the reviewed Git index; stage it before auditing.')
    result={**expected,'sourceSelection':{**expected['sourceSelection'],'sha256':hashlib.sha256(raw).hexdigest()}}
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write-manifest',action='store_true');args=parser.parse_args();reader=IndexReader()
    def edition():return {name:IndexArtifact(reader,name) for name in sorted(reader.entries) if not excluded(name) and PurePosixPath(name).parts[0] not in validator.ORIGINAL_ROOTS|{validator.ARCHIVE_MEMBERS_ROOT}}
    def addons():
        allowlist=validator.read_json('provenance/addon-allowlist.json');roots=[]
        for root in allowlist['allowedRoots']:validator.validate_addon_root(root);roots.append(root+'/')
        return {name:IndexArtifact(reader,name) for name in sorted(reader.entries) if not excluded(name) and any(name.startswith(root) for root in roots)}
    validator.edition_files=edition;validator.addon_files=addons
    original_expected_manifest=validator.expected_manifest
    validator.expected_manifest=lambda *values:bind_index_source_selection(original_expected_manifest(*values),reader)
    try:
        before=dict(reader.entries);report=validator.verify(args.write_manifest)
        after=subprocess.check_output(['git','ls-files','--stage','-z','--','.'],cwd=ROOT)
        current={r.split('\t',1)[1]:r.split()[1] for r in after.decode().split('\0') if r}
        if current!=before:raise ValueError('Git index changed during audit')
        report.update(editionReadBackend='EXACT_REVIEWED_GIT_INDEX_BLOBS',indexPaths=len(reader.entries),blobReads=reader.reads,originalSourceChecksUnchanged=True)
        print(json.dumps(report,indent=2))
    finally:reader.close()

if __name__=='__main__':main()
