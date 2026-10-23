import unittest
from fractions import Fraction as F
from rigorous_rational_intervals import Interval,UncertifiedExpression
from certified_bounded_transcendentals import (
    exp_positive_bounded,log_positive_bounded,sqrt_positive_bounded)
def Q(a,b=None):
    if b is None:b=a
    return Interval(F(a),F(b))
class RationalTranscendentalProofControls(unittest.TestCase):
    def test_exp_zero_exact(self):
        self.assertEqual(exp_positive_bounded(Q(0)).json(),['1','1'])
    def test_exp_one_has_very_small_proven_tail(self):
        r=exp_positive_bounded(Q(1))
        self.assertGreater(r.lo,F(2718,1000))
        self.assertLess(r.hi,F(2719,1000))
    def test_exp_negative_one_reciprocal(self):
        r=exp_positive_bounded(Q(-1))
        self.assertGreater(r.lo,F(1,3))
        self.assertLess(r.hi,F(1,2))
    def test_exp_interval_monotone(self):
        r=exp_positive_bounded(Q(-1,1))
        self.assertLess(r.lo,F(1,2))
        self.assertGreater(r.hi,F(2))
    def test_log_one_exact(self):
        self.assertEqual(log_positive_bounded(Q(1)).json(),['0','0'])
    def test_log_two_geometric_tail(self):
        r=log_positive_bounded(Q(2))
        self.assertGreater(r.lo,F(69,100))
        self.assertLess(r.hi,F(70,100))
    def test_log_half_negative(self):
        r=log_positive_bounded(Q(F(1,2)))
        self.assertGreater(r.lo,F(-7,10))
        self.assertLess(r.hi,F(-69,100))
    def test_sqrt_four_exact(self):
        self.assertEqual(sqrt_positive_bounded(Q(4)).json(),['2','2'])
    def test_sqrt_two_dyadic_bounds(self):
        r=sqrt_positive_bounded(Q(2),bits=48)
        self.assertGreater(r.lo,F(707,500))
        self.assertLess(r.hi,F(283,200))
        self.assertLessEqual(r.lo*r.lo,F(2))
        self.assertGreaterEqual(r.hi*r.hi,F(2))
    def test_sqrt_interval_still_enclosing(self):
        r=sqrt_positive_bounded(Q(2,3),bits=32)
        self.assertLessEqual(r.lo*r.lo,F(2))
        self.assertGreaterEqual(r.hi*r.hi,F(3))
    def test_source_gigantic_exponential_not_approximated(self):
        with self.assertRaises(UncertifiedExpression):
            exp_positive_bounded(Q(1048576))
    def test_log_outside_proved_domain_rejected(self):
        with self.assertRaises(UncertifiedExpression):
            log_positive_bounded(Q(F(1,4),2))
    def test_sqrt_negative_rejected(self):
        with self.assertRaises(UncertifiedExpression):
            sqrt_positive_bounded(Q(-1,2))
    def test_no_float_precision_smuggling(self):
        with self.assertRaises(UncertifiedExpression):
            exp_positive_bounded(Interval.parse([0.0,1.0]))
if __name__=='__main__':unittest.main()
