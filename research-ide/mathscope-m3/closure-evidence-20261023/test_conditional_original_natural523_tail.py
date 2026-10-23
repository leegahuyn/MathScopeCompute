import unittest
from fractions import Fraction as F
from conditional_original_natural523_tail import (
 conditional_scaled_tail,original_523_conditional_frontier,
 ACTUAL_REACHABLE_DERIVATIVE_SHAPES,MissingSourceNaturalAnalyticPremise)
class SourceNatural523ConditionalTests(unittest.TestCase):
 def test_actual_source_call_distribution(self):
  self.assertEqual(sum(ACTUAL_REACHABLE_DERIVATIVE_SHAPES.values()),523)
  self.assertEqual(len(ACTUAL_REACHABLE_DERIVATIVE_SHAPES),15)
 def test_original_greatest_eta_order(self):
  self.assertEqual(max(k for k,m in ACTUAL_REACHABLE_DERIVATIVE_SHAPES),3)
  self.assertEqual(max(m for k,m in ACTUAL_REACHABLE_DERIVATIVE_SHAPES),5)
 def test_exact_worst_ratio(self):
  r=original_523_conditional_frontier()
  self.assertEqual(F(r['worst_ratio_upper']),F(19,52))
 def test_exact_worst_coefficient_factor(self):
  r=original_523_conditional_frontier()
  self.assertEqual(F(r['worst_normalized_tail_factor']),F(2873,322961408))
 def test_monotonic_in_Y(self):
  self.assertLess(conditional_scaled_tail(1,5,12,'4')[1],
                  conditional_scaled_tail(1,5,12,'5')[1])
 def test_no_false_source_analytic_norm(self):
  r=original_523_conditional_frontier()
  self.assertFalse(r['original_coefficient_B_rho_norm_proved_here'])
  self.assertFalse(r['uniform_complex_analytic_domain_proved_here'])
  self.assertEqual(r['final_original_67_jet_intervals_certified'],0)
 def test_decreasing_for_greater_truncation(self):
  self.assertLess(conditional_scaled_tail(1,5,14,'5')[1],
                  conditional_scaled_tail(1,5,12,'5')[1])
 def test_float_as_certified_rational_rejected(self):
  with self.assertRaises(MissingSourceNaturalAnalyticPremise):
   conditional_scaled_tail(1,5,12,5.0)
 def test_y_exceeding_analytic_cap_rejected(self):
  with self.assertRaises(MissingSourceNaturalAnalyticPremise):
   conditional_scaled_tail(1,5,12,'5001/1000')
 def test_too_low_degree_rejected(self):
  with self.assertRaises(MissingSourceNaturalAnalyticPremise):
   original_523_conditional_frontier(2)
 def test_missing_convergence_ratio_rejected(self):
  with self.assertRaises(MissingSourceNaturalAnalyticPremise):
   conditional_scaled_tail(3,5,3,'5')
 def test_exact_zero_y_limit(self):
  self.assertEqual(conditional_scaled_tail(1,5,12,'0')[1],0)
if __name__=='__main__':unittest.main()
