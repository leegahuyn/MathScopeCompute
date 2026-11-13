#!/usr/bin/env python3
"""Hash the fixed same-live input, source blobs, scripts and transfer outputs."""
import hashlib,json
from pathlib import Path
D=Path('work/goal-next/continuation41/forced-transfer')
files=[D/x for x in ('README.md','transfer_primary_class_constants.py','source_mode_two_leibniz.py','compose_mode_two_majorant.py','bound_selected_fixed_lifts.py','hash_forced_transfer.py','n3-primary-constants-transfer.json','n3-mode-two-source-c4.json','n3-mode-two-k-transfer.json','n3-selected-lifts-exact.json')]
files.extend(Path(x) for x in (
 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-join/active-n3-c5-binding/norm-leading/n3-whole-k.json',
 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-join/active-n3-c5-binding/bind_live_primary_c5.mjs',
 'work/goal-next/continuation40/first-cycle-43372241418/same-family-mode-two.json',
 'work/goal-next/continuation40/first-cycle-43372241418/primary-K-arithmetic-frontier.json',
 'work/goal-next/continuation32/n4-25m-preflight/runtime/research-ide/mathscope-m3/navier/source-primary-class-majorants.mjs',
 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-harmonic-assembly.mjs',
 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-initialized-angular.mjs',
 'work/MathScopeCompute-CD/research-ide/mathscope-m3/navier/source-global-forced-current.mjs',
 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-global-band.mjs',
 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-global-pressure.mjs',
 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/global-source-index.mjs',
 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier/actual-common-band-physical-curl.mjs',
 'work/goal-next/continuation27/original-primary-degree-runtime/research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs'))
rows=[]
for f in files:
 h=hashlib.sha256()
 with f.open('rb') as src:
  for chunk in iter(lambda:src.read(1<<20),b''):h.update(chunk)
 rows.append({'path':f.as_posix(),'bytes':f.stat().st_size,'sha256':h.hexdigest()})
out={'status':'PASS_SAME_LIVE_MODE_TWO_TRANSFER_BYTE_HASHES','files':rows,'scope':'File integrity only; source theorem premises, C4 and W5 remain independent proof obligations.','release':'HOLD'}
(D/'forced-transfer-byte-hashes.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS',len(rows),'input, output and code hashes')
