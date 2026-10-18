"""RECOVERY: trace canonical seed potentials/pressure into authenticated source.

This extends the 93-root coefficient raw capture; it does not evaluate a kernel
or conflate initialized ingredients with the final summed field.
"""
from pathlib import Path
import collections
import hashlib
import importlib.util
import json
import sqlite3

BASE=Path(__file__).resolve().parents[1]
WORKSPACE=BASE.parents[2]
ROOT=WORKSPACE/'recovered/base'
SCALAR=WORKSPACE/'work/prune_recovery/scalar'
NATIVE=WORKSPACE/'work/prune_recovery/native'
def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def pin(p):return {'path':str(p.relative_to(WORKSPACE)),'sha256':sha(p),'bytes':p.stat().st_size}
family_path=ROOT/'work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json'
assert sha(family_path)=='b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78'
family=load(family_path)
norm_path=ROOT/family['source_norm_family']['path']
assert sha(norm_path)==family['source_norm_family']['sha256']
norm=load(norm_path)
seed=next(n for n in family['nodes'] if n['operation']=='ActualInitializedState')['data']
actual_roots=norm['source']['actualRoots']
assert actual_roots['potential']['psi']==seed['potentials']['actual_five_psi']==3614778
assert actual_roots['potential']['compactPsi']==seed['potentials']['actual_five_compact_psi']==3614782
assert actual_roots['initializedVelocity']['v']==seed['actual_tuple']['mean_velocity']['v']==3614791
assert actual_roots['initializedPressure']['value']==seed['actual_tuple']['full_mean_pressure']==3615361
assert seed['actual_tuple']['full_pressure']==3825009
assert actual_roots['background']=={'b':622934,'V':634588,'G':622933}
closure_path=SCALAR/'evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json'
receipt_path=SCALAR/'evidence/SCALAR_RECOVERY_RECEIPT.json'
inventory_path=NATIVE/'evidence/NATIVE_BINDING_INVENTORY.json'
closure=load(closure_path);receipt=load(receipt_path);native=load(inventory_path)
assert receipt['missing_remaining']==0 and receipt['missing_recovered']==700
assert len(closure['records'])==128555 and len(native['semanticCalls'])==589
assert native['nonzeroExpressionDerivativeCount']==811
header_path=ROOT/'analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json'
assert sha(header_path)==receipt['source_header_sha256']
header=load(header_path);registries={}
def registry(value):
    for k,v in value.items():
        if k=='base':registry(v)
        elif isinstance(v,str):
            try:registries[k]=json.loads(v)
            except ValueError:pass
registry(header['definitions'])
helper_path=ROOT/'analysis/base/PR30-recovery-handoff/MathScopeCompute/tools/n6-native-domain-frontier-20261015/native_domain_extract.py'
assert sha(helper_path)=='566e1a18b5417cafecf9fe7a4cd2e38d1e270c0cc29c1d984448a579a2a92f9d'
spec=importlib.util.spec_from_file_location('original_native_helper',helper_path)
helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
database=SCALAR/'cache_recheck/independent-recheck.sqlite'
db=sqlite3.connect('file:'+str(database)+'?mode=ro',uri=True)
assert db.execute('select count(*) from nodes').fetchone()[0]==3892594
records=dict(closure['records']);new_records={}
def get(ident):
    key=str(ident)
    if key not in records:
        row=db.execute('select raw from nodes where id=?',(ident,)).fetchone()
        if row is None:raise ValueError('Missing authenticated source record '+key)
        records[key]=json.loads(row[0]);new_records[key]=records[key]
    return records[key]
assert get(31)=={'op':'coordinate','args':['initial$1']}
selected_checks=[]
for row in norm['selectedNodeBindings']:
    assert get(row['id'])==row['node']
    selected_checks.append(row['id'])
known_native={r['node'] for r in native['semanticCalls']}
groups=[
    ('original_five_potential_constituent',[3614778,3614782],['A0','A1','A2']),
    ('initialized_direct_swirl_constituents',[3614791,634588],['b']),
    ('complete_initialized_pressure',[3825009,3615361],['p']),
    ('background_seed_components',[622933,622934],['A0','A1','A2','b']),
]
reports=[];all_semantic={}
for name,roots,fields in groups:
    seen=set();frontiers={};stack=list(roots)
    while stack:
        ident=stack.pop()
        if ident in seen:continue
        seen.add(ident);node=get(ident)
        stack.extend(helper.argument_children(node))
        if node['op'] in helper.NATIVE:
            key,definition=helper.native_definition(node,registries)
            if type(definition.get('body')) is int:stack.append(definition['body'])
            if node['op'] not in ('actual_expression_partial','m3_aux_expression_partial','m3_coupled_expression_partial'):
                entry={'node':ident,'operation':node['op'],'registry':key,
                       'same_call_in_current_589':ident in known_native}
                frontiers[ident]=entry;all_semantic[ident]=entry
    reports.append({'name':name,'source_roots':roots,'related_final_jet_fields':fields,
                    'source_root_records':{str(i):get(i) for i in roots},
                    'raw_dependency_count':len(seen),
                    'outside_previous_128555_root_capture':len(seen-set(map(int,closure['records']))),
                    'semantic_native_calls':sorted(frontiers.values(),key=lambda r:r['node']),
                    'native_calls_in_current_589':sum(i in known_native for i in frontiers),
                    'native_calls_outside_current_589':sum(i not in known_native for i in frontiers),
                    'meaning':'Original initialized constituent dependency cone; not the final Cartesian jet or a numerical evaluation'})
