"""Actual low-height zeta certificates and rejection controls.

Run with the pinned python-flint installation on PYTHONPATH.  The full
certificates are retained in RESULTS so the small external test runner can
persist exactly the computations exercised here, without recomputation.
"""

from copy import deepcopy
from fractions import Fraction
import hashlib
import json
import unittest
from unittest.mock import patch

from flint import acb, arb, ctx

from p7.ball_backend import dyadic_to_fraction, flint_workprec, parse_exact_rational
from p7.zero_certificate import (
    _branch_tube_test,
    _point,
    _segment_tube,
    certify_zeros,
)


RESULTS = {}


def bounds(row):
    assert row["kind"] == "finite"
    return dyadic_to_fraction(row["lower"]), dyadic_to_fraction(row["upper"])


def canonical(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("ascii")


class FiniteZeroCertificateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        for height in ("20", "30"):
            RESULTS[height] = certify_zeros({"height": height, "precisionBits": 192, "tolerance": "1e-30"})

    def test_actual_counts_and_winding_with_pole_correction(self):
        for height, positive, winding in (("20", 1, 1), ("30", 3, 5)):
            with self.subTest(height=height):
                result = RESULTS[height]
                self.assertEqual(result["status"], "FINITE_RH_TO_T", result.get("failure"))
                self.assertTrue(result["pass"])
                self.assertEqual(result["positiveZeroCount"], positive)
                contour = result["contour"]
                self.assertEqual(contour["windingInteger"], winding)
                self.assertEqual(contour["zeroCountIncludingMultiplicity"], winding + 1)
                self.assertEqual(winding + 1, 2 * positive)
                lower, upper = bounds(contour["windingInterval"])
                self.assertLessEqual(lower, winding)
                self.assertGreaterEqual(upper, winding)
                self.assertLessEqual(upper - lower, Fraction(1, 10**30))

    def test_whole_tube_coverage_and_strict_branch_inequalities(self):
        for height, result in RESULTS.items():
            cells = result["contour"]["cells"]
            self.assertGreater(len(cells), 4)
            self.assertEqual(cells[0]["start"], cells[-1]["end"])
            edge_order = []
            for index, cell in enumerate(cells):
                if not edge_order or edge_order[-1] != cell["edge"]:
                    edge_order.append(cell["edge"])
                if index:
                    self.assertEqual(cells[index - 1]["end"], cell["start"])
                self.assertGreater(parse_exact_rational(cell["exactTube"]["padding"]), 0)
                for axis in ("real", "imag"):
                    exact = cell["exactTube"][axis]
                    lo, hi = parse_exact_rational(exact["lower"]), parse_exact_rational(exact["upper"])
                    for endpoint in (cell["start"], cell["end"]):
                        self.assertLess(lo, parse_exact_rational(endpoint[axis]))
                        self.assertGreater(hi, parse_exact_rational(endpoint[axis]))
                    blo, bhi = bounds(cell["tube"][axis])
                    self.assertLessEqual(blo, lo)
                    self.assertGreaterEqual(bhi, hi)
                tr, ti = bounds(cell["tube"]["real"]), bounds(cell["tube"]["imag"])
                self.assertFalse(tr[0] <= 1 <= tr[1] and ti[0] <= 0 <= ti[1])
                self.assertGreater(bounds(cell["zetaAbsoluteLower"])[0], 0)
                self.assertGreater(bounds(cell["quotientRealLower"])[0], 0)
                self.assertGreater(bounds(cell["quotientTube"]["real"])[0], 0)
                self.assertGreater(bounds(cell["endpointQuotient"]["real"])[0], 0)
                self.assertEqual(cell["argumentIncrement"]["kind"], "finite")
                for name in ("zetaTube", "zetaStart", "zetaEnd", "quotientTube", "endpointQuotient"):
                    self.assertEqual(cell[name]["kind"], "finite")
            self.assertEqual(edge_order, ["bottom", "right", "top", "left"])

    def test_actual_hardy_signs_disjoint_boxes_and_count_saturation(self):
        for result in RESULTS.values():
            roots = result["hardyRoots"]
            for index, root in enumerate(roots):
                lower, upper = parse_exact_rational(root["lower"]), parse_exact_rational(root["upper"])
                self.assertGreater(lower, 0)
                self.assertLess(lower, upper)
                self.assertLessEqual(upper - lower, Fraction(1, 10**30))
                left, right = bounds(root["hardyLower"]), bounds(root["hardyUpper"])
                self.assertTrue((left[1] < 0 < right[0]) or (right[1] < 0 < left[0]))
                self.assertEqual(root["lowerSign"] * root["upperSign"], -1)
                self.assertTrue(root["rootEnclosure"]["toleranceMet"])
                self.assertTrue(root["hardyLower"]["toleranceMet"])
                self.assertTrue(root["hardyUpper"]["toleranceMet"])
                self.assertFalse(root["imageContainsZeroUsedForExistence"])
                self.assertTrue(root["uniqueAndSimpleByTotalCount"])
                if index:
                    self.assertLess(parse_exact_rational(roots[index - 1]["upper"]), lower)
            self.assertEqual(result["contour"]["zeroCountIncludingMultiplicity"], 2 * len(roots))
            self.assertEqual(result["countSaturation"]["remainingZerosInRectangle"], 0)

    def test_flint_observations_have_width_and_are_not_claimed_independent(self):
        for result in RESULTS.values():
            observations = result["flintObservations"]
            self.assertTrue(observations["pass"])
            self.assertFalse(observations["listAndCountIndependent"])
            self.assertFalse(observations["contourUsesTheseRoutines"])
            self.assertTrue(observations["sharedArithmeticAndZetaBackendWithContour"])
            self.assertTrue(observations["count"]["toleranceMet"])
            self.assertEqual(observations["countInteger"], len(result["hardyRoots"]))
            for row in observations["listedZeros"]:
                self.assertTrue(row["zero"]["toleranceMet"])
                self.assertTrue(row["containedInSignBracket"])

    def test_nonzero_endpoint_samples_do_not_certify_segment_crossing_a_zero(self):
        with flint_workprec(192):
            start = (Fraction(1, 2), Fraction(14))
            end = (Fraction(1, 2), Fraction(15))
            self.assertFalse(_point(start).zeta().contains(0))
            self.assertFalse(_point(end).zeta().contains(0))
            tube, _ = _segment_tube(start, end)
            self.assertIsNone(_branch_tube_test(tube, _point(start).zeta()))

    def test_a_whole_tube_containing_the_pole_is_rejected(self):
        with flint_workprec(192):
            pole_tube = acb(arb(1, arb(1) / 8), arb(0, arb(1) / 8))
            self.assertIsNone(_branch_tube_test(pole_tube, acb(2).zeta()))

    def test_low_precision_cannot_succeed_by_reporting_working_bits_only(self):
        result = certify_zeros({"height": "20", "precisionBits": 32, "tolerance": "1e-30"})
        self.assertEqual(result["status"], "UNRESOLVED")
        self.assertFalse(result["pass"])
        self.assertFalse(result["scope"]["finiteRHToRequestedHeight"])
        self.assertEqual(result["failure"]["code"], "WINDING_WIDTH")

    def test_cell_depth_and_evaluation_budgets_never_become_completion(self):
        for controls, expected in (({"maxCells": 1}, "CELL_BUDGET"),
                                   ({"maxDepth": 0}, "SUBDIVISION_DEPTH"),
                                   ({"maxEvaluations": 1}, "EVALUATION_BUDGET")):
            with self.subTest(controls=controls):
                result = certify_zeros(controls)
                self.assertEqual(result["status"], "UNRESOLVED")
                self.assertFalse(result["pass"])
                self.assertFalse(result["scope"]["finiteRHToRequestedHeight"])
                self.assertEqual(result["failure"]["code"], expected)

    def test_deadline_failure_is_unresolved_and_restores_context(self):
        previous = (ctx.prec, ctx.cap)
        with patch("p7.zero_certificate.monotonic", side_effect=[0, 2]):
            result = certify_zeros({"timeoutSeconds": 1})
        self.assertEqual(result["failure"]["code"], "TIME_BUDGET")
        self.assertFalse(result["pass"])
        self.assertEqual((ctx.prec, ctx.cap), previous)

    def test_exact_input_and_untrusted_count_controls(self):
        bad_requests = [
            {"height": 20}, {"height": 20.0}, {"height": True}, {"height": "21"},
            {"tolerance": 1e-30}, {"tolerance": "0"}, {"tolerance": "nan"},
            {"precisionBits": True}, {"trustedCount": 1}, {"maxCells": 0},
        ]
        for request in bad_requests:
            with self.subTest(request=request):
                result = certify_zeros(request)
                self.assertEqual(result["status"], "UNRESOLVED")
                self.assertEqual(result["failure"]["code"], "INVALID_REQUEST")
                self.assertFalse(result["scope"]["globalRHProved"])

    def test_scope_and_recomputation_hash_are_explicit(self):
        for result in RESULTS.values():
            self.assertFalse(result["scope"]["globalRHProved"])
            self.assertFalse(result["scope"]["formalKernelProof"])
            self.assertFalse(result["scope"]["completeP7Milestone"])
            self.assertFalse(result["scope"]["independentSoftwareImplementation"])
            self.assertFalse(result["scope"]["serializedReceiptAuthenticatesNewComputation"])
            unsigned = deepcopy(result)
            digest = unsigned.pop("computationSha256")
            self.assertEqual(digest, hashlib.sha256(canonical(unsigned)).hexdigest())
            self.assertNotIn("elapsedSeconds", result)
            self.assertNotIn("timestamp", result)

    def test_fresh_recomputation_is_deterministic_and_context_safe(self):
        previous = (ctx.prec, ctx.cap)
        again = certify_zeros({"height": "20", "precisionBits": 192, "tolerance": "1e-30"})
        self.assertEqual(again, RESULTS["20"])
        self.assertEqual((ctx.prec, ctx.cap), previous)


if __name__ == "__main__":
    unittest.main(verbosity=2)
