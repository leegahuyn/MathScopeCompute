from pathlib import Path
from urllib.request import urlopen
import argparse, hashlib, json, subprocess

p=argparse.ArgumentParser()
p.add_argument('--repo', required=True, type=Path)
p.add_argument('--out', required=True, type=Path)
args=p.parse_args()
here=Path(__file__).resolve().parent
receipt=json.loads((here/'R1-05_RECEIPT.json').read_bytes())
assets=args.out/'assets'; assets.mkdir(parents=True,exist_ok=True)
three=args.out/'three'; three.mkdir(parents=True,exist_ok=True)

def save(out, data, digest):
    assert hashlib.sha256(data).hexdigest()==digest, out
    out.write_bytes(data)

for name, meta in receipt['dependencies']['archivedPageAssets'].items():
    data=subprocess.check_output(['git','-c','core.longpaths=true','-C',str(args.repo),'show',
        meta['sourceCommit']+':'+meta['sourcePath']])
    assert len(data)==meta['bytes']
    save(assets/Path(name).name,data,meta['sha256'])
for url, digest in receipt['dependencies']['three'].items():
    with urlopen(url,timeout=25) as response:
        data=response.read()
    save(three/Path(url).name,data,digest)
