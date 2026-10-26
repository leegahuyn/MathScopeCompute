import math,os,unittest
from fractions import Fraction as F
from decimal import Decimal as D,localcontext
from pathlib import Path
from rigorous_rational_intervals import UncertifiedExpression
from original_pressure_u1_coefficients import (_exp_point,_square_step,PressureAD,
    calculate,pressure_quadrature,authenticate_source,norm_margins,source_scales)


class ActualPressureU1(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.result=calculate(64,96)

    def contains(self,pair,x):
        lo,hi=map(F,pair);self.assertLessEqual(lo,x);self.assertGreaterEqual(hi,x)

    def test_dyadic_exponential_encloses_independent_decimal(self):
        with localcontext() as ctx:
            ctx.prec=100
            for x in (F(-200),F(-96),F(-12),F(-1),F(-1,100),F(0),F(1,5)):
                r=_exp_point(x,96);expected=(D(x.numerator)/D(x.denominator)).exp()
                self.assertLessEqual(D(r.lo.numerator)/D(r.lo.denominator),expected)
                self.assertGreaterEqual(D(r.hi.numerator)/D(r.hi.denominator),expected)

    def test_literal_radial_square_seed_and_symmetry(self):
        with localcontext() as ctx:
            ctx.prec=100
            for s in (F(1,4),F(2,5),F(1,2),F(3,5),F(3,4)):
                x=D(s.numerator)/D(s.denominator)
                a=(-1/(x*x)).exp();b=(-1/((1-x)*(1-x))).exp();expected=a/(a+b)
                r=_square_step(s,96)
                self.assertLessEqual(D(r.lo.numerator)/D(r.lo.denominator),expected)
                self.assertGreaterEqual(D(r.hi.numerator)/D(r.hi.denominator),expected)
                symmetric=_square_step(1-s,96)
                self.assertLessEqual(r.lo+symmetric.lo,1)
                self.assertGreaterEqual(r.hi+symmetric.hi,1)
            # The unsquared time seed is a different function.
            self.assertLess(_square_step(F(1,4),96).hi,F(1,100000))

    def test_refinement_tightens_enclosure(self):
        runs=[pressure_quadrature(n,96) for n in (16,32,64)]
        for a,b in zip(runs,runs[1:]):
            self.assertLess(a['c0'].lo,b['c0'].lo)
            self.assertGreater(a['c0'].hi,b['c0'].hi)
            self.assertGreater(a['c0'].hi-a['c0'].lo,b['c0'].hi-b['c0'].lo)

    def test_independent_floating_quadrature_is_inside_certified_bound(self):
        # A supplementary check, not the enclosure proof or source parameter
        # evaluator. The proof uses monotone Riemann bounds and exact exp tails.
        def sigma(s):
            if s<=0:return 0.
            if s>=1:return 1.
            if s>.5:return 1-sigma(1-s)
            t=1/(s*s)-1/((1-s)*(1-s))
            a=0. if t>700 else math.exp(-t)
            return a/(1+a)
        N=8192;S=0.;previous_sigma=0.;previous_density=1.;integral=0.
        for i in range(1,N+1):
            s=i/N;value=sigma(s);S+=(previous_sigma+value)/(2*N)
            density=math.exp(s/5-6*S/5)
            integral+=(previous_density+density)/(2*N)
            previous_sigma=value;previous_density=density
        q=self.result['quadrature'];lo,hi=map(F,q['initial_integral'])
        self.assertLess(float(lo),integral);self.assertGreater(float(hi),integral)

    def test_pressure_odd_coefficients_are_exact_zero(self):
        p=self.result['pressure_Taylor_coefficients_divided_by_K']
        for k in (1,3,5):self.assertEqual(p[k],['0','0'])
        self.assertLess(F(p[0][1]),0)
        self.assertGreater(F(p[2][0]),0);self.assertLess(F(p[4][1]),0);self.assertGreater(F(p[6][0]),0)

    def test_u1_even_jets_preserve_nonzero_source_scales(self):
        rows=self.result['u1_even_eta_derivatives']
        self.assertEqual([x['exact_positive_scale'] for x in rows],['h^4','h^4','h^5'])
        for row,limit in zip(rows,(F(9,4),F(-12),F(-288))):self.contains(row['normalized_enclosure'],limit)
        self.assertGreater(F(rows[0]['normalized_enclosure'][0]),0)
        self.assertLess(F(rows[1]['normalized_enclosure'][1]),0)
        self.assertLess(F(rows[2]['normalized_enclosure'][1]),0)

    def test_u1_odd_jets_include_independent_zero_scale_limit(self):
        c=list(map(F,self.result['quadrature']['c0']))
        for row,factor in zip(self.result['u1_odd_eta_derivatives'],(3,-60,2520)):
            for value in c:self.contains(row['enclosure'],factor*value)
            self.assertEqual(row['normalized_by'],'K=Pstar^2')

    def test_evenness_does_not_infer_unknown_square_even(self):
        nodes=[{'op':'rational','args':['0','1']},{'op':'rational','args':['1','1']},
               {'op':'coordinate','args':['eta']},{'op':'add','args':[1,2]},
               {'op':'integer_power','args':[3,2]},{'op':'integer_power','args':[2,2]}]
        ad=PressureAD(nodes)
        self.assertEqual(ad.even(4),'unknown');self.assertEqual(ad.even(5),'even')

    def test_moving_integral_endpoint_not_accepted(self):
        nodes=[{'op':'rational','args':['0','1']},{'op':'rational','args':['1','1']},
               {'op':'coordinate','args':['eta']},{'op':'coordinate','args':['s']},
               {'op':'multiply','args':[2,3]},{'op':'definite_integral','args':[4,3,0,2]}]
        with self.assertRaises(UncertifiedExpression):PressureAD(nodes).derivative(5)

    def test_original_scale_and_norm_scalar_margins(self):
        r=source_scales();self.assertTrue(r['terminal_wait_finite_and_positive'])
        self.assertGreater(F(r['Qb_strict_lower']),1)
        self.assertLess(F(r['Qp_strict_bounds'][1]),1)
        self.assertEqual(norm_margins()['finite_degree1_pair_upper'],'819200*K/sigmaStar^2 < Q')

    def test_no_whole_field_or_energy_tail_promotion(self):
        r=self.result
        self.assertTrue(r['finite_degree1_Phi_u_pair_Brho_on_I_prime_norm_le_Q'])
        for key in ('whole_Phi_u_Brho_norm_proved','original_appendix_I_bound_to_I_prime',
                    'final_A_D_fields_computed','outer_energy_tail_certified'):
            self.assertFalse(r[key])
        self.assertEqual(r['final_67_jets'],0);self.assertEqual(r['natural_Y_OPEN'],490)
        self.assertEqual(r['M3'],'62/64');self.assertEqual(r['M4'],'0/16');self.assertEqual(r['release'],'HOLD')

    def test_actual_first_coefficient_display_samples_include_source_corrections(self):
        v=self.result['visualization'];self.assertEqual(len(v['samples']),65)
        self.assertFalse(v['final_A_D_field_samples'])
        self.assertFalse(v['source_h_and_inverse_K_replaced_by_zero'])
        c=list(map(F,self.result['quadrature']['c0']))
        for row in v['samples']:
            eta=F(row['eta']);f=1/(1+eta*eta)
            for value in c:
                self.contains(row['u1_divided_K'],value*eta*(3-eta*eta)*f**3)
                self.contains(row['P0_divided_K'],-value*f*f)
        axis=v['samples'][32]
        self.assertLess(F(axis['u1_divided_K'][0]),0)
        self.assertGreater(F(axis['u1_divided_K'][1]),0)

    def test_bad_numerical_controls_rejected(self):
        for n,bits in ((8,96),(17,96),(16384,96),(True,96),(64,31),(64,257)):
            with self.assertRaises(UncertifiedExpression):pressure_quadrature(n,bits)

    def test_full_source_pressure_and_independent_derivative_replay(self):
        path=os.environ.get('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not path:self.skipTest('Set original graph environment variable')
        r=authenticate_source(Path(path).parent)
        self.assertTrue(r['independent_eta_derivative_reproduced_exact_source_node'])
        self.assertTrue(r['pressure_evenness_checked_from_source_AST'])
        self.assertEqual(r['differentiated_fixed_integrals'],6)
        self.assertEqual(r['complete_pressure_stage_count'],12)
        self.assertFalse(r['outer_energy_tail_certified'])


if __name__=='__main__':unittest.main()
