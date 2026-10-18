"""Reject caught core failures even when the Node recorder exits zero."""
import argparse,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--directory',type=Path,required=True);args=p.parse_args()
core=json.loads((args.directory/'ACTUAL_CORE_TWO_FOLD_EXECUTION.json').read_text(encoding='utf-8'))
assert 'errorCode' not in core and 'errorMessage' not in core, 'Core recorder caught an evaluation error.'
r=core['result']
assert r['status']=='CORE_REFINEMENTS_EXECUTED_FINAL_FIELD_PENDING'
assert r['freshCoreComparisonsExecuted'] is True
assert r['execution']['uniqueCoreEvaluations']==7
assert r['execution']['binary64UsedForDecisions'] is False
assert {f['axis'] for f in r['families']}=={'spatialGrid','comparisonDegree','arithmeticBits'}
assert all(len(f['levels'])==2 and len(f['variants'])==2 for f in r['families'])
assert r['adaptationAxes']['fourierCutoff']['executed'] is False
assert core['actualFinalFieldEvaluated'] is False and core['actualLastResolvedTau'] is None
backend=json.loads((args.directory/'ORIGINAL_NUMERIC_BACKEND_ATTEMPT.json').read_text(encoding='utf-8'))
assert {a['parameter'] for a in backend['attempts']}=={'h','T','lambda'}
assert len(backend['attempts'])==3
assert all(a.get('errorCode')=='EXACT_SOURCE_SCALE_NOT_REPRESENTABLE' and 'returned' not in a for a in backend['attempts'])
assert all(a['parameterOverridesUsed'] is False and a['coordinateOverridesUsed'] is False for a in backend['attempts'])
result={'passed':True,'actualCoreEvaluations':7,'independentAxes':3,'expectedBackendScaleLimits':3,'scope':'Partial actual core and explicit original backend limits; not N7-06/N8-05 or final-field validation.'}
(args.directory/'PARTIAL_NUMERIC_OUTPUT_ACCEPTANCE.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))
