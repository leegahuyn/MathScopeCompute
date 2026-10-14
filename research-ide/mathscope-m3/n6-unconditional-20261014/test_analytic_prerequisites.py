"""Adversarial controls for original analytic prerequisite proof leaves."""
import copy
from fractions import Fraction as F
import itertools
import unittest
from analytic_prerequisites import (SourceAudit, even_kernel_monomial,
                                    exponent_implications, sharp_step_polynomial,
                                    tail_guard, verify_mask, word_degree)


class AnalyticControls(unittest.TestCase):
    def test_sharp_global_step_bound_and_endpoint_equality(self):
        proof=sharp_step_polynomial()
        self.assertEqual(proof['minimumAtOneQuarter'],'0')
        self.assertEqual(proof['derivativeUpperOnWholeInterval'],'-29')

    def test_forged_bound_below_actual_midpoint_rejected(self):
        with self.assertRaises(ValueError):
            sharp_step_polynomial(F(7999,1000))

    def test_missing_original_transport_block_rejected(self):
        matrix=[[0]*6 for _ in range(6)]
        matrix[4][0]=1
        nodes={0:{'op':'rational','args':['0','1']},1:{'op':'coordinate','args':['eta']}}
        self.assertEqual(len(verify_mask(matrix,nodes.__getitem__)),1)
        matrix[0][4]=1
        with self.assertRaises(ValueError):
            verify_mask(matrix,nodes.__getitem__)

    def test_word_bound_both_adjacent_cancellation_and_extremal_words(self):
        for k in range(13):
            degrees=[word_degree(w) for w in itertools.product([0,1],repeat=k)]
            self.assertEqual(max(x for x in degrees if x is not None),(k+1)//2)
        self.assertIsNone(word_degree([1,1]))

    def test_unknown_word_grammar_rejected(self):
        with self.assertRaises(ValueError):
            word_degree([0,2])

    def test_original_eta_tail_includes_cauchy_derivative_cost(self):
        receipt=tail_guard(1,F(1,2),144,128,2,F(1,2))
        self.assertTrue(receipt['allHigherKCoveredByMonotonicity'])

    def test_value_tail_does_not_imply_derivative_tail(self):
        with self.assertRaises(ValueError):
            tail_guard(1,1,72,128,3,F(1,1000))

    def test_insufficient_actual_norm_threshold_rejected(self):
        with self.assertRaises(ValueError):
            tail_guard(1,F(1,2),100,32)

    def test_evenX_kernel_high_orders_exact_independent_monomials(self):
        for n,k in [(0,12),(8,12),(12,12),(50,21),(100,64)]:
            self.assertEqual(*even_kernel_monomial(n,k))

    def test_changed_even_kernel_factor_detected(self):
        lhs,rhs=even_kernel_monomial(50,21)
        self.assertNotEqual(lhs,rhs*2) # omitting one source factor 1/2

    def test_eta_step_dependency_and_integral_binders(self):
        nodes={0:{'op':'rational','args':['0','1']},1:{'op':'coordinate','args':['eta']},
               2:{'op':'coordinate','args':['s']},3:{'op':'source_step_derivative','args':[1,0]},
               4:{'op':'definite_integral','args':[1,1,0,2]}}
        audit=SourceAudit(nodes.__getitem__,2,1)
        self.assertIn(1,audit.free(3))
        self.assertNotIn(1,audit.free(4))

    def test_odd_forcing_and_reflection_violation_rejected(self):
        nodes={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['1','1']},
               2:{'op':'coordinate','args':['xi']},3:{'op':'coordinate','args':['eta']}}
        s={'A0':[[0]*6 for _ in range(6)],'A1':[[0]*6 for _ in range(6)],
           'forcing':[0,0,0,2,1,1]}
        audit=SourceAudit(nodes.__getitem__,2,3)
        self.assertEqual(len(audit.verify_system_parity(s)),78)
        s=copy.deepcopy(s);s['forcing'][0]=1
        with self.assertRaises(ValueError):
            audit.verify_system_parity(s)

    def test_original_exponent_arithmetic_keeps_missing_seminorms_open(self):
        rows=exponent_implications()
        self.assertEqual(len(rows),9)
        self.assertTrue(all(F(r['exactMargin'])>0 for r in rows))
        self.assertTrue(all(not r['actualUniformSeminormProved'] for r in rows))

    def test_large_derivative_loss_cannot_be_promoted(self):
        with self.assertRaises(ValueError):
            exponent_implications(F(1,100))


if __name__=='__main__':
    unittest.main()
