import unittest
from fractions import Fraction as Q
from rigorous_rational_intervals import UncertifiedExpression
from paper_eq820_torus_mean_update import paper_eq820_finite_torus_update

def sine():
 return {'0,1':{'re':['0','0'],'im':['-1/2','-1/2']},
         '0,-1':{'re':['0','0'],'im':['1/2','1/2']}}

class Eq820Tests(unittest.TestCase):
 def test_fixed_ci_sign_and_quotient(self):
  r=paper_eq820_finite_torus_update(sine(),sine(),['2','2'])
  lo,hi=map(Q,r['delta_v_coefficients']['0,1']['re'])
  self.assertGreater(lo,Q(39,1000));self.assertLess(hi,Q(40,1000))
  self.assertEqual(r['delta_v_coefficients'],r['gamma_desired_coefficients'])
  self.assertFalse(r['actual_pressure_recomputed'])
  self.assertEqual(r['actual_original_final_67_jet_intervals_certified'],0)
 def test_varying_ci(self):
  r=paper_eq820_finite_torus_update(sine(),sine(),['1','2'])
  lo,hi=map(Q,r['delta_v_coefficients']['0,1']['re'])
  self.assertLessEqual(lo,Q(1,16));self.assertGreater(hi,Q(1,16))
 def test_zero_ci_rejected(self):
  with self.assertRaises(UncertifiedExpression):
   paper_eq820_finite_torus_update(sine(),sine(),['0','2'])
 def test_negative_ci_rejected(self):
  with self.assertRaises(UncertifiedExpression):
   paper_eq820_finite_torus_update(sine(),sine(),['-2','-1'])
 def test_missing_conjugate_rejected(self):
  with self.assertRaises(UncertifiedExpression):
   paper_eq820_finite_torus_update({'0,1':sine()['0,1']},sine(),['1','1'])
if __name__=='__main__':unittest.main()
