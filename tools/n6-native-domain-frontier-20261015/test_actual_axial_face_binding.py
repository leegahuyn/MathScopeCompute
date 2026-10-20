"""Exact source and lexical-scope adverse controls; no analytic promotion."""
import contextlib
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest

import actual_axial_face_binding as a

HISTORICAL = (Path(__file__).resolve().parents[2]
    / "research-ide/mathscope-m3/evidence/n6-continuation-20261015"
    / "FIRST26_FRONTIER_RUN38734477166.json")


def background():
    historical = json.loads(HISTORICAL.read_text(encoding="utf-8"))
    # A unit fixture only. The production CLI separately compares live Source;
    # this fixture is never represented as complete archive authentication.
    return {"schema": "MathScope.N6.ActualBackground26JetRegularity/1",
            "sourceHeaderBinding": {"sourceHeaderRecordSHA256": a.HEADER_SHA256},
            "fixedDefinitionSHA256": a.FIXED_SHA256,
            "unprovedPrimitiveFrontier": historical["currentActualPrimitiveFrontier"]}


def source():
    return a.expected_nodes()


class ActualAxialFaceBindingControls(unittest.TestCase):
    def reject_changed_node(self, node, change):
        actual = source()
        change(actual[str(node)])
        with self.assertRaises(a.Gap):
            a.audit(background(), lambda i: actual[str(i)])

    def test_complete_historical_cone_and_actual_face_source_records_bind(self):
        actual = source()
        result = a.audit(background(), lambda i: actual[str(i)])
        self.assertEqual(result["schema"], a.SCHEMA)
        self.assertEqual(result["sourceConeNodeCount"], 83)
        self.assertEqual(result["sourceConeCanonicalSHA256"], a.CONE_SHA256)
        self.assertEqual(len(result["completeOriginalDerivativeCone"]), 83)
        self.assertEqual(len(result["faceAndEndpointSourceNodes"]), 121)
        self.assertEqual(result["selectedSourceNodes"], actual)
        self.assertEqual(result["sourceComparison"]["actualNodeCountCompared"], len(actual))
        self.assertTrue(result["sourceComparison"]["everySelectedNodeStructurallyEqual"])
        self.assertFalse(result["sourceComparison"]["fullSourceArchiveAuthenticatedByThisTool"])

    def test_every_selected_actual_operation_and_argument_is_pinned(self):
        for node in source():
            with self.subTest(node=node):
                self.reject_changed_node(node, lambda n: n["args"].append("unbound"))
                self.reject_changed_node(node, lambda n: n.update(op="unreviewed"))

    def test_every_actual_source_record_is_required(self):
        for key in source():
            with self.subTest(node=key):
                actual = source()
                del actual[key]
                with self.assertRaises((a.Gap, KeyError)):
                    a.audit(background(), lambda i: actual[str(i)])

    def test_native_registry_system_arguments_and_orders_are_exact(self):
        for node in [517218, 517221, 517227]:
            for position, value in [(0, 0), (1, [517017, 517175]), (2, [0, 0])]:
                with self.subTest(node=node, position=position):
                    self.reject_changed_node(node, lambda n, p=position, v=value:
                                             n["args"].__setitem__(p, v))

    def test_radial_integral_body_binder_and_oriented_bounds_cannot_change(self):
        for position, value in [(0, 517218), (1, 517017), (2, 0), (3, 28824)]:
            with self.subTest(position=position):
                self.reject_changed_node(517222, lambda n, p=position, v=value:
                                         n["args"].__setitem__(p, v))
        self.reject_changed_node(117055, lambda n: n.update(args=["physical_norm_face_7_2$28313"]))

    def test_original_cartesian_guard_all_six_operands_are_required(self):
        for position, value in enumerate([517015, 0, 28826, 1, 517218, 1]):
            with self.subTest(position=position):
                self.reject_changed_node(517234, lambda n, p=position, v=value:
                                         n["args"].__setitem__(p, v))

    def test_face_integral_binders_bodies_and_original_bounds_cannot_change(self):
        for node in [517238, 517239, 517240]:
            for position in range(4):
                with self.subTest(node=node, position=position):
                    self.reject_changed_node(node, lambda n, p=position:
                                             n["args"].__setitem__(p, 0))

    def test_face_interval_cannot_be_reversed_widened_or_eta_shifted(self):
        changes = [
            (517238, 2, 0), (517238, 3, 24),
            (517239, 2, 215514), (517239, 3, 346574),
            (517240, 2, 20), (517240, 3, 1),
        ]
        for node, position, value in changes:
            with self.subTest(node=node, position=position):
                self.reject_changed_node(node, lambda n, p=position, v=value:
                                         n["args"].__setitem__(p, v))

    def test_radius_is_the_actual_sqrt_two_Xb_not_Xplus_or_arbitrary_box(self):
        for node, position, value in [(137008, 1, 28824), (215514, 0, 28826),
                                      (346574, 1, 28826), (28826, 1, 3292)]:
            with self.subTest(node=node):
                self.reject_changed_node(node, lambda n, p=position, v=value:
                                         n["args"].__setitem__(p, v))

    def test_nested_endpoint_constant_integrals_keep_their_own_binders(self):
        for node in [275, 257, 249, 239, 229]:
            self.reject_changed_node(node, lambda n: n["args"].__setitem__(1, 517015))

    def test_exact_selector_ancestry_uses_actual_operands(self):
        actual = source()
        result = a.audit(background(), lambda i: actual[str(i)])
        path = result["actualSelectorAncestry"]["path"]
        self.assertEqual(path, [617466, 617465, 617444, 617443, 617442,
                                539400, 539399, 517247, 517240])
        for node, child in zip(path, path[1:]):
            self.assertIn(child, actual[str(node)]["args"])
            self.reject_changed_node(node, lambda n, v=child:
                                     n["args"].__setitem__(n["args"].index(v), 0))

    def test_cartesian_names_are_source_specific_and_cannot_alias_native_parameters(self):
        for node in [517015, 517016, 517017]:
            self.reject_changed_node(node, lambda n: n.update(args=["X"]))
        self.reject_changed_node(4756, lambda n: n.update(args=["physical_norm_face_7_0$28311"]))

    def test_json_bool_and_float_cannot_impersonate_source_integers(self):
        for value in [True, 1.0]:
            self.reject_changed_node(517221, lambda n, v=value: n["args"].__setitem__(0, v))
            self.reject_changed_node(517238, lambda n, v=value: n["args"].__setitem__(3, v))

    def test_wrong_header_fixed_definition_schema_or_scope_is_rejected(self):
        mutations = [lambda d: d.update(schema="other"),
                     lambda d: d.update(fixedDefinitionSHA256="0" * 64),
                     lambda d: d["sourceHeaderBinding"].update(sourceHeaderRecordSHA256="0" * 64),
                     lambda d: d["unprovedPrimitiveFrontier"].update(scopedCoordinates=[117055, 517016, 517017])]
        actual = source()
        for change in mutations:
            changed = background();change(changed)
            with self.assertRaises(a.Gap):
                a.audit(changed, lambda i: actual[str(i)])

    def test_changed_background_cone_and_guard_summary_cannot_hide_behind_live_source(self):
        actual = source()
        for change in [lambda f: f["sourceNode"]["args"].__setitem__(2, 28826),
                       lambda f: f["smallOriginalPrimitiveCone"]["517221"]["args"].__setitem__(0, 0)]:
            changed = background();change(changed["unprovedPrimitiveFrontier"])
            with self.assertRaises(a.Gap):
                a.audit(changed, lambda i: actual[str(i)])

    def test_input_flags_and_pass_only_source_labels_grant_no_analytic_authority(self):
        changed = background()
        changed.update(actualFaceFinitenessProvedHere=True, wholeGOnJProved=True)
        changed["unprovedPrimitiveFrontier"].update(coneIsNotAProof=False,
                                                   finiteOrPositiveValueAssumed=True)
        actual = source()
        result = a.audit(changed, lambda i: actual[str(i)])
        self.assertFalse(result["actualFaceFinitenessProvedHere"])
        self.assertFalse(result["wholeGOnJProved"])
        with self.assertRaises(a.Gap):
            a.audit(changed, lambda i: {"pass": True})

    def test_live_source_getter_is_mandatory(self):
        with self.assertRaises(a.Gap):
            a.audit(background(), None)

    def test_lexical_scopes_bind_only_bodies_and_preserve_outer_coordinate_meaning(self):
        actual = source()
        result = a.audit(background(), lambda i: actual[str(i)])
        rows = result["actualFaceIntegrals"]
        self.assertEqual([r["node"] for r in rows], [517240, 517239, 517238, 517222])
        for row in rows:
            self.assertEqual(row["bodyScope"], row["endpointScope"] + [row["binder"]])
        self.assertEqual(rows[-1]["endpointScope"], [517015, 517016, 517017])
        calls = result["actualNative1Calls"]
        self.assertEqual(calls[1]["arguments"], [117055, 517017])
        self.assertEqual(calls[1]["lexicalScope"], rows[-1]["bodyScope"])

    def test_receipt_copies_cannot_change_later_source_binding(self):
        actual = source()
        first = a.audit(background(), lambda i: actual[str(i)])
        first["selectedSourceNodes"]["517221"]["args"][0] = 0
        first["completeOriginalDerivativeCone"]["517234"]["args"][2] = 0
        first["actualFaceIntegrals"][0]["bounds"][0] = 0
        first["actualSelectorAncestry"]["path"][0] = 0
        again = a.audit(background(), lambda i: actual[str(i)])
        self.assertEqual(again["selectedSourceNodes"]["517221"]["args"][0], 1)
        self.assertEqual(again["completeOriginalDerivativeCone"]["517234"]["args"][2], 28824)
        self.assertEqual(again["actualFaceIntegrals"][0]["bounds"][0], 346574)
        self.assertEqual(again["actualSelectorAncestry"]["path"][0], 617466)

    def test_internal_extra_pin_mutation_is_rejected_and_restored(self):
        old = copy.deepcopy(a.EXPECTED_EXTRA_NODES["517238"])
        try:
            a.EXPECTED_EXTRA_NODES["517238"]["args"][1] = 117055
            with self.assertRaises(a.Gap):
                a.expected_nodes()
        finally:
            a.EXPECTED_EXTRA_NODES["517238"] = old
        self.assertEqual(a.expected_nodes()["517238"], old)

    def test_native1_wrapper_association_is_deferred_to_the_actual_density_receipt(self):
        actual = source();result = a.audit(background(), lambda i: actual[str(i)])
        ref = result["native1DefinitionReference"]
        self.assertEqual(ref["registry"], "expression:1")
        self.assertEqual(ref["body"], 117047)
        self.assertTrue(ref["definitionAssociationRequiresAcceptedDensityReceipt"])
        self.assertFalse(ref["finiteOrdinaryNativeValuesProvedHere"])
        self.reject_changed_node(117047, lambda n: n["args"].__setitem__(4, 0))

    def test_source_binding_proves_no_finite_face_continuity_moment_or_original_row(self):
        actual = source();result = a.audit(background(), lambda i: actual[str(i)])
        for key in ["actualFaceFinitenessProvedHere", "actualNativeDerivativeExistenceProvedHere",
                    "actualAnalyticCompositionApplied", "actualFaceContinuityProvedHere",
                    "actualStressPrimitiveJoinsProvedHere", "actualTotalAxialMomentZeroProvedHere",
                    "numericalNormHonestyProvedHere", "originalBackground26ClosureProved", "wholeGOnJProved"]:
            self.assertIs(result[key], False, key)
        for key in ["newOriginalGuardsDischarged", "newOriginalJetsDischarged", "newOriginalPDETermsDischarged"]:
            self.assertEqual(result[key], 0, key)
        self.assertIn("bounded piecewise integrable", result["minimalUnprovedFiniteFacePremise"][-1])

    def test_cli_rejects_unknown_proof_switches(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            a.main(["--background", "b", "--source-db", "s", "--stage3", "p", "--out", "o",
                    "--assert-finite", "true"])

    def test_cli_prevents_literal_and_hardlink_input_overwrite_before_loading(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            inputs = [base / name for name in ["background.json", "source.sqlite", "stage3.py"]]
            for path in inputs:
                path.write_bytes(b"disposable original")
            arguments = ["--background", str(inputs[0]), "--source-db", str(inputs[1]),
                         "--stage3", str(inputs[2])]
            for path in inputs:
                with self.assertRaises(a.Gap):
                    a.main(arguments + ["--out", str(path)])
            alias = base / "output-hardlink.json";alias.hardlink_to(inputs[0])
            with self.assertRaises(a.Gap):
                a.main(arguments + ["--out", str(alias)])
            self.assertEqual(inputs[0].read_bytes(), b"disposable original")

    def test_cli_cannot_use_a_forged_inherited_parser(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder);bg = base / "background.json";db = base / "source.sqlite";parser = base / "stage3.py"
            bg.write_text(json.dumps(background()), encoding="utf-8")
            db.write_bytes(b"disposable");parser.write_text("pass\n", encoding="utf-8")
            with self.assertRaises(a.Gap):
                a.main(["--background", str(bg), "--source-db", str(db), "--stage3", str(parser),
                        "--out", str(base / "out.json")])
            self.assertFalse((base / "out.json").exists())


if __name__ == "__main__":
    unittest.main()
