"""Actual finite spectral contracts and refusal of infinite-claim promotion."""

from copy import deepcopy
from fractions import Fraction
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from p7 import ball_backend as balls
from p7.operator_registry import (
    BRIDGE_IDS, audit_operator, make_reference_fixture, validate_finite_fixture,
)


class OperatorRegistryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.audit = audit_operator({})

    def test_reference_computes_actual_finite_contract_and_keeps_research_open(self):
        result = self.audit
        self.assertTrue(result["pass"])
        self.assertEqual(result["status"], "REFERENCE_CONTRACT_AUDITED")
        self.assertEqual(result["researchStatus"], "RESEARCH_OPEN")
        validation = result["finiteValidation"]
        self.assertTrue(all(validation["checks"].values()))
        expected = sum((Fraction(1, k*k) for k in range(1, 9)), Fraction())
        self.assertEqual(Fraction(validation["actualTraceInverseSquare"]), expected)
        self.assertEqual(validation["actualMinimumEigenvalue"], "1")
        self.assertTrue(result["toleranceMet"])

    def test_exact_characteristic_polynomial_computed_from_matrix(self):
        validation = validate_finite_fixture(make_reference_fixture(3))
        self.assertEqual(validation["actualCharacteristicPolynomialAscending"], ["6", "-11", "6", "-1"])
        self.assertEqual(validation["actualTraceInverseSquare"], "49/36")
        self.assertEqual(validation["actualTraceInverse"], "11/6")

    def test_altered_normalization_is_numerically_separated_not_only_named_wrong(self):
        fixture = make_reference_fixture()
        fixture["claims"]["linearCounterterm"] = "0"
        validation = validate_finite_fixture(fixture)
        self.assertFalse(validation["pass"])
        self.assertFalse(validation["checks"]["linearCountertermEqualsTraceInverse"])
        self.assertTrue(all(row["normalizationMismatchNumericallySeparated"] for row in validation["determinantProbes"]))
        self.assertTrue(all(not row["difference"]["containsZero"] for row in validation["determinantProbes"]))

    def test_missing_zero_fails_degree_and_spectrum_contract(self):
        fixture = make_reference_fixture()
        fixture["claims"]["spectrum"].pop(0)
        validation = validate_finite_fixture(fixture)
        self.assertFalse(validation["pass"])
        self.assertFalse(validation["checks"]["characteristicPolynomialMatches"])
        self.assertFalse(validation["checks"]["spectrumAndMultiplicityMatchMatrix"])

    def test_wrong_multiplicity_fails_even_if_distinct_eigenvalue_list_looks_same(self):
        fixture = make_reference_fixture()
        fixture["claims"]["spectrum"][0]["multiplicity"] = 2
        validation = validate_finite_fixture(fixture)
        self.assertFalse(validation["pass"])
        self.assertFalse(validation["checks"]["spectrumAndMultiplicityMatchMatrix"])
        self.assertFalse(validation["checks"]["characteristicPolynomialMatches"])

    def test_negative_eigenvalue_cannot_be_labeled_positive(self):
        fixture = make_reference_fixture()
        fixture["matrix"][0][0] = "-1"
        fixture["claims"]["spectrum"][0]["value"] = "-1"
        validation = validate_finite_fixture(fixture)
        self.assertFalse(validation["pass"])
        self.assertFalse(validation["checks"]["strictPositivity"])
        self.assertTrue(validation["checks"]["spectrumAndMultiplicityMatchMatrix"])
        self.assertEqual(validation["actualMinimumEigenvalue"], "-1")

    def test_nondiagonal_or_singular_matrix_is_not_silently_diagonalized(self):
        for i, j, value in ((0, 1, "1"), (0, 0, "0")):
            fixture = make_reference_fixture()
            fixture["matrix"][i][j] = value
            validation = validate_finite_fixture(fixture)
            self.assertFalse(validation["pass"])
            self.assertFalse(validation["checks"]["referenceCompressionMatches"])
            self.assertFalse(validation["checks"]["invertible"])
            self.assertEqual(validation["determinantProbes"], [])

    def test_trace_and_determinant_reference_have_independent_explicit_tails(self):
        reference = self.audit["analyticReferenceChecks"]
        self.assertTrue(reference["traceInverseSquare"]["referenceContainedInTailBand"])
        self.assertEqual(reference["traceInverseSquare"]["tailInterval"], {"lower": "1/9", "upper": "1/8"})
        self.assertTrue(reference["det2"]["tailIndependentOfObservedGammaResidual"])
        for row in reference["det2"]["probes"]:
            self.assertTrue(row["referenceContainedInProductTailBand"])
            self.assertGreater(Fraction(row["omittedLogProductAbsoluteBound"]), 0)

    def test_product_tail_shrinks_as_actual_finite_compression_grows(self):
        small = audit_operator({"dimension": 2})
        large = audit_operator({"dimension": 16})
        for index in range(2):
            lower_n = Fraction(small["analyticReferenceChecks"]["det2"]["probes"][index]["omittedLogProductAbsoluteBound"])
            higher_n = Fraction(large["analyticReferenceChecks"]["det2"]["probes"][index]["omittedLogProductAbsoluteBound"])
            self.assertGreater(lower_n, higher_n)
        self.assertTrue(small["pass"] and large["pass"])

    def test_spectral_zeta_identity_has_a_computed_zero_spectrum_counterexample(self):
        witness = self.audit["analyticReferenceChecks"]["spectralZetaDoesNotDetermineNontrivialZeroSpectrum"]
        self.assertEqual(witness["witnessEigenvalue"], "2")
        self.assertTrue(witness["det2AtEigenvalue"]["exact"])
        self.assertEqual(balls.dyadic_to_fraction(witness["det2AtEigenvalue"]["width"]), 0)
        self.assertTrue(witness["xiExcludesZero"])
        self.assertTrue(witness["negativeControlPass"])
        self.assertFalse(witness["zetaAtTwo"]["containsZero"])

    def test_all_mutated_contract_controls_are_actually_rejected(self):
        controls = self.audit["negativeControls"]
        self.assertEqual(len(controls), 9)
        self.assertTrue(all(row["rejected"] and row["failedChecks"] for row in controls))
        normalization = next(row for row in controls if row["id"] == "altered-linear-normalization")
        self.assertTrue(normalization["normalizationDifferenceExcludesZero"])

    def test_unknown_candidate_is_open_with_every_bridge_unresolved(self):
        result = audit_operator({"candidate": "rh-research-open"})
        self.assertFalse(result["pass"])
        self.assertEqual(result["status"], "RESEARCH_OPEN")
        self.assertIsNone(result["candidateDefinition"]["operator"])
        self.assertEqual([row["id"] for row in result["unresolvedRHBridges"]], list(BRIDGE_IDS))
        self.assertTrue(all(row["status"] == "UNRESOLVED" and not row["proofExecuted"] for row in result["unresolvedRHBridges"]))

    def test_width_failure_does_not_promote_finite_reference(self):
        result = audit_operator({"precisionBits": 64, "tolerance": "1e-100"})
        self.assertTrue(result["finiteValidation"]["pass"])
        self.assertFalse(result["toleranceMet"])
        self.assertFalse(result["pass"])
        self.assertEqual(result["status"], "REFERENCE_CHECK_UNRESOLVED")

    def test_request_fixture_types_and_budgets_are_closed(self):
        for request in ({"dimension": True}, {"dimension": 1}, {"dimension": 33},
                        {"candidate": "invented"}, {"precisionBits": 63}, {"precisionBits": 4097},
                        {"tolerance": 0.01}, {"tolerance": "0"}, {"globalRHProved": True}):
            with self.subTest(request=request), self.assertRaises(ValueError):
                audit_operator(request)
        fixture = make_reference_fixture()
        fixture["matrix"][0][0] = 1.0
        with self.assertRaises(ValueError):
            validate_finite_fixture(fixture)
        fixture = make_reference_fixture()
        fixture["claims"]["spectrum"][0]["multiplicity"] = True
        with self.assertRaises(ValueError):
            validate_finite_fixture(fixture)

    def test_reference_never_promotes_to_rh_or_whole_p7(self):
        for field in ("finiteFixturesCanPromoteInfiniteClaims", "spectralZetaIdentityImpliesZeroSpectrum",
                      "referenceIsRiemannZeroOperator", "globalRHProved", "universalBSDProved",
                      "allP7CriteriaComplete", "formalKernelProof"):
            self.assertIs(self.audit["scope"][field], False)
        fixture = make_reference_fixture()
        fixture["claims"]["globalRHProved"] = True
        self.assertFalse(validate_finite_fixture(fixture)["pass"])


if __name__ == "__main__":
    unittest.main()