request=load(BASE/'evidence/MISSING_ACTUAL_JET_REQUEST.json')
atom_links=[]
for atom in request['requested_field_jets']:
    field=atom.split('@')[0]
    atom_links.append({'jet':atom,'constituent_cones':[r['name'] for r in reports if field in r['related_final_jet_fields']],
        'remaining':'Differentiate before complete physical substitution, apply original gauge/cover, include every actual recursive correction and frozen cutoff; no final aggregate scalar root is supplied'})
norm_scope=norm['family']['scope']
result={'schema':'MathScope.RecoveryActualEnergySourceConnection/1',
    'implementation':'NEW_RECOVERY_IMPLEMENTATION_NOT_LOST_BYTES',
    'input_pins':[pin(p) for p in (closure_path,receipt_path,inventory_path,norm_path,family_path,header_path,helper_path,
                                 SCALAR/'cache_recheck/CACHE_PERSISTENCE_DIAGNOSTIC.json')],
    'canonical_seed_root_meanings':{
        'five_potential':{'roots':[3614778,3614782],
            'norm_archive_paths':['$.source.actualRoots.potential.psi','$.source.actualRoots.potential.compactPsi'],
            'frozen_family_paths':['$.nodes[1].data.potentials.actual_five_psi','$.nodes[1].data.potentials.actual_five_compact_psi'],
            'equalities_checked':True},
        'direct_swirl_constituents':{'roots':[3614791,634588],
            'norm_archive_paths':['$.source.actualRoots.initializedVelocity.v','$.source.actualRoots.background.V'],
            'equalities_checked':True},
        'pressure':{'roots':[3825009,3615361],
            'frozen_family_paths':['$.nodes[1].data.actual_tuple.full_pressure','$.nodes[1].data.actual_tuple.full_mean_pressure'],
            'mean_pressure_norm_archive_path':'$.source.actualRoots.initializedPressure.value','equalities_checked':True},
        'background':{'roots':[622933,622934],
            'norm_archive_paths':['$.source.actualRoots.background.G','$.source.actualRoots.background.b'],
            'equalities_checked':True}},
    'current_initialized_capture':{'historical_missing':700,'recovered':700,'missing_remaining':0,
        'raw_records':128555,'semantic_native_calls':589,'nonzero_expression_derivative_calls':811,
        'semantic_definedness_and_numeric_evaluation_complete':False},
    'canonical_initialized_constituent_connections':reports,
    'additional_raw_records_recovered':len(new_records),
    'additional_raw_records_file':'ENERGY_ADDITIONAL_RAW_SOURCE_RECORDS.json',
    'final_jet_to_constituent_connections':atom_links,
    'current_589_intersection_union':sum(i in known_native for i in all_semantic),
    'additional_semantic_calls_outside_current_589':sorted((v for i,v in all_semantic.items() if i not in known_native),key=lambda r:r['node']),
    'outer_cutoff_13_jet_connection':{'original_operator_binding':'ACTUAL_ENERGY_OPERATOR_BINDING.json',
        'formula':request['outer_cutoff'],
        'captured_localization_graph_is_not_implicitly_same_as_raw_scalar_graph':True,
        'can_generate_finite_derivative_formula':True,'actual_closed_cell_numeric_enclosures_computed':False,
        'remaining':'Original qbig/h/scales and cell support branches must be enclosed; source indices from a different captured graph must not be looked up in the initialized graph by integer equality'},
    'original_norm_selector_review':{'source_norm_archive_sha256':sha(norm_path),
        'selected_actual_root_bindings_checked':selected_checks,
        'saved_initialized_scope':norm_scope,
        'certificates':[{'order':c['program']['request']['order'],
            'exactDeferredSourceNormExpressions':c['exactDeferredSourceNormExpressions'],
            'allIntegerDerivativeGraphsExecuted':c['allIntegerDerivativeGraphsExecuted'],
            'scope':c['scope']} for c in norm['certificates']],
        'frozen_correction_bound_nodes':[n['id'] for n in family['nodes'] if n['operation']=='ExactSourceFunctionalBound'],
        'conclusion':'Saved material gives same-source initialized norm recipes and 28 verified scalar-root bindings. It does not evaluate the frozen correction-wise exact sup/min functionals or identify those with these initialized bounds. No alternate schedule substituted.',
        'frozen_selector_values_resolved':False},
    'actual_final_jets_evaluated':False,'whole_K_energy_integrated':False,
    'N706_closed':False,'N805_closed':False,'actual_last_resolved_tau':None}
(BASE/'evidence/ACTUAL_ENERGY_SOURCE_CONNECTION.json').write_text(json.dumps(result,indent=2)+'\n')
(BASE/'evidence/ENERGY_ADDITIONAL_RAW_SOURCE_RECORDS.json').write_text(json.dumps({
    'schema':'MathScope.RecoveryEnergyAdditionalRawSource/1','source_header_sha256':receipt['source_header_sha256'],
    'source_node_sha256':receipt['authentication']['parentSHA256'],'records':dict(sorted(new_records.items(),key=lambda kv:int(kv[0]))),
    'numeric_values_computed':False},separators=(',',':'))+'\n')
print(json.dumps({'canonical_groups':len(reports),'additional_raw_records':len(new_records),
    'joined_current_589':result['current_589_intersection_union'],
    'additional_semantic_frontiers':len(result['additional_semantic_calls_outside_current_589']),
    'verified_norm_source_roots':len(selected_checks),'missing_original_records':0,'N706_closed':False}))
