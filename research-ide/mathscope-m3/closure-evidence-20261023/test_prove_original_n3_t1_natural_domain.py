import unittest,copy
from fractions import Fraction as F
from prove_original_n3_t1_natural_domain import source_t1_strict_upper_bound
from audit_original_56_Y_eta_domain import classify_original_Y
class SourceN3T1OriginalDomain(unittest.TestCase):
 def test_original_parameter_t1_bound(self):
  q=source_t1_strict_upper_bound()
  self.assertTrue(q['source_Q_strict_gt_1_proved_from_formulas'])
  self.assertEqual(q['original_t1_strict_upper_bound'],'1/8')
  self.assertEqual(q['four_exp_t1_strict_upper_bound'],'32/7')
  self.assertLess(F(q['four_exp_t1_strict_upper_bound']),5)
  self.assertFalse(q['shared_eta_analytic_domain_proved'])
  self.assertFalse(q['source_Brho_coefficient_norm_bound_proved'])
 def test_exact_original_Lambda_Xa_exp_t1_inequality(self):
  nodes=[
    {'op':'source_parameter','args':['Lambda']},        # 0
    {'op':'source_parameter','args':['Xa']},            # 1
    {'op':'source_parameter','args':['t1']},            # 2
    {'op':'exp','args':[2]},                            # 3
    {'op':'multiply','args':[1,3]},                    # 4
    {'op':'multiply','args':[0,4]},                    # 5
  ]
  p=classify_original_Y(nodes,5)
  self.assertEqual(p['shape'],'SOURCE_LAMBDA_XA_EXP_CANCELS_TO_FOUR_TIMES_EXP')
  self.assertTrue(p['Y_upper5_proved'])
  self.assertTrue(p['exponent_bound_proved'])
  self.assertEqual(p['source_Y_strict_upper_bound'],'32/7')
 def test_same_expression_arbitrary_exponent_does_not_pass(self):
  nodes=[
    {'op':'source_parameter','args':['Lambda']},
    {'op':'source_parameter','args':['Xa']},
    {'op':'coordinate','args':['unknown_exponent']},
    {'op':'exp','args':[2]},
    {'op':'multiply','args':[1,3]},
    {'op':'multiply','args':[0,4]}
  ]
  p=classify_original_Y(nodes,5)
  self.assertFalse(p['Y_upper5_proved'])
  self.assertFalse(p['exponent_bound_proved'])
if __name__=='__main__':unittest.main()
