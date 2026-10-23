import unittest
from fractions import Fraction as F
from sourceexpressions_elementary_intervals import (
 evaluate_original_elementary_nodes,UnsupportedOriginalNumericKernel)
from rigorous_rational_intervals import UncertifiedExpression

def rational(n,d=1):return {'op':'rational','args':[str(n),str(d)]}
class SourceBoundedTranscendentalIntegrationTests(unittest.TestCase):
    def test_original_source_node_exp_one(self):
        nodes=[rational(1),{'op':'exp','args':[0]}]
        out=evaluate_original_elementary_nodes(nodes,[1],{},enable_bounded_transcendentals=True)
        lo,hi=map(F,out['roots']['1'])
        self.assertLess(lo,F(2719,1000))
        self.assertGreater(lo,F(2718,1000))
        self.assertLess(hi,F(2719,1000))
        self.assertEqual(out['actual_original_67_jet_intervals_certified'],0)
    def test_original_log_then_exp_encloses_true_value(self):
        nodes=[rational(3,2),{'op':'log_positive','args':[0]},
               {'op':'exp','args':[1]}]
        out=evaluate_original_elementary_nodes(nodes,[2],{},enable_bounded_transcendentals=True)
        lo,hi=map(F,out['roots']['2'])
        self.assertLessEqual(lo,F(3,2))
        self.assertGreaterEqual(hi,F(3,2))
    def test_original_sqrt_node_encloses_exact_square(self):
        nodes=[rational(2),{'op':'sqrt_positive','args':[0]},
               {'op':'multiply','args':[1,1]}]
        out=evaluate_original_elementary_nodes(nodes,[2],{},enable_bounded_transcendentals=True)
        lo,hi=map(F,out['roots']['2'])
        self.assertLessEqual(lo,F(2))
        self.assertGreaterEqual(hi,F(2))
    def test_large_source_profile_exponent_rejected_not_replaced_zero(self):
        nodes=[rational(1048576),{'op':'exp','args':[0]}]
        with self.assertRaises(UncertifiedExpression):
            evaluate_original_elementary_nodes(nodes,[1],{},enable_bounded_transcendentals=True)
    def test_optin_cannot_make_native_pulse_and_integral_appear_certified(self):
        for op in ('m3_global_pulse_jet','definite_integral','source_parameter'):
            with self.assertRaises(UnsupportedOriginalNumericKernel):
                evaluate_original_elementary_nodes([{'op':op,'args':[]}],[0],{},
                    enable_bounded_transcendentals=True)
if __name__=='__main__':unittest.main()
