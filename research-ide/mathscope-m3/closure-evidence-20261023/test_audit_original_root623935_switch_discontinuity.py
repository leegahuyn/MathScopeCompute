import os,unittest
from fractions import Fraction as F
from audit_original_root623935_switch_discontinuity import certificate
from prove_original_root623935_general_srep_image import graph_pin
from prove_original_root623935_mesh_prerequisites import real_mesh_box
from prove_original_root623935_interval_projection import exact_signed_interval_midpoint

class OriginalSignedZSwitchObstruction(unittest.TestCase):
    def test_analytic_source_C0_obstruction_exact_bounds(self):
        x=certificate()
        self.assertTrue(x['H_left_negative_for_all_source_h'])
        self.assertTrue(x['H_right_positive_for_all_source_h'])
        self.assertTrue(x['unique_real_a_star_with_source_L_eq_delta'])
        self.assertEqual(x['source_delta'],'1/972')
        self.assertEqual(x['negative_selected_Z_left_limit'],'-1/972')
        self.assertEqual(x['positive_selected_Z_at_zero_width'],'1/972')
        self.assertEqual(x['original_signed_Z_selector_jump'],'1/486')
        self.assertFalse(x['global_unconstrained_signed_projection_is_C0'])
        self.assertFalse(x['actual_native_runtime_passes_through_switch_proved'])
        self.assertEqual(x['actual_final_67_jets'],0)
        self.assertEqual(x['release'],'HOLD')
    def test_precise_branch_midpoints_near_switch(self):
        d=F(1,972);U=F(1)
        before=exact_signed_interval_midpoint(d-F(1,10**8),U,-d,d)
        at=exact_signed_interval_midpoint(d,U,-d,d)
        self.assertEqual(before['branch'],'negative')
        self.assertEqual(at['branch'],'positive')
        self.assertEqual(F(at['Z_midpoint']),d)
        self.assertLess(F(before['Z_midpoint']),0)
        self.assertEqual(F(at['Z_midpoint'])-F(before['Z_midpoint']),2*d-F(1,2*10**8))
        self.assertFalse(at['piecewise_first_derivative_join_proved'])
    def test_original_integer_mesh_source_witnesses(self):
        x=certificate()
        Xa=F(x['fixed_source_Xa'])
        for item in x['source_original_bounds_checked_at_both_bracket_endpoints']:
            box=real_mesh_box(3,F(1458),F(0),F(729),Xa,F(item['source_Xb']))
            self.assertEqual(F(box['source_s_lower_a']),F(item['source_a']))
            self.assertEqual(F(box['source_s_upper_b']),2)
    def test_original_hash_pin_if_graph_given(self):
        name=os.getenv('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not name:self.skipTest('authenticated full original graph required')
        self.assertEqual(graph_pin(name)['actual_root_node'],623935)

if __name__=='__main__':unittest.main()
