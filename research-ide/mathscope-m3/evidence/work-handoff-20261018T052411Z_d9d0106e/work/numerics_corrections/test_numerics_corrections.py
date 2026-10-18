import copy
from decimal import Decimal, localcontext
from fractions import Fraction as Q
import json
import os
from pathlib import Path
import tempfile
import unittest

from numerics_corrections import gaussian_E, gaussian_dE, log_interval, producer_losses, verify_gaussian_model, verify_recorded_losses
import verify_all_eight_items as v8


INPUTS = Path(os.environ.get("MATHSCOPE_NUMERICS_INPUTS", "../v5/02_eight_items_verifiers_and_evidence/inputs"))


class ExactNumericalCorrectionsTests(unittest.TestCase):
    def test_log_enclosure_against_separate_decimal_implementation(self):
        # A separate transcendental implementation checks 50 displayed digits;
        # rigor follows from the rational remainder in the production code.
        with localcontext() as ctx:
            ctx.prec = 110
            for x in (Q(1, 7), Q(1), Q(2), Q(172), Q(173), Q(180)):
                low, high = log_interval(x)
                value = (Decimal(x.numerator) / Decimal(x.denominator)).ln()
                self.assertLessEqual(Decimal(low.numerator) / Decimal(low.denominator), value)
                self.assertGreaterEqual(Decimal(high.numerator) / Decimal(high.denominator), value)

    def test_false_old_threshold_and_monotonicity_claims_rejected(self):
        self.assertGreater(gaussian_dE(Q(40))[0], 0)
        self.assertGreater(gaussian_E(Q(172))[0], -500)
        self.assertLess(gaussian_E(Q(173))[1], -500)
        self.assertGreater(gaussian_E(Q(180))[0], Q(-591))
        self.assertLess(gaussian_E(Q(180))[1], Q(-590))

    def test_model_does_not_claim_physical_tau_or_completeness(self):
        result = verify_gaussian_model()
        self.assertEqual(result["least_integer_ell_for_E_le_minus_500"], 173)
        self.assertFalse(result["actual_source_c_evaluated"])
        self.assertIsNone(result["last_resolved_physical_tau"])
        self.assertEqual(result["new_M3_completions"], 0)
        self.assertTrue(result["bands"]["300"]["exp_E_strictly_positive"])

    def test_saved_comparison_count_and_m_zero_are_exact(self):
        result = verify_recorded_losses(INPUTS)
        self.assertEqual(result["stage_order_combinations"], 63)
        self.assertEqual(result["discrepancy_records"], 126)
        self.assertEqual(result["stage_indices"], list(range(9)))
        self.assertEqual(result["orders"], list(range(7)))
        self.assertEqual(result["m_zero"]["ell_prime_m"], "1")
        self.assertEqual(result["difference_formulas"]["ell_m"], "0")
        self.assertFalse(result["actual_stage_fields_constructed"])

    def test_mutated_saved_loss_cannot_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ("stage_tail_connection.json", "STAGE_CYCLE_AND_TAIL_SCHEDULE.json"):
                (root / name).write_bytes((INPUTS / name).read_bytes())
            p = root / "stage_tail_connection.json"
            data = json.loads(p.read_text(encoding="utf-8-sig"))
            data["source_loss_bridge"]["acceptance_loss_discrepancies"][0]["producer_minus_acceptance"]["constant"] = "1/2"
            p.write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaises(ValueError):
                verify_recorded_losses(root)

    def test_duplicate_or_extra_discrepancy_cannot_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ("stage_tail_connection.json", "STAGE_CYCLE_AND_TAIL_SCHEDULE.json"):
                (root / name).write_bytes((INPUTS / name).read_bytes())
            p = root / "stage_tail_connection.json"
            data = json.loads(p.read_text(encoding="utf-8-sig"))
            rows = data["source_loss_bridge"]["acceptance_loss_discrepancies"]
            rows.append(copy.deepcopy(rows[0]))
            p.write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaises(ValueError):
                verify_recorded_losses(root)

    def test_paper_sufficient_ell_formula_includes_m_zero(self):
        for m in (0, 1, 2, 100):
            # 2A+(m+1)(1+3h/2), A=1/2+h: independent symbolic expansion.
            expected = Q(1) + (m + 1), Q(2) + Q(3, 2) * (m + 1)
            self.assertEqual(producer_losses(m)["ell_m"], expected)

    def test_successful_n7_model_samples_cannot_supply_whole_K_norms(self):
        result = v8.verify_n704_and_n705_terminal_jets_and_extension(INPUTS)
        jets, ext = result["n704_terminal_force_jets"], result["n705_extension_parameters"]
        self.assertTrue(ext["model_sample_scalar_conditions_hold"])
        self.assertIsNone(jets["f_j_norms_on_K"])
        self.assertIsNone(result["actual_Fj_CaK_norms"])
        self.assertFalse(jets["origin_flatness_verified"])
        self.assertFalse(jets["all_origin_derivatives_verified"])
        self.assertFalse(jets["cross_terms_included"])
        self.assertFalse(ext["all_b_j_conditions_hold"])
        self.assertFalse(ext["actual_integer_b_j_constructed"])
        self.assertFalse(result["mathematical_complete"])
        self.assertEqual(result["new_M3_completions"], 0)

    def test_model_tau_and_successful_sweeps_cannot_be_actual_tau(self):
        result = v8.verify_n706_and_n805_energy_and_adaptation(INPUTS)
        adapt = result["n805_four_axis_adaptation"]
        self.assertTrue(all(adapt["each_axis_monotone_decreasing"].values()))
        self.assertEqual(adapt["model_last_resolved_tau"], 1e-4)
        self.assertIsNone(adapt["last_resolved_tau"])
        self.assertIsNone(adapt["actual_last_resolved_tau"])
        self.assertIsNone(result["actual_last_resolved_tau"])
        self.assertIsNone(result["actual_whole_K_integrals"])
        self.assertFalse(result["actual_final_field_source_attached"])
        self.assertFalse(result["mathematical_complete"])
        self.assertEqual(result["new_M3_completions"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
