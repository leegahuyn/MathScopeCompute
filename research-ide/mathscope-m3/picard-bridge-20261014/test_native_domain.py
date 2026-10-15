"""Negative controls for a genuine complex denominator lemma."""
from fractions import Fraction as Q
import unittest
from native_domain_audit import ETA_RADIUS,H_ABS_MAX,L_LOWER,POLY_L,add,mul,power

class NativeDomainTests(unittest.TestCase):
    def test_exact_radius_bound(self):
        self.assertEqual(ETA_RADIUS,Q(1,4))
        self.assertEqual(H_ABS_MAX,Q(1,100))
        self.assertEqual(L_LOWER,Q(31,32))
    def test_derived_denominator_polynomial(self):
        h={(1,0):Q(1)}
        eta={(0,1):Q(1)}
        target=add({(0,0):Q(1)},mul({(0,0):Q(-2)},mul(h,power(eta,2))))
        self.assertEqual(target,POLY_L)
    def test_missing_h_not_equal_L(self):
        fake={(0,0):Q(1),(0,2):Q(-2)}
        self.assertNotEqual(fake,POLY_L)
    def test_large_h_breaks_bound(self):
        h=Q(1,2)
        upper=2*h*(Q(5,4)**2)
        self.assertGreater(upper,1)
    def test_boundary_eta_magnitude(self):
        self.assertEqual(Q(2)*Q(1,100)*Q(5,4)**2,Q(1,32))
    def test_capture_variable_must_be_eta2(self):
        eta1={(0,0):Q(1)}
        target=add({(0,0):Q(1)},mul({(0,0):Q(-2)},mul({(1,0):Q(1)},power(eta1,2))))
        self.assertNotEqual(target,POLY_L)

if __name__=='__main__':unittest.main()
