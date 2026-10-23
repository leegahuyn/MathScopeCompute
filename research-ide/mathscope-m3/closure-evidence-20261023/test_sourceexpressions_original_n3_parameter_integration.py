import unittest
from fractions import Fraction as Q
from sourceexpressions_elementary_intervals import evaluate_original_elementary_nodes,UnsupportedOriginalNumericKernel
from rigorous_rational_intervals import UncertifiedExpression
class IntegratedN3IntervalControls(unittest.TestCase):
    def test_actual_native_source_parameter_h_interval(self):
        n=[{'op':'source_parameter','args':['h']}]
        a=evaluate_original_elementary_nodes(n,[0],{},enable_pinned_n3_parameter_bounds=True)
        lo,hi=map(Q,a['roots']['0'])
        self.assertEqual(lo,0)
        self.assertEqual(hi,Q(1,2**4096))
        self.assertEqual(a['actual_original_67_jet_intervals_certified'],0)
    def test_actual_native_source_parameter_co_exact(self):
        n=[{'op':'source_parameter','args':['co']}]
        a=evaluate_original_elementary_nodes(n,[0],{},enable_pinned_n3_parameter_bounds=True)
        self.assertEqual(a['roots']['0'],['1/256','1/256'])
    def test_inverting_tiny_h_fails_explicitly(self):
        n=[{'op':'source_parameter','args':['h']},{'op':'inverse','args':[0]}]
        with self.assertRaises(UncertifiedExpression):
            evaluate_original_elementary_nodes(n,[1],{},enable_pinned_n3_parameter_bounds=True)
    def test_source_h_power_not_global_math_completion(self):
        n=[{'op':'source_parameter','args':['h']},{'op':'integer_power','args':[0,2]}]
        a=evaluate_original_elementary_nodes(n,[1],{},enable_pinned_n3_parameter_bounds=True)
        self.assertEqual(Q(a['roots']['1'][0]),0)
        self.assertFalse(a['all_order_smoothness_verified'])
    def test_unknown_source_native_parameter_rejected(self):
        n=[{'op':'source_parameter','args':['Q']}]
        with self.assertRaises(UncertifiedExpression):
            evaluate_original_elementary_nodes(n,[0],{},enable_pinned_n3_parameter_bounds=True)
    def test_source_parameter_requires_opt_in(self):
        n=[{'op':'source_parameter','args':['co']}]
        with self.assertRaises(UnsupportedOriginalNumericKernel):
            evaluate_original_elementary_nodes(n,[0],{})
if __name__=='__main__':unittest.main()
