import os,unittest
from fractions import Fraction as F
from decimal import Decimal as D,localcontext
from math import factorial
from pathlib import Path
from rigorous_rational_intervals import UncertifiedExpression
from original_monotone2_interval_jets import point
from original_phi1_coefficient import (_phi1_scaled_series,phi1_axis_jets,tube_bound,
    source_polynomial,authenticate_source,source_parameter_bounds)


def add(a,b):
    out=[F(0)]*max(len(a),len(b))
    for k,v in enumerate(a):out[k]+=v
    for k,v in enumerate(b):out[k]+=v
    return out


def scale(a,x):return [v*x for v in a]


def mul(a,b):
    out=[F(0)]*(len(a)+len(b)-1)
    for i,u in enumerate(a):
        for j,v in enumerate(b):out[i+j]+=u*v
    return out


def derivative(a):return [i*a[i] for i in range(1,len(a))] or [F(0)]


def independent_rational_derivatives_at_zero(numerator,denominator,order):
    """Repeated direct quotient differentiation; no inverse Taylor series."""
    p=numerator;out=[];dp=derivative(denominator)
    for m in range(order+1):
        out.append(p[0]/denominator[0]**(m+1))
        p=add(mul(derivative(p),denominator),scale(mul(p,dp),F(-(m+1))))
    return out


