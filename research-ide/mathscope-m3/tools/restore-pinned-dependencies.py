from pathlib import Path
import subprocess,json,hashlib
root=Path(__file__).resolve().parents[3]
base='research-ide/mathscope-m3/navier/'
dirs=[base+'evidence/global-forced-current-20261012/attempt382884203291/',base+'evidence/forced-snapshot-replay-20261012/attempt1/']
def blob(p):return subprocess.check_output(['git','show','HEAD:'+p],cwd=root)
paths=set(subprocess.check_output(['git','ls-tree','-r','--name-only','-z','HEAD','--',*dirs],cwd=root).decode().split('\0'))-{''}
original=json.loads(blob(dirs[0]+'source-bytes-before.json'))
replay=json.loads(blob(dirs[1]+'source-before.json'))
for r in original['files']+replay: paths.add(r['path'])
captured=json.loads(blob(dirs[1]+'input-verification.json'))
for r in captured['files']:paths.add(r['path'])
for p in sorted(paths):
    target=root/p;target.parent.mkdir(parents=True,exist_ok=True);raw=blob(p)
    if not target.is_file() or target.read_bytes()!=raw:target.write_bytes(raw)
for r in original['files']+replay+captured['files']:
    raw=(root/r['path']).read_bytes()
    assert len(raw)==r['bytes'] and hashlib.sha256(raw).hexdigest()==r['sha256'],r['path']
print(json.dumps({'restoredExactGitBlobPaths':len(paths),'verifiedPinnedRows':len(original['files']+replay+captured['files']),'noReceiptSemanticsChanged':True}))
