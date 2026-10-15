"""Adverse controls for the source-bound axial interior algebra audit.

The checked historical cone is the fixture, not a regularity certificate.
"""
import contextlib
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest

import actual_axial_stress_derivative as a


HISTORICAL = (Path(__file__).resolve().parents[2]
    / "research-ide/mathscope-m3/evidence/n6-continuation-20261015"
    / "FIRST26_FRONTIER_RUN38734477166.json")


def historical():
    return json.loads(HISTORICAL.read_text(encoding="utf-8"))


def frontier():
    return copy.deepcopy(historical()["currentActualPrimitiveFrontier"])


class ActualAxialStressAlgebraControls(unittest.TestCase):
    def assert_gap(self, changed):
        with self.assertRaises(a.Gap):
            a.audit(changed)

    def test_checked_historical_full_cone_and_two_exact_comparisons(self):
        original = frontier()
        cone = a.validate_cone(original)
        self.assertEqual(len(cone), 83)
        self.assertEqual(a.cone_sha256(cone), a.CONE_SHA256)
        self.assertEqual(a.canonical(cone), a.canonical(a.EXPECTED_CONE))
        result = a.audit(original)
        exact = result["exactAlgebra"]
        self.assertEqual(exact["sourceExpansionMinusExpected"], "0")
        self.assertEqual(exact["independentCartesianChainMinusExpected"], "0")
        self.assertEqual(exact["wrongCoefficientAndOmittedTermControlsRejected"], 3)
        self.assertEqual(exact["actualGuard"]["args"],
                         [517175, 28814, 28824, 0, 517233, 0])
        self.assertEqual(result["sourceConeNodeCount"], 83)
        self.assertFalse(result["numericalEvidenceUsed"])

    def test_every_actual_node_is_structurally_pinned(self):
        for node_id in a.EXPECTED_CONE:
            with self.subTest(node=node_id):
                changed = frontier()
                changed["smallOriginalPrimitiveCone"][node_id]["args"].append(
                    "unexpected argument")
                self.assert_gap(changed)

    def test_every_actual_operation_is_pinned(self):
        for node_id in a.EXPECTED_CONE:
            with self.subTest(node=node_id):
                changed = frontier()
                changed["smallOriginalPrimitiveCone"][node_id]["op"] = "opaque"
                self.assert_gap(changed)

    def test_every_actual_node_is_required(self):
        for node_id in a.EXPECTED_CONE:
            with self.subTest(node=node_id):
                changed = frontier()
                del changed["smallOriginalPrimitiveCone"][node_id]
                self.assert_gap(changed)

    def test_added_unrelated_node_is_rejected(self):
        changed = frontier()
        changed["smallOriginalPrimitiveCone"]["999999"] = {
            "op": "rational", "args": ["1", "1"]}
        self.assert_gap(changed)

    def test_false_complete_flag_cannot_hide_missing_source(self):
        changed = frontier()
        changed["coneComplete"] = True
        del changed["smallOriginalPrimitiveCone"]["517221"]
        self.assert_gap(changed)

    def test_diagnostic_labels_do_not_supply_algebra_or_proof(self):
        changed = frontier()
        changed["coneComplete"] = False
        changed["coneIsNotAProof"] = False
        changed["allAnalyticHypothesesProved"] = True
        changed["originalBackground26ClosureProved"] = True
        result = a.audit(changed)
        self.assertFalse(result["originalBackground26ClosureProved"])
        self.assertFalse(result["actualNativeDerivativeExistenceProved"])
        self.assertFalse(result["actualStressPrimitiveJoinsProved"])

    def test_original_guard_branch_and_cartesian_arguments_rejected_if_mutated(self):
        for position, value in [(0, 517015), (1, 28824), (2, 28814),
                                (3, 1), (4, 517218), (5, 1)]:
            with self.subTest(position=position):
                changed = frontier()
                changed["smallOriginalPrimitiveCone"]["517234"]["args"][
                    position] = value
                self.assert_gap(changed)

    def test_mutated_guard_summary_rejected_even_if_cone_unchanged(self):
        changed = frontier()
        changed["sourceNode"]["args"][3] = 1
        self.assert_gap(changed)
        changed = frontier()
        changed["sourceNode"]["args"][3] = False
        self.assert_gap(changed)

    def test_actual_binder_and_scope_are_required(self):
        for position, value in [(0, 517218), (1, 517175), (2, 0),
                                (3, 28824)]:
            with self.subTest(position=position):
                changed = frontier()
                changed["smallOriginalPrimitiveCone"]["517222"]["args"][
                    position] = value
                self.assert_gap(changed)

    def test_binder_coordinate_name_is_pinned(self):
        changed = frontier()
        changed["smallOriginalPrimitiveCone"]["117055"]["args"] = [
            "actual_n1_Ttheta_forward"]
        self.assert_gap(changed)

    def test_native_registry_arguments_and_orders_are_pinned(self):
        for node_id in ["517227", "517218", "517221"]:
            for position, value in [(0, 0), (1, [517017, 517175]),
                                    (2, [0, 0])]:
                with self.subTest(node=node_id, position=position):
                    changed = frontier()
                    changed["smallOriginalPrimitiveCone"][node_id]["args"][
                        position] = value
                    self.assert_gap(changed)

    def test_json_bool_and_float_do_not_impersonate_source_integers(self):
        for replacement in [True, 1.0]:
            changed = frontier()
            changed["smallOriginalPrimitiveCone"]["517221"]["args"][0] = replacement
            self.assert_gap(changed)

    def test_guard_endpoint_parameter_and_coefficient_mutations_are_rejected(self):
        for node_id, args in [("3617", ["XR"]), ("3612", ["T"]),
                              ("28811", ["1", "127"]), ("101", ["12", "1"]),
                              ("83", ["61", "1"]), ("8", ["h"])]:
            with self.subTest(node=node_id):
                changed = frontier()
                changed["smallOriginalPrimitiveCone"][node_id]["args"] = args
                self.assert_gap(changed)

    def test_source_expansion_independently_rejects_wrong_coefficient(self):
        changed = copy.deepcopy(a.EXPECTED_CONE)
        changed["20"]["args"] = ["1", "1"]
        with self.assertRaises(a.Gap):
            a.exact_algebra(changed)

    def test_source_integral_recognition_independently_rejects_wrong_native_jet(self):
        changed = copy.deepcopy(a.EXPECTED_CONE)
        changed["517221"]["args"][2] = [1, 1]
        with self.assertRaises(a.Gap):
            a.exact_algebra(changed)

    def test_live_source_compares_all83_even_guard_ancestors(self):
        compared = []
        def get(node_id):
            compared.append(node_id)
            return a.EXPECTED_CONE[str(node_id)]
        result = a.audit(frontier(), get)
        self.assertEqual(set(compared), {int(i) for i in a.EXPECTED_CONE})
        self.assertEqual(len(compared), 83)
        self.assertEqual(result["liveSourceComparison"]["actualNodeCountCompared"], 83)
        self.assertFalse(result["liveSourceComparison"][
            "fullSourceArchiveAuthenticatedByThisTool"])

    def test_each_live_source_node_mismatch_is_rejected(self):
        for bad_id in a.EXPECTED_CONE:
            with self.subTest(node=bad_id):
                def get(node_id):
                    node = copy.deepcopy(a.EXPECTED_CONE[str(node_id)])
                    if str(node_id) == bad_id:
                        node["args"].append("changed")
                    return node
                with self.assertRaises(a.Gap):
                    a.compare_source_nodes(a.EXPECTED_CONE, get)

    def test_no_original_obligation_or_analytic_fact_is_discharged(self):
        result = a.audit(frontier())
        for name in ["actualNativeDerivativeExistenceProved",
                     "actualIntegralFinitenessProved", "actualDensityJoinsProved",
                     "actualStressPrimitiveJoinsProved",
                     "smoothPiecewiseRegularityProved",
                     "originalBackground26ClosureProved",
                     "sourceDefinitionsConstantsQuantifiersAndOrderedDerivativesChanged"]:
            self.assertIs(result[name], False)
        for name in ["newOriginalGuardsDischarged", "newOriginalJetsDischarged",
                     "newOriginalPDETermsDischarged"]:
            self.assertEqual(result[name], 0)
        self.assertEqual(len(result[
            "unprovedAnalyticHypothesesForPrimitiveInterpretation"]), 4)
        self.assertEqual(len(result[
            "unprovedAdditionalStressGluingRequirements"]), 3)

    def test_fresh_background_frontier_uses_actual_field(self):
        fresh = {"unprovedPrimitiveFrontier": frontier()}
        self.assertEqual(a.validate_cone(a.extract_frontier(fresh, "background")),
                         a.EXPECTED_CONE)
        with self.assertRaises(a.Gap):
            a.extract_frontier({"allPassed": True}, "background")
        with self.assertRaises(a.Gap):
            a.validate_cone(None)


