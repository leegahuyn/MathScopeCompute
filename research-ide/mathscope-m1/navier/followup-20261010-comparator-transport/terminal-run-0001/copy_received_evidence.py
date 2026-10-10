#!/usr/bin/env python3
"""Preserve received evidence without changing its original verdicts."""
from pathlib import Path
import datetime
import hashlib
import json
import shutil

BASE=Path('/workspace/scratch/9a6c38c54c2e')
EDITION=BASE/'MathScopeCompute/research-ide'
T=EDITION/'mathscope-m1/navier/followup-20261010-comparator-transport'
OUT=T/'terminal-run-0001'
SOURCES={
 'protected-run-0001':BASE/'tmp/ns-guard-repair-20261010/protected-run-0001',
 'terminal-actual-audit-0001':BASE/'tmp/ns-guard-repair-20261010/terminal-actual-audit-0001',
 'independent-terminal-actual-0001':BASE/'tmp/ns-guard-repair-20261010/independent-terminal-actual-0001',
 'terminal-job-log-reconstruction-0001':BASE/'tmp/ns-guard-repair-20261010/terminal-job-log-reconstruction-0001',
 'producer-terminal-schema-review-0001':BASE/'tmp/ns-guard-repair-20261010/producer-terminal-schema-review-0001',
 'prior-checkpoint-publication-receipts':BASE/'tmp/github-evidence-checkpoint-upload-20261010/receipts',
}
def sha(data):return hashlib.sha256(data).hexdigest()
def write_json(path,value):
 with path.open('x',encoding='utf-8') as f:json.dump(value,f,ensure_ascii=False,indent=2);f.write('\n')

OUT.mkdir(exist_ok=False)
copied=[]
for label,root in SOURCES.items():
 if not root.is_dir():raise ValueError('Missing received input '+str(root))
 original=sorted(p for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts)
 if not original:raise ValueError('Empty received input '+str(root))
 for source in original:
  if source.is_symlink():raise ValueError('Symlink input '+str(source))
  data=source.read_bytes();target=OUT/'raw'/label/source.relative_to(root)
  target.parent.mkdir(parents=True,exist_ok=True)
  with target.open('xb') as f:f.write(data)
  if target.read_bytes()!=data or source.read_bytes()!=data:raise ValueError('Copy/source changed '+str(source))
  copied.append({'sourceAbsolutePath':str(source),'destinationRelativePath':target.relative_to(OUT).as_posix(),'bytes':len(data),'sha256':sha(data),'sourceAndDestinationBytesEqualWhenCopied':True})
 if original!=sorted(p for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts):raise ValueError('Source set changed '+str(root))
mapping={'schema':'MathScope.ActualTerminalHandoffSourceMapping/1','copiedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'destinationRootRelativeToResearchIDE':OUT.relative_to(EDITION).as_posix(),'copiedFileCount':len(copied),'copiedBytes':sum(x['bytes'] for x in copied),'copiedFiles':copied,'sourceBytesRewritten':False,'actualProductionRunId':38014602021,'actualProductionJobId':114101981614,'actualProductionStatus':'completed/success','N106Completed':False,'currentDatedAssessmentCounts':{'PASS':69,'PARTIAL':1,'BLOCKED':0},'scope':'Exact received production artifact, final and earlier API observations, original raw job-log parts and reconstructed bytes, first actual auditor failures and checkpoint receipts. Preservation success does not complete N1-06.'}
write_json(OUT/'source-mapping.json',mapping)
shutil.copyfile(Path(__file__),OUT/'copy_received_evidence.py')
print(json.dumps({'root':str(OUT),'files':len(copied),'bytes':mapping['copiedBytes'],'mappingSHA256':sha((OUT/'source-mapping.json').read_bytes())}))
