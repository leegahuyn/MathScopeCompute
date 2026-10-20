"""Independent unit-interval enclosure controls; not full-source proofs."""
import unittest
from fractions import Fraction as Q
from actual_background_jet_regularity import ConstantDomains,Bound,Gap

ACTUAL_11_NODE_CONE={402510: {'op': 'inverse', 'args': [402509]},
 402509: {'op': 'add', 'args': [1, 402508]},
 402508: {'op': 'multiply', 'args': [20, 402507]},
 402507: {'op': 'multiply', 'args': [25, 402506]},
 402506: {'op': 'integer_power', 'args': [402372, 2]},
 402372: {'op': 'coordinate', 'args': ['physical_norm_face_7_2$23614']},
 25: {'op': 'multiply', 'args': [9, 24]},
 24: {'op': 'rational', 'args': ['2', '1']},
 9: {'op': 'source_parameter', 'args': ['h']},
 20: {'op': 'rational', 'args': ['-1', '1']},
 1: {'op': 'rational', 'args': ['1', '1']}}
H_AST={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}

class UnitIntervalEvenPowerPeerControls(unittest.TestCase):
 def engine(self):return ConstantDomains(lambda i:None,{})
 def test_all_positive_even_orders_preserve_unit_interval_upper(self):
  for n in (2,4,128,100000):
   with self.subTest(n=n):
    b=self.engine().operation('integer_power',[Bound(Q(-1),Q(1))],n)
    self.assertEqual((b.lo,b.hi),(Q(0),Q(1)));self.assertFalse(b.strict_positive)
 def test_negative_unit_interval_excluding_zero_has_positive_even_power(self):
  b=self.engine().operation('integer_power',[Bound(Q(-1),Q(-1,2))],2)
  self.assertTrue(b.strict_positive);self.assertEqual(b.hi,1)
 def test_zero_power_case_is_the_existing_one(self):
  b=self.engine().operation('integer_power',[Bound(Q(-1),Q(1))],0)
  self.assertEqual((b.lo,b.hi),(1,1))
 def test_odd_power_is_not_clamped_nonnegative(self):
  b=self.engine().operation('integer_power',[Bound(Q(-1),Q(1))],3)
  self.assertFalse(b.strict_positive);self.assertFalse(b.lo is not None and b.lo>=0)
 def test_outside_unit_interval_does_not_gain_unit_upper(self):
  b=self.engine().operation('integer_power',[Bound(Q(-2),Q(2))],2)
  self.assertTrue(b.hi is None or b.hi>=4)
 def test_unbounded_input_does_not_gain_unit_upper(self):
  b=self.engine().operation('integer_power',[Bound(None,Q(1))],2)
  self.assertIsNone(b.hi)
 def test_negative_even_power_cannot_erase_pole_at_zero(self):
  with self.assertRaises(Gap):self.engine().operation('integer_power',[Bound(Q(-1),Q(1))],-2)
 def test_zero_square_cannot_be_inverted(self):
  c=self.engine();square=c.operation('integer_power',[Bound(Q(0),Q(0))],2)
  with self.assertRaises(Gap):c.operation('inverse',[square])
 def test_zero_L_cannot_be_inverted(self):
  c=self.engine();v=c.operation('add',[Bound(Q(1),Q(1)),Bound(Q(-1),Q(-1))])
  with self.assertRaises(Gap):c.operation('inverse',[v])
 def test_exact_actual_11_node_L_cone_on_explicit_admitted_eta_box(self):
  c=ConstantDomains(ACTUAL_11_NODE_CONE.__getitem__,{'h':H_AST})
  env=((402372,Bound(Q(-1),Q(1))),)
  L=c.at(402509,env);inverse=c.at(402510,env)
  self.assertEqual((L.lo,L.hi),(Q(7,8),Q(1)));self.assertTrue(inverse.strict_positive)
 def test_actual_L_cone_does_not_silently_assume_eta_box(self):
  c=ConstantDomains(ACTUAL_11_NODE_CONE.__getitem__,{'h':H_AST})
  with self.assertRaises(Gap):c.at(402510,((402372,Bound(Q(-4),Q(4))),))
 def test_actual_L_cone_rejects_unscoped_eta(self):
  c=ConstantDomains(ACTUAL_11_NODE_CONE.__getitem__,{'h':H_AST})
  with self.assertRaises(Gap):c.at(402510)
 def test_actual_small_h_source_AST_must_be_the_unchanged_one(self):
  c=ConstantDomains(ACTUAL_11_NODE_CONE.__getitem__,{'h':{'exp':{'product':[{'integer':8002},{'ref':'T'}]}}})
  with self.assertRaises(Gap):c.at(402510,((402372,Bound(Q(-1),Q(1))),))

if __name__=='__main__':unittest.main()
