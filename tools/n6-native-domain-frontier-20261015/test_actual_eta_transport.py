"""Semantic controls only; tiny fixtures do not authenticate the original graph."""
import unittest
import actual_eta_transport as m

def node(op,*args):return {'op':op,'args':list(args)}

class ActualEtaTransportControls(unittest.TestCase):
 def test_exact_chart_sign_registry_controls(self):
  self.assertTrue(all(v for k,v in m.negative_controls().items() if isinstance(v,bool)))
 def test_formal_eta_is_not_an_actual_domain_proof(self):
  n=m.Normal(lambda i:node('coordinate','eta'),{})
  out=m.classify_eta(n,m.ETA)
  self.assertEqual(out['kind'],'formalEta');self.assertFalse(out['rangeEstablishedHere'])
 def test_unknown_native_eta_argument_remains_open(self):
  n=m.Normal(lambda i:node('actual_expression_partial',77,[2],[0]),{})
  self.assertEqual(m.classify_eta(n,123)['kind'],'unresolvedEtaArgument')
 def test_missing_monotone_registry_is_rejected(self):
  n=m.Normal(lambda i:node('actual_monotone_root',2,10,11),{'monotone':[]})
  with self.assertRaises(IndexError):n.at(1)
 def test_wrong_monotone_arity_is_rejected(self):
  n=m.Normal(lambda i:node('actual_monotone_root',0,10),{'monotone':[{'parameters':[10,11]}]})
  with self.assertRaises(ValueError):n.at(1)
 def test_integral_binder_only_binds_body_not_endpoints(self):
  g={0:node('coordinate','a'),1:node('coordinate','b'),2:node('add',0,1),3:node('definite_integral',2,0,0,1)}
  f=m.semantic_free_coordinates(g.__getitem__,set(g))
  self.assertEqual(f[3],{0,1})
 def test_nested_integral_shadowing_retains_free_outer_endpoint(self):
  g={0:node('coordinate','x'),1:node('coordinate','y'),2:node('definite_integral',0,0,1,1),3:node('definite_integral',2,1,0,0)}
  f=m.semantic_free_coordinates(g.__getitem__,set(g))
  self.assertEqual(f[2],{1});self.assertEqual(f[3],{0})
 def fixture(self,orders=None,parameters=None,body=0):
  parameters=parameters if parameters is not None else [99]
  g={0:node('coordinate','x'),1:node('actual_expression_partial',12,[0],orders if orders is not None else [0])}
  reg={'expression':{12:{'name':'fixture','parameters':parameters,'body':body,'unspecifiedOracle':False}}}
  return g,reg
 def test_unbound_native_body_coordinate_rejected(self):
  g,r=self.fixture();f=m.semantic_free_coordinates(g.__getitem__,set(g))
  with self.assertRaises(ValueError):m.expression_inventory(g.__getitem__,r,set(g),f,expected_count=1)
 def test_boolean_partial_order_rejected(self):
  g,r=self.fixture([True],[0]);f=m.semantic_free_coordinates(g.__getitem__,set(g))
  with self.assertRaises(ValueError):m.expression_inventory(g.__getitem__,r,set(g),f,expected_count=1)
 def test_partial_arity_rejected(self):
  g,r=self.fixture([0,0],[0]);f=m.semantic_free_coordinates(g.__getitem__,set(g))
  with self.assertRaises(ValueError):m.expression_inventory(g.__getitem__,r,set(g),f,expected_count=1)
 def test_source_call_count_cannot_be_satisfied_by_tiny_fixture(self):
  g,r=self.fixture([0],[0]);f=m.semantic_free_coordinates(g.__getitem__,set(g))
  self.assertEqual(len(m.expression_inventory(g.__getitem__,r,set(g),f,expected_count=1)[0]),1)
  with self.assertRaises(ValueError):m.expression_inventory(g.__getitem__,r,set(g),f)
 def test_pressure_radial_coordinate_is_not_silently_ignored(self):
  g={0:node('coordinate','Z'),1:node('coordinate','T'),2:node('coordinate','R'),3:node('multiply',0,1),4:node('add',3,2)}
  f=m.semantic_free_coordinates(g.__getitem__,set(g))
  self.assertNotIn(2,f[3]);self.assertIn(2,f[4])

if __name__=='__main__':unittest.main()
