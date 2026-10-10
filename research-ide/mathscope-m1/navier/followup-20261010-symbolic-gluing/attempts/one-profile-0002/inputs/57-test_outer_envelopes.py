"""Rejection tests for underestimated asymptotic errors and false root claims."""
import copy
import json
import unittest
from fractions import Fraction as F
from pathlib import Path

from check_outer_envelopes import monomial_absorption
from verify_pulse_integral_independent import exact_checks

HERE=Path(__file__).resolve().parent


class AsymptoticRejectionTests(unittest.TestCase):
    def test_weak_lambda_cannot_absorb_the_required_eta_loss(self):
        # A lambda^1/2 error with a growing preconstant must not be accepted
        # if its lambda power is removed from the submitted inequality.
        valid=monomial_absorption(4,0,32,F(1,2),-190)
        invalid=monomial_absorption(4,0,32,0,-190)
        self.assertTrue(valid["passed"])
        self.assertFalse(invalid["passed"])

    def test_unbounded_prefactor_is_not_silently_replaced_by_expT(self):
        self.assertFalse(monomial_absorption(2**256,0,0,1,-190)["passed"])

    def test_invalid_positive_envelope_inputs_are_rejected(self):
        for coefficient,power in [(-1,0),(0,0),(1,-1)]:
            with self.assertRaises(ValueError):monomial_absorption(coefficient,power,0,1,-190)


class ActualRootRejectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.record=json.loads((HERE/"actual-main-pulse-integral.json").read_text())

    def test_actual_integral_and_integer_root_checks_pass(self):
        self.assertTrue(all(exact_checks(self.record).values()))

    def test_omitting_cutoff_cannot_pass_the_exact_total_check(self):
        altered=copy.deepcopy(self.record)
        cutoff=altered["integrals"]["cutoff"]
        total=altered["integrals"]["Kb"]
        total["upperNumerator"]=str(int(total["upperNumerator"])-int(cutoff["upperNumerator"]))
        self.assertFalse(exact_checks(altered)["total_upper_is_not_below_sum"])

    def test_false_global_promotion_is_rejected(self):
        altered=copy.deepcopy(self.record)
        altered["scope"]["fullOriginalProfileCompleted"]=True
        self.assertFalse(exact_checks(altered)["no_joining_or_global_promotion"])

    def test_hiding_analytic_bridge_is_rejected(self):
        altered=copy.deepcopy(self.record)
        altered["scope"]["amplitudeBracketConditionalOnWrittenAnalyticTotalSBridge"]=False
        self.assertFalse(exact_checks(altered)["analytic_bridge_is_explicit"])

    def test_zeroing_small_positive_parameters_is_rejected(self):
        altered=copy.deepcopy(self.record)
        altered["scope"]["lambdaOrHUnderflowedToZero"]=True
        self.assertFalse(exact_checks(altered)["no_underflow_substitution"])


if __name__=="__main__":unittest.main()
