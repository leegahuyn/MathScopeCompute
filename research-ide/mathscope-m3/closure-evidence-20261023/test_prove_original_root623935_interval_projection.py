import os,unittest
from fractions import Fraction as Q
from prove_original_root623935_interval_projection import (
 exact_signed_interval_midpoint,exact_T_midpoint_on_source_s_interval,original_exact_projection,ProjectedImageConditionOPEN
)

class OriginalRoot623935SignedAnnularProjection(unittest.TestCase):
    def test_negative_real_annular_interval_strict_width(self):
        x=exact_signed_interval_midpoint(Q(1,2),Q(3,2),Q(-5,4),Q(-3,4))
        self.assertEqual(x['branch'],'negative')
        self.assertEqual(Q(x['Z_midpoint']),Q(-1))
        self.assertTrue(x['certifies_L_le_absZ_le_U'])
    def test_positive_while_negative_disjoint(self):
        x=exact_signed_interval_midpoint(Q(1,2),Q(3,2),Q(3,4),Q(5,4))
        self.assertEqual(x['branch'],'positive')
        self.assertEqual(Q(x['Z_midpoint']),Q(1))
    def test_zero_width_negative_with_no_positive_must_FAIL_closed(self):
        # Refutes naive "at least one nonempty intersection" inference
        # when the source chooses the positive arm at zero width.
        with self.assertRaisesRegex(ProjectedImageConditionOPEN,'no admissible intersection'):
            exact_signed_interval_midpoint(Q(1,2),Q(3,2),Q(-1,2),Q(0))
    def test_zero_width_negative_selects_admissible_positive_source_branch(self):
        x=exact_signed_interval_midpoint(Q(1,2),Q(3,2),Q(-1,2),Q(3,4))
        self.assertEqual(x['branch'],'positive')
        self.assertTrue(x['zero_width_negative_source_switch'])
        self.assertEqual(Q(x['Z_midpoint']),Q(5,8))
        self.assertTrue(x['certifies_L_le_absZ_le_U'])
        self.assertFalse(x['piecewise_first_derivative_join_proved'])

    def test_zero_width_both_sign_intersections_source_still_has_value(self):
        x=exact_signed_interval_midpoint(Q(0),Q(1),Q(0),Q(0))
        self.assertEqual(x['Z_midpoint'],'0')
        self.assertTrue(x['zero_width_negative_source_switch'])

    def test_actual_T_midpoint_exact_source_clamp_and_root_sign(self):
        x=exact_T_midpoint_on_source_s_interval(
            Q(1,2),Q(3,2),Q(1,4),Q(5,4),Q(1,2),Q(1))
        self.assertEqual(Q(x['T_exact_midpoint']),Q(3,4))
        self.assertTrue(x['source_F_a_le_zero_F_b_ge_zero_given_real_g'])
        self.assertFalse(x['actual_original_Z_T_domains_without_external_ga_gb_certified'])

    def test_original_T_box_m_greater_than_b_rejected(self):
        with self.assertRaisesRegex(ProjectedImageConditionOPEN,'m<=b'):
            exact_T_midpoint_on_source_s_interval(
                Q(1,2),Q(1),Q(3,2),Q(2),Q(1),Q(3,2))

    def test_actual_T_inequality_failure_rejected(self):
        with self.assertRaisesRegex(ProjectedImageConditionOPEN,'g\\(a\\)'):
            exact_T_midpoint_on_source_s_interval(
                Q(1,2),Q(3,2),Q(0),Q(1),Q(5,4),Q(3,2))

    def test_no_signed_projection_intersection(self):
        with self.assertRaises(ProjectedImageConditionOPEN):
            exact_signed_interval_midpoint(Q(1,2),Q(3,2),Q(2),Q(3))
    def test_invalid_source_annular_range_rejected(self):
        with self.assertRaises(ProjectedImageConditionOPEN):
            exact_signed_interval_midpoint(Q(3,2),Q(1,2),Q(-2),Q(2))
    def test_strict_exact_rational_not_sampled_floats(self):
        with self.assertRaises(ProjectedImageConditionOPEN):
            exact_signed_interval_midpoint(0.5,Q(3,2),Q(-1),Q(1))

class OriginalRootProjectionPinnedSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.getenv('MATHSCOPE_ORIGINAL_REACH'):
            raise unittest.SkipTest('full original source AST required')
        cls.x=original_exact_projection(os.environ['MATHSCOPE_GRAPH_DIR'],
            os.environ['MATHSCOPE_ORIGINAL_REACH'])
    def test_exact_623935_source_branches_and_paired_T(self):
        x=self.x
        self.assertTrue(x['root_to_native_reachable_623935'])
        self.assertEqual(x['source_negative_intersection_width_node'],623914)
        self.assertEqual(x['source_positive_intersection_width_node'],623916)
        self.assertEqual(x['source_negative_candidate_Z_midpoint_node'],623918)
        self.assertEqual(x['source_positive_candidate_Z_midpoint_node'],623920)
        self.assertEqual(x['source_T_half_sum_node'],623934)
    def test_source_zero_width_and_global_open_are_preserved(self):
        x=self.x
        self.assertTrue(x['source_piecewise_equality_at_zero_value_certified_if_positive_interval_exists'])
        self.assertTrue(x['extra_source_T_feasibility_m_le_b_required'])
        self.assertFalse(x['source_piecewise_equality_at_zero_derivative_join_certified'])
        self.assertFalse(x['all_original_11_root_actual_mesh_intersections_certified'])
        self.assertEqual(x['original_523_Y_OPEN'],490)
        self.assertEqual(x['final_67_jet_intervals'],0)
        self.assertEqual(x['release'],'HOLD')
if __name__=='__main__':unittest.main()
