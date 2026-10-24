import os,unittest
from fractions import Fraction as Q
from prove_original_slow_image_mesh_transport import exact_transport,pin_and_prove,MissingActualMeshSupport

class ActualMeshToOriginalSlowImage(unittest.TestCase):
    def test_source_integer_ell_three_margin_is_exact(self):
        c=exact_transport(3)
        self.assertEqual(c['source_same_box_max_absolute_Z_T_displacement'],'4/729')
        self.assertEqual(c['Z_squared_variation_upper_rational'],'8764/531441')
        self.assertEqual(c['source_endpoint_F_variation_upper_rational'],'20444/531441')
        self.assertTrue(c['source_image_target_certified_given_exact_assumptions'])

    def test_all_tested_larger_ell_and_monotone_formula(self):
        for ell in [3,4,5,9,24,512]:
            c=exact_transport(ell)
            e=Q(c['source_same_box_max_absolute_Z_T_displacement'])
            self.assertEqual(e,Q(4,ell**6))
            self.assertLess(Q(c['source_endpoint_F_variation_upper_rational']),Q(1,16))
            self.assertLess(Q(c['Z_squared_variation_upper_rational']),Q(1,8))

    def test_small_integer_ell_two_does_NOT_transport(self):
        with self.assertRaises(MissingActualMeshSupport):
            exact_transport(2)

    def test_reference_s_margin_zero_does_NOT_transport(self):
        with self.assertRaisesRegex(MissingActualMeshSupport,'interior margin'):
            exact_transport(300,Q(0))

    def test_even_large_mesh_cannot_replace_reference_interior(self):
        # Reference s0=1/2 or 2 is at image boundary: no uniform nonzero
        # perturbation can be certified without one-sided source evidence.
        with self.assertRaises(MissingActualMeshSupport):
            exact_transport(300,Q(0))

    def test_mesh_analytic_lemma_still_not_actual_global_jets(self):
        x=pin_and_prove(os.environ['MATHSCOPE_GLOBAL_BAND_SOURCE'],
                        os.environ['MATHSCOPE_N3_SOURCE_PROFILE'],
                        os.getenv('MATHSCOPE_TWO_ROOT_RECEIPT'))
        self.assertEqual(x['valid_for_all_integer_ell_at_least'],3)
        self.assertFalse(x['actual_reachable_root_623935_has_source_same_mesh_attachment_certified'])
        self.assertFalse(x['source_interior_reference_s_and_T_bounds_certified'])
        self.assertEqual(x['original_523_natural_Y_OPEN'],490)
        self.assertEqual(x['original_67_final_jets_certified'],0)
        self.assertEqual(x['release'],'HOLD')

if __name__=='__main__':unittest.main()
