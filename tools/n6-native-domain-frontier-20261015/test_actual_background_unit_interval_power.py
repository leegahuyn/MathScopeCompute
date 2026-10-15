import unittest
from fractions import Fraction as F
from actual_background_jet_regularity import Bound,ConstantDomains,Gap

class UnitIntervalPowerControls(unittest.TestCase):
 def setUp(self):self.c=ConstantDomains(lambda _:None,{})
 def test_every_positive_even_power_keeps_unit_upper_bound(self):
  for n in (2,4,6,128):
   result=self.c.operation('integer_power',[Bound(F(-1),F(1))],n)
   self.assertEqual((result.lo,result.hi),(0,1));self.assertFalse(result.strict_positive)
   for k in range(-8,9):self.assertLessEqual(F(k,8)**n,result.hi)
 def test_negative_unit_interval_even_power_retains_strict_sign(self):
  result=self.c.operation('integer_power',[Bound(F(-1),F(-1,2))],4)
  self.assertEqual(result.hi,1);self.assertTrue(result.strict_positive)
 def test_original_L_floor_is_retained(self):
  sq=self.c.operation('integer_power',[Bound(F(-1),F(1))],2)
  twice_h=self.c.operation('multiply',[Bound(F(0),F(1,16),True),Bound(F(2),F(2))])
  negative=self.c.operation('multiply',[Bound(F(-1),F(-1)),twice_h,sq])
  L=self.c.operation('add',[Bound(F(1),F(1)),negative])
  self.assertGreaterEqual(L.lo,F(7,8));self.assertTrue(L.strict_positive)
  self.assertTrue(self.c.operation('inverse',[L]).strict_positive)
 def test_outside_unit_interval_has_no_unit_upper_bound(self):
  result=self.c.operation('integer_power',[Bound(F(-2),F(2))],2)
  self.assertIsNone(result.hi);self.assertFalse(result.strict_positive)
 def test_odd_power_does_not_become_nonnegative(self):
  result=self.c.operation('integer_power',[Bound(F(-1),F(1))],3)
  self.assertIsNone(result.lo);self.assertFalse(result.strict_positive)
 def test_zero_remains_zero_and_cannot_be_inverted(self):
  result=self.c.operation('integer_power',[Bound(F(0),F(0))],2)
  with self.assertRaises(Gap):self.c.operation('inverse',[result])
 def test_negative_power_still_checks_nonzero_first(self):
  with self.assertRaises(Gap):self.c.operation('integer_power',[Bound(F(-1),F(1))],-2)
 def test_a_different_L_with_zero_is_rejected(self):
  z=self.c.operation('add',[Bound(F(1),F(1)),Bound(F(-1),F(-1))])
  with self.assertRaises(Gap):self.c.operation('inverse',[z])

if __name__=='__main__':unittest.main()
