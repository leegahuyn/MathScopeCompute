"""Executed arithmetic and adversarial certificate tests; no mocked success receipts."""
from copy import deepcopy
from fractions import Fraction
from hashlib import sha256
import json
import os
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

from p7 import ball_backend as balls
from p7.elliptic_local import point_multiply
from p7.height_certificate import (canonical_height_certificate, duplication_bound, duplicate_x,
                                   rank_one_primitivity_certificate, replay_canonical_height_certificate,
                                   replay_rank_one_primitivity_certificate, verify_duplication_bound)
from p7.pari_backend import (PariBackendUnavailable, PariExecutionError, backend_fingerprint,
                             run_elliptic_arithmetic, verify_cover_map)
from p7.period_certificate import isolate_largest_real_root, real_period_certificate
from p7.elliptic_arithmetic import (complete_local_certificate, evaluate_elliptic_arithmetic,
                                    replay_elliptic_arithmetic)


def endpoints(record):
    return tuple(balls.dyadic_to_fraction(record[name]) for name in ("lower", "upper"))


def reseal(record):
    body = {key: value for key, value in record.items() if key != "computationSha256"}
    record["computationSha256"] = sha256(json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()).hexdigest()
    return record


class HeightWitnessTests(unittest.TestCase):
    def test_duplication_agrees_with_independent_full_group_law(self):
        for model, point in [("37a1", [0, 0]), ("11a1", [5, 5]), ([0, 0, 0, -1, 0], [0, 0])]:
            current = point_multiply(model, 1, point)
            for _ in range(7):
                doubled = point_multiply(model, 2, current)
                self.assertEqual(duplicate_x(model, None if current is None else current[0]),
                                 None if doubled is None else doubled[0])
                current = doubled

    def test_altered_bezout_constant_is_rejected(self):
        bound = duplication_bound("37a1")
        self.assertEqual((bound["D"], bound["heightBoundConstant"]), (37, 171))
        self.assertTrue(verify_duplication_bound("37a1", bound))
        bound["D"] += 1
        self.assertFalse(verify_duplication_bound("37a1", bound))

    def test_torsion_height_contains_zero_and_non_torsion_is_positive(self):
        torsion = canonical_height_certificate("11a1", [5, 5])
        non_torsion = canonical_height_certificate("37a1", [0, 0])
        self.assertFalse(torsion["positiveHeightCertified"])
        self.assertTrue(torsion["heightCremona"]["containsZero"])
        self.assertTrue(non_torsion["positiveHeightCertified"])
        low, high = endpoints(non_torsion["heightCremona"])
        slow, shigh = endpoints(non_torsion["heightSilverman"])
        # A ball division may widen its radius outward even for the exact
        # normalization factor 2; directed containment is the required claim.
        self.assertLessEqual(slow*2, low)
        self.assertGreaterEqual(shigh*2, high)

    def test_tripling_has_quadratic_height_and_finer_tail(self):
        first = canonical_height_certificate("37a1", [0, 0], iterations=7)
        tripled = canonical_height_certificate("37a1", point_multiply("37a1", 3, [0, 0]), iterations=7)
        a, b = endpoints(first["heightCremona"])
        c, d = endpoints(tripled["heightCremona"])
        self.assertLessEqual(max(9*a, c), min(9*b, d))
        finer = canonical_height_certificate("37a1", [0, 0], iterations=8)
        self.assertLess(endpoints(finer["infiniteLimitTailUpperBound"])[1],
                        endpoints(first["infiniteLimitTailUpperBound"])[0]/3)

    def test_resealed_height_or_omitted_enumeration_fails_fresh_replay(self):
        height = canonical_height_certificate("37a1", [0, 0], iterations=7)
        self.assertEqual(replay_canonical_height_certificate(height)["status"], "MATCH")
        altered = deepcopy(height)
        altered["heightCremona"]["lower"]["mantissa"] = "1"
        with self.assertRaises(ValueError):
            replay_canonical_height_certificate(reseal(altered))
        primitive = rank_one_primitivity_certificate("37a1", [0, 0])
        altered = deepcopy(primitive)
        altered["enumeration"]["affinePoints"].pop()
        with self.assertRaises(ValueError):
            replay_rank_one_primitivity_certificate(reseal(altered))

    def test_full_divisor_enumeration_and_proper_multiple_negative_control(self):
        primitive = rank_one_primitivity_certificate("37a1", [0, 0])
        self.assertTrue(primitive["primitivityProved"])
        self.assertEqual(primitive["enumeration"]["bound"], 5)
        self.assertEqual(primitive["enumeration"]["reducedXCoordinatesChecked"], 39)
        self.assertEqual(len(primitive["enumeration"]["affinePoints"]), 10)
        self.assertIn(["1/4", "-5/8"], primitive["enumeration"]["affinePoints"])
        self.assertIn(["1/4", "-3/8"], primitive["enumeration"]["affinePoints"])
        multiple = rank_one_primitivity_certificate("37a1", point_multiply("37a1", 3, [0, 0]))
        self.assertFalse(multiple["primitivityProved"])

    def test_float_boolean_invalid_point_and_resource_inputs_are_rejected(self):
        for point in ([0.0, 0], [False, 0], [1, 2]):
            with self.assertRaises(ValueError):
                canonical_height_certificate("37a1", point)
        for value in (True, -1, 11):
            with self.assertRaises(ValueError):
                canonical_height_certificate("37a1", [0, 0], iterations=value)


