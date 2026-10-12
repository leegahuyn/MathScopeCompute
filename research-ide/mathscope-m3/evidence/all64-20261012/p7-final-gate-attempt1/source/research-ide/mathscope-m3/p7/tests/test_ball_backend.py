"""Actual pinned-FLINT checks for the first P7 complex-ball backend."""

import copy
from fractions import Fraction
import hashlib
import json
import unittest

from flint import acb, arb, ctx

from p7.ball_backend import (
    BallRequestError, arb_from_exact_component, dyadic_to_fraction, evaluate,
    flint_workprec, parse_exact_rational, replay_evaluation, serialize_acb,
    serialize_arb,
)


def request(operation, real="1/2", imag="14", order=0, bits=192, tolerance="1e-40"):
    return {"operation": operation, "s": {"real": real, "imag": imag},
            "precisionBits": bits, "tolerance": tolerance, "derivativeOrder": order}


def component_interval(component):
    return dyadic_to_fraction(component["lower"]), dyadic_to_fraction(component["upper"])


def reconstitute(ball):
    def part(component):
        lower, upper = component_interval(component)
        return arb_from_exact_component({"lower": str(lower), "upper": str(upper)})
    return acb(part(ball["real"]), part(ball["imag"]))


class ExactInputTests(unittest.TestCase):
    def test_exact_decimal_and_rational_are_identical(self):
        self.assertEqual(parse_exact_rational("5e-1"), Fraction(1, 2))
        self.assertEqual(parse_exact_rational(".0000000000000000000000000000001"), Fraction(1, 10**31))
        self.assertEqual(parse_exact_rational("-3/-6"), Fraction(1, 2))
        self.assertEqual(evaluate(request("zeta", "1/2")), evaluate(request("zeta", "0.5")))

    def test_float_boolean_nonfinite_and_ambiguous_inputs_rejected(self):
        for value in (0.5, 1, True, float("nan"), "NaN", "inf", " 1/2", "1/0", "1e10001", "1e10000", "1_000"):
            with self.subTest(value=value), self.assertRaises(BallRequestError):
                parse_exact_rational(value)
        for key, value in (("precisionBits", True), ("derivativeOrder", 17), ("tolerance", 1e-20)):
            bad = request("zeta")
            bad[key] = value
            with self.subTest(key=key), self.assertRaises(BallRequestError):
                evaluate(bad)
        bad = request("zeta")
        bad["callerCertified"] = True
        with self.assertRaises(BallRequestError):
            evaluate(bad)

    def test_outward_dyadic_serialization_and_context_restore(self):
        original = ctx.prec, ctx.cap
        with flint_workprec(113, 7):
            value = arb_from_exact_component("1/3")
            result = serialize_arb(value, "1e-25")
            lower, upper = component_interval(result)
            self.assertLessEqual(lower, Fraction(1, 3))
            self.assertGreaterEqual(upper, Fraction(1, 3))
            self.assertEqual(dyadic_to_fraction(result["width"]), upper - lower)
            self.assertTrue(result["toleranceMet"])
        self.assertEqual((ctx.prec, ctx.cap), original)
        with self.assertRaises(RuntimeError):
            with flint_workprec(73, 3):
                raise RuntimeError("restore on exceptional exit")
        self.assertEqual((ctx.prec, ctx.cap), original)

    def test_dyadic_decoder_refuses_tampering(self):
        for value in ({"mantissa": "1", "exponent": 0}, {"mantissa": "2", "exponent": "-1"},
                      {"mantissa": "-0", "exponent": "0"}, {"mantissa": "1", "exponent": "1000001"},
                      {"mantissa": "1", "exponent": "0", "trusted": True}):
            with self.subTest(value=value), self.assertRaises(BallRequestError):
                dyadic_to_fraction(value)


