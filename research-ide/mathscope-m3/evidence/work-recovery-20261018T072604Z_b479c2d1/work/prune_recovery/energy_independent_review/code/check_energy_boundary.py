#!/usr/bin/env python3
"""Independent adapter-mutation, additional-source, and scope review."""
from pathlib import Path
import copy
import gzip
import hashlib
import importlib.util
import json
import sys
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'recovered/base';ENERGY=ROOT/'work/prune_recovery/energy'
OUT=Path(__file__).resolve().parents[1]

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_bytes())
def check(v,m):
    if not v:raise AssertionError(m)
def module(p,name):
    spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);sys.modules[name]=m;spec.loader.exec_module(m);return m

def main():
    worker=ENERGY/'code/actual_energy_backend.py';backend=module(worker,'energy_review_backend')
    binding_path=ENERGY/'evidence/ACTUAL_ENERGY_OPERATOR_BINDING.json';binding=load(binding_path)
    adapter=backend.FrozenActualEnergyAdapter(BASE,binding)
    request=adapter.required_request()
    check(len(request['requested_field_jets'])==67 and len(request['requested_cutoff_jets'])==13,'Incomplete exact source jet request')
    try:adapter.evaluate_actual_cell()
    except backend.MissingActualJet as e:check(e.code=='MISSING_ACTUAL_JET' and e.request==request,'Changed structured actual boundary')
    else:raise AssertionError('Actual values fabricated')
    mutations=[]
    for label,mutate in [
        ('omitted required atoms',lambda b:b.update(requiredAtoms=[])),
        ('omitted source pins',lambda b:b.update(sourcePins=[])),
        ('modified velocity polynomial',lambda b:b['exactPolynomials']['velocity'][0][0].update(coefficient='999'))]:
        bad=copy.deepcopy(binding);mutate(bad)
        try:backend.FrozenActualEnergyAdapter(BASE,bad)
        except ValueError as e:check(str(e)=='CHANGED_EXACT_OPERATOR_BINDING','Unexpected mutation rejection');mutations.append(label)
        else:raise AssertionError('Altered source request accepted: '+label)
    local=copy.deepcopy(binding);isolated=backend.FrozenActualEnergyAdapter(BASE,local);local['requiredAtoms']=[]
    check(len(isolated.required_request()['requested_field_jets'])==67,'Caller alias mutates frozen request')
    isolated.binding['requiredAtoms']=[]
    try:isolated.required_request()
    except ValueError as e:check(str(e)=='CHANGED_EXACT_OPERATOR_BINDING','Post-init mutation rejection');mutations.append('post-construction binding mutation')
    else:raise AssertionError('Mutated internal request accepted')
    try:backend.energy_contract_nu_one(backend.Interval(0,1),0,0,0,0)
    except ValueError as e:check(str(e)=='INITIAL_ENERGY_MUST_BE_EXACTLY_ZERO','Wrong initial energy condition')
    else:raise AssertionError('Nonzero/uncertain initial energy accepted')
    energy=backend.energy_contract_nu_one(0,4,0,2,1)
    check(energy['nu_one_10_13_status']=='VIOLATED' and energy['actual_field_authenticated'] is False,'Force norm integral conflated or generic promoted')
    zero=backend.energy_contract_nu_one(0,0,0,0,0)
    check(zero['zero_in_defect'] and zero['zero_in_defect_is_not_an_identity_proof'] and not zero['actual_field_authenticated'],'Defect inclusion promoted to identity')
    check(backend.Interval(-2,3).square()==backend.Interval(0,9),'Interval square invalid at zero')
    # Only the independently audited raw-export node table is trusted; the
    # worker's SQLite cache is never opened by this reviewer.
    scalar=ROOT/'work/prune_recovery/scalar';old_path=scalar/'evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json'
    previous_review=load(ROOT/'work/prune_recovery/scalar_independent_review/INDEPENDENT_REVIEW.json')
    check(sha(old_path)==previous_review['reviewed_output_sha256'][old_path.name],'Changed independently audited raw export')
    original=load(old_path)['records'];extra_path=ENERGY/'evidence/ENERGY_ADDITIONAL_RAW_SOURCE_RECORDS.json';extra=load(extra_path)['records']
    connection_path=ENERGY/'evidence/ACTUAL_ENERGY_SOURCE_CONNECTION.json';connection=load(connection_path)
    records=dict(original)
    for i,n in extra.items():check(i not in records or records[i]==n,'Conflicting extra record');records[i]=n
    source=ROOT/'work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz'
    check(sha(source)=='42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3','Changed pinned gzip')
    matched=set()
    with gzip.open(source,'rb') as stream:
        header_bytes=stream.readline();header=json.loads(header_bytes)
        check(hashlib.sha256(header_bytes).hexdigest()=='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1','Wrong source header')
        for line in stream:
            key,payload=line[1:].split(b',',1);ident=key.decode()
            if ident in extra:
                check(json.loads(payload[:-2])==extra[ident],'Additional source differs at '+ident);matched.add(ident)
    check(matched==set(extra) and len(extra)==142,'Additional original byte record count')
    # Reuse only this reviewer's independent source-edge definitions, not any
    # worker/helper implementation or mutable SQLite authority.
    rules_path=ROOT/'work/prune_recovery/scalar_independent_review/code/review_recovery.py'
    check(sha(rules_path)==previous_review['review_code_sha256'],'Independent edge-rule source changed')
    rules=module(rules_path,'independent_scalar_rules');registries=rules.registry_map(header)
    known=set(load(old_path)['native_calls'])
    known_semantic={i for i in known if original[i]['op'] not in rules.EXPR}
    union={};group_results=[]
    for group in connection['canonical_initialized_constituent_connections']:
        seen=set();frontiers={};stack=list(group['source_roots'])
        while stack:
            i=stack.pop()
            if i in seen:continue
            seen.add(i);node=records[str(i)];stack.extend(rules.edges(node))
            if node['op'] in rules.NATIVE:
                key,d=rules.resolve(node,registries)
                if type(d.get('body')) is int:stack.append(d['body'])
                if node['op'] not in rules.EXPR:
                    entry={'node':i,'operation':node['op'],'registry':key,'same_call_in_current_589':str(i) in known_semantic}
                    frontiers[i]=entry;union[i]=entry
        check(len(seen)==group['raw_dependency_count'],'Constituent dependency count differs')
        check(len(seen-set(map(int,original)))==group['outside_previous_128555_root_capture'],'Constituent new node count differs')
        check(sorted(frontiers.values(),key=lambda x:x['node'])==group['semantic_native_calls'],'Constituent semantic inventory differs')
        group_results.append({'name':group['name'],'roots':group['source_roots'],'raw_records':len(seen),'native_calls':len(frontiers)})
    check(sum(str(i) in known_semantic for i in union)==584,'Current native intersection')
    check(set(i for i in union if str(i) not in known_semantic)=={3676897},'Additional pressure native identity')
    family_path=BASE/'work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json';family=load(family_path)
    check(sha(family_path)==backend.FrozenActualEnergyAdapter.FAMILY_SHA256,'Changed frozen family')
    norm_path=BASE/family['source_norm_family']['path'];norm=load(norm_path)
    check(sha(norm_path)==family['source_norm_family']['sha256'],'Changed source norm archive')
    potentials=norm['source']['actualRoots']['potential']
    check(potentials['psi']==3614778 and potentials['compactPsi']==3614782,'Potential names are not original exact IDs')
    node=family['nodes'][1]['data']
    check(node['potentials']['actual_five_psi']==3614778 and node['potentials']['actual_five_compact_psi']==3614782,'Frozen canonical potential mapping differs')
    check(node['actual_tuple']['full_pressure']==3825009 and node['actual_tuple']['full_mean_pressure']==3615361,'Frozen full pressure mapping differs')
    for row in norm['selectedNodeBindings']:check(records[str(row['id'])]==row['node'],'Original source norm named scalar differs')
    ledger_path=BASE/'FINAL_ID_LEDGER.json';ledger=load(ledger_path)
    check(ledger['initial_obligations']['completed']==ledger['initial_obligations']['total']==1260,'Initial obligation inventory changed')
    check(ledger['M3']['completed']==62 and ledger['M3']['total']==64 and ledger['M3']['open_from_requested_eight']==['N7-06','N8-05'],'Final M3 inventory changed')
    report={'schema':'MathScope.EnergyBoundaryIndependentReview/1','status':'PASS','review_code_sha256':sha(Path(__file__)),
      'backend_code_sha256':sha(worker),'binding_sha256':sha(binding_path),'source_connection_sha256':sha(connection_path),'extra_records_sha256':sha(extra_path),
      'mutated_binding_rejections':mutations,'caller_alias_isolated':True,'exact_initial_energy_zero_enforced':True,
      'energy_10_13_force_norm_not_force_squared':True,'generic_arithmetic_not_actual_field_authentication':True,
      'actual_adapter_outcome':'MISSING_ACTUAL_JET','actual_fields_evaluated':False,'requested_field_jets':67,'requested_cutoff_jets':13,
      'additional_records_independently_compared_to_original_gzip':142,'constituent_cones_independently_reconstructed':group_results,
      'intersection_with_current_589':584,'additional_semantic_call':3676897,
      'named_potential_mapping_verified':{'archive_sha256':sha(norm_path),'pointer':'$.source.actualRoots.potential','psi':3614778,'compactPsi':3614782,'frozen_family_sha256':sha(family_path)},
      'norm_selected_root_bindings_verified':len(norm['selectedNodeBindings']),
      'initial_and_final_inventories':{'ledger_sha256':sha(ledger_path),'initial_completed':1260,'initial_total':1260,'initial_scope':ledger['initial_obligations']['scope'],'M3_completed':62,'M3_total':64,'final_open':['N7-06','N8-05']},
      'frontier_units':{'historical_missing_records':700,'historical_bodyless_native_boundaries':138,'current_missing_records':0,'current_raw_records':128555,'current_semantic_native_calls':589,'current_nonzero_expression_derivatives':811,'additional_raw_records':142,'new_pressure_semantic_call_count':1},
      'scope':'Raw initialized constituents and exact generic localization consumer; no identified final canonical jet evaluator, frozen selector values, or whole-K quadrature.',
      'source_producer_executed':False,'sqlite_opened':False,'N706_closed':False,'N805_closed':False,'actual_last_resolved_tau':None}
    (OUT/'BOUNDARY_REVIEW.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
