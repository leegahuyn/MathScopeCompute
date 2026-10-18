#!/usr/bin/env python3
"""Copy the exact minimal input tree and runner files; never modify sources."""
import argparse,hashlib,json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('destination',type=Path)
parser.add_argument('--root',type=Path,default=ROOT)
args=parser.parse_args();root=args.root.resolve();destination=args.destination.resolve()
manifest_path=root/'work/remaining_chain/evidence/REPRO_INPUT_MANIFEST.json'
record=json.loads(manifest_path.read_text())
for item in record['files']:
    relative=Path(item['path'])
    if relative.is_absolute() or '..' in relative.parts:raise ValueError('unsafe manifest path')
    source=root/relative;target=destination/relative
    data=source.read_bytes()
    if hashlib.sha256(data).hexdigest()!=item['sha256'] or len(data)!=item['bytes']:raise ValueError('changed input: '+str(relative))
    if target.exists() and target.read_bytes()!=data:raise ValueError('refusing to overwrite different file: '+str(target))
    target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
copy=destination/'work/remaining_chain/evidence/REPRO_INPUT_MANIFEST.json'
copy.parent.mkdir(parents=True,exist_ok=True);copy.write_bytes(manifest_path.read_bytes())
print(json.dumps({'copied_files':len(record['files'])+1,'destination':str(destination),'all_sha256_verified':True}))
