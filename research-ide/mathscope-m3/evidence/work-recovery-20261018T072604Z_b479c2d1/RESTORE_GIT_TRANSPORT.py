"""Restore exact indexed bytes from local Git transport objects; no network."""
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
