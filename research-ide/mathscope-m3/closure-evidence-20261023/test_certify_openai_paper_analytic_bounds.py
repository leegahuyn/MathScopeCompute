import unittest
from fractions import Fraction as Q
from math import factorial,comb
from certify_openai_paper_B11_f0_exact import paper_B11_certificate,finite_enclosure
from certify_openai_paper_Brho_tail_exact import receipt,tail_factor

class OriginalPaperExactAnalyticCertificates(unittest.TestCase):
    def test_original_B11_exact_lower(self):
        c=paper_B11_certificate(5)
        self.assertEqual(Q(c['f0_lower_exact']),Q(305719,1152000))
        self.assertEqual(c['f0_upper_exact'],'1')
        self.assertEqual(len(c['radial_derivatives']),5)
        self.assertFalse(c['actual_Phi_positive_proven'])
    def test_original_B11_alternating_finite_interval(self):
        for z in (Q(0),Q(1),Q(4),Q(41,10)):
            a=finite_enclosure(z,0,12)
            b=finite_enclosure(z,0,13)
            self.assertLessEqual(max(a[0],b[0]),min(a[1],b[1]))
            self.assertGreaterEqual(a[0],Q(305719,1152000))
            self.assertLessEqual(a[1],Q(1))
    def test_exact_B11_derivative_sign_enclosures(self):
        for k in range(1,9):
            lo,hi=finite_enclosure(Q(41,10),k,14)
            self.assertGreater(lo,0) if k%2==0 else self.assertLess(hi,0)
    def test_24_real_mixed_tail_parameters(self):
        c=receipt(12)
        self.assertEqual(len(c['mixed_derivative_upper_enclosures']),24)
        self.assertFalse(c['original_source_M_rho_domain_certified'])
        self.assertFalse(c['original_source_coefficient_values_evaluated'])
        self.assertEqual(c['final_67_field_jet_intervals_certified'],0)
    def test_zero_order_tail_ratio_formula(self):
        q=Q(41,200)
        self.assertEqual(tail_factor(12,0,0),q**13/(14**2*(1-q)))
    def test_higher_derivative_geometric_majorant(self):
        R=Q(41,10)
        for radial,eta in [(0,0),(1,2),(3,5)]:
            partial=Q(0)
            for alpha in range(13,60):
                partial+=(Q(factorial(alpha),factorial(alpha-radial))*
                    Q(comb(alpha+eta,eta)*factorial(eta),
                      (alpha+1)**2*(eta+1)**2)*
                    R**(alpha-radial)/Q(20)**alpha)
            self.assertLess(partial,tail_factor(12,radial,eta))
    def test_malformed_radius_or_orders_rejected(self):
        for bad in (Q(20),Q(21),Q(-1),1.2):
            with self.assertRaises(ValueError):tail_factor(12,3,5,bad)
        with self.assertRaises(ValueError):tail_factor(0,3,5)
        with self.assertRaises(ValueError):finite_enclosure(4.1,0,12)
    def test_conditional_certificates_cannot_promote_original_523(self):
        x=paper_B11_certificate()
        y=receipt()
        self.assertEqual(x['new_global_523_Y_bounds_certified'],0)
        self.assertEqual(y['original_523_calls_newly_certified'],0)
        self.assertEqual(y['release'],'HOLD')
if __name__=='__main__':unittest.main()
