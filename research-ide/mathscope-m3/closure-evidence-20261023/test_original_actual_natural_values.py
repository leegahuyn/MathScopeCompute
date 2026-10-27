import unittest
from fractions import Fraction as F
from math import factorial
import original_actual_natural_values as a
from rigorous_rational_intervals import Interval as I,UncertifiedExpression


class ActualNaturalValues(unittest.TestCase):
    def test_nonlinear_error_is_actual_fixed_point_difference(self):
        d=a.nonlinear_correction_certificate()
        self.assertEqual(len(d['source_derivative_shapes']),15)
        self.assertTrue(d['actual_Phi_positive_on_explicit_real_domain'])
        self.assertFalse(d['all_native_call_runtime_support_bound'])
        t=F(41,20)
        self.assertEqual(1-t/2+t*t/12-t**3/144,F(305719,1152000))

    def test_actual_end_Y_keeps_original_positive_t1(self):
        d=a.literal_Y_contracts()
        self.assertEqual(d[474]['enclosure'],a.point(4))
        self.assertEqual(d[3628]['formula'],'Lambda*Xa*exp(t1)=4*exp(t1)')
        self.assertGreater(d[3628]['enclosure'].hi,4)
        self.assertLess(d[3628]['enclosure'].hi,F(41,10))

    def test_center_complex_disk_and_exact_chi_axis(self):
        self.assertTrue(a.scaled_chi_disk_certificate()['applies_to_comparison_center_only'])
        c=a.scaled_chi_series()
        axis=F(4000000,4000001)
        self.assertLessEqual(c[0].lo,axis);self.assertGreaterEqual(c[0].hi,axis)
        derivative=F(9*4000000,4000001**2)
        self.assertLessEqual(c[1].lo,derivative);self.assertGreaterEqual(c[1].hi,derivative)

    def test_independent_high_degree_center_and_chain_derivatives(self):
        # h=0 is an independent algebraic limit control, never a source input.
        Y=F(4);c=F(4000000,4000001);chi1=F(9*4000000,4000001**2)
        chi2=F(2*4000000)*F(9,2)**2*F(1-3*4000000,4000001**3)
        derivatives=[]
        for k in range(3):
            s=F(0)
            for n in range(k,81):
                s+=F((-1)**n,2**n*factorial(n-k)*factorial(n+1))*(Y*c)**(n-k)
            derivatives.append(s)
        refs=[derivatives[0],Y*derivatives[1]*chi1,
              Y*Y*derivatives[2]*chi1*chi1+Y*derivatives[1]*chi2]
        rows=a.actual_Phi_axis_jets(a.point(Y))
        for m,ref in enumerate(refs):
            row=next(r for r in rows if r['radial_order']==0 and r['eta_order']==m)
            interval=I.parse(row['enclosure'])
            self.assertLessEqual(interval.lo,ref);self.assertGreaterEqual(interval.hi,ref)
            self.assertLess(interval.hi-interval.lo,F(1,10**35))
        actual=I.parse(rows[0]['enclosure']);self.assertGreater(actual.lo,F(53,200));self.assertLess(actual.hi,1)

    def test_all_comparison_tails_include_independent_more_terms(self):
        for k,m in [(0,0),(3,0),(1,5)]:
            s=sum((F(5**n,factorial(n-k)*factorial(n+1)) for n in range(33,80)),F(0))*factorial(m)*16**m
            self.assertLess(s,a.comparison_tail(32,k,m))
        with self.assertRaises(UncertifiedExpression):a.comparison_tail(1,3)

    def test_actual_scalar_axis_conditions_and_domain_rejection(self):
        self.assertEqual(a.scalar_Phi(a.point(0),a.point(1)),a.point(1))
        for Y,c in [(a.point(6),a.point(1)),(a.point(4),a.point(2))]:
            with self.assertRaises(UncertifiedExpression):a.scalar_Phi(Y,c)
        with self.assertRaises(UncertifiedExpression):a.actual_Phi_axis_jets(a.point(6))


if __name__=='__main__':unittest.main()