class ActualPhi1Coefficient(unittest.TestCase):
    def contains(self,pair,x):
        lo,hi=map(F,pair);self.assertLessEqual(lo,x);self.assertGreaterEqual(hi,x)

    def test_full_five_derivatives_independent_exact_quotient_rule(self):
        # Generic rational tests exercise the recurrence at resolved nonzero
        # h and h^8; these are not replacement source parameters.
        for h in (F(1,64),F(1,32)):
            q=h**8;inv=F(1,1024)
            Hs=[F(1),F(9,2)-h,-q,-4*q];hs2=mul(Hs,Hs)
            den=add(hs2,[F(1,4000000)])
            chi=independent_rational_derivatives_at_zero(hs2,den,5)
            r1=independent_rational_derivatives_at_zero([-3+h,-q],[F(1),F(0),-2*h*q],5)
            series=_phi1_scaled_series(point(h),point(q),point(inv),5,512)
            for m,value in enumerate(series):
                expected=(-chi[m]+inv*r1[m])/4
                self.assertLessEqual(value.lo*factorial(m),expected)
                self.assertGreaterEqual(value.hi*factorial(m),expected)

    def test_original_axis_value_and_first_derivative_h_zero_limit_enclosed(self):
        r=phi1_axis_jets(bits=256);rows=r['normalized_eta_jets'];ratio=F(1,4000000)
        self.contains(rows[0]['normalized_enclosure'],-F(1000000,4000001))
        self.contains(rows[1]['normalized_enclosure'],-F(9,4)*ratio/(1+ratio)**2)
        self.assertLess(F(rows[0]['normalized_enclosure'][1]),0)
        self.assertGreater(F(rows[0]['normalized_enclosure'][0]),F(-1,4))
        self.assertLess(F(rows[1]['normalized_enclosure'][1]),0)
        self.assertEqual([x['unnormalized_exact_scale']['integer_exponent'] for x in rows],[0,-4,-8,-12,-16,-20])

    def test_actual_h_effect_resolved_in_independent_decimal_axis_formula(self):
        with localcontext() as ctx:
            ctx.prec=1460
            h=D(2)**(-4097);inv=D(2)**(-5000);ratio=D(1)/D(4000000)
            c0=(-1/(1+ratio)+inv*(-3+h))/4
            c1=-(D('4.5')-h)*ratio/(2*(1+ratio)**2)-inv*h**8/4
            r=phi1_axis_jets(bits=4096)
            for row,value in zip(r['normalized_eta_jets'],(c0,c1)):
                lo,hi=map(F,row['normalized_enclosure'])
                self.assertLessEqual(D(lo.numerator)/D(lo.denominator),value)
                self.assertGreaterEqual(D(hi.numerator)/D(hi.denominator),value)

    def test_source_poly_normalization_rejects_hidden_nonpolynomial_nodes(self):
        nodes=[{'op':'coordinate','args':['eta']},{'op':'source_parameter','args':['h']},
               {'op':'coordinate','args':['eta']},{'op':'source_parameter','args':['j0']},
               {'op':'multiply','args':[2,3]}]
        self.assertEqual(source_polynomial(nodes,4),{(1,0,1):F(1)})
        for item in ({'op':'inverse','args':[2]},{'op':'coordinate','args':['hidden']},
                     {'op':'actual_natural_series','args':[]}):
            with self.assertRaises(UncertifiedExpression):source_polynomial(nodes+[item],5)

    def test_complex_tube_numeric_margins_and_source_Q_budget(self):
        r=tube_bound();b=source_parameter_bounds()
        self.assertEqual(r['complex_tube_radius'],'4*rho')
        self.assertEqual(r['B_rho_radial_n1_slice_on_I_prime_upper'],'163840/sigmaStar^2 < Q')
        self.assertFalse(r['original_appendix_interval_I_bound_to_I_prime'])
        self.assertGreater(int(b['Q_numerator_constant']),163840)
        for m in range(100):self.assertLessEqual(m+1,4**m)

    def test_no_whole_series_tail_Y_or_final_field_completion(self):
        r=phi1_axis_jets();self.assertTrue(r['actual_nonlinear_finite_coefficient_evaluated'])
        self.assertTrue(r['finite_degree1_Phi_polynomial_Brho_on_I_prime_norm_le_Q'])
        for k in ('whole_natural_function_evaluated','whole_Phi_u_Brho_norm_proved',
                  'common_all_radial_coefficients_complex_domain_proved'):
            self.assertFalse(r[k])
        self.assertEqual(r['source_natural_Y_calls_newly_certified'],0)
        self.assertEqual(r['natural_Y_OPEN'],490);self.assertEqual(r['final_67_jets'],0)
        self.assertEqual(r['M3'],'62/64');self.assertEqual(r['M4'],'0/16');self.assertEqual(r['release'],'HOLD')

    def test_exact_complex_samples_respect_uniform_tube_bounds(self):
        # Supplemental samples of the exact formula; the universal proof is
        # the polynomial Lipschitz/triangle bound, not these sample points.
        def cmul(a,b):return (a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0])
        def cadd(a,b):return (a[0]+b[0],a[1]+b[1])
        def cscale(a,b):return (a[0]*b,a[1]*b)
        def cdiv(a,b):
            n=b[0]**2+b[1]**2
            return ((a[0]*b[0]+a[1]*b[1])/n,(a[1]*b[0]-a[0]*b[1])/n)
        norm2=lambda z:z[0]**2+z[1]**2
        h=F(1,64);j=h**4;sigma=j/2000;rho=sigma**2/65536;one=(F(1),F(0))
        for x in (F(-2),F(-1),F(-1,2),F(0),F(1,2),F(1),F(2)):
            for dr,di in ((1,0),(-1,0),(0,1),(0,-1),(F(1,2),F(1,2))):
                z=(x+4*rho*dr,4*rho*di);zz=cmul(z,z)
                Hs=cadd(cscale(z,F(1,2)-h),cmul(cadd(one,cscale(zz,-1)),cadd(cscale(z,4),(j,F(0)))))
                hs2=cmul(Hs,Hs);den=cadd(hs2,(sigma**2,F(0)))
                L=cadd(one,cscale(zz,-2*h))
                self.assertGreaterEqual(norm2(den),(sigma**2/2)**2)
                self.assertGreaterEqual(norm2(L),F(1,4))
                r1=cdiv(cadd((F(-3)+h,F(0)),cscale(z,-j)),L)
                phi=cscale(cadd(cscale(cdiv(hs2,den),-1),cscale(r1,F(1,2))),F(1,4))
                self.assertLess(norm2(phi),(2048/sigma**2)**2)

    def test_invalid_options_fail_closed(self):
        for degree,bits in ((6,256),(True,256),(2,31),(2,8193)):
            with self.assertRaises(UncertifiedExpression):phi1_axis_jets(degree,bits)

    def test_full_source_core_and_recurrence_authentication(self):
        path=os.environ.get('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not path:self.skipTest('Set original graph environment variable')
        result=authenticate_source(Path(path).parent)
        self.assertEqual(len(result['polynomial_identities_checked']),3)
        self.assertTrue(result['source_parameters']['h_strictly_positive'])


if __name__=='__main__':unittest.main()
