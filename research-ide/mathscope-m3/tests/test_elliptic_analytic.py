"""Numerical validation, independent identities, and forged-claim controls."""

from copy import deepcopy
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from p7 import ball_backend as balls
from p7 import elliptic_analytic as analytic
from p7.elliptic_local import as_curve, coefficients


def endpoints(ball):
    return balls.dyadic_to_fraction(ball["lower"]), balls.dyadic_to_fraction(ball["upper"])


def rehash(record):
    record.pop("computationSha256", None)
    raw = json.dumps(record, sort_keys=True, ensure_ascii=True, separators=(",", ":"), allow_nan=False).encode("ascii")
    record["computationSha256"] = sha256(raw).hexdigest()
    return record


class EllipticAnalyticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        balls._require_backend()
        cls.records = {model: analytic.elliptic_central_certificate(model) for model in analytic.SUPPORTED_MODELS}

    def test_11a1_nonzero_value_certifies_analytic_rank_zero(self):
        record = self.records["11a1"]
        lower, upper = endpoints(record["values"]["L"])
        self.assertGreater(lower, Fraction("0.253841860855910684"))
        self.assertLess(upper, Fraction("0.253841860855910685"))
        self.assertEqual(record["analyticRank"]["exactRank"], 0)
        self.assertTrue(record["analyticRank"]["centralValueExcludesZero"])
        self.assertTrue(record["toleranceMet"])

    def test_37a1_exact_parity_zero_and_positive_derivative_certify_rank_one(self):
        record = self.records["37a1"]
        # SageMath's independently implemented published deriv_at1 example
        # begins 0.305999773834052301820483683321676474452637774590...
        lower, upper = endpoints(record["values"]["LPrime"])
        self.assertGreater(lower, Fraction("0.30599977383405230182048368332167647445263"))
        self.assertLess(upper, Fraction("0.30599977383405230182048368332167647445264"))
        self.assertEqual(endpoints(record["values"]["L"]), (0, 0))
        self.assertEqual(endpoints(record["values"]["Lambda"]), (0, 0))
        self.assertTrue(record["analyticRank"]["centralValueExactZero"])
        self.assertEqual(record["analyticRank"]["exactRank"], 1)
        self.assertTrue(record["toleranceMet"])

    def test_even_parity_kills_completed_derivative_not_uncompleted_derivative(self):
        record = self.records["11a1"]
        self.assertEqual(endpoints(record["values"]["LambdaPrime"]), (0, 0))
        self.assertFalse(record["values"]["LPrime"]["containsZero"])
        with balls.flint_workprec(256):
            c = 2*balls.arb.pi()/balls.arb(11).sqrt()
            # Rearrangement of the differentiated functional equation.
            l = balls.arb_from_exact_component({k: str(v) for k, v in zip(("lower", "upper"), endpoints(record["values"]["L"]))})
            predicted = (c.log() - balls.arb(1).digamma()) * l
            actual = balls.arb_from_exact_component({k: str(v) for k, v in zip(("lower", "upper"), endpoints(record["values"]["LPrime"]))})
            self.assertTrue(actual.overlaps(predicted))

    def test_exponential_integral_matches_independent_incomplete_gamma_identity(self):
        with balls.flint_workprec(192):
            for numerator, denominator in ((1, 10), (1, 1), (11, 3), (100, 1)):
                x = balls.arb(numerator)/denominator
                self.assertTrue(x.expint(1).overlaps(x.gamma_upper(0)))
                self.assertGreater(x.expint(1), 0)
                self.assertLess(x.expint(1), (-x).exp()/x)

    def test_completed_bounds_shrink_and_enclose_a_longer_computation(self):
        for model in analytic.SUPPORTED_MODELS:
            short = analytic.elliptic_central_certificate(model, coefficient_limit=8)
            long = analytic.elliptic_central_certificate(model, coefficient_limit=160, precision_bits=256)
            for name in ("L", "LPrime", "Lambda", "LambdaPrime"):
                short_lower, short_upper = endpoints(short["values"][name])
                long_lower, long_upper = endpoints(long["values"][name])
                self.assertLessEqual(short_lower, long_lower)
                self.assertLessEqual(long_upper, short_upper)
            self.assertFalse(short["toleranceMet"])

    def test_actual_omitted_finite_block_is_inside_the_analytic_majorant(self):
        for model, conductor, sign in (("11a1", 11, 1), ("37a1", 37, -1)):
            actual = coefficients(model, 96)
            with balls.flint_workprec(192):
                c = 2*balls.arb.pi()/balls.arb(conductor).sqrt()
                value_block, derivative_block = balls.arb(0), balls.arb(0)
                for n in range(9, 97):
                    x = c*n
                    value_block += (1+sign)*actual[n-1]*(-x).exp()/x
                    derivative_block += (1-sign)*actual[n-1]*x.expint(1)/x
                value_tail, derivative_tail = analytic._tail_balls(c, sign, 8)
                self.assertLessEqual(abs(value_block), value_tail)
                self.assertLessEqual(abs(derivative_block), derivative_tail)

    def test_short_cutoff_does_not_fake_the_requested_width(self):
        record = analytic.elliptic_central_certificate("37a1", coefficient_limit=1)
        self.assertFalse(record["toleranceMet"])
        self.assertFalse(record["values"]["LPrime"]["toleranceMet"])
        self.assertGreater(balls.dyadic_to_fraction(record["values"]["LPrime"]["width"]), Fraction(1, 2))
        # Rank and width are distinct: even this broad positive interval can
        # establish rank one, but must not pretend to meet the width request.
        self.assertEqual(record["analyticRank"]["exactRank"], 1)

    def test_low_precision_does_not_fake_width_even_with_long_cutoff(self):
        record = analytic.elliptic_central_certificate("11a1", precision_bits=32, coefficient_limit=160)
        self.assertFalse(record["toleranceMet"])
        self.assertFalse(record["values"]["L"]["toleranceMet"])
        self.assertEqual(record["analyticRank"]["exactRank"], 0)

    def test_inconclusive_derivative_cannot_establish_rank_from_parity_alone(self):
        with balls.flint_workprec(64):
            zero = balls.serialize_arb(balls.arb(0))
            wide = balls.serialize_arb(balls.arb(0, 1))
        result = analytic._analytic_rank({"L": zero, "LPrime": wide}, -1)
        self.assertTrue(result["centralValueExactZero"])
        self.assertIsNone(result["exactRank"])
        self.assertEqual(result["status"], "INCONCLUSIVE")

    def test_exact_model_coefficients_and_alias_replay_identically(self):
        record = analytic.elliptic_central_certificate(list(as_curve("37a1").ainvs))
        self.assertEqual(record, self.records["37a1"])
        self.assertEqual(json.loads(json.dumps(record, allow_nan=False)), record)
        replay = analytic.replay_elliptic_central_certificate(record)
        self.assertTrue(replay["valid"])
        self.assertTrue(replay["freshComputationMatches"])

    def test_parameters_are_closed_and_resource_bounded(self):
        for field, values in (("precision_bits", (True, 31, 4097, 192.0)),
                              ("coefficient_limit", (True, 0, 2049, 8.0)),
                              ("tolerance", (True, 0.1, "0", "-1", "2", "nan"))):
            for value in values:
                with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                    analytic.elliptic_central_certificate("11a1", **{field: value})
        with self.assertRaises(analytic.EllipticAnalyticError):
            analytic.elliptic_central_certificate([0, 0, 0, -1, 0])
        with self.assertRaises(TypeError):
            analytic.elliptic_central_certificate("11a1", root_number=-1)

    def test_complete_factors_are_required_and_no_incomplete_series_is_promoted(self):
        omitted = deepcopy(self.records["11a1"]["coefficientData"])
        omitted.update({"function": "L^S(E,s)", "omittedPrimes": [11], "completeBadFactorsIncluded": False})
        with patch.object(analytic, "dirichlet_coefficients", return_value=omitted):
            with self.assertRaises(analytic.EllipticAnalyticError) as caught:
                analytic.elliptic_central_certificate("11a1")
            self.assertEqual(caught.exception.code, "INCOMPLETE_L_SERIES")

    def test_backend_absence_is_not_a_float_fallback(self):
        with patch.object(balls, "flint", None):
            with self.assertRaises(balls.BallBackendUnavailable):
                analytic.elliptic_central_certificate("11a1")

    def test_error_budget_records_tail_separately_and_includes_it_in_final_ball(self):
        for record in self.records.values():
            budget = record["errorBudget"]
            self.assertTrue(budget["separatelyRecordedAnalyticTail"])
            self.assertFalse(budget["internalRoundingAndSpecialFunctionTruncationSeparated"])
            for name, tail in budget["analyticTailUpperBounds"].items():
                lower, upper = endpoints(tail)
                self.assertEqual(lower, upper)
                self.assertGreaterEqual(lower, 0)
                finite_lower, finite_upper = endpoints(budget["finiteSumBalls"][name])
                total_lower, total_upper = endpoints(record["values"][name])
                self.assertLessEqual(total_lower, finite_lower)
                self.assertGreaterEqual(total_upper, finite_upper)

    def test_forged_results_and_authority_promotions_are_rejected_even_after_rehash(self):
        original = self.records["37a1"]
        mutations = {
            "root number": lambda r: r["normalization"].update(rootNumber=1),
            "normalization": lambda r: r["normalization"].update(Lambda="Gamma_C normalization with an extra factor two"),
            "coefficient omitted": lambda r: r["coefficientData"]["coefficients"].__setitem__(1, "0"),
            "bad prime omitted": lambda r: r["coefficientData"]["omittedPrimes"].append(37),
            "zero tail": lambda r: r["errorBudget"]["analyticTailUpperBounds"].__setitem__("LPrime", deepcopy(r["values"]["L"])),
            "value edited": lambda r: r["values"]["LPrime"]["lower"].update(mantissa="1", exponent="0"),
            "rank promoted": lambda r: r["analyticRank"].update(exactRank=2),
            "BSD promoted": lambda r: r["scope"].update(universalBSDProved=True),
            "P7 promoted": lambda r: r["scope"].update(allP7CriteriaComplete=True),
            "formal proof promoted": lambda r: r["scope"].update(leanProofExecuted=True),
            "source edited": lambda r: r["sourceSha256"].update({"elliptic_local.py": "0"*64}),
        }
        for name, mutate in mutations.items():
            with self.subTest(mutation=name):
                record = deepcopy(original)
                mutate(record)
                with self.assertRaises(analytic.EllipticAnalyticError) as caught:
                    analytic.replay_elliptic_central_certificate(rehash(record))
                self.assertEqual(caught.exception.code, "REPLAY_MISMATCH")

    def test_replay_rejects_unknown_fields_and_noncanonical_numeric_types(self):
        record = deepcopy(self.records["11a1"])
        record["request"]["extra"] = "ignored?"
        with self.assertRaises(analytic.EllipticAnalyticError):
            analytic.replay_elliptic_central_certificate(rehash(record))
        record = deepcopy(self.records["11a1"])
        record["scope"]["universalBSDProved"] = 0  # 0 == False in Python, but not in canonical JSON
        with self.assertRaises(analytic.EllipticAnalyticError):
            analytic.replay_elliptic_central_certificate(rehash(record))

    def test_backend_context_is_restored_and_no_global_conjecture_claimed(self):
        original_precision, original_cap = balls.ctx.prec, balls.ctx.cap
        record = analytic.elliptic_central_certificate("11a1", precision_bits=160)
        self.assertEqual((balls.ctx.prec, balls.ctx.cap), (original_precision, original_cap))
        for name in ("allP7CriteriaComplete", "universalRHProved", "universalBSDProved", "leanProofExecuted",
                     "arithmeticRankUpperBoundComputed", "arithmeticRankEqualityClaimed", "bsdLeadingTermClaimed",
                     "modularSymbolsExecuted", "finiteDisplacementTaylorRemainder"):
            self.assertFalse(record["scope"][name])


if __name__ == "__main__":
    unittest.main()
