import unittest
from fractions import Fraction as Q
from verify_original_N7_localization_67jet_independent import audit, fixture_receipt

class OriginalNativeN7Localization(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=audit()
    def test_both_source_geometry_cases(self):
        self.assertEqual(len(self.data["rows"]),2)
        for row in self.data["rows"]:
            self.assertTrue(row["full_localization_commutator_equals_direct_3D_residual"])
            self.assertTrue(row["original_jet_backend_equals_independent_differentiation"])
            self.assertEqual(row["original_67_field_plus_13_cutoff_jet_inputs"],80)
            self.assertEqual(row["direct_divergence"],"0")
    def test_genuine_cutoff_and_quadratic_negative_controls(self):
        for row in self.data["rows"]:
            self.assertTrue(row["negative_missing_grad_c_cross_A_rejected"])
            self.assertTrue(row["negative_omitted_quadratic_u_grad_u_rejected"])
    def test_real_source_never_promoted(self):
        self.assertEqual(self.data["actual_original_67_final_A_D_jet_interval_values_certified"],0)
        self.assertFalse(self.data["actual_original_C_native_definition_domains_authenticated"])
        self.assertFalse(self.data["source_original_finite_cutoff_or_tail_authenticated"])
        self.assertEqual((self.data["M3"],self.data["M4"],self.data["release"]),("62/64","0/16","HOLD"))

if __name__=="__main__":unittest.main()
