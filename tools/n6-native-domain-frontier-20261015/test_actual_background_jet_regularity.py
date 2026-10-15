"""Adverse domain/binder controls; fixtures never certify the original rows."""
import unittest
from fractions import Fraction as Q
import actual_background_jet_regularity as b
from actual_background_jet_regularity import ConstantDomains,Bound,Gap,bounded

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
  r=self.engine(g).at(1);self.assertFalse(r.strict_positive);self.assertLess(r.hi,0)
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
 def test_finite_integral_rejects_axis_pole(self):
  g={0:node('coordinate','x'),1:node('inverse',0),2:node('rational','0','1'),3:node('rational','1','1'),4:node('definite_integral',1,0,2,3)}
  with self.assertRaises(b.Gap):self.engine(g).at(4)
 def test_integral_endpoints_are_outside_new_scope(self):
  g={0:node('coordinate','x'),1:node('rational','1','1'),2:node('definite_integral',0,0,1,0)}
  with self.assertRaises(b.Gap):self.engine(g).at(2)
  self.assertTrue(self.engine(g).at(2,((0,b.Bound(Q(2),Q(2),True)),)).strict_positive)
 def test_nested_integral_variable_endpoint_is_scoped(self):
  g={0:node('coordinate','x'),1:node('coordinate','y'),2:node('rational','0','1'),3:node('rational','1','1'),4:node('definite_integral',1,1,2,0),5:node('definite_integral',4,0,2,3)}
  r=self.engine(g).at(5);self.assertTrue(r.strict_positive)
 def test_shared_body_cache_does_not_erase_scopes(self):
  g={0:node('coordinate','x'),1:node('inverse',0),2:node('rational','0','1'),3:node('rational','1','1'),4:node('rational','2','1'),5:node('definite_integral',1,0,3,4),6:node('definite_integral',1,0,2,3)}
  e=self.engine(g);self.assertTrue(e.at(5).strict_positive)
  with self.assertRaises(b.Gap):e.at(6)
 def test_step_derivative_positive_integral_uses_interior(self):
  g={0:node('coordinate','x'),1:node('source_step_derivative',0,1),2:node('rational','0','1'),3:node('rational','1','1'),4:node('definite_integral',1,0,2,3)}
  e=self.engine(g);self.assertTrue(e.at(4).strict_positive)
  self.assertEqual(e.domains[-1]['positiveInteriorRationalWitness'],'1/2')
 def test_unknown_integrand_and_derivative_orders_fail(self):
  for op,args in [('opaque_native',[0]),('source_step_derivative',[0,13])]:
   g={0:node('coordinate','x'),1:node(op,*args),2:node('rational','0','1'),3:node('rational','1','1'),4:node('definite_integral',1,0,2,3)}
   with self.assertRaises(b.Gap):self.engine(g).at(4)
 def test_discontinuous_binder_ceiling_not_declared_continuous(self):
  g={0:node('coordinate','x'),1:node('ceiling',0),2:node('rational','0','1'),3:node('rational','1','1'),4:node('definite_integral',1,0,2,3)}
  with self.assertRaises(b.Gap):self.engine(g).at(4)

class StrictNegativeControls(unittest.TestCase):
 def engine(self):return ConstantDomains(lambda i:None,{})
 def test_negative_maximum_preserves_strict_sign_without_a_decimal_margin(self):
  c=self.engine();small=Bound(Q(0),None,True)
  negative=c.operation('multiply',[bounded(Q(-1)),small])
  self.assertTrue(negative.strict_negative);self.assertEqual(negative.hi,0)
  maximum=c.operation('maximum',[negative,negative]);self.assertTrue(maximum.strict_negative)
  positive=c.operation('multiply',[bounded(Q(-1)),maximum]);self.assertTrue(positive.strict_positive)
  self.assertTrue(c.operation('inverse',[positive]).strict_positive)
 def test_zero_in_maximum_prevents_nonzero_reciprocal_promotion(self):
  c=self.engine();negative=Bound(None,Q(0),False,True)
  value=c.operation('maximum',[negative,bounded(Q(0))])
  self.assertFalse(value.strict_negative)
  with self.assertRaises(Gap):c.operation('inverse',[value])
 def test_unknown_nonpositive_input_cannot_be_treated_as_strictly_negative(self):
  c=self.engine();value=c.operation('maximum',[Bound(None,Q(0),False,True),Bound(None,Q(0))])
  self.assertFalse(value.strict_negative)
  with self.assertRaises(Gap):c.operation('inverse',[value])
 def test_negative_reciprocal_and_odd_power_keep_strict_sign(self):
  c=self.engine();negative=Bound(None,Q(0),False,True)
  self.assertTrue(c.operation('inverse',[negative]).strict_negative)
  self.assertTrue(c.operation('integer_power',[negative],3).strict_negative)
  self.assertTrue(c.operation('integer_power',[negative],2).strict_positive)
 def test_contradictory_strict_signs_are_rejected(self):
  with self.assertRaises(Gap):Bound(Q(0),None,False,True)
  with self.assertRaises(Gap):Bound(None,Q(0),True)

if __name__=='__main__':unittest.main()
