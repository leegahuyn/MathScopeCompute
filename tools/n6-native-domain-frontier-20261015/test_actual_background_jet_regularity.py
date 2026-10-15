"""Adverse domain/binder controls; fixtures never certify the original rows."""
import unittest
from fractions import Fraction as Q
import actual_background_jet_regularity as b

def node(op,*args):return {'op':op,'args':list(args)}
class BackgroundProofControls(unittest.TestCase):
 def engine(self,g,p=None):return b.ConstantDomains(g.__getitem__,p or {})
 def test_zero_inverse_not_canceled(self):
  g={0:node('rational','0','1'),1:node('inverse',0),2:node('multiply',0,1)}
  with self.assertRaises(b.Gap):self.engine(g).at(2)
 def test_unknown_native_constant_rejected(self):
  with self.assertRaises(b.Gap):self.engine({0:node('actual_natural_series','Phi',1,2,0,0)}).at(0)
 def test_coordinate_cannot_be_frozen_by_guess(self):
  with self.assertRaises(b.Gap):self.engine({0:node('coordinate','x')}).at(0)
 def test_missing_fixed_parameter_rejected(self):
  with self.assertRaises(b.Gap):self.engine({0:node('source_parameter','unknown')}).at(0)
 def test_zero_log_and_negative_radical_rejected(self):
  for op,value in [('log_positive','0'),('sqrt_positive','-1')]:
   with self.assertRaises(b.Gap):self.engine({0:node('rational',value,'1'),1:node(op,0)}).at(1)
 def test_positive_finite_exponential_inverse(self):
  g={0:node('rational','-2','1'),1:node('exp',0),2:node('inverse',1)}
  self.assertTrue(self.engine(g).at(2).strict_positive)
 def test_sign_ambiguous_inverse_rejected(self):
  with self.assertRaises(b.Gap):self.engine({}).operation('inverse',[b.Bound(None,None)])
 def test_positive_log_does_not_imply_positive_value(self):
  g={0:node('rational','1','2'),1:node('log_positive',0)}
  r=self.engine(g).at(1);self.assertFalse(r.strict_positive);self.assertEqual(r.hi,0)
 def test_algebra_preserves_real_integral_scope(self):
  g={0:node('coordinate','outer'),1:node('coordinate','eta'),2:node('actual_expression_partial',2,[0,1],[0,0]),3:node('integer_power',2,2),4:node('rational','0','1'),5:node('coordinate','X'),6:node('definite_integral',3,0,4,5)}
  out=b.BodyNormal(g.__getitem__,{}).at(6)
  self.assertEqual(out,('integral',b.e.power(b.call(2,[('bound',0),('coordinate',1)]),2),b.e.rat(0),('coordinate',5)))
 def test_derivative_order_not_erased_by_body_comparison(self):
  g={0:node('coordinate','x'),1:node('actual_expression_partial',2,[0],[0]),2:node('actual_expression_partial',2,[0],[1])}
  n=b.BodyNormal(g.__getitem__,{});self.assertNotEqual(n.at(1),n.at(2))
 def test_changed_small_source_exponent_rejected(self):
  with self.assertRaises(b.Gap):self.engine({}, {'h':{'exp':{'product':[{'integer':8002},{'ref':'T'}]}}}).ast('h')
 def test_positive_max_cannot_hide_undefined_argument(self):
  g={0:node('rational','1','1'),1:node('rational','0','1'),2:node('inverse',1),3:node('maximum',0,2)}
  with self.assertRaises(b.Gap):self.engine(g).at(3)
 def test_tiny_power_bound_retains_strict_positive_difference(self):
  g={0:node('rational','1','2'),1:node('integer_power',0,100000),2:node('rational','-1','1'),3:node('multiply',1,2),4:node('rational','1','1'),5:node('add',4,3),6:node('inverse',5)}
  self.assertTrue(self.engine(g).at(6).strict_positive)

if __name__=='__main__':unittest.main()
