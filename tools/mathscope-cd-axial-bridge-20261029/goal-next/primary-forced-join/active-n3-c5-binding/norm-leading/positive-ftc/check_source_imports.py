#!/usr/bin/env python3
"""Recursively verify the original positive C10 producer's module imports."""
import argparse,hashlib,json,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=Path('work/goal-20261111/axial-replay/source'));p.add_argument('--prior',type=Path,default=Path('work/goal-next/whole-k-prefix/higher-ftc-norm-operands.json'));p.add_argument('--out',type=Path);a=p.parse_args()
prior=a.prior.read_bytes();assert hashlib.sha256(prior).hexdigest()=='f76e18b57bc6308c36e24cfb16459ee49674c91dfd086779fe6a2d11b54b72f7'
data=json.loads(prior);pins=data['sourcePins'];root=a.source.resolve();nav=root/'research-ide/mathscope-m2/navier'
queue=[nav/'actual-residual-order-induction-source.mjs',nav/'actual-residual-order-induction-norms.mjs'];done={}
for f in queue:
 f=f.resolve();rel=f.relative_to(root).as_posix()
 if rel in done:continue
 raw=f.read_bytes();digest=hashlib.sha256(raw).hexdigest();assert pins.get(rel)==digest,(rel,digest,pins.get(rel))
 done[rel]=digest
 for dep in re.findall(r'''\b(?:from\s+|import\s*)['"](\.[^'"]+)['"]''',raw.decode('utf8')):
  d=(f.parent/dep).resolve();d.relative_to(root);queue.append(d)
out={'status':'PASS','moduleCount':len(done),'sourceProfile':data['sourceProfile'],
 'scope':'recursive static relative imports of original source/norm modules only; dynamic imports and separate trace runtime are not silently covered',
 'modules':dict(sorted(done.items()))}
txt=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(txt,encoding='utf8',newline='\n')
print(json.dumps({'status':'PASS','moduleCount':len(done),'sourceProfile':out['sourceProfile']}))
