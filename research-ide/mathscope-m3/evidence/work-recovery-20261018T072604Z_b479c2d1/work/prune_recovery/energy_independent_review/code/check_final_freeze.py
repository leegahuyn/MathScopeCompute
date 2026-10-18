#!/usr/bin/env python3
"""Verify final package pins and original zero-order pressure recipe rows."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parents[1]
ENERGY=ROOT/'work/prune_recovery/energy'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def objsha(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
manifest_path=ENERGY/'RECOVERY_MANIFEST.json';manifest=json.loads(manifest_path.read_bytes())
assert sha(manifest_path)=='da7fced4f849d8fcd31015826558077bbccec888e964d0d4a369403d362a3269'
for row in manifest['files']:
    p=ENERGY/row['path'];assert p.stat().st_size==row['bytes'] and sha(p)==row['sha256'],row['path']
header=json.loads((ROOT/'work/recovery_git/recovered/runtime/source/header.json').read_bytes());reg={}
def visit(d):
    for k,v in d.items():
        if k=='base':visit(v)
        elif isinstance(v,str):
            try:reg[k]=json.loads(v)
            except ValueError:pass
visit(header['definitions'])
pressure_path=ENERGY/'evidence/ADDITIONAL_PRESSURE_INDEXED_RECIPE.json';pressure=json.loads(pressure_path.read_bytes());recipe=pressure['recipe'];definition=reg['fieldDefinitions'][9]
extra=json.loads((ENERGY/'evidence/ENERGY_ADDITIONAL_RAW_SOURCE_RECORDS.json').read_bytes())['records'];node=extra['3676897']
assert extra['3825009']=={'op':'add','args':[3676897,3677236]}
assert node['op']=='m3_aux_indexed_partial' and node['args'][0]==9
assert recipe['sourceDefinitionSHA256']==objsha(definition)
assert recipe['outerParameters']==definition['parameters'] and recipe['outerArgumentNodes']==node['args'][1]
assert recipe['orders']==node['args'][2] and not any(recipe['orders'])
assert len(recipe['rows'])==len(definition['rows'])==162
for i,(observed,source) in enumerate(zip(recipe['rows'],definition['rows'])):
    assert observed['index']==i
    for key in ['label','guards','localSystem','localBody','localParameters']:assert observed[key]==source[key]
    assert observed['argumentNodes']==source['values'] and observed['rowCoefficientNode']==source['coefficient']
    assert observed['derivatives']==[{'localOrders':[0]*len(source['localParameters']),'integerMultiplier':1,'coefficientNodeFactors':[]}]
assert recipe['guardBeforeLocalBody'] and recipe['differentiateLocalBodyBeforeSimultaneousSubstitution']
assert not recipe['labelsDifferentiated'] and not recipe['nearestCopyDifferentiated']
assert not recipe['numericValueComputed'] and not pressure['numeric_pressure_computed']
checks=json.loads((ENERGY/'evidence/RECOVERY_CHECKS.json').read_bytes());assert checks['passed']==54 and checks['failed']==0
for name in ('operator','checks','connection','pressure'):
    assert (ENERGY/f'logs/{name}.exit.txt').read_text().strip()=='0'
    assert (ENERGY/f'logs/{name}.stderr.log').stat().st_size==0
report={'schema':'MathScope.EnergyFinalFreezeReview/1','status':'PASS',
        'review_code_sha256':sha(Path(__file__)),'worker_manifest_sha256':sha(manifest_path),
        'worker_payload_files_verified':len(manifest['files']),
        'worker_payload_bytes_verified':sum(row['bytes'] for row in manifest['files']),
        'worker_manifest_members':manifest['files'],
        'worker_recorded_checks':54,'worker_recorded_execution_exits':[0,0,0,0],
        'pressure_recipe_sha256':sha(pressure_path),'pressure_definition_sha256':objsha(definition),
        'pressure_original_rows_compared':162,'pressure_local_zero_order_requests_verified':162,
        'pressure_outer_source_tuple_exact':True,'source_pressure_root':3825009,'pressure_indexed_child':3676897,
        'other_complete_pressure_child_retained':3677236,'pressure_numeric_value_computed':False,
        'review_discovered_issues_resolved':['Explicit historical700/138 versus current missing0/semantic589 separation',
          'Canonical binding hash, copied input, and repeated integrity check reject weakened jet/source requests',
          'Named psi/compactPsi and complete pressure root meanings pinned to original norm archive and frozen family'],
        'N706_closed':False,'N805_closed':False,'source_producers_executed':False,'sqlite_opened':False}
(OUT/'FINAL_FREEZE_REVIEW.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='worker_manifest_members'},indent=2))
