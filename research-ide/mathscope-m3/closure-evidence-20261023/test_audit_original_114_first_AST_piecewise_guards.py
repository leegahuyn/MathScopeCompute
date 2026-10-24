import copy,os,unittest
from audit_original_114_first_AST_piecewise_guards import (
 audit_first_AST_piecewise,verify_first_rows,EXPECTED_CASES,UnauthenticatedGuardRoute)
class FirstSyntacticGuardsNotRuntimeSupport(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result=audit_first_AST_piecewise(os.environ['MATHSCOPE_GRAPH_DIR'])

    def test_exact_114_syntactically_piecewise_guarded_calls(self):
        self.assertEqual(self.result['number_with_at_least_one_syntactic_piecewise_ancestor'],114)
        self.assertEqual(verify_first_rows(self.result['first_ancestor_records']),dict(sorted(EXPECTED_CASES.items())))

    def test_each_record_is_original_source_position(self):
        for r in self.result['first_ancestor_records']:
            self.assertLess(r['original_natural_node_id'],r['piecewise_node_id'])
            self.assertIn(r['arm'],('before','inside','after'))

    def test_has_inside_branches_not_just_X_le_Xa(self):
        self.assertEqual(sum(v for k,v in EXPECTED_CASES.items() if k.startswith('inside|')),20)
        self.assertEqual(sum(v for k,v in EXPECTED_CASES.items() if k.startswith('before|')),94)

    def test_incorrect_global_guard_promotion_refused(self):
        self.assertEqual(self.result['first_piecewise_proved_to_dominate_all_original_consumer_execution_paths'],0)
        self.assertFalse(self.result['native_coordinate_alias_substitution_verified'])
        self.assertEqual(self.result['source_Y_upper_bounds_newly_certified'],0)
        self.assertEqual(self.result['actual_final_67_jet_intervals'],0)
        self.assertEqual(self.result['release'],'HOLD')

    def test_omitted_source_call_is_rejected(self):
        with self.assertRaises(UnauthenticatedGuardRoute):
            verify_first_rows(self.result['first_ancestor_records'][:-1])

    def test_altered_first_guard_branch_is_rejected(self):
        r=copy.deepcopy(self.result['first_ancestor_records'])
        r[0]['arm']='after'
        with self.assertRaises(UnauthenticatedGuardRoute):
            verify_first_rows(r)

    def test_wrong_guard_condition_is_rejected(self):
        r=copy.deepcopy(self.result['first_ancestor_records'])
        r[0]['left_node']=999
        with self.assertRaises(UnauthenticatedGuardRoute):
            verify_first_rows(r)
if __name__=='__main__':unittest.main()
