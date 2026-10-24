import unittest
from fractions import Fraction as F
from audit_source56_Y_algebraic_normal_forms import OriginalAlgebra,InvalidOriginalNaturalSource

class RealSourceAlgebraGuards(unittest.TestCase):
 def setUp(self):
  self.nodes=[
   {'op':'source_parameter','args':['Lambda']},
   {'op':'source_parameter','args':['Xa']},
   {'op':'coordinate','args':['X']},
   {'op':'inverse','args':[1]},
   {'op':'multiply','args':[3,2]},
   {'op':'log_positive','args':[4]},
   {'op':'exp','args':[5]},
   {'op':'multiply','args':[1,6]},
   {'op':'multiply','args':[0,7]},
   {'op':'rational','args':['4','1']},
   {'op':'source_parameter','args':['t1']},
   {'op':'exp','args':[10]},
   {'op':'multiply','args':[9,11]},
   {'op':'coordinate','args':['actual_inner_xi']},
   {'op':'integer_power','args':[13,2]},
   {'op':'multiply','args':[0,14]}
  ]
 def test_exact_Xa_Lambda_cancellation_reduces_to_coordinate_bound(self):
  a=OriginalAlgebra(self.nodes).solve(8)
  self.assertEqual(a.text(),'COORD:X * Lambda')
  self.assertEqual(a.coefficient,F(1))
 def test_exp_log_positive_keeps_necessary_real_domain_guard(self):
  a=OriginalAlgebra(self.nodes).solve(8)
  self.assertTrue(any('STRICT_POSITIVE_FOR_LOG' in t for t in a.guards))
 def test_Xa_identity_does_not_force_X_upper_bound(self):
  a=OriginalAlgebra(self.nodes).solve(8)
  self.assertIn('COORD:X',a.text())
 def test_source_t1_factor_remains_precisely_source_t1(self):
  a=OriginalAlgebra(self.nodes).solve(12)
  self.assertEqual(a.text(),'4 * EXP_NODE:10')
 def test_normalize_original_inner_xi_squared(self):
  a=OriginalAlgebra(self.nodes).solve(15)
  self.assertEqual(a.text(),'COORD:actual_inner_xi^2 * Lambda')
 def test_unbound_source_coordinate_is_not_bounded_by_math_rule(self):
  a=OriginalAlgebra(self.nodes).solve(2)
  self.assertEqual(a.text(),'COORD:X')
 def test_unknown_original_graph_id_fails_closed(self):
  with self.assertRaises(InvalidOriginalNaturalSource):
   OriginalAlgebra(self.nodes).solve(99999)

if __name__=='__main__':unittest.main()
