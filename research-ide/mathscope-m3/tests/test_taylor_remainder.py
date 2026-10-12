"""Cauchy-tail tests: actual uniform balls, domains, and width failures."""

from fractions import Fraction
import unittest

from p7.ball_backend import dyadic_to_fraction
from p7.taylor_remainder import evaluate_taylor_remainder


def upper(ball):
    return dyadic_to_fraction(ball["upper"])


class TaylorRemainderTests(unittest.TestCase):
    def test_zeta_finite_displacement_has_explicit_tail_and_actual_uniform_bound(self):
        result = evaluate_taylor_remainder({})
        self.assertEqual(result["status"], "CERTIFIED_TAYLOR_ENCLOSURE")
        self.assertTrue(result["pass"])
        self.assertEqual(len(result["coefficients"]), 11)
        self.assertGreater(upper(result["remainderCertificate"]["absoluteUpperBound"]), 0)
        self.assertTrue(result["uniformBound"]["containsEntireClosedCauchyCircle"])
        self.assertFalse(result["uniformBound"]["sampledMaximumUsed"])
        self.assertTrue(result["directEvaluationObservation"]["overlapsTaylorEnclosure"])
        self.assertFalse(result["directEvaluationObservation"]["independentSoftwareImplementation"])
        self.assertIsNone(result["errorAccounting"]["internalRoundingBound"])

    def test_gamma_and_reciprocal_gamma_are_executed(self):
        for operation in ("gamma", "rgamma"):
            with self.subTest(operation=operation):
                result = evaluate_taylor_remainder({"operation": operation, "center": {"real": "1"}})
                self.assertTrue(result["certified"], result.get("failure"))
                self.assertTrue(result["directEvaluationObservation"]["overlapsTaylorEnclosure"])

    def test_reciprocal_gamma_remains_entire_at_a_gamma_pole(self):
        request = {"operation": "rgamma", "center": {"real": "0"}}
        result = evaluate_taylor_remainder(request)
        self.assertTrue(result["certified"], result.get("failure"))
        self.assertTrue(result["domainCertificate"]["reciprocalGammaEntire"])
        self.assertTrue(result["coefficients"][0]["ball"]["real"]["containsZero"])
        gamma = evaluate_taylor_remainder({**request, "operation": "gamma"})
        self.assertFalse(gamma["certified"])

    def test_critical_strip_uses_analytic_continuation_not_euler_product(self):
        result = evaluate_taylor_remainder({
            "center": {"real": "1/2", "imag": "14"},
            "displacement": {"real": "1/1000", "imag": "1/500"},
            "radius": "1/8", "displacementRadius": "1/400",
        })
        self.assertTrue(result["certified"], result.get("failure"))
        self.assertTrue(result["domainCertificate"]["analyticOnNeighborhoodOfClosedDisk"])
        self.assertFalse(result["scope"]["globalRHProved"])

    def test_increasing_order_reduces_the_geometric_remainder(self):
        low = evaluate_taylor_remainder({"order": 3})
        high = evaluate_taylor_remainder({"order": 10})
        self.assertTrue(low["certified"])
        self.assertTrue(high["certified"])
        self.assertGreater(upper(low["remainderCertificate"]["absoluteUpperBound"]), upper(high["remainderCertificate"]["absoluteUpperBound"]))
        self.assertEqual(low["status"], "WIDTH_UNRESOLVED")

    def test_zero_displacement_has_zero_tail(self):
        result = evaluate_taylor_remainder({"displacement": {"real": "0"}, "displacementRadius": "0"})
        self.assertTrue(result["certified"])
        self.assertEqual(upper(result["remainderCertificate"]["absoluteUpperBound"]), 0)
        self.assertEqual(result["remainderCertificate"]["exactGeometricFactor"], "0")

    def test_complex_norm_is_not_checked_componentwise(self):
        result = evaluate_taylor_remainder({"displacement": {"real": "1/10", "imag": "1/10"}, "displacementRadius": "1/10"})
        self.assertFalse(result["certified"])
        self.assertEqual(result["failure"]["code"], "INVALID_REQUEST")

    def test_touching_or_included_poles_are_rejected(self):
        for request in (
            {"center": {"real": "2"}, "radius": "1"},
            {"center": {"real": "1"}},
            {"operation": "gamma", "center": {"real": "1/4"}, "radius": "1/4"},
            {"operation": "gamma", "center": {"real": "-2"}},
        ):
            with self.subTest(request=request):
                result = evaluate_taylor_remainder(request)
                self.assertFalse(result["certified"])
                self.assertEqual(result["failure"]["code"], "UNSUPPORTED_BOUNDING_SQUARE")

    def test_pole_in_square_corner_is_conservatively_rejected(self):
        # Pole lies outside the circle but inside its bounding square: refusal
        # is a declared safe-subset restriction, not a claim of a disk pole.
        result = evaluate_taylor_remainder({"center": {"real": "5/4", "imag": "1/4"}, "radius": "1/4"})
        self.assertFalse(result["certified"])
        self.assertEqual(result["failure"]["code"], "UNSUPPORTED_BOUNDING_SQUARE")

    def test_requested_width_is_checked_after_adding_the_tail(self):
        result = evaluate_taylor_remainder({"tolerance": "1e-40"})
        self.assertTrue(result["certified"])
        self.assertFalse(result["pass"])
        self.assertEqual(result["status"], "WIDTH_UNRESOLVED")
        self.assertGreater(dyadic_to_fraction(result["value"]["maxComponentWidth"]), Fraction(1, 10**40))

    def test_invalid_radii_types_and_external_bounds_are_refused(self):
        for request in (
            {"displacementRadius": "1/4"}, {"displacementRadius": "1/2"},
            {"radius": "0"}, {"radius": "2"}, {"radius": 0.25},
            {"center": {"real": {"lower": "2", "upper": "3"}}},
            {"order": True}, {"order": 17}, {"operation": "lgamma"},
            {"M": "1"}, {"remainderBound": "0"},
        ):
            with self.subTest(request=request):
                self.assertFalse(evaluate_taylor_remainder(request)["certified"])

    def test_repeated_actual_execution_is_deterministic(self):
        a = evaluate_taylor_remainder({})
        b = evaluate_taylor_remainder({})
        self.assertEqual(a["computationSha256"], b["computationSha256"])


if __name__ == "__main__":
    unittest.main()
