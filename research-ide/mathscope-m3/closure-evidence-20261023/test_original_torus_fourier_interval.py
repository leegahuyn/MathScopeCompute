import unittest
from fractions import Fraction as Q
from rigorous_rational_intervals import UncertifiedExpression
from original_torus_fourier_interval import (
 sqrt2_bracket,pi_bracket,inverse_direction_multiplier,
 inverse_finite_real_fourier_modes,conditional_Cm_fourier_tail_bound)

class OriginalEq819Tests(unittest.TestCase):
 def test_exact_sqrt2_interval(self):
  a=sqrt2_bracket(96);self.assertLess(a.lo*a.lo,2);self.assertGreater(a.hi*a.hi,2)
 def test_exact_machin_pi(self):
  a=pi_bracket();self.assertGreater(a.lo,Q(314,100));self.assertLess(a.hi,Q(315,100))
 def test_reject_zero_mode(self):
  with self.assertRaises(UncertifiedExpression):inverse_direction_multiplier(0,0)
 def test_algebraic_conjugate_near_denominator(self):
  for k in [(1,0),(-1,1),(99,-40),(0,1),(337,-139)]:
   a=inverse_direction_multiplier(*k)
   self.assertLess(a.hi-a.lo,Q(1,10**12))
 def test_sine_y2_pair(self):
  modes={'0,1':{'re':['0','0'],'im':['-1/2','-1/2']},
    '0,-1':{'re':['0','0'],'im':['1/2','1/2']}}
  r=inverse_finite_real_fourier_modes(modes)
  lo,hi=map(Q,r['output_coefficients']['0,1']['re'])
  self.assertLess(lo,Q(-79,1000));self.assertGreater(hi,Q(-80,1000))
  self.assertEqual(r['output_coefficients']['0,1'],r['output_coefficients']['0,-1'])
  self.assertEqual(r['actual_original_final_field_jet_intervals_certified'],0)
 def test_haar_mean_nonzero_rejected(self):
  with self.assertRaises(UncertifiedExpression):
   inverse_finite_real_fourier_modes({'0,0':{'re':['1','1'],'im':['0','0']}})
 def test_missing_conjugate_rejected(self):
  with self.assertRaises(UncertifiedExpression):
   inverse_finite_real_fourier_modes({'1,0':{'re':['1','1'],'im':['0','0']}})
 def test_invalid_real_conjugacy_rejected(self):
  with self.assertRaises(UncertifiedExpression):
   inverse_finite_real_fourier_modes({'1,0':{'re':['1','1'],'im':['0','0']},
    '-1,0':{'re':['2','2'],'im':['0','0']}})
 def test_four_derivative_conditional_tail(self):
  r=conditional_Cm_fourier_tail_bound(3,5,'2')
  self.assertEqual(Q(r['tail_Cm_upper_bound']),Q(7,4860))
  self.assertFalse(r['actual_source_Cm_plus4_bound_proven_by_this_kernel'])
 def test_float_M_rejected(self):
  with self.assertRaises(UncertifiedExpression):conditional_Cm_fourier_tail_bound(3,5,2.)
 def test_zero_K_rejected(self):
  with self.assertRaises(UncertifiedExpression):conditional_Cm_fourier_tail_bound(3,0,2)
 def test_negative_M_rejected(self):
  with self.assertRaises(UncertifiedExpression):conditional_Cm_fourier_tail_bound(3,5,-1)
if __name__=='__main__':unittest.main()
