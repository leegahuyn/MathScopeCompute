import unittest
from fractions import Fraction as Q
from prove_original_monotone2_uniform_complex_tube import (
  exact_tube_contract,cauchy_derivative_majorant,original_chart_complex_eta_pullback,H_UPPER,R,DELTA)

class SourceImageUniformComplexTube(unittest.TestCase):
    def test_all_source_guards_and_explicit_complex_inverse(self):
        x=exact_tube_contract()
        self.assertTrue(x['strict_inward_mapping'])
        self.assertTrue(x['source_inverse_holomorphic_over_image_polydisk'])
        self.assertEqual(x['holomorphic_s_solution_disk_radius'],'1/8')
        self.assertEqual(x['holomorphic_Z_and_T_polydisk_radii'],['1/100','1/100'])
        self.assertEqual(x['center_displacement_strict_upper'],'1103/20000')
        self.assertEqual(x['source_G_s_exact_factor_times_h'],'512/25 h')
    def test_all_order_cauchy_majorants_exact(self):
        self.assertEqual(cauchy_derivative_majorant(0,0),Q(17,8))
        self.assertEqual(cauchy_derivative_majorant(1,0),Q(425,2))
        self.assertEqual(cauchy_derivative_majorant(0,1),Q(425,2))
        self.assertEqual(cauchy_derivative_majorant(1,1),Q(21250))
        self.assertEqual(cauchy_derivative_majorant(2,0),Q(42500))
        self.assertEqual(cauchy_derivative_majorant(4,3),
          Q(17,8)*24*6*100**7)
        self.assertGreater(cauchy_derivative_majorant(50,14),0)
    def test_exact_source_image_complex_eta_pullback_all_derivatives_zero(self):
        e=original_chart_complex_eta_pullback()
        self.assertEqual(e['source_chart_complex_eta_radius'],'1/1000')
        self.assertEqual(e['source_chart_eta_Z_excursion_bound'],'3/2000')
        self.assertEqual(e['source_chart_eta_T_excursion_bound'],'2001/500000')
        self.assertTrue(e['source_chart_complex_F_s0_Z_eta_T_eta_identically_zero'])
        self.assertTrue(e['native_inverse_after_source_image_eta_pullback_is_s0_identically'])
        self.assertEqual(e['every_positive_order_eta_derivative_of_inverse_on_exact_source_image'],'0')
        self.assertFalse(e['source_native_free_coordinate_call_uses_this_pullback_proved'])
        self.assertFalse(e['original_analytic_profile_phi_u_Brho_scope_proved'])

    def test_infinite_order_claim_not_per_call_certificate(self):
        x=exact_tube_contract()
        self.assertEqual(x['actual_original_reachable_call_ids'],[622820,623935])
        self.assertFalse(x['native_callers_real_source_image_all_verified'])
        self.assertFalse(x['source_mesh_switch_gluing_C_infinity'])
        self.assertEqual(x['original_523_Y_upper_bound_OPEN'],490)
        self.assertEqual(x['final_67_source_jets_certified'],0)
        self.assertEqual(x['release'],'HOLD')
    def test_wrong_multiindex_rejected(self):
        for i,j in ((-1,0),(0,-1),(0,65),(1.2,0),(1,'1')):
            with self.subTest(i=i,j=j),self.assertRaises(ValueError):
                cauchy_derivative_majorant(i,j)
    def test_rational_disk_geometry(self):
        self.assertEqual(R,Q(1,8))
        self.assertEqual(DELTA,Q(1,100))
        self.assertLess(H_UPPER,Q(1,256))
        self.assertLess(Q(1103,20000)+R*Q(1,8),R)

if __name__=='__main__':unittest.main()
