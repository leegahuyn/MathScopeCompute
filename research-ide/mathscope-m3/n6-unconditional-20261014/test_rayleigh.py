"""Independent exact counterexamples and premise-sensitivity controls."""
from fractions import Fraction as Q
import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("rayleigh", Path(__file__).with_name("rayleigh.py"))
rayleigh = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(rayleigh)


class RayleighControls(unittest.TestCase):
    def test_exact_polynomial_has_three_expected_terms(self):
        result = rayleigh.exact_polynomial_lemma()
        # The independent expected coefficient vector detects sign, factor,
        # radial-gradient, and v_s normalization mistakes.
        self.assertEqual(result["expandedTerms"], [[[4, 1, 2], "2"], [[4, 2, 0], "-4"], [[4, 3, 0], "2"]])
        self.assertEqual(result["independentDifferenceTerms"], 0)
        self.assertFalse(result["globalSourcePremisesProved"])

    def test_positive_radial_shear_does_not_prove_rayleigh(self):
        self.assertEqual(rayleigh.rayleigh_value(1, -1, 0), -2)

    def test_strict_boundary_is_not_positive(self):
        self.assertEqual(rayleigh.rayleigh_value(1, -2, 0), 0)

    def test_loop_small_a_can_satisfy_strict_rayleigh(self):
        self.assertEqual(rayleigh.rayleigh_value(1, Q(-4, 5), 1), Q(8, 125))

    def test_radial_gradient_sign_error_is_rejected_by_polynomial(self):
        self.assertEqual(rayleigh.rayleigh_value(1, 3, 0), -90)

    def test_zero_field_has_no_strict_margin(self):
        self.assertEqual(rayleigh.rayleigh_value(0, -3, 1), 0)

    def test_exact_lower_bound(self):
        bound = rayleigh.finite_margin(Q(1, 3), Q(1, 5), Q(1, 7))
        self.assertEqual(bound, Q(2, 14175))
        # This positive exact tuple has v_s-2=1/10 and dominates all supplied
        # lower bounds. It is a finite control, never an actual source sample.
        self.assertGreaterEqual(rayleigh.rayleigh_value(1, Q(-5, 2), 0), rayleigh.finite_margin(1, 2, Q(1, 10)))

    def test_nonstrict_or_negative_inputs_rejected(self):
        for values in [(0, 1, 1), (1, 0, 1), (1, 1, 0), (1, 1, -1), (-1, 1, 1)]:
            with self.subTest(values=values), self.assertRaises(ValueError):
                rayleigh.finite_margin(*values)

    def test_finite_power_lemma_keeps_actual_application_open(self):
        result = rayleigh.power_margin_ledger()
        self.assertEqual(result["rows"][0]["lower"], "2*Renv^-70")
        self.assertTrue(all(result["checks"].values()))
        self.assertFalse(result["actualGlobalInputsIndependentlyProved"])

    def test_c12_finite_derivative_budget_and_global_premise_boundary(self):
        result = rayleigh.c12_robustness_lemma()
        self.assertEqual(result["derivativeBounds"]["DfourthGap"]["coefficientSum"], 208)
        self.assertTrue(all(result["checks"].values()))
        self.assertFalse(result["actualOriginalTupleAndPerturbationEnvelopeProvedHere"])
        self.assertTrue(result["coversAllPhasesWheneverInputsAreGlobal"])

    def test_c12_undersized_original_envelope_rejected(self):
        with self.assertRaises(ValueError):
            rayleigh.c12_robustness_lemma(256)

    def test_actual_parameter_hierarchy_reads_expressions_not_flags(self):
        result = rayleigh.actual_parameter_hierarchy()
        self.assertIn("N=1+ceil(Renv^50)>Renv^50", result["conclusions"])
        self.assertFalse(result["sourceAcceptedFlagsRead"])
        self.assertFalse(result["hugeExponentialNumericallyEvaluated"])
        self.assertFalse(result["actualWholeProfileEnvelopeOrRayleighCertified"])

    def test_heat_positive_lower_bound_and_real_slope(self):
        result = rayleigh.heat_kernel_lemma()
        self.assertEqual(result["finiteArithmetic"]["maxDeficit"], "101/20000")
        self.assertGreater(Q(result["finiteArithmetic"]["lowerH"]), Q(1, 2))
        self.assertLess(Q(result["finiteArithmetic"]["slopeCoefficient"]), 6)
        self.assertFalse(result["wholeOriginalLeadingFieldAndRayleighCertified"])

    def test_heat_endpoint_holomorphic_claim_has_exact_obstruction(self):
        result = rayleigh.heat_kernel_lemma()["analyticBoundaryObstruction"]
        h = Q(result["finiteControlCoefficients"]["h"])
        values = list(map(Q, result["finiteControlCoefficients"]["absCoefficients"]))
        for m in range(1, len(values) - 1):
            self.assertEqual(values[m + 1] / values[m], (h + m) * (1 + h + m) / (m + 1))
            self.assertGreater(values[m + 1] / values[m], m)
        self.assertTrue(result["oneSidedRealSmoothnessRetained"])
        self.assertFalse(result["finiteControlCoefficients"]["controlAloneUsedAsProof"])

    def test_negative_controls_preserve_scope(self):
        rows = rayleigh.negative_controls()
        self.assertEqual(len(rows), 9)
        self.assertEqual(sum(row.get("invalidPremiseRejected", False) for row in rows), 4)
        self.assertTrue(all(row.get("scope") == "EXACT_LEMMA_CONTROL_NOT_ACTUAL_PROFILE_POINT" for row in rows[:4]))

    def test_changed_or_missing_archive_cannot_supply_source_authority(self):
        with tempfile.TemporaryDirectory() as folder:
            dag = Path(folder) / "mean-proof-inputs-38500114302" / "dag"
            dag.mkdir(parents=True)
            (dag / "header.json").write_text('{"pass":true,"globalRayleighProved":true}', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Changed byte-pinned"):
                rayleigh.source_audit(folder)


if __name__ == "__main__":
    unittest.main()
