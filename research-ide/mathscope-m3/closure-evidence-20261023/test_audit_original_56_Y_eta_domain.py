import unittest
from audit_original_56_Y_eta_domain import classify_original_Y,MissingSourceDomainCertificate
from prove_original_n3_Q_rho_signs import original_n3_Q_rho_strict_positivity
class ActualSourceYPatternTests(unittest.TestCase):
 def setUp(self):
  self.nodes=[
    {'op':'rational','args':['4','1']},              #0
    {'op':'source_parameter','args':['Lambda']},     #1
    {'op':'source_parameter','args':['Xa']},         #2
    {'op':'coordinate','args':['s']},                #3
    {'op':'exp','args':[3]},                         #4
    {'op':'multiply','args':[0,4]},                  #5 =4 exp(s)
    {'op':'multiply','args':[2,4]},                  #6 = Xa exp(s)
    {'op':'multiply','args':[1,6]},                  #7 = Lambda Xa exp(s)
    {'op':'coordinate','args':['J']},                #8 symbolic
    {'op':'multiply','args':[1,8]},                  #9 unresolved
    {'op':'rational','args':['6','1']}               #10 outside
  ]
 def test_source_exact_four(self):
  x=classify_original_Y(self.nodes,0)
  self.assertEqual(x['shape'],'SOURCE_EXACT_RATIONAL_Y_LE_5')
  self.assertTrue(x['Y_upper5_proved'])
 def test_direct_four_exp_is_algebraic_not_domain_proof(self):
  x=classify_original_Y(self.nodes,5)
  self.assertEqual(x['symbolically_exact_Y'],'4*exp(source_exponent)')
  self.assertEqual(x['exponent_root_id'],3)
  self.assertFalse(x['Y_upper5_proved'])
 def test_exact_lambda_Xa_cancellation_retains_exponent_condition(self):
  self.assertTrue(original_n3_Q_rho_strict_positivity()['Lambda_is_strictly_positive'])
  x=classify_original_Y(self.nodes,7)
  self.assertEqual(x['shape'],'SOURCE_LAMBDA_XA_EXP_CANCELS_TO_FOUR_TIMES_EXP')
  self.assertEqual(x['sharp_domain_obligation'],'source_exponent <= log(5/4)')
  self.assertFalse(x['exponent_bound_proved'])
 def test_symbolic_coordinate_not_assumed_bounded(self):
  x=classify_original_Y(self.nodes,8)
  self.assertFalse(x['Y_upper5_proved'])
 def test_missing_composite_coefficient_not_assumed_bounded(self):
  x=classify_original_Y(self.nodes,9)
  self.assertEqual(x['shape'],'ARITHMETIC_UNCERTIFIED')
 def test_exact_rational_six_does_not_fit_domain(self):
  self.assertFalse(classify_original_Y(self.nodes,10)['Y_upper5_proved'])
 def test_invalid_node_reference_fails_closed(self):
  with self.assertRaises(MissingSourceDomainCertificate):
   classify_original_Y(self.nodes,10000)
if __name__=='__main__':unittest.main()
