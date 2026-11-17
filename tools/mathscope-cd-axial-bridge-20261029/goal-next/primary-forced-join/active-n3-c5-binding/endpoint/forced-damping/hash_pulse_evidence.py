#!/usr/bin/env python3
"""Hash and validate the two-system pulse evidence chain."""
import hashlib,json
from pathlib import Path
D=Path('work/goal-next/continuation44/forced');W=Path('work/goal-next/continuation36/hosted-43363985266/mathscope-original-n3-primary-c5')
files=[D/n for n in ('README.md','extract_actual_pulse_matrix.py','certify_actual_damping.py','certify_damping_floor.py','hash_pulse_evidence.py','two-pulse-source-windows.json','n3-two-actual-pulse-damping-transport.json','n3-two-actual-pulse-damping-floor.json')]
files += [W/n for n in ('same-family-mode-two.json','primary-c5-native.json','witness/original-active-mode-two-witness.json','witness/original-source-functions.json','witness/original-source-nodes.jsonl.gz')]
files += [Path('work/goal-next/second-live/node-fixture/research-ide/mathscope-m3/navier/source-forced-pulse.mjs'),Path('work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-global-band.mjs')]
rows=[]
for f in files:
 h=hashlib.sha256()
 with f.open('rb') as stream:
  for chunk in iter(lambda:stream.read(1<<20),b''):h.update(chunk)
 rows.append({'path':f.as_posix(),'bytes':f.stat().st_size,'sha256':h.hexdigest()})
get=lambda f:next(r['sha256'] for r in rows if r['path']==f.as_posix())
A=json.loads((D/'n3-two-actual-pulse-damping-transport.json').read_bytes());B=json.loads((D/'n3-two-actual-pulse-damping-floor.json').read_bytes());X=json.loads((D/'two-pulse-source-windows.json').read_bytes())
assert A['status']=='CONDITIONAL_ACTUAL_TWO_MODE_SCALAR_DAMPING_TRANSPORT' and B['status']=='CONDITIONAL_ACTUAL_TWO_MODE_POSITIVE_DAMPING_FLOOR'
assert B['priorDampingSHA256']==get(D/'n3-two-actual-pulse-damping-transport.json') and A['uncompressedSourceGraphSHA256']==X['witnessGraphSHA256'] and A['sameLiveCheckpointSHA256']==get(W/'same-family-mode-two.json')
out={'status':'PASS_ACTUAL_TWO_PULSE_EVIDENCE_BYTE_HASH_CHAIN','files':rows,'scope':'File integrity and recorded source identity only; source-domain analytic assumptions and numerical F,A,B remain separate.','release':'HOLD'}
(D/'pulse-byte-hashes.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS',len(rows),'files and receipt dependency chain')
