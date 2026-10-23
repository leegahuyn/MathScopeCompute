import unittest
from prove_original_n3_Q_rho_signs import (
 structural_real_sign,original_n3_Q_rho_strict_positivity,MissingSourceAnalyticPremise)
class RealPinnedN3Positivity(unittest.TestCase):
 def test_actual_positive_Q_rho(self):
  x=original_n3_Q_rho_strict_positivity()
  self.assertTrue(x['rho_is_strictly_positive'])
  self.assertTrue(x['Q_is_strictly_positive'])
  self.assertTrue(x['Lambda_is_strictly_positive'])
  self.assertFalse(x['source_coefficient_Brho_norm_le_Q_proven'])
  self.assertFalse(x['shared_complex_analytic_domain_proven'])
  self.assertEqual(x['actual_final_67_jets_certified'],0)
 def test_negative_exponent_exp_is_strictly_positive(self):
  self.assertEqual(structural_real_sign({'exp':{'integer':-10}},{}),1)
 def test_even_power_negative_source_is_positive(self):
  self.assertEqual(structural_real_sign({'power':[{'integer':-3},4]},{}),1)
 def test_division_by_zero_refused(self):
  with self.assertRaises(MissingSourceAnalyticPremise):
   structural_real_sign({'quotient':[{'integer':1},{'integer':0}]},{})
 def test_negative_power_zero_refused(self):
  with self.assertRaises(MissingSourceAnalyticPremise):
   structural_real_sign({'power':[{'integer':0},-2]},{})
 def test_unsupported_log_sign_is_not_invented(self):
  with self.assertRaises(MissingSourceAnalyticPremise):
   structural_real_sign({'log':{'integer':1}},{})
 def test_negative_plus_positive_has_undetermined_sign(self):
  self.assertIsNone(structural_real_sign({'sum':[{'integer':5},{'integer':-2}]},{}))
 def test_invalid_cyclic_source_reference_refused(self):
  with self.assertRaises(MissingSourceAnalyticPremise):
   structural_real_sign({'ref':'a'},{'a':{'ref':'a'}})
if __name__=='__main__':unittest.main()