class PeriodWitnessTests(unittest.TestCase):
    def test_sturm_largest_root_for_one_and_three_real_roots(self):
        three = isolate_largest_real_root(-1, 0, 128)
        self.assertEqual(three["allRealRootCount"], 3)
        self.assertLessEqual(Fraction(three["lower"]), 1)
        self.assertGreaterEqual(Fraction(three["upper"]), 1)
        self.assertLessEqual(Fraction(three["upper"])-Fraction(three["lower"]), Fraction(1, 2**128))
        one = isolate_largest_real_root(0, -2, 128)
        self.assertEqual(one["allRealRootCount"], 1)
        self.assertLess(Fraction(one["lower"])**3, 2)
        self.assertGreater(Fraction(one["upper"])**3, 2)

    def test_full_real_period_includes_both_components(self):
        curve = real_period_certificate("37a1")
        self.assertEqual(curve["realConnectedComponents"], 2)
        a, b = endpoints(curve["identityComponentPeriod"])
        c, d = endpoints(curve["realPeriodOmega"])
        self.assertEqual((2*a, 2*b), (c, d))
        self.assertTrue(curve["integral"]["analyticBranchFlagForwarded"])
        self.assertGreater(curve["integral"]["observedCalls"]["analytic"], 0)
        self.assertLess(d-c, Fraction(1, 10**45))


class ActualPariArithmeticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.backend = backend_fingerprint()
        cls.zero = evaluate_elliptic_arithmetic({"model": "11a1"})
        cls.one = evaluate_elliptic_arithmetic({"model": "37a1"})

    def test_exact_rank_zero_and_one_have_independent_lower_and_descent_upper(self):
        for result, rank in [(self.zero, 0), (self.one, 1)]:
            bounds = result["arithmeticRank"]
            self.assertEqual((bounds["lowerBound"], bounds["upperBound"], bounds["exactRank"]), (rank, rank, rank))
            certificate = bounds["rankUpperCertificate"]
            self.assertTrue(certificate["freshProcessExecuted"])
            self.assertEqual(certificate["upperBound"], certificate["twoSelmerRank"]-certificate["rationalTwoTorsionRank"]-certificate["casselsPairingRank"])
            self.assertFalse(certificate["analyticRankUsed"])
            self.assertFalse(certificate["databaseLookupUsed"])
            self.assertFalse(result["scope"]["formalLeanProofIssued"])

    def test_local_analytic_dependency_does_not_run_descent_or_height(self):
        with patch("p7.elliptic_arithmetic.canonical_height_certificate", side_effect=AssertionError("unexpected height call")):
            local = complete_local_certificate([0, 0, 0, 0, -2], coefficient_limit=128)
        self.assertEqual(local["global"]["conductor"], 1728)
        self.assertEqual(len(local["dirichletCoefficients"]["coefficients"]), 128)
        self.assertFalse(local["scope"]["descentExecuted"])
        self.assertFalse(local["scope"]["heightComputed"])
        self.assertNotIn("ellrank(", local["pariReceipt"]["execution"]["script"])
        self.assertNotIn("ell2cover(", local["pariReceipt"]["execution"]["script"])
        self.assertNotIn("elltors(", local["pariReceipt"]["execution"]["script"])

    def test_one_coefficient_cutoff_uses_a_real_backend_prefix_and_preserves_one(self):
        local = complete_local_certificate("37a1", coefficient_limit=1)
        self.assertEqual(local["dirichletCoefficients"]["coefficients"], [1])
        self.assertEqual(local["pariReceipt"]["dirichletCoefficients"], ["1"])
        script = local["pariReceipt"]["execution"]["script"]
        self.assertIn("AN=ellan(E,2);", script)
        self.assertIn("vector(1,i,AN[i])", script)
        self.assertEqual(local["pariReceipt"]["execution"]["exitCode"], 0)

    def test_saturated_regulator_torsion_and_unknown_sha_are_distinct(self):
        self.assertEqual(self.zero["rationalTorsion"]["order"], 5)
        self.assertEqual(self.one["rationalTorsion"]["order"], 1)
        self.assertTrue(self.one["saturation"]["proved"])
        self.assertEqual(self.one["saturation"]["primitivityCertificate"]["enumeration"]["bound"], 5)
        self.assertEqual(self.one["regulator"]["status"], "CERTIFIED_FULL_REGULATOR")
        self.assertEqual(self.one["sha"]["status"], "UNKNOWN")
        self.assertFalse(self.one["bsdLedger"]["universalBSDProved"])

    def test_additive_tate_and_two_torsion_are_actually_computed(self):
        result = evaluate_elliptic_arithmetic({"model": [0, 0, 0, -1, 0]})
        self.assertEqual(result["global"]["conductor"], 32)
        bad = next(row for row in result["localRows"] if row["prime"] == 2)
        self.assertEqual(bad["reduction"], "additive")
        self.assertEqual(bad["eulerPolynomial"], [1])
        upper = result["arithmeticRank"]["rankUpperCertificate"]
        self.assertEqual((upper["twoSelmerRank"], upper["rationalTwoTorsionRank"], upper["upperBound"]), (2, 2, 0))
        self.assertEqual(result["rationalTorsion"]["order"], 4)

    def test_nonminimal_rational_model_returns_the_same_minimal_period(self):
        scaled = evaluate_elliptic_arithmetic({"model": [0, -4, 8, -160, -1280]})
        self.assertEqual(scaled["minimalModelCertificate"]["change"], ["2", "0", "0", "0"])
        self.assertEqual(scaled["global"], self.zero["global"])
        self.assertEqual(scaled["realPeriod"]["realPeriodOmega"], self.zero["realPeriod"]["realPeriodOmega"])
        rational = evaluate_elliptic_arithmetic({"model": [0, "-1/4", "1/8", "-5/8", "-5/16"]})
        self.assertEqual(rational["global"]["conductor"], 11)
        self.assertTrue(rational["minimalModelCertificate"]["fiveCoefficientIdentityChecked"])

    def test_resealed_rank_certificate_removal_and_bad_factor_fail_fresh_replay(self):
        self.assertEqual(replay_elliptic_arithmetic(self.one)["status"], "MATCH")
        altered = deepcopy(self.one)
        del altered["arithmeticRank"]["rankUpperCertificate"]
        with self.assertRaises(ValueError):
            replay_elliptic_arithmetic(reseal(altered))
        altered = deepcopy(self.one)
        altered["localRows"] = [row for row in altered["localRows"] if row["prime"] != 37]
        with self.assertRaises(ValueError):
            replay_elliptic_arithmetic(reseal(altered))

    def test_cover_map_tamper_is_rejected_by_exact_quotient_ring_identity(self):
        cover = deepcopy(self.one["pariReceipt"]["twoCovers"][0])
        self.assertTrue(verify_cover_map("37a1", cover)["exactRationalMapIdentityChecked"])
        cover[1][0][0][0] = "0"
        with self.assertRaises(PariExecutionError):
            verify_cover_map("37a1", cover)

    def test_clean_exit_without_marker_and_warnings_cannot_be_success(self):
        for completed in [subprocess.CompletedProcess([], 0, b"", b""),
                          subprocess.CompletedProcess([], 0, b"MATHSCOPE_P7_EXACT_V1=[]\n", b"warning\n")]:
            with patch("p7.pari_backend._fingerprint", return_value=self.backend), patch("p7.pari_backend.subprocess.run", return_value=completed):
                with self.assertRaises(PariExecutionError):
                    run_elliptic_arithmetic("37a1")

    def test_missing_backend_and_user_gp_code_are_closed_failures(self):
        with patch.dict(os.environ, {"MATHSCOPE_PARI_GP": "/nonexistent/mathscope-pinned-gp"}):
            with self.assertRaises(PariBackendUnavailable):
                backend_fingerprint()
        for model in ([0, 0, 1, "-1);system(\"false\")", 0], [0, 0, 1, -1.0, 0]):
            with self.assertRaises(ValueError):
                evaluate_elliptic_arithmetic({"model": model})


if __name__ == "__main__":
    unittest.main()
