import unittest,copy
from audit_original_217_Y_domain_obligations import (
 audit_217_domain_obligations,NAMES,GRAPH_SHA,REG_SHA,
 UnsupportedNaturalSourceObligation)

def fixture():
 rows=[]
 for name,(group,pairs,calls,condition,reason) in NAMES.items():
  parts=[calls//pairs+(1 if i<calls%pairs else 0) for i in range(pairs)]
  for i,n in enumerate(parts):
   rows.append({'normal_form':name,'Y_id':len(rows)+100,'eta_id':2,
       'calls':n,'actual_Y_bound_proved':False,
       'positive_domain_obligations':[] if i==0 else ['NODE_100_STRICT_POSITIVE_FOR_LOG']})
 return {'schema':'MathScope.M3.Source56ConservativeAlgebraicNormalForms/1',
   'original_node_SHA256':GRAPH_SHA,'native_registry_SHA256':REG_SHA,
   'source_pairs':56,'source_calls':523,'Y_bound_certified_calls':33,
   'remaining_unproved_Y_bounds':490,'different_algebraic_signatures':43,
   'coefficient_Brho_norm_le_Q_proved':False,
   'final_67_closed_cell_jets_certified':0,
   'per_pair':rows}

class Actual217SourceObligationTests(unittest.TestCase):
 def test_source_contract_17_original_pairs_217_calls(self):
  a=audit_217_domain_obligations(fixture())
  self.assertEqual(a['source_input_pairs'],17)
  self.assertEqual(a['original_natural_calls'],217)
  self.assertEqual(a['source_natural_217_Y_interval_certified_calls'],0)
  self.assertEqual(a['original_523_remaining_unproved_Y_calls'],490)
 def test_representative_X_obligation_exactly_114_calls(self):
  a=audit_217_domain_obligations(fixture())
  x=next(g for g in a['groups'] if g['kind']=='X')
  self.assertEqual(x['source_calls'],114)
  self.assertEqual(x['required_bound'],'0 <= X <= 5/Lambda')
  self.assertFalse(x['Y_upper_bound_source_verified'])
 def test_original_xi_square_lower_sign_algebraic_not_upper(self):
  a=audit_217_domain_obligations(fixture())
  self.assertTrue(a['source_lambda_xi_squared_nonnegative_from_real_square'])
  x=next(g for g in a['groups'] if g['kind']=='xi')
  self.assertEqual(x['source_calls'],33)
  self.assertFalse(x['subchart_or_original_root_range_certified'])
 def test_all_three_source_Omega_coordinate_labels_retained(self):
  a=audit_217_domain_obligations(fixture())
  self.assertEqual([x['source_calls'] for x in a['groups'] if x['kind'].startswith('Omega')],[26,26,18])
  self.assertFalse(a['source_all_Omega_signs_and_bounds_proved'])
  self.assertFalse(a['Omega_named_Y_coordinates_are_integral_values'])
  self.assertFalse(a['Omega_integral_value_supnorms_are_required_for_these_Y_inputs'])
  for row in a['groups']:
   if row['kind'].startswith('Omega'):
    self.assertEqual(row['coordinate_role'],'BOUND_RADIAL_INTEGRATION_VARIABLE')
    self.assertNotIn('original implicit root',row['proof_frontier'])
 def test_no_coefficient_norm_promotion(self):
  a=audit_217_domain_obligations(fixture())
  self.assertFalse(a['coefficient_Brho_norm_proved'])
  self.assertFalse(a['common_complex_eta_domain_proved'])
  self.assertEqual(a['actual_final_67_closed_cell_jets'],0)
 def test_forged_actual_Y_certification_rejected(self):
  a=fixture()
  a['per_pair'][0]['actual_Y_bound_proved']=True
  with self.assertRaises(UnsupportedNaturalSourceObligation):audit_217_domain_obligations(a)
 def test_missing_source_log_guard_record_rejected(self):
  a=fixture()
  a['per_pair'][1]['positive_domain_obligations']=['unknown']
  with self.assertRaises(UnsupportedNaturalSourceObligation):audit_217_domain_obligations(a)
 def test_changed_original_counts_rejected(self):
  a=fixture()
  a['per_pair'][0]['calls']+=1
  with self.assertRaises(UnsupportedNaturalSourceObligation):audit_217_domain_obligations(a)
 def test_changed_archive_digest_rejected(self):
  a=fixture();a['original_node_SHA256']='0'*64
  with self.assertRaises(UnsupportedNaturalSourceObligation):audit_217_domain_obligations(a)

if __name__=='__main__':unittest.main()
