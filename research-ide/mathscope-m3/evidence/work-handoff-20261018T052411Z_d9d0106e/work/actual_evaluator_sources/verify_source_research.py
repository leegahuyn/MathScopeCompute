#!/usr/bin/env python3
"""Portable pin check and exact kernel replay; never an N7/N8 acceptance flag."""
import argparse
import hashlib
import json
from pathlib import Path
from constructive_kernels import audit

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
args = parser.parse_args()
root = args.root.resolve()
here = root/'work/actual_evaluator_sources'
pins = json.loads((here/'SOURCE_PINS.json').read_text())
checks=[]
for row in pins['sources']:
    path=(root/row['path']).resolve()
    if not path.is_relative_to(root):
        raise ValueError('source path escaped root')
    data=path.read_bytes()
    ok=len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256']
    checks.append({'path':row['path'],'pass':ok})
if not all(r['pass'] for r in checks):
    raise AssertionError('source changed')
expected=json.loads((here/'ELEMENTARY_KERNEL_AUDIT.json').read_text())
if audit()!=expected:
    raise AssertionError('elementary kernel audit does not replay')
result={'schema':'MathScope.ActualEvaluatorSourceResearchReplay/1',
        'source_pin_checks':checks,'kernel_replay_exact':True,
        'scope':expected['scope'],'N706_or_N805_closed':False}
(here/'RESEARCH_REPLAY.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'pass':True,'pinned_sources':len(checks),'kernel_replay_exact':True,
                  'N706_or_N805_closed':False}))
