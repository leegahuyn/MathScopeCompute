#!/usr/bin/env python3
"""Source-SHA-bound 217 natural-series calls: exact local-domain obligations.

Input is the verified 56->43 normal-form receipt from
audit_source56_Y_algebraic_normal_forms.py, not an invented range.
This is a PROOF-OBLIGATION COMPILER, not an interval certificate.

All 217 selected calls have Y=Lambda*source_coordinate or Lambda*xi**2,
with original Lambda>0. Their upper-bound proof is explicitly OPEN.
No stored cutoff in source-global-band.mjs is silently identified with
any of these source coordinates.
"""
import json,sys
from collections import defaultdict
from pathlib import Path

GRAPH_SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG_SHA='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
NAMES={
 'COORD:X * Lambda':('X',8,114,'0 <= X <= 5/Lambda',
                    'original full slow chart is insufficient; source call support subchart needed'),
 'COORD:actual_inner_xi^2 * Lambda':('xi',3,33,
                    'abs(actual_inner_xi) <= sqrt(5/Lambda)',
                    'source-specific xi support bound and coordinate/cutoff identity needed'),
 'COORD:actual_n1_Omega_prefix0$201 * Lambda':('Omega0',2,26,
                    '0 <= bound radial integration variable actual_n1_Omega_prefix0$201 <= 5/Lambda at each selected natural branch',
                    'integral binder and selected natural branch; this coordinate is NOT an integral result or implicit root'),
 'COORD:actual_n1_Omega_prefix1$202 * Lambda':('Omega1',2,26,
                    '0 <= bound radial integration variable actual_n1_Omega_prefix1$202 <= 5/Lambda at each selected natural branch',
                    'integral binder and selected natural branch; this coordinate is NOT an integral result or implicit root'),
 'COORD:actual_n1_Omega_prefix2$203 * Lambda':('Omega2',2,18,
                    '0 <= bound radial integration variable actual_n1_Omega_prefix2$203 <= 5/Lambda at each selected natural branch',
                    'integral binder and selected natural branch; this coordinate is NOT an integral result or implicit root'),
}
class UnsupportedNaturalSourceObligation(ValueError):pass

