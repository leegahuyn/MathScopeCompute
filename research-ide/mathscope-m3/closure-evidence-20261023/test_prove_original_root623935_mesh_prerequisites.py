import os,unittest
from fractions import Fraction as F
from prove_original_root623935_mesh_prerequisites import (
 real_mesh_box,central_slice_negative_projection,inspect_sha_original_geometry,
 OriginalMeshConditionOPEN
)

class OriginalPhysicalMeshRadialTGuards(unittest.TestCase):
    def test_exact_original_delta_and_distinct_denominators(self):
        x=real_mesh_box(3,F(7,4),F(0),F(49,32),F(1),F(1))
        self.assertEqual(x['mesh_radius_delta'],'1/972')
        self.assertTrue(x['source_upper_s_uses_Xa_not_K'])
        self.assertTrue(x['original_root_chart_basic_box_feasible'])

    def test_valid_central_slice_source_image_nontrivial(self):
        c=central_slice_negative_projection(3,F(7,4),F(49,32),F(1),F(1))
        self.assertTrue(c['source_negative_signed_Z_intersection_strict_width'])
        self.assertTrue(c['actual_monotone2_source_Z_T_image_value_on_this_subdomain'])
        self.assertTrue(c['native_inverse_denominator_two_s_ge_one_on_this_subdomain'])
        self.assertFalse(c['actual_original_11root_all_image_paths_proved'])

    def test_original_radial_outside_native_s_bracket_rejected(self):
        c=real_mesh_box(3,F(4),F(0),F(1),F(1),F(1))
        self.assertFalse(c['a_within_original_bracket'])
        with self.assertRaisesRegex(OriginalMeshConditionOPEN,'s/T box'):
            central_slice_negative_projection(3,F(4),F(1),F(1),F(1))

    def test_original_time_lower_larger_than_s_upper_rejected(self):
        c=real_mesh_box(3,F(1),F(0),F(3,2),F(1),F(1))
        self.assertFalse(c['source_T_lower_le_s_upper'])
        with self.assertRaises(OriginalMeshConditionOPEN):
            central_slice_negative_projection(3,F(1),F(3,2),F(1),F(1))

    def test_original_negative_T_upper_is_not_a_valid_T_box(self):
        c=real_mesh_box(3,F(1),F(0),F(-1),F(1),F(1))
        self.assertFalse(c['source_T_range_nonempty'])

    def test_invalid_original_positive_Xa_or_XR_factor_rejected(self):
        for K,Xa in [(F(0),F(1)),(F(1),F(0)),(F(-1),F(1))]:
            with self.assertRaises(OriginalMeshConditionOPEN):
                real_mesh_box(3,F(1),F(0),F(1),Xa,K)

    def test_source_mesh_index_and_exact_rational_required(self):
        with self.assertRaises(OriginalMeshConditionOPEN):
            real_mesh_box(2,F(1),F(0),F(1),F(1),F(1))
        with self.assertRaises(OriginalMeshConditionOPEN):
            real_mesh_box(3,1.0,F(0),F(1),F(1),F(1))

class OriginalSourceASTMeshPin(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.getenv('MATHSCOPE_GRAPH_DIR'):
            raise unittest.SkipTest('full original source only on authenticated CI')
        cls.receipt=inspect_sha_original_geometry(os.environ['MATHSCOPE_GRAPH_DIR'],
            os.environ['MATHSCOPE_GLOBAL_BAND_SOURCE'])
    def test_full_original_mesh_ast_and_actual_K_Xa_difference(self):
        r=self.receipt
        self.assertEqual(r['original_delta'],'3/(4*ell^6)')
        self.assertEqual(r['original_frozen_mesh_coordinate_nodes']['ell'],622791)
        self.assertIn('XR*exp(u)',r['actual_lower_s_expression'])
        self.assertIn('Xa',r['actual_upper_s_expression'])
        self.assertNotIn('XR',r['actual_upper_s_expression'])
    def test_no_fake_global_certifications(self):
        r=self.receipt
        self.assertTrue(r['central_slice_z_zero_negative_projection_conditional_certified'])
        self.assertFalse(r['actual_11_root_mesh_r_z_t_support_globally_proved'])
        self.assertEqual(r['original_523_Y_OPEN'],490)
        self.assertEqual(r['original_final_67_jets'],0)
        self.assertEqual(r['release'],'HOLD')
if __name__=='__main__':unittest.main()
