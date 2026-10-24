import copy,os,unittest
from audit_native_global_expression_114_guard_gaps import (
    audit_native_first_guard_gaps,verify_claims,InvalidSourceNativeGuard
)

class OriginalNativeDefinitionGuardGap(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result=audit_native_first_guard_gaps(os.environ['MATHSCOPE_GRAPH_DIR'])

    def test_exact_native_global_expression_body_bypass_frontier(self):
        r=self.result
        self.assertTrue(verify_claims(r))
        self.assertEqual(r['native_global_expression_body_roots_with_additional_paths'],28)
        self.assertEqual(r['distinct_original_114_calls_with_unprotected_structural_paths'],84)
        self.assertEqual(r['other_original_114_calls_not_exposed_in_this_specific_registry_subset'],30)

    def test_original_native_expression_one_retains_84_structural_calls(self):
        rows=self.result['exposed_definition_bodies']
        row=next(x for x in rows if x['native_global_expression_index']==1)
        self.assertEqual(row['registered_body_root_node_id'],117047)
        self.assertEqual(row['unprotected_structural_call_count'],84)
        self.assertEqual(len(row['calls_with_first_selected_guard_insufficient']),84)

    def test_proof_domain_and_67_jet_promotions_refused(self):
        r=self.result
        self.assertFalse(r['all_root_to_call_paths_checked'])
        self.assertFalse(r['native_invocation_argument_bindings_proved'])
        self.assertTrue(r['possible_bypass_not_actual_domain_counterexample'])
        self.assertEqual(r['global_114_Y_bounds_newly_certified'],0)
        self.assertEqual(r['original_523_Y_bounds_OPEN'],490)
        self.assertEqual(r['actual_67_final_field_jet_intervals_certified'],0)
        self.assertEqual(r['release'],'HOLD')

    def test_forged_zero_native_gaps_rejected(self):
        bad=copy.deepcopy(self.result)
        bad['native_global_expression_body_roots_with_additional_paths']=0
        with self.assertRaises(InvalidSourceNativeGuard):
            verify_claims(bad)

    def test_forged_final_67_certificate_rejected(self):
        bad=copy.deepcopy(self.result)
        bad['actual_67_final_field_jet_intervals_certified']=67
        with self.assertRaises(InvalidSourceNativeGuard):
            verify_claims(bad)
if __name__=='__main__':unittest.main()