def audit_217_domain_obligations(receipt):
    if (receipt.get('schema')!='MathScope.M3.Source56ConservativeAlgebraicNormalForms/1' or
        receipt.get('original_node_SHA256')!=GRAPH_SHA or
        receipt.get('native_registry_SHA256')!=REG_SHA or
        receipt.get('source_pairs')!=56 or receipt.get('source_calls')!=523 or
        receipt.get('Y_bound_certified_calls')!=33 or receipt.get('remaining_unproved_Y_bounds')!=490 or
        receipt.get('different_algebraic_signatures')!=43 or
        receipt.get('coefficient_Brho_norm_le_Q_proved') is not False or
        receipt.get('final_67_closed_cell_jets_certified')!=0):
        raise UnsupportedNaturalSourceObligation('Expected immutable original 56->43 source receipt and RELEASE HOLD')
    rows=[r for r in receipt.get('per_pair',[]) if r.get('normal_form') in NAMES]
    result=defaultdict(lambda:{'pair_count':0,'natural_calls':0,'source_log_guard_pairs':0,'source_log_guard_calls':0,'input_pairs':[]})
    seen=set()
    for r in rows:
        name=r['normal_form'];group,expected_pairs,expected_calls,criterion,reason=NAMES[name]
        key=(r['Y_id'],r['eta_id'])
        if key in seen or type(r.get('calls')) is not int or r['calls']<1:
            raise UnsupportedNaturalSourceObligation('Duplicate source arguments or invalid actual call count')
        seen.add(key)
        guards=r.get('positive_domain_obligations')
        if not isinstance(guards,list) or any(not isinstance(x,str) or
                not x.startswith('NODE_') or not x.endswith('_STRICT_POSITIVE_FOR_LOG') for x in guards):
            raise UnsupportedNaturalSourceObligation('Source log-positivity guard missing or forged')
        if r.get('actual_Y_bound_proved') is not False:
            raise UnsupportedNaturalSourceObligation('Original unproved Y bound was promoted')
        obj=result[group]
        obj['pair_count']+=1
        obj['natural_calls']+=r['calls']
        obj['source_log_guard_pairs']+=bool(guards)
        obj['source_log_guard_calls']+=r['calls'] if guards else 0
        obj['input_pairs'].append({'source_Y_node_id':r['Y_id'],'source_eta_node_id':r['eta_id'],
            'actual_natural_calls':r['calls'],
            'native_log_positive_guards':guards,
            'required_real_domain':criterion,
            'original_source_interval_certificate_present':False})
    summaries=[]
    for name,(group,expected_pairs,expected_calls,criterion,reason) in NAMES.items():
        d=result[group]
        if d['pair_count']!=expected_pairs or d['natural_calls']!=expected_calls:
            raise UnsupportedNaturalSourceObligation('Source 217-domain group mismatch: '+group)
        summaries.append({'kind':group,'normal_form':name,
            'coordinate_role':'BOUND_RADIAL_INTEGRATION_VARIABLE' if group.startswith('Omega') else 'SOURCE_COORDINATE',
            'source_pairs':d['pair_count'],'source_calls':d['natural_calls'],
            'log_guard_pairs':d['source_log_guard_pairs'],'log_guard_calls':d['source_log_guard_calls'],
            'required_bound':criterion,'proof_frontier':reason,
            'log_guards_discharge_via_original_sources_proved':False,
            'Y_upper_bound_source_verified':False,
            'subchart_or_original_root_range_certified':False,
            'input_pairs':d['input_pairs']})
    if sum(s['source_pairs'] for s in summaries)!=17 or sum(s['source_calls'] for s in summaries)!=217:
        raise UnsupportedNaturalSourceObligation('17 pair and 217 natural source calls not preserved')
    return {'schema':'MathScope.M3.Source217ActualLocalNaturalDomainObligations/1',
        'original_node_sha256':GRAPH_SHA,'native_definition_sha256':REG_SHA,
        'source_first_FiveMap_only':True,
        'source_input_pairs':17,'original_natural_calls':217,
        'source_call_log_guard_count':sum(s['log_guard_calls'] for s in summaries),
        'conditional_log_guard_note':'exp(log_positive(z))=z only when original z>0, which must be source-validated',
        'source_original_Lambda_strict_positive_required':True,
        'source_lambda_X_nonnegative_if_declared_slow_chart_holds':True,
        'source_lambda_xi_squared_nonnegative_from_real_square':True,
        'source_all_Omega_signs_and_bounds_proved':False,
        'Omega_named_Y_coordinates_are_integral_values':False,
        'Omega_integral_value_supnorms_are_required_for_these_Y_inputs':False,
        'source_chart_support_upper_bounds_proved':False,
        'source_natural_217_Y_interval_certified_calls':0,
        'original_56_total_Y_interval_certified_calls':33,
        'original_523_remaining_unproved_Y_calls':490,
        'coefficient_Brho_norm_proved':False,
        'common_complex_eta_domain_proved':False,
        'actual_finite_source_coefficient_intervals_computed':0,
        'actual_final_67_closed_cell_jets':0,'release':'HOLD',
        'groups':summaries}

if __name__=='__main__':
    if len(sys.argv)!=3:
        raise SystemExit('Usage: script.py verified-real-56-to-43-algebra.json source217-obligations.json')
    receipt=json.loads(Path(sys.argv[1]).read_text())
    r=audit_217_domain_obligations(receipt)
    Path(sys.argv[2]).write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'pairs':17,'calls':217,
        'guarded_calls':r['source_call_log_guard_count'],
        'new_verified_Y_calls':0,'release':'HOLD'}))