class AxialCLIControls(unittest.TestCase):
    def run_main(self, argv):
        with contextlib.redirect_stdout(io.StringIO()):
            a.main(argv)

    def test_historical_cli_and_fresh_cli_write_scoped_result(self):
        for mode in ["frontier", "background", "both"]:
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as raw:
                folder = Path(raw)
                out = folder / "audit.json"
                fresh = folder / "ACTUAL_BACKGROUND_26_JET_REGULARITY.json"
                fresh.write_text(json.dumps({
                    "unprovedPrimitiveFrontier": frontier()}), encoding="utf-8")
                argv = ["--out", str(out)]
                if mode in ["frontier", "both"]:
                    argv.extend(["--frontier", str(HISTORICAL)])
                if mode in ["background", "both"]:
                    argv.extend(["--background", str(fresh)])
                before = HISTORICAL.read_bytes()
                self.run_main(argv)
                result = json.loads(out.read_text(encoding="utf-8"))
                self.assertEqual(result["sourceConeCanonicalSHA256"], a.CONE_SHA256)
                self.assertEqual(result["newOriginalJetsDischarged"], 0)
                self.assertEqual(len(result["inputBindings"]), 2 if mode == "both" else 1)
                self.assertEqual(HISTORICAL.read_bytes(), before)

    def test_cannot_overwrite_original_input(self):
        with self.assertRaises(a.Gap):
            self.run_main(["--frontier", str(HISTORICAL),
                           "--out", str(HISTORICAL)])

    def test_source_parser_and_database_are_required_together(self):
        for flag in ["--source-db", "--stage3"]:
            with self.subTest(flag=flag), self.assertRaises(a.Gap):
                self.run_main(["--frontier", str(HISTORICAL),
                               flag, "missing", "--out", "unused.json"])

    def test_no_input_is_rejected(self):
        with self.assertRaises(a.Gap):
            self.run_main(["--out", "unused.json"])

    def test_proof_assertion_switches_are_not_accepted(self):
        for flag in ["--assume-native-cinfinity", "--proof", "--assert-closed",
                     "--allow-changed-cone"]:
            with self.subTest(flag=flag), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as caught:
                    self.run_main(["--frontier", str(HISTORICAL),
                                   "--out", "unused.json", flag])
                self.assertEqual(caught.exception.code, 2)

    def test_stage3_parser_pin_prevents_execution_of_changed_parser(self):
        with tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            db, parser = folder / "source.sqlite", folder / "stage3.py"
            db.write_bytes(b"not used")
            parser.write_text("raise RuntimeError('must not execute')", encoding="utf-8")
            with self.assertRaises(a.Gap):
                a.load_live_source(db, parser)


if __name__ == "__main__":
    unittest.main()