class ActualBallTests(unittest.TestCase):
    def assert_contains_real(self, result, value):
        self.assertEqual(result["status"], "finite")
        lo, hi = component_interval(result["value"]["real"])
        ilo, ihi = component_interval(result["value"]["imag"])
        self.assertLessEqual(lo, Fraction(value))
        self.assertGreaterEqual(hi, Fraction(value))
        self.assertLessEqual(ilo, 0)
        self.assertGreaterEqual(ihi, 0)

    def test_exact_special_values_and_removable_xi_singularities(self):
        for operation, point, expected in (("zeta", "0", "-1/2"), ("zeta", "-2", "0"),
                                           ("gamma", "5", "24"), ("rgamma", "0", "0"),
                                           ("rgamma", "-3", "0"), ("xi", "0", "1/2"),
                                           ("xi", "1", "1/2")):
            with self.subTest(operation=operation, point=point):
                result = evaluate(request(operation, point, "0"))
                self.assert_contains_real(result, expected)
                self.assertTrue(result["toleranceMet"])

    def test_deflation_is_the_regularized_zeta_at_one(self):
        result = evaluate(request("zeta_deflated", "1", "0"))
        with flint_workprec(192):
            self.assertTrue(reconstitute(result["value"]).overlaps(acb(arb.const_euler())))
        self.assertEqual(result["formula"]["deflation"], "zeta(s)-1/(s-1)")

    def test_factorials_are_actual_derivatives_not_taylor_coefficients(self):
        result = evaluate(request("lgamma_derivatives", "1", "0", order=3))
        self.assertEqual([r["taylorCoefficientMultiplier"] for r in result["derivatives"]], ["1", "1", "2", "6"])
        with flint_workprec(192):
            second = reconstitute(result["derivatives"][2]["ball"])
            third = reconstitute(result["derivatives"][3]["ball"])
            self.assertTrue(second.overlaps(acb(arb.pi()**2 / 6)))
            self.assertTrue(third.overlaps(-2 * acb(3).zeta()))
            self.assertFalse(third.overlaps(-acb(3).zeta() / 3))
        zeta_prime = evaluate(request("zeta", "0", "0", order=1))
        with flint_workprec(192):
            self.assertTrue(reconstitute(zeta_prime["value"]).overlaps(-acb(2 * arb.pi()).log() / 2))

    def test_xi_reflection_includes_derivative_sign(self):
        left = evaluate(request("xi_derivatives", "-2", "1/3", order=3))
        right = evaluate(request("xi_derivatives", "3", "-1/3", order=3))
        self.assertTrue(left["formula"]["reflectionUsed"])
        self.assertFalse(right["formula"]["reflectionUsed"])
        with flint_workprec(192):
            for k in range(4):
                a = reconstitute(left["derivatives"][k]["ball"])
                b = reconstitute(right["derivatives"][k]["ball"])
                self.assertTrue(a.overlaps((-1)**k * b))
            self.assertFalse(reconstitute(left["derivatives"][1]["ball"]).overlaps(
                reconstitute(right["derivatives"][1]["ball"])))

    def test_xi_matches_unregularized_formula_away_from_poles(self):
        result = evaluate(request("xi", "1/2", "14"))
        with flint_workprec(192):
            s = acb(arb_from_exact_component("1/2"), 14)
            reference = s * (s - 1) * (s / 2).gamma() * (-s * arb.pi().log() / 2).exp() * s.zeta() / 2
            actual = reconstitute(result["value"])
            self.assertTrue(actual.overlaps(reference))
            self.assertFalse(actual.overlaps(2 * reference))

    def test_gamma_recurrence_derivatives_and_rgamma_at_zero(self):
        first = evaluate(request("gamma_derivatives", "1", "0", order=16))
        second = evaluate(request("gamma_derivatives", "2", "0", order=16))
        with flint_workprec(192):
            for k in range(1, 17):
                reference = reconstitute(first["derivatives"][k]["ball"]) + k * reconstitute(first["derivatives"][k-1]["ball"])
                self.assertTrue(reconstitute(second["derivatives"][k]["ball"]).overlaps(reference))
        self.assert_contains_real(evaluate(request("rgamma", "0", "0", order=1)), "1")

    def test_poles_are_nonfinite_and_branch_cut_is_explicit(self):
        for operation, real in (("zeta", "1"), ("gamma", "0"), ("gamma", "-3"),
                                ("lgamma", {"lower": "-1/8", "upper": "1/8"})):
            result = evaluate(request(operation, real, "0"))
            self.assertEqual(result["status"], "nonfinite")
            self.assertIn("pole", result["reason"])
            self.assertIsNone(result["value"])
            self.assertFalse(result["scope"]["actualBackendExecution"])
        branch = evaluate(request("lgamma", "-1/2", {"lower": "-1/100", "upper": "1/100"}))
        self.assertEqual(branch["status"], "unsupported")
        self.assertIn("branch", branch["reason"])
        self.assertEqual(evaluate(request("gamma", "-1/2", "0"))["status"], "finite")

    def test_lgamma_is_not_principal_log_of_gamma_value(self):
        result = evaluate(request("lgamma", "0", "10"))
        with flint_workprec(192):
            actual = reconstitute(result["value"])
            principal = acb(0, 10).gamma().log()
            self.assertTrue(actual.overlaps(principal + acb(0, 4 * arb.pi())))
            self.assertFalse(actual.overlaps(principal))
        self.assertFalse(result["formula"]["isPrincipalLogOfGammaValue"])

    def test_precision_bits_do_not_replace_actual_width_check(self):
        low = evaluate(request("zeta", bits=24))
        high = evaluate(request("zeta", bits=192))
        self.assertEqual(low["status"], "finite")
        self.assertFalse(low["toleranceMet"])
        self.assertTrue(high["toleranceMet"])
        self.assertLess(dyadic_to_fraction(high["value"]["maxComponentWidth"]),
                        dyadic_to_fraction(low["value"]["maxComponentWidth"]))
        self.assertIsNone(high["errorAccounting"]["internalRoundingBound"])
        self.assertIsNone(high["errorAccounting"]["internalTruncationBound"])
        self.assertIsNone(high["errorAccounting"]["finiteDisplacementTaylorRemainder"])

    def test_input_rectangle_propagation_and_wide_box_rejection(self):
        result = evaluate(request("gamma", {"lower": "2", "upper": "21/10"}, "0", bits=256))
        self.assertEqual(result["status"], "finite")
        self.assertFalse(result["toleranceMet"])
        with flint_workprec(256):
            ball = reconstitute(result["value"])
            self.assertTrue(ball.contains(acb(2).gamma()))
            self.assertTrue(ball.contains(acb(arb_from_exact_component("21/10")).gamma()))
        wide = evaluate(request("xi", {"lower": "0", "upper": "1"}, "0"))
        self.assertEqual(wide["status"], "unsupported")
        self.assertFalse(wide["scope"]["rigorousEnclosure"])
        removable = evaluate(request("xi", {"lower": "19/20", "upper": "21/20"}, "0"))
        self.assertEqual(removable["status"], "finite")
        with flint_workprec(192):
            self.assertTrue(reconstitute(removable["value"]).contains(acb(arb_from_exact_component("1/2"))))

    def test_backend_nonfinite_serialization_never_invents_endpoints(self):
        with flint_workprec(192):
            ball = serialize_acb(acb(1).zeta(), "1e-40")
        self.assertEqual(ball["kind"], "nonfinite")
        self.assertIsNone(ball["real"]["lower"])
        self.assertIsNone(ball["maxComponentWidth"])
        self.assertFalse(ball["toleranceMet"])

    def test_saved_record_requires_hash_and_fresh_backend_match(self):
        record = evaluate(request("zeta"))
        replay = replay_evaluation(record)
        self.assertTrue(replay["matches"])
        self.assertTrue(replay["evaluationRecomputed"])
        self.assertTrue(replay["backendRecomputed"])
        for operation, real in (("zeta", "1"), ("lgamma", "-1/2")):
            rejection = evaluate(request(operation, real, "0"))
            replay = replay_evaluation(rejection)
            self.assertTrue(replay["matches"])
            self.assertTrue(replay["evaluationRecomputed"])
            self.assertFalse(replay["backendRecomputed"])
        altered = copy.deepcopy(record)
        altered["derivatives"][0]["ball"]["real"]["upper"]["mantissa"] = "1"
        with self.assertRaises(BallRequestError):
            replay_evaluation(altered)
        altered = copy.deepcopy(record)
        altered["scope"]["RiemannHypothesisProof"] = True
        payload = {key: value for key, value in altered.items() if key != "computationSha256"}
        altered["computationSha256"] = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=True,
                                                                 separators=(",", ":"), allow_nan=False).encode("ascii")).hexdigest()
        with self.assertRaises(BallRequestError):
            replay_evaluation(altered)


if __name__ == "__main__":
    unittest.main()
