"""Unsupported actual scalar primitives stay OPEN with source-node diagnostics."""
import unittest
from actual_background_jet_regularity import ConstantDomains,Bound,Gap
from fractions import Fraction as Q

class ConstantFrontier(unittest.TestCase):
 def test_unknown_expression_records_actual_tuple(self):
  node={'op':'actual_expression_partial','args':[99,[10,11],[0,1]]}
  with self.assertRaises(Gap) as caught:ConstantDomains({416306:node}.__getitem__,{}).at(416306)
  d=caught.exception.primitive_frontier
  self.assertEqual(d['node'],416306);self.assertEqual(d['sourceNode'],node)
  self.assertTrue(d['unsupportedNativeOrPrimitive']);self.assertFalse(d['finiteOrPositiveValueAssumed'])
 def test_unknown_scoped_primitive_records_scope(self):
  node={'op':'not_a_reviewed_primitive','args':[10]}
  with self.assertRaises(Gap) as caught:ConstantDomains({42:node}.__getitem__,{}).at(42,((10,Bound(Q(0),Q(1))),))
  self.assertEqual(caught.exception.primitive_frontier['scopedCoordinates'],[10])

if __name__=='__main__':unittest.main()
