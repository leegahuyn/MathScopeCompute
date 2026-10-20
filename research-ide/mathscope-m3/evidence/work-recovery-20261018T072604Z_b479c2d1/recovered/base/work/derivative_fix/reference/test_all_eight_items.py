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
        self.assertTrue(res["convergence_and_order_improvement_preserved"])
        self.assertTrue(res["n608_shrinking_cutoff_verification"]["all_lemma_5_4_inequalities_hold"])
        self.assertTrue(res["n608_shrinking_cutoff_verification"]["a_j_dyadic_doubling_holds"])
        self.assertTrue(res["n608_shrinking_cutoff_verification"]["locally_finite_sum_verified"])

    def test_n704_and_n705_terminal_jets_and_extension_parameters(self) -> None:
        res = v8.verify_n704_and_n705_terminal_jets_and_extension(INPUTS_DIR)
        self.assertTrue(res["n704_terminal_force_jets"]["cross_terms_included"])
        self.assertTrue(res["n704_terminal_force_jets"]["origin_flatness_verified"])
        self.assertEqual(res["actual_recorded_integer_b_j_sequence"], [5, 11, 22, 43, 86, 172])
        self.assertTrue(res["n705_extension_parameters"]["all_b_j_conditions_hold"])
        self.assertTrue(res["n705_extension_parameters"]["force_extension_separated_from_velocity"])

    def test_n706_and_n805_zero_ic_energy_and_four_axis_adaptation(self) -> None:
        res = v8.verify_n706_and_n805_energy_and_adaptation(INPUTS_DIR)
        self.assertTrue(res["n706_global_energy_balance"]["all_runs_satisfy_zero_ic_and_10_14"])
        sweeps_ok = res["n805_four_axis_adaptation"]["each_axis_monotone_decreasing"]
        self.assertTrue(all(sweeps_ok.values()))
        self.assertEqual(res["n805_four_axis_adaptation"]["last_resolved_tau"], 1e-4)


if __name__ == "__main__":
    unittest.main(verbosity=2)
