"""Explicit-formula regression and refusal tests with actual finite counts."""

from copy import deepcopy
from fractions import Fraction
import unittest
from unittest.mock import patch

from p7.ball_backend import dyadic_to_fraction
from p7.explicit_formula import evaluate_explicit_formula


def ends(ball):
    return dyadic_to_fraction(ball["lower"]), dyadic_to_fraction(ball["upper"])


class ExplicitFormulaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # These two principal fixtures execute the actual contour and Hardy-Z
        # routines. Other tests reuse this fresh in-process result only to
        # isolate input/refusal/error-budget behavior, never as run evidence.
        cls.t30 = evaluate_explicit_formula({})
        cls.t20 = evaluate_explicit_formula({"height": "20", "tolerance": "32"})
        if not cls.t30["certified"] or not cls.t20["certified"]:
            raise AssertionError((cls.t30.get("failure"), cls.t20.get("failure")))

    def evaluate_reusing_test_certificate(self, request, certificate=None):
        with patch("p7.explicit_formula.certify_zeros", return_value=deepcopy(certificate or self.t30["zeroCertificate"])):
            return evaluate_explicit_formula(request)

    def test_half_integer_prime_side_and_zero_side_are_independent(self):
        result = self.t30
        self.assertEqual(result["status"], "CERTIFIED_ENCLOSURE")
        self.assertEqual(result["primeSide"]["exactLogArgument"], "2520")
        self.assertEqual([r["primePower"] for r in result["primeSide"]["primePowers"]], [2, 3, 4, 5, 7, 8, 9])
        lo, hi = ends(result["psiEnclosure"])
        plo, phi = ends(result["primeSide"]["value"])
        self.assertLessEqual(lo, plo)
        self.assertLessEqual(phi, hi)
        self.assertFalse(result["primeSide"]["usedToChooseTailBound"])
        self.assertFalse(result["primeSide"]["intersectedWithZeroSideBand"])
        self.assertFalse(result["scope"]["globalRHAssumed"])
        self.assertFalse(result["scope"]["formalKernelProof"])

    def test_more_certified_zeros_reduce_the_nontrivial_tail(self):
        tail20 = ends(self.t20["errorBudget"]["nontrivialZeroTailAbsoluteBound"])[1]
        tail30 = ends(self.t30["errorBudget"]["nontrivialZeroTailAbsoluteBound"])[1]
        self.assertGreater(tail20, tail30)
        self.assertGreater(tail30, 6)
        self.assertLess(tail30, Fraction(63, 10))
        self.assertEqual(self.t30["zeroCertificate"]["positiveZeroCount"], 3)
        self.assertEqual(self.t20["zeroCertificate"]["positiveZeroCount"], 1)

    def test_narrow_requested_width_does_not_hide_the_tail(self):
        result = self.evaluate_reusing_test_certificate({"tolerance": "1e-20"})
        self.assertTrue(result["certified"])
        self.assertFalse(result["pass"])
        self.assertFalse(result["toleranceMet"])
        self.assertEqual(result["status"], "WIDTH_UNRESOLVED")
        self.assertEqual(result["psiEnclosure"]["width"], self.t30["psiEnclosure"]["width"])

    def test_prime_side_mutation_does_not_shrink_the_zero_tail(self):
        with patch("p7.explicit_formula._prime_side", return_value=(2521, [])):
            result = self.evaluate_reusing_test_certificate({})
        self.assertEqual(result["psiEnclosure"], self.t30["psiEnclosure"])
        self.assertEqual(result["tailCertificate"], self.t30["tailCertificate"])

    def test_incomplete_or_duplicated_zero_list_is_rejected(self):
        incomplete = deepcopy(self.t30["zeroCertificate"])
        incomplete["hardyRoots"].pop()
        duplicate = deepcopy(self.t30["zeroCertificate"])
        duplicate["hardyRoots"][1] = deepcopy(duplicate["hardyRoots"][0])
        for certificate in (incomplete, duplicate):
            result = self.evaluate_reusing_test_certificate({}, certificate)
            self.assertFalse(result["certified"])
            self.assertEqual(result["failure"]["code"], "INVALID_REQUEST_OR_CERTIFICATE")

    def test_forged_saved_receipt_cannot_be_submitted(self):
        result = evaluate_explicit_formula({"zeroCertificate": self.t30["zeroCertificate"]})
        self.assertFalse(result["certified"])
        self.assertIsNone(result["request"])

    def test_invalid_endpoint_and_budget_requests_are_refused(self):
        for request in ({"x": "10"}, {"x": 10.5}, {"x": "1/2"}, {"height": "31"},
                        {"trivialTerms": True}, {"tolerance": "0"}, {"zeroTolerance": "1"}):
            with self.subTest(request=request):
                self.assertFalse(evaluate_explicit_formula(request)["certified"])
        exhausted = evaluate_explicit_formula({"maxCells": 1})
        self.assertFalse(exhausted["certified"])
        self.assertEqual(exhausted["failure"]["code"], "ZERO_CERTIFICATE_UNRESOLVED")

    def test_unsmoothed_diagnostic_has_no_borrowed_error_band(self):
        self.assertFalse(self.t30["unsmoothedFiniteDiagnostic"]["hasOwnCertifiedTail"])
        self.assertEqual(self.t30["scope"]["formulaVariant"], "integrated explicit formula, unit secant")

    def test_trivial_series_tail_is_positive_and_controlled(self):
        coarse = self.evaluate_reusing_test_certificate({"trivialTerms": 1})
        self.assertTrue(coarse["certified"])
        fine_tail = ends(self.t30["errorBudget"]["trivialZeroSeriesTailUpperBound"])[1]
        coarse_tail = ends(coarse["errorBudget"]["trivialZeroSeriesTailUpperBound"])[1]
        self.assertGreater(coarse_tail, fine_tail)
        self.assertGreater(fine_tail, 0)
        self.assertEqual(coarse["errorBudget"]["trivialZeroTailSign"], "nonnegative")

    def test_other_half_integer_uses_correct_endpoint_convention(self):
        result = self.evaluate_reusing_test_certificate({"x": "5/2"})
        self.assertTrue(result["certified"])
        self.assertEqual(result["primeSide"]["exactLogArgument"], "2")
        self.assertEqual(result["endpointConvention"]["unitInterval"], {"lower": "2", "upper": "3"})


if __name__ == "__main__":
    unittest.main()
