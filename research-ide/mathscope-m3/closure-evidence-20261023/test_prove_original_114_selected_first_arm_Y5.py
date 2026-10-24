import os,unittest
from fractions import Fraction as F
from prove_original_114_selected_first_arm_Y5 import proof,INSIDE_COUNTS,InvalidLocalFirstArmProof
class ExactOriginalAll114SelectedArmRadius(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result=proof(os.environ['MATHSCOPE_GRAPH_DIR'])

    def test_stronger_actual_n3_t1_formula(self):
        self.assertEqual(self.result['original_exact_N3_t1_strict_bound'],'1/2^120')
        self.assertEqual(self.result['weaker_simple_t1_strict_bound'],'1/16')
        self.assertEqual(F(self.result['exact_sufficient_exp_2t1_upper']),F(32,7))
        self.assertLess(F(self.result['exact_sufficient_exp_2t1_upper']),F(5))

    def test_all_114_selected_local_arms(self):
        r=self.result
        self.assertEqual(r['first_before_local_conditional_Y_le_5'],94)
        self.assertEqual(r['first_inside_alias_local_conditional_Y_le_5'],20)
        self.assertEqual(r['all_first_syntactic_arms_local_conditional_Y_le_5'],114)
        self.assertEqual({int(k):v['calls'] for k,v in r['verified_inside_Y_alias_source_nodes'].items()},INSIDE_COUNTS)

    def test_no_unconditional_global_promotion(self):
        r=self.result
        self.assertTrue(r['requires_selected_syntactic_arm'])
        self.assertTrue(r['requires_original_real_nonnegative_coordinate_and_log_positive_guards'])
        self.assertFalse(r['every_native_root_to_call_path_dominance_proved'])
        self.assertFalse(r['common_complex_eta_and_Brho_norm_proved'])
        self.assertEqual(r['source_114_GLOBAL_Y_le_5_newly_proved'],0)
        self.assertEqual(r['all_523_original_Y_OPEN'],490)
        self.assertEqual(r['actual_67_final_field_jets_certified'],0)
        self.assertEqual(r['release'],'HOLD')
if __name__=='__main__':unittest.main()
