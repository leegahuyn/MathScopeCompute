import unittest
from actual_picard_parity import Reflection

class ReflectionControls(unittest.TestCase):
 def setUp(self):
  self.n={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['1','1']},
   2:{'op':'coordinate','args':['xi']},3:{'op':'coordinate','args':['u']},
   4:{'op':'integer_power','args':[2,2]}}
 def value(self,body,left,right):
  self.n[5]={'op':'definite_integral','args':[body,3,left,right]}
  return Reflection(self.n,2).parity(5)
 def test_odd_limit_adds_orientation_sign(self):self.assertEqual(self.value(1,0,2),1)
 def test_odd_integrand_and_odd_limit_give_even_integral(self):self.assertEqual(self.value(3,0,2),0)
 def test_even_limits_do_not_flip_the_bound_variable(self):self.assertEqual(self.value(2,0,4),1)
 def test_bound_variable_shadows_an_outer_reflection(self):
  self.n[5]={'op':'definite_integral','args':[3,3,0,4]}
  self.assertEqual(Reflection(self.n,2).parity(5,(3,)),0)
 def test_odd_selector_is_not_accepted_as_even_guard(self):
  self.n[5]={'op':'smooth_piecewise','args':[2,0,1,0,1,0]}
  self.assertIsNone(Reflection(self.n,2).parity(5))
 def test_sqrt_of_odd_expression_has_no_claimed_parity(self):
  self.n[5]={'op':'sqrt_positive','args':[2]}
  self.assertIsNone(Reflection(self.n,2).parity(5))
 def test_unknown_native_fails_closed(self):
  self.n[5]={'op':'unknown_native','args':[]}
  with self.assertRaises(ValueError):Reflection(self.n,2).parity(5)
if __name__=='__main__':unittest.main(verbosity=2)
