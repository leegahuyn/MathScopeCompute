import unittest
from fractions import Fraction as F
from pathlib import Path
from tempfile import TemporaryDirectory
from audit_original_local_B2_radius_41 import (
    original_local_B2_radius_41, ChangedOriginalLocalSource)

class RealOriginalLocalB2Radius(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.receipt=original_local_B2_radius_41()

    def test_local_Xcut_and_a_squared_within_paper_4point1(self):
        r=self.receipt
        self.assertEqual(F(r['conditional_Lambda_Xkeep_strict_upper']),F(2048,511))
        self.assertEqual(F(r['conditional_Lambda_Xcut_strict_upper']),F(1024,255))
        self.assertEqual(F(r['conditional_Lambda_a_squared_strict_upper']),F(512,127))
        self.assertLess(F(r['conditional_Lambda_a_squared_strict_upper']),F(41,10))

    def test_picard_xi_squared_only_on_declared_radial_domain(self):
        r=self.receipt
        self.assertTrue(r['native_picard_radial_domain_zero_to_a_source_verified'])
        self.assertTrue(r['local_picard_abs_xi_le_a_implies_Y_in_B2_interval'])
        self.assertFalse(r['actual_consumer_paths_to_local_picard_domain_verified'])
        self.assertFalse(r['all_33_Lambda_xi_squared_calls_support_proved'])

    def test_order_one_branch_is_not_the_global_chart(self):
        r=self.receipt
        self.assertTrue(r['inner_leading_F0_U0_v0_source_choose_Xa_a_squared_anchors_verified'])
        self.assertFalse(r['all_114_Lambda_X_calls_support_proved'])
        self.assertFalse(r['all_70_Lambda_Omega_calls_range_proved'])

    def test_no_false_global_promotion(self):
        r=self.receipt
        self.assertEqual(r['source_217_new_unconditional_Y_bounds'],0)
        self.assertEqual(r['original_523_unproved_Y_bounds'],490)
        self.assertFalse(r['coefficient_Brho_norm_proved'])
        self.assertFalse(r['common_complex_eta_domain_proved'])
        self.assertEqual(r['final_67_jets_certified'],0)
        self.assertEqual(r['release'],'HOLD')

    def test_tampered_original_radial_domain_rejected(self):
        base=Path(__file__).resolve().parents[2]/'mathscope-m2/navier'
        real=base/'actual-continuation-exact-inner.mjs'
        one=base/'actual-continuation-exact-order-one.mjs'
        with TemporaryDirectory() as d:
            fake=Path(d)/'inner.mjs'
            fake.write_text(real.read_text().replace(
                'radialDomain:[z,a]','radialDomain:[z,G.mul(a,2)]'))
            with self.assertRaises(ChangedOriginalLocalSource):
                original_local_B2_radius_41(fake,one)

    def test_tampered_leading_natural_branch_rejected(self):
        base=Path(__file__).resolve().parents[2]/'mathscope-m2/navier'
        real=base/'actual-continuation-exact-inner.mjs'
        one=base/'actual-continuation-exact-order-one.mjs'
        with TemporaryDirectory() as d:
            fake=Path(d)/'inner.mjs'
            fake.write_text(real.read_text().replace(
                'F0=G.choose(X,Xa,aSquared,naturalF,collarF,collarF)',
                'F0=naturalF'))
            with self.assertRaises(ChangedOriginalLocalSource):
                original_local_B2_radius_41(fake,one)

if __name__=='__main__':
    unittest.main()
