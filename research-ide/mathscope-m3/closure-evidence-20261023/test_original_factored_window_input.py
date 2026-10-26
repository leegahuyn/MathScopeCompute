import copy,os,unittest
from decimal import Decimal as D,localcontext
from fractions import Fraction as F
from pathlib import Path
from rigorous_rational_intervals import UncertifiedExpression
from original_factored_window_input import (PINS,verify_pin,authenticate_window,
    integer_window_bridge,pullback_power,factored_native_inputs)


class OriginalFactoredWindow(unittest.TestCase):
    def test_integer_bridge_including_negative_and_large_levels(self):
        for e in (-100,0,8,10000,1<<8205):
            for margin in (10,11,100):
                for gap in (4,5,100):
                    m=e+margin;n=m+gap;r=integer_window_bridge(e,m,n)
                    self.assertEqual(r['lower'],m)
                    self.assertEqual(r['four_witness_levels'],[m,m+1,m+2,m+3])
                    for ell in r['four_witness_levels']:
                        self.assertLessEqual(r['lower'],ell)
                        self.assertLessEqual(ell,r['upper'])
                        self.assertGreaterEqual(ell-(e+4),6)

    def test_floor_translation_source_inequalities_independently(self):
        # Generic rational tests of floor monotonicity/translation, not
        # numerical stand-ins for the actual transcendental source constants.
        for e in (-10,0,8,100):
            for frac in (F(0),F(1,7),F(6,7)):
                x=e+10+frac
                for extra in (F(0),F(1,11),F(3)):
                    y=x+4+extra;m=x.numerator//x.denominator;n=y.numerator//y.denominator
                    integer_window_bridge(e,m,n)
                    self.assertGreaterEqual(m,e+10);self.assertGreaterEqual(n,m+4)

    def test_invalid_or_missing_source_floor_premises_rejected(self):
        for args in ((0,9,14),(0,10,13),(0.0,10,14),(False,10,14)):
            with self.assertRaises(UncertifiedExpression):integer_window_bridge(*args)

    def test_source_pin_drift_including_growth_16_and_threshold(self):
        for node,(op,args) in PINS.items():
            item={'op':op,'args':copy.deepcopy(args)}
            verify_pin(node,item)
            with self.assertRaises(UncertifiedExpression):verify_pin(node,{'op':'untrusted','args':args})
        for node in (591,136158,617357,617464,617465,617513,617514,622784,622785,622790):
            op,args=PINS[node]
            with self.assertRaises(UncertifiedExpression):verify_pin(node,{'op':op,'args':args+[0]})

    def test_all_pullback_exponents_and_nonzero_h_scale_effect(self):
        with localcontext() as ctx:
            ctx.prec=80
            ell=D(100);h=D(1)/D(1024);d=D('0.5')-h
            Q=(-ell*D(2).ln()).exp()
            for a in range(5):
                for b in range(5-a):
                    p=pullback_power(a,b);alpha=F(p['rational_exponent'])
                    exponent=D(alpha.numerator)/D(alpha.denominator)+p['h_exponent_coefficient']*h
                    direct=Q/((d*a*Q.ln()).exp()*(b*Q.ln()).exp())
                    encoded=(exponent*Q.ln()).exp()
                    self.assertLess(abs(direct/encoded-1),D('1e-75'))
            self.assertNotEqual((h*Q.ln()).exp(),D(1))
        for a,b in ((-1,1),(1,4),(True,0),(0.0,0)):
            with self.assertRaises(UncertifiedExpression):pullback_power(a,b)

    def test_source_point_native_root_exact_and_physical_scale_not_discarded(self):
        r=factored_native_inputs(bits=128)
        self.assertEqual(r['native_jets']['root'],['1','1'])
        self.assertEqual(r['native_jets']['derivatives']['2,0'],['2','2'])
        qzz=r['physical_q_jets_z_tau_with_t_sign']['2,0']
        self.assertEqual(qzz['positive_exact_scale']['rational_exponent'],'0')
        self.assertEqual(qzz['positive_exact_scale']['h_exponent_coefficient'],2)
        self.assertTrue(r['h_dependent_Q_powers_retained'])
        self.assertFalse(r['Q_h_replaced_by_one'])
        self.assertEqual([x['first_omitted_b2_q_lower'] for x in r['factored_labels']],['16','8','4','2'])

    def test_actual_analytic_and_field_obligations_never_promoted(self):
        r=factored_native_inputs(bits=64)
        self.assertFalse(r['finite_real_source_scale_premise_discharged'])
        self.assertFalse(r['representative_623935_image_proved'])
        self.assertFalse(r['physical_r_and_original_mesh_labels_evaluated'])
        self.assertFalse(r['actual_final_field_values_computed'])
        self.assertEqual(r['final_67_jets'],0);self.assertEqual(r['natural_Y_OPEN'],490)
        self.assertEqual(r['M3'],'62/64');self.assertEqual(r['M4'],'0/16')
        self.assertEqual(r['release'],'HOLD')

    def test_full_original_window_formula_authentication(self):
        path=os.environ.get('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not path:self.skipTest('Set original graph environment variable for full source authentication')
        r=authenticate_window(Path(path).parent)
        self.assertEqual(r['window_formula_pin_count'],len(PINS))
        self.assertFalse(r['source_norm_and_selector_expressions_proved_finite_real'])


if __name__=='__main__':unittest.main()
