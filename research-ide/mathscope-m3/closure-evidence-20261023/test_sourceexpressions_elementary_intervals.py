import unittest
from fractions import Fraction
from sourceexpressions_elementary_intervals import (
 evaluate_original_elementary_nodes,UnsupportedOriginalNumericKernel)
from rigorous_rational_intervals import UncertifiedExpression

def r(n,d=1):return {'op':'rational','args':[str(n),str(d)]}
class OriginalElementarySourceExpressionTests(unittest.TestCase):
    def test_real_source_node_shapes_and_exact_enclosure(self):
        nodes=[r(1,2),{'op':'coordinate','args':['r']},
               {'op':'multiply','args':[0,1]},{'op':'add','args':[0,2]},
               {'op':'inverse','args':[3]},
               {'op':'integer_power','args':[4,2]}]
        out=evaluate_original_elementary_nodes(nodes,[2,3,4,5],{'r':['2','3']})
        self.assertEqual(out['roots']['2'],['1','3/2'])
        self.assertEqual(out['roots']['3'],['3/2','2'])
        self.assertEqual(out['roots']['4'],['1/2','2/3'])
        self.assertEqual(out['roots']['5'],['1/4','4/9'])
        self.assertFalse(out['actual_final_A_b_p_provenance_verified'])
        self.assertEqual(out['actual_original_67_jet_intervals_certified'],0)
    def test_source_parameter_needs_real_certified_evaluator(self):
        with self.assertRaises(UnsupportedOriginalNumericKernel) as e:
            evaluate_original_elementary_nodes([{'op':'source_parameter','args':['h']}],
                [0],{})
        self.assertEqual(e.exception.operation,'source_parameter')
    def test_exp_requires_directed_rounding(self):
        with self.assertRaises(UnsupportedOriginalNumericKernel):
            evaluate_original_elementary_nodes([r(1),{'op':'exp','args':[0]}],[1],{})
    def test_integral_requires_proven_interval_integrator(self):
        with self.assertRaises(UnsupportedOriginalNumericKernel):
            evaluate_original_elementary_nodes([{'op':'definite_integral','args':[1,2,3,4]}],
                [0],{})
    def test_ODE_native_kernel_not_filled_with_zero(self):
        with self.assertRaises(UnsupportedOriginalNumericKernel):
            evaluate_original_elementary_nodes([{'op':'m3_global_pulse_jet','args':[0,1,2,[],[]]}],[0],{})
    def test_reject_zero_crossing_inverse(self):
        with self.assertRaises(UncertifiedExpression):
            evaluate_original_elementary_nodes([
                {'op':'coordinate','args':['r']},{'op':'inverse','args':[0]}],
                [1],{'r':['-1','1']})
    def test_reject_numerical_float_as_exact_endpoint(self):
        with self.assertRaises(UncertifiedExpression):
            evaluate_original_elementary_nodes([
                {'op':'coordinate','args':['r']}],[0],{'r':[1.0,2.0]})
    def test_reject_missing_coefficient_coordinate(self):
        with self.assertRaises(UncertifiedExpression):
            evaluate_original_elementary_nodes([
                {'op':'coordinate','args':['r']}],[0],{})
    def test_reject_forward_source_index(self):
        with self.assertRaises(UncertifiedExpression):
            evaluate_original_elementary_nodes([
                {'op':'add','args':[0,1]},r(1)],[1],{})
    def test_fail_closed_source_budget(self):
        with self.assertRaises(UncertifiedExpression):
            evaluate_original_elementary_nodes([r(1)]*4,[3],{},max_nodes=3)
if __name__=='__main__':unittest.main()
