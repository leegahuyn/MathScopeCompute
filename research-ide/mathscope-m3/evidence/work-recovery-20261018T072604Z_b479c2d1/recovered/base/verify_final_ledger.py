#!/usr/bin/env python3
"""Check ledger arithmetic and authenticated evidence; not a proof kernel."""
import argparse
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
root = args.root.resolve()
ledger = json.loads((root / 'FINAL_ID_LEDGER.json').read_text(encoding='utf-8'))
ids = {'N6-01','N6-02','N6-07','N6-08','N7-04','N7-05','N7-06','N8-05'}
assert {item['id'] for item in ledger['items']} == ids
assert len(ledger['items']) == 8
closed = [item['id'] for item in ledger['items'] if item['status'] == 'CLOSED']
assert ledger['M3']['new_completed'] == len(closed)
assert ledger['M3']['completed'] == ledger['M3']['inherited_completed'] + len(closed)
assert ledger['M3']['total'] == 64
assert ledger['initial_obligations']['completed'] == ledger['initial_obligations']['total'] == 1260
assert ledger['constants'] == {'B0':'7/10','C0_star':'6/5'}
verified = set()
for item in ledger['items']:
    assert item['status'] in ('OPEN', 'CLOSED')
    if item['status'] == 'CLOSED':
        assert len(item['independent_reviews']) >= 2
        assert not item['remaining_original_obligations']
    else:
        assert item['remaining_original_obligations']
    for evidence in item['evidence_files'] + item['independent_reviews']:
        relative = Path(evidence['path'])
        assert not relative.is_absolute() and '..' not in relative.parts
        raw = (root / relative).read_bytes()
        assert len(raw) == evidence['size_bytes']
        assert hashlib.sha256(raw).hexdigest() == evidence['sha256'], evidence['path']
        verified.add(evidence['path'])
result = {'passed':True,'M3':ledger['M3'],'initial_obligations':ledger['initial_obligations'],'evidence_files_verified':len(verified),'scope':'Ledger integrity and input hashes only; mathematical decisions are documented theorem applications and reviews.'}
args.out.parent.mkdir(parents=True,exist_ok=True)
args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'passed':True,'M3_completed':ledger['M3']['completed'],'verified_files':len(verified)}))
