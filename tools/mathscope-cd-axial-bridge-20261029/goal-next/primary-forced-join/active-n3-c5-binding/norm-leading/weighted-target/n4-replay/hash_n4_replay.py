#!/usr/bin/env python3
"""Portable byte-hash manifest for the N4 source, inputs, scripts and receipts."""
import hashlib,json
from pathlib import Path
D=Path('work/goal-next/continuation40/n4-target');A=D/'hosted-43373034256-n4';O=D/'n4-live'
files=[A/n for n in ('primary-c5-native.json','primary-K-binding-index.json','primary-K-arithmetic-frontier.json','primary-target-c6-source.jsonl.gz')]
files += [O/n for n in ('n4-live-c6-c7-binding.json','n4-three-integrals-binding.json','n4-weighted-target-classification.json','n4-weighted-target-directed.json','n4-weighted-target-readback.json','n4-replay-summary.json')]
files += [D/n for n in ('replay_hosted_n4.py','match_c6_certified.py','safe_common_nodes.py','test_safe_common_nodes.py','bind_three_source_integrals.py','classify_weighted_target.py','evaluate_weighted_target.mjs','check_weighted_target_directed.py','hash_n4_replay.py','README.md')]
files += [Path(p) for p in ('work/goal-next/continuation38/target-bound/c7-grammar-test.jsonl.gz','work/goal-next/continuation38/target-bound/c7-candidate-168.json','work/goal-next/continuation38/target-bound/c7-directed-readback.json','work/goal-next/whole-k-prefix/compare_selector_exports.py','work/goal-next/whole-k-prefix/historical-scale-arithmetic-input.json','work/goal-next/whole-k-prefix/historical-scale-arithmetic-result.json','work/goal-next/axial-recursion/hosted-43020929929/original-n2-current-pressure-graph/original-source-nodes.jsonl.gz','work/goal-next/continuation37/slow-chart-directed.json','work/goal-next/continuation37/slow-chart-majorant.json','work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/whole-k-annular-initial/numerical/source_arithmetic.mjs')]
runtime=Path('work/goal-next/annular-numeric-24/pinned-original-runtime')
pins=json.loads(Path('work/goal-next/whole-k-prefix/historical-scale-arithmetic-result.json').read_bytes())['sourcePins']
files += [runtime/p for p in pins]
rows=[]
for f in files:
 h=hashlib.sha256()
 with f.open('rb') as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
 rows.append({'path':f.as_posix(),'bytes':f.stat().st_size,'sha256':h.hexdigest()})
for rel,pin in pins.items():
 assert next(r['sha256'] for r in rows if r['path']==(runtime/rel).as_posix())==pin,rel
out={'status':'PASS_N4_BYTE_HASH_MANIFEST','files':rows,'scope':'Byte hashes identify replay inputs and outputs; they do not establish mathematical validity or source seals.','release':'HOLD'}
(O/'n4-byte-hash-manifest.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS',len(rows),'files')
