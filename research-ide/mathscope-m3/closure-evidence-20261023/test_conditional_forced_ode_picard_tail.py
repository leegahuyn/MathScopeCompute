import unittest
from fractions import Fraction as Q
from rigorous_rational_intervals import UncertifiedExpression
from conditional_forced_ode_picard_tail import conditional_original_forced_ode_tail as bound

class OriginalZeroDataPulsePicardTailTests(unittest.TestCase):
 def test_zero_matrix_exact_single_picard_step(self):
  r=bound('0','3','1/2',0)
  self.assertEqual(r['tail_norm_closed_interval'],['0','0'])
  self.assertFalse(r['actual_native_ode_coefficients_source_certified'])
 def test_zero_forcing_gives_exact_zero(self):
  self.assertEqual(bound('10','0','1',2)['tail_norm_closed_interval'],['0','0'])
 def test_zero_duration_exact(self):
  self.assertEqual(bound('10','5','0',3)['tail_norm_closed_interval'],['0','0'])
 def test_simple_forced_matrix_tail_is_strict_and_rational(self):
  r=bound('1','1','1',0)
  u=Q(r['tail_norm_closed_interval'][1])
  self.assertGreater(u,Q(1,2))
  self.assertLess(u,Q(3,2))
  self.assertEqual(r['actual_final_67_jet_intervals_certified'],0)
 def test_higher_retained_order_shrinks(self):
  first=Q(bound('1','1','1',2)['tail_norm_closed_interval'][1])
  later=Q(bound('1','1','1',7)['tail_norm_closed_interval'][1])
  self.assertLess(later,first)
 def test_large_source_exponent_does_not_produce_fake_tail(self):
  with self.assertRaises(UncertifiedExpression):bound('1000000','1','1',5)
 def test_no_unknown_matrix_majorant(self):
  with self.assertRaises(UncertifiedExpression):bound(None,'1','1',5)
 def test_no_negative_matrix_norm(self):
  with self.assertRaises(UncertifiedExpression):bound('-1','1','1',5)
 def test_no_float_error_budget(self):
  with self.assertRaises(UncertifiedExpression):bound(1.0,'1','1',5)
 def test_no_negative_retained_order(self):
  with self.assertRaises(UncertifiedExpression):bound('1','1','1',-1)
if __name__=='__main__':unittest.main()
