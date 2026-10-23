import unittest
from fractions import Fraction as F
from rigorous_rational_intervals import UncertifiedExpression
from conditional_covariance_volterra_tail import original_covariance_volterra_tail as bound
class OriginalCovarianceVolterraTailTests(unittest.TestCase):
 def test_zero_matrix_no_higher_order_terms(self):
  a=bound('0','2','4',0)
  self.assertEqual(a['tail_norm_closed_interval'],['0','0'])
  self.assertEqual(a['actual_original_final_67_jets_certified'],0)
 def test_zero_initial_data_exact(self):
  self.assertEqual(bound('5','0','1',4)['tail_norm_closed_interval'],['0','0'])
 def test_zero_interval_exact(self):
  self.assertEqual(bound('4','3','0',2)['tail_norm_closed_interval'],['0','0'])
 def test_constant_scalar_norm_expansion_majorant(self):
  a=bound('1','1','1',0)
  x=F(a['tail_norm_closed_interval'][1])
  self.assertGreater(x,F(2));self.assertLess(x,F(3))
 def test_picard_remainder_shrinks_with_order(self):
  a=F(bound('1','1','1',3)['tail_norm_closed_interval'][1])
  b=F(bound('1','1','1',7)['tail_norm_closed_interval'][1])
  self.assertLess(b,a)
 def test_small_fractional_original_norm(self):
  a=bound('1/16','2','1/4',5)
  self.assertLess(F(a['tail_norm_closed_interval'][1]),F(1,10000000))
 def test_unknown_bound_fails_closed(self):
  with self.assertRaises(UncertifiedExpression):bound(None,'1','1',2)
 def test_negative_bound_fails_closed(self):
  with self.assertRaises(UncertifiedExpression):bound('-1','1','1',2)
 def test_float_bound_fails_closed(self):
  with self.assertRaises(UncertifiedExpression):bound('1',1.0,'1',2)
 def test_unbounded_source_magnitude_requires_proof(self):
  with self.assertRaises(UncertifiedExpression):bound('100000','1','1',2)
if __name__=='__main__':unittest.main()
