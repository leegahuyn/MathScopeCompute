"""Protocol controls only: synthetic scalar handlers do not prove source rows."""
import unittest
from fractions import Fraction as Q
from actual_background_jet_regularity import ConstantDomains,Bound,Gap

def node(op,*args):return {'op':op,'args':list(args)}

class ExactScalarProtocolControls(unittest.TestCase):
 def graph(self):
  return {0:node('rational','0','1'),1:node('rational','1','1'),
   2:node('coordinate','synthetic x'),3:node('inverse',0),
   517240:node('definite_integral',3,2,0,1)}
 def handler(self,engine,i,n,environment):
  if i!=517240:return None
  if environment:raise ValueError('Exact scalar application requires no free coordinates')
  engine.domains.append({'node':i,'boundedPiecewiseIntegrabilityProved':True,
   'continuousOnFiniteClosedInterval':False,'syntheticProtocolFixtureOnly':True})
  return Bound(Q(0),None,True)
 def test_default_retains_unproved_actual_primitive(self):
  with self.assertRaises(Gap):ConstantDomains(self.graph().__getitem__,{}).at(517240)
 def test_complete_scalar_hook_does_not_stamp_integrand_continuous(self):
  c=ConstantDomains(self.graph().__getitem__,{},scalar_handler=self.handler)
  self.assertTrue(c.at(517240).strict_positive)
  self.assertEqual(c.domains,[{'node':517240,'boundedPiecewiseIntegrabilityProved':True,
   'continuousOnFiniteClosedInterval':False,'syntheticProtocolFixtureOnly':True}])
 def test_same_children_remain_unapproved_independently(self):
  c=ConstantDomains(self.graph().__getitem__,{},scalar_handler=self.handler)
  c.at(517240)
  with self.assertRaises(Gap):c.at(3)
 def test_application_does_not_hide_an_unrelated_undefined_operand(self):
  g=self.graph();g[4]=node('add',517240,3)
  with self.assertRaises(Gap):ConstantDomains(g.__getitem__,{},scalar_handler=self.handler).at(4)
 def test_empty_environment_result_is_not_reused_in_a_new_scope(self):
  c=ConstantDomains(self.graph().__getitem__,{},scalar_handler=self.handler);c.at(517240)
  with self.assertRaises(Gap) as caught:c.at(517240,((2,Bound(Q(0),Q(1))),))
  self.assertTrue(caught.exception.primitive_frontier['exactScalarApplicationRejected'])
 def test_handler_without_application_leaves_native_fail_closed(self):
  g=self.graph();g[4]=node('actual_expression_partial',1,[0,1],[0,1])
  with self.assertRaises(Gap):ConstantDomains(g.__getitem__,{},scalar_handler=self.handler).at(4)
 def test_malformed_application_cannot_be_used_as_a_finite_value(self):
  with self.assertRaises(Gap):ConstantDomains(self.graph().__getitem__,{},scalar_handler=lambda *args:True).at(517240)
 def test_application_rejection_preserves_exact_source_frontier(self):
  def reject(*args):raise ValueError('changed source theorem')
  with self.assertRaises(Gap) as caught:ConstantDomains(self.graph().__getitem__,{},scalar_handler=reject).at(517240)
  self.assertEqual(caught.exception.primitive_frontier['sourceNode'],self.graph()[517240])
  self.assertFalse(caught.exception.primitive_frontier['finiteOrPositiveValueAssumed'])

if __name__=='__main__':unittest.main()
