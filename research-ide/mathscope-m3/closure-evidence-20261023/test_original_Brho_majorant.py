import copy,unittest
from fractions import Fraction as F
from math import comb
from unittest.mock import patch
import original_Brho_majorant as b
from rigorous_rational_intervals import UncertifiedExpression


class ExplicitWholeBrho(unittest.TestCase):
    def test_exact_positive_infinite_resolvent_tail_not_partial_sum(self):
        c=b.resolvent_certificate()
        p=F(c['positive_partial_sum']);u=F(c['entire_resolvent_norm_upper'])
        self.assertLess(p,u);self.assertLess(u,2**704)
        self.assertTrue(c['all_k_not_only_finite_partial_sum'])
        # Independent recurrence sums additional terms inside certified tail.
        t=F(1);s=t
        for k in range(400):t*=F(30720,(k+1)*(k+2));s+=t
        self.assertLess(s,u)

    def test_resolvent_ratio_failure_rejected(self):
        with self.assertRaises(UncertifiedExpression):b.resolvent_certificate(1)

    def test_weight_ratios_independent_formula(self):
        rho=F(1,7)
        for n in range(32):
            for m in [0,1,2,5,31,128]:
                self.assertLessEqual(b.weight(n,m,rho)/b.weight(n+1,m,rho),80)
                self.assertLessEqual(b.weight(n,m+1,rho)/b.weight(n+1,m,rho),F(80,rho)*(n+1))

    def test_convolution_and_binomial_edge_indices(self):
        for n in range(45):
            self.assertLessEqual(sum(F((n+1)**2,(i+1)**2*(n-i+1)**2) for i in range(n+1)),16)
        for n in range(12):
            for m in range(12):
                for i in range(n+1):
                    for k in range(m+1):
                        self.assertLessEqual(comb(i+k,k)*comb(n-i+m-k,m-k),comb(n+m,m))

    def test_mixed_kernel_full_leibniz_saturation_and_averages(self):
        rho=F(1,3)
        for n in range(10):
            for m in range(10):
                for eta,radial,average in [(True,True,False),(True,False,False),(False,True,False),(True,True,True)]:
                    total=F(0)
                    for i in range(n+1):
                        for k in range(m+1):
                            term=comb(m,k)*b.weight(i,k+int(eta),rho)*b.weight(n-i,m-k,rho)
                            if radial:term*=n-i
                            if average:term/=i+1
                            total+=term
                    ratio=total/F((n+1)*(n+1))/b.weight(n+1,m,rho) # nu1 worst case
                    self.assertLessEqual(ratio,F(20480,rho))

    def test_raw_eta_derivative_cannot_be_treated_as_bounded(self):
        m=1000
        # At n=0 this ratio exceeds the ordinary integration80 bound.
        self.assertGreater(b.weight(0,m+1)/b.weight(0,m),80)
        with self.assertRaises(UncertifiedExpression):b.remainder_majorant([(['Linv'],'raw_eta_u')])

    def test_original_remainder_monomial_counts_and_costs(self):
        self.assertEqual(len(b.R1),12);self.assertEqual(len(b.R2),10)
        self.assertEqual(b.remainder_majorant(b.R1)['computed_total_Q_exponent'],14)
        self.assertEqual(b.remainder_majorant(b.R2)['computed_total_Q_exponent'],18)
        self.assertTrue(any(k=='etaavg_u_DXPhi' for _,k in b.R1))
        self.assertTrue(any(k=='etaI_g_g_Phi_Phi' for _,k in b.R2))

    def test_majorant_unknown_factor_and_exponent_overflow_rejected(self):
        for rows in [[],[(['oracle'],'u')],[(['Linv']*10,'u')],b.R1*2]:
            with self.assertRaises(UncertifiedExpression):b.remainder_majorant(rows)

    def test_actual_complex_amplitude_selection_not_real_only(self):
        source=b.pinned_profile();bad=copy.deepcopy(source)
        bad['parametersExactExpressions']['CSelected']={'integer':1}
        with patch.object(b,'pinned_profile',return_value=bad):
            with self.assertRaises(UncertifiedExpression):b.source_budget()
        self.assertEqual(b.source_budget()['g_Brho_upper'],1)

    def test_all_order_tail_ratio_against_independent_positive_terms(self):
        for k,m in [(0,0),(4,0),(0,5),(4,5)]:
            d=b.normalized_tail(64,k,m);upper=F(d['normalized_entire_tail_upper'])
            y=F(41,10);s=F(0)
            for n in range(65,150):
                falling=1
                for j in range(k):falling*=n-j
                s+=F(comb(n+m,m)*falling,20**n*(n+1)**2)*y**(n-k)
            self.assertLess(s,upper)
            self.assertFalse(d['small_absolute_numeric_error_claimed'])

    def test_bad_tail_domain_and_ratio_rejected(self):
        for args in [(2,4,0),(64,0,1000),(64,0,0,F(20))]:
            with self.assertRaises(UncertifiedExpression):b.normalized_tail(*args)

    def test_scope_holds_native_final_and_release_gates(self):
        d=b.calculate()
        self.assertTrue(d['whole_radial_series_Brho_on_I_prime_by_written_proof'])
        for key in ['original_unspecified_appendix_I_bound','all_native_call_arguments_bound',
                    'final_A_D_fields_computed','global_energy_certified',
                    'N8_four_axis_refinement_certified','quadrature_Banach_complex_analysis_formalized_in_Lean']:
            self.assertFalse(d[key])
        self.assertEqual((d['natural_Y_certified'],d['final_67_jets'],d['M4'],d['release']),(33,0,'0/16','HOLD'))


if __name__=='__main__':unittest.main()
