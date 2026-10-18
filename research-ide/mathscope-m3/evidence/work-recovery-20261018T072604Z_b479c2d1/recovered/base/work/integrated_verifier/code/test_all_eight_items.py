#!/usr/bin/env python3
"""Self-contained unit and negative-control tests for verify_all_eight_items.py (relative paths only)."""

from __future__ import annotations

from fractions import Fraction
from pathlib import Path
import unittest

import verify_all_eight_items as v8

HERE = Path(__file__).resolve().parent
S2_ROOT = HERE.parent
INPUTS_DIR = S2_ROOT / "inputs"


class AllEightItemsTests(unittest.TestCase):
    def test_no_hardcoded_container_paths_in_code(self) -> None:
        for py_file in (HERE / "verify_all_eight_items.py", HERE / "test_all_eight_items.py"):
            txt = py_file.read_text(encoding="utf-8")
            self.assertNotIn("/" + "working_dir/", txt)
            self.assertNotIn("/" + "tmp/", txt)

    def test_n601_cutoff_identity_gaussian_tail_and_recovered_parent_nodes(self) -> None:
        res = v8.verify_n601_identities_and_bindings(INPUTS_DIR)
        self.assertTrue(res["identity_740_exact"])
        tail = res["gaussian_tail_decay"]
        self.assertAlmostEqual(tail["stationary_point_ell_crit"], 56.5135, places=3)
        self.assertEqual(tail["exact_threshold_ell_for_minus_500"], 173)
        self.assertTrue(tail["supercritical_monotone_decreasing"])
        self.assertTrue(tail["threshold_minus_500_satisfied_on_valid_regime"])
        self.assertLess(tail["bands"]["180"]["log_bound"], -500.0)
        self.assertTrue(tail["strictly_decreasing_for_large_l"])
        self.assertTrue(tail["universal_C_N_bound_holds_for_all_ell_ge_1"])
        self.assertTrue(tail["gaussian_source_dag_nodes_617317_300173_verified"])
        self.assertEqual(res["actual_source_nodes_total"], 155)
        self.assertEqual(res["recovered_parent_nodes_total"], 285)
        self.assertEqual(res["native_field_row_counts"], [162, 162, 162])
        self.assertTrue(res["coupled_and_whole_residual_roots_verified"])
        self.assertFalse(res["unconditional_global_wave_certificate"])
        self.assertEqual(len(res["undischarged_premises_in_current_wave_application"]), 4)

    def test_n602_full_residual_and_negative_controls(self) -> None:
        res = v8.verify_n602_full_residual_substeps(inputs_dir=INPUTS_DIR, nu=Fraction(1, 1))
        self.assertTrue(res["all_substeps_exact"])
        self.assertEqual(res["active_substep_count"], 4)
        self.assertTrue(res["negative_controls"]["all_negative_controls_detected"])
        self.assertIn("VERIFIER_TEST_ON_MODEL_JETS", res["verifier_test_label"])
        with self.assertRaises(ValueError):
            v8.verify_n602_full_residual_substeps(inputs_dir=INPUTS_DIR, nu=Fraction(0, 1))

    def test_n607_and_n608_126_discrepancies_and_cutoff_schedule(self) -> None:
        res = v8.verify_n607_and_n608_losses_and_summation(INPUTS_DIR)
        self.assertEqual(res["discrepancy_pairs_count"], 126)
        self.assertTrue(res["loss_differences_independent_of_j"])
        self.assertFalse(res["convergence_and_order_improvement_preserved"])
        self.assertTrue(res["conditional_exponent_gain_preserved"])
        self.assertEqual(res["recorded_loss_audit"]["stage_order_combinations"], 63)
        self.assertFalse(res["n608_shrinking_cutoff_verification"]["all_lemma_5_4_inequalities_hold"])
        self.assertTrue(res["n608_shrinking_cutoff_verification"]["model_sample_inequalities_hold"])
        self.assertIsNone(res["n608_shrinking_cutoff_verification"]["actual_tail_bound"])
        self.assertTrue(res["n608_shrinking_cutoff_verification"]["a_j_dyadic_doubling_holds"])
        self.assertFalse(res["n608_shrinking_cutoff_verification"]["locally_finite_sum_verified"])

    def test_n704_and_n705_terminal_jets_and_extension_parameters(self) -> None:
        res = v8.verify_n704_and_n705_terminal_jets_and_extension(INPUTS_DIR)
        self.assertFalse(res["n704_terminal_force_jets"]["cross_terms_included"])
        self.assertFalse(res["n704_terminal_force_jets"]["origin_flatness_verified"])
        self.assertIsNone(res["actual_recorded_integer_b_j_sequence"])
        self.assertEqual(res["historical_v5_hardcoded_b_j_sequence"], [5, 11, 22, 43, 86, 172])
        self.assertFalse(res["n705_extension_parameters"]["all_b_j_conditions_hold"])
        self.assertTrue(res["n705_extension_parameters"]["model_sample_scalar_conditions_hold"])
        self.assertTrue(res["n705_extension_parameters"]["force_extension_separated_from_velocity"])

    def test_n706_and_n805_zero_ic_energy_and_four_axis_adaptation(self) -> None:
        res = v8.verify_n706_and_n805_energy_and_adaptation(INPUTS_DIR)
        self.assertTrue(res["n706_global_energy_balance"]["all_runs_satisfy_zero_ic_and_10_14"])
        sweeps_ok = res["n805_four_axis_adaptation"]["each_axis_monotone_decreasing"]
        self.assertTrue(all(sweeps_ok.values()))
        self.assertIsNone(res["n805_four_axis_adaptation"]["last_resolved_tau"])
        self.assertEqual(res["n805_four_axis_adaptation"]["model_last_resolved_tau"], 1e-4)

    def test_n706_model_energy_balance_defect_converges_to_zero(self) -> None:
        """Check the energy identity itself, independently of inequality (10.14)."""
        res = v8.verify_n706_and_n805_energy_and_adaptation(INPUTS_DIR)
        runs = res["n706_global_energy_balance"]["refinement_runs"]
        normalized_by_n_t = {}
        for run in runs:
            # a(1)=1, so 2*E_final is the spatial norm multiplier. Removing it
            # isolates temporal integration error despite changes in n_x.
            normalized = run["energy_balance_defect"] / (2.0 * run["E_final"])
            n_t = run["n_t"]
            # The exact identity is integral(a*a')=1/2. Composite midpoint
            # quadrature has error <= 4/n_t**2 for this polynomial; see
            # PROOF_SCOPE.md for the bound. A wrong derivative leaves an O(1)
            # normalized defect and must not pass via inequality (10.14).
            self.assertLessEqual(normalized, 4.0 / (n_t * n_t))
            normalized_by_n_t[n_t] = normalized
        self.assertEqual(sorted(normalized_by_n_t), [64, 128, 256])
        for coarse, fine in ((64, 128), (128, 256)):
            ratio = normalized_by_n_t[coarse] / normalized_by_n_t[fine]
            self.assertGreater(ratio, 3.9)
            self.assertLess(ratio, 4.1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
