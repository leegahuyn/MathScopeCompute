"""Exact small controls, including varying-selector and integral mutations."""
import copy
from fractions import Fraction as Q
import unittest

from jet_solve import DirectionalSourceCalculus, FormulaArena, formula_semantic_hash, new_request_row
from jet_worker import js_hash
from acceptance import REQUEST_BINDING_FIELDS, verify_request_binding


def bound(key, definition):
    return {"key": key, "definition": definition, "definitionSHA256": js_hash(definition)}


def fixture():
    source = {
        0: {"op": "rational", "args": ["0", "1"]},
        1: {"op": "rational", "args": ["1", "1"]},
        2: {"op": "coordinate", "args": ["theta"]},
        3: {"op": "coordinate", "args": ["slow"]},
        4: {"op": "coordinate", "args": ["selector"]},
        5: {"op": "cosine", "args": [2]},
        6: {"op": "multiply", "args": [3, 5]},
        7: {"op": "rational", "args": ["-1", "1"]},
        8: {"op": "rational", "args": ["2", "1"]},
        9: {"op": "m3_aux_indexed_partial", "args": [0, [2, 3, 4], [0]]},
    }
    local = {"parameters": [2, 3], "body": 6, "derivativeLimits": [8, 8]}
    row = {"localSystem": -1, "localBody": 6, "localParameters": [2, 3], "values": [2, 3],
           "derivativeMaps": [[{"parameter": 0, "coefficient": 1}]],
           "coefficient": 1, "guards": [[4, 7, 8]], "label": {"row": 0}}
    field = {"parameters": [2, 3, 4], "directions": [2], "rows": [row]}
    definitions = {"expressionDefinitions:0": bound("expressionDefinitions:0", local), "fieldDefinitions:0": bound("fieldDefinitions:0", field)}
    calc = DirectionalSourceCalculus(source, definitions)
    calc.theta_source_coordinate = 2;calc.allow_synthetic_cover = True
    calc.step_all_order_lemma = {"syntheticProofFixture": True}
    return calc


class SolveTests(unittest.TestCase):
    def test_request_row_serializes_strict_source_binding(self):
        original = dict.fromkeys(REQUEST_BINDING_FIELDS, None)
        original.update(result=12, baseSourceNode=9, actualSourceNode={"op": "coordinate", "args": ["theta"]},
                        orderedDifferentiationCoordinates=[0], minimalObligation={"reason": "historical stop"})
        program = [{"op": "coordinate", "args": ["theta", 2]}]
        row = new_request_row(original, program)
        self.assertTrue(verify_request_binding(original, row, program))
        self.assertEqual(row["originalSourceNodeSHA256"], js_hash(original["actualSourceNode"]))
        self.assertFalse(row["derivativeComputed"])
        row["originalRequest"]["minimalObligation"]["reason"] = "mutation"
        self.assertEqual(original["minimalObligation"]["reason"], "historical stop")
        with self.assertRaisesRegex(ValueError, "Preserved complete"):
            verify_request_binding(original, row, program)

    def test_complete_fixed_selector_theta_derivative_has_no_join_premise(self):
        calc = fixture()
        root = calc.d(calc.ref(9), 2)
        self.assertFalse(calc.reachable(root)["stops"])
        self.assertTrue(calc.selector_certificates)
        self.assertTrue(calc.theta_identities)
        self.assertTrue(all(not x["slowLabelOrTorusCopyJoinsAssumed"] for x in calc.theta_identities.values()))

    def test_second_theta_derivative_is_independently_computed(self):
        calc = fixture();first = calc.d(calc.ref(9), 2);second = calc.d(first, 2)
        self.assertFalse(calc.reachable(second)["stops"])
        self.assertNotEqual(first, second)

    def test_stored_theta_partial_before_argument_application(self):
        calc = fixture()
        calc.source[9]["args"][2] = [1]
        result = calc.indexed_theta_identity(9, theta=2)
        self.assertTrue(result["provedOnOriginalLeafDefinedDomain"])
        self.assertEqual(result["orders"], [1])
        self.assertTrue(result["storedPartialsTakenBeforeCompleteSimultaneousApplication"])

    def test_varying_theta_guard_rejected_instead_of_frozen(self):
        calc = fixture();calc.defs["fieldDefinitions:0"]["definition"]["rows"][0]["guards"][0][0] = 2
        with self.assertRaisesRegex(ValueError, "selector changes"):
            calc.indexed_theta_identity(9, theta=2)

    def test_changed_declared_theta_jacobian_rejected(self):
        calc = fixture();calc.defs["fieldDefinitions:0"]["definition"]["rows"][0]["derivativeMaps"][0][0]["coefficient"] = 8
        with self.assertRaisesRegex(ValueError, "Jacobian"):
            calc.indexed_theta_identity(9, theta=2)

    def test_nonangle_local_argument_cannot_vary_in_theta(self):
        calc = fixture();calc.defs["fieldDefinitions:0"]["definition"]["rows"][0]["values"][1] = 2
        with self.assertRaisesRegex(ValueError, "non-angle local argument"):
            calc.indexed_theta_identity(9, theta=2)

    def test_fixed_selector_rule_does_not_claim_other_direction_join(self):
        calc = fixture();first = calc.d(calc.ref(9), 2);changing = calc.d(first, 4)
        self.assertTrue(calc.reachable(changing)["stops"])

    def test_unknown_earlier_derivative_is_not_erased(self):
        calc = fixture();stop = calc.stop(calc.ref(3), 3, "unproved varying source derivative")
        later = calc.d(stop, 2)
        self.assertTrue(calc.reachable(later)["stops"])
        self.assertNotEqual(later, calc.zero)

    def test_compact_polynomial_integral_leibniz_is_proved(self):
        calc = fixture();x = calc.put("coordinate", ["parameter", 10]);t = calc.put("coordinate", ["binder", 11])
        body = calc.mul(x, calc.pow(t, 2));integral = calc.put("definite_integral", [body, 11, calc.zero, calc.one])
        result = calc.d(integral, 10)
        self.assertFalse(calc.reachable(result)["stops"])
        self.assertTrue(calc.leibniz_certificates[-1]["proved"])

    def test_moving_endpoint_terms_are_retained(self):
        calc = fixture();x = calc.put("coordinate", ["parameter", 10]);t = calc.put("coordinate", ["binder", 11])
        integral = calc.put("definite_integral", [calc.pow(t, 2), 11, calc.zero, x]);result = calc.d(integral, 10)
        self.assertFalse(calc.reachable(result)["stops"])
        self.assertNotEqual(result, calc.zero)

    def test_binder_dependent_unproved_pole_blocks_leibniz(self):
        calc = fixture();x = calc.put("coordinate", ["parameter", 10]);t = calc.put("coordinate", ["binder", 11])
        body = calc.put("inverse", [calc.add(t, calc.neg(x))]);integral = calc.put("definite_integral", [body, 11, calc.zero, calc.one])
        result = calc.d(integral, 10)
        self.assertTrue(calc.reachable(result)["stops"])
        self.assertFalse(calc.leibniz_certificates[-1]["proved"])

    def test_capture_free_integral_substitution_alpha_renames(self):
        calc = fixture();x = calc.put("coordinate", ["x", 10]);t = calc.put("coordinate", ["t", 11])
        integral = calc.put("definite_integral", [calc.add(x, t), 11, calc.zero, calc.one])
        moved = calc.substitute(integral, {10: t});n = calc.nodes[moved]
        self.assertEqual(n["op"], "definite_integral")
        self.assertLess(n["args"][1], 0)
        support, unknown = calc.expression_support(moved)
        self.assertFalse(unknown);self.assertIn(11, support)
        self.assertNotIn(n["args"][1], support)

    def test_delayed_source_integral_argument_is_not_captured(self):
        calc = fixture()
        calc.source.update({10: {"op": "coordinate", "args": ["formal"]},
                            11: {"op": "coordinate", "args": ["original-binder"]},
                            12: {"op": "add", "args": [10, 11]},
                            13: {"op": "definite_integral", "args": [12, 11, 0, 1]}})
        free_old_binder = calc.ref(11)
        expanded = calc.expand(13, ((10, free_old_binder),))
        node = calc.nodes[expanded]
        self.assertEqual(node["op"], "definite_integral")
        self.assertLess(node["args"][1], 0)
        self.assertTrue(calc.source_integral_renamings)
        support, unknown = calc.expression_support(expanded)
        self.assertFalse(unknown);self.assertIn(11, support)
        derivative = calc.d(expanded, 11)
        self.assertFalse(calc.reachable(derivative)["stops"])
        self.assertNotEqual(derivative, calc.zero)

    def test_delayed_source_integral_unknown_capture_support_stops(self):
        calc = fixture()
        calc.source.update({10: {"op": "coordinate", "args": ["formal"]},
                            11: {"op": "coordinate", "args": ["original-binder"]},
                            12: {"op": "add", "args": [10, 11]},
                            13: {"op": "definite_integral", "args": [12, 11, 0, 1]}})
        uncertain = calc.stop(calc.ref(3), 3, "unknown source argument support")
        expanded = calc.expand(13, ((10, uncertain),))
        self.assertTrue(calc.reachable(expanded)["stops"])

    def test_typed_formula_hash_ignores_node_numbers_and_preserves_binder(self):
        calc = fixture();root = calc.d(calc.ref(9), 2)
        arena = FormulaArena();arena.put("rational", ["99", "1"])
        moved = arena.inline_formula(calc.nodes, root)
        self.assertEqual(formula_semantic_hash(calc.nodes, root), formula_semantic_hash(arena.nodes, moved))

    def test_analytic_stop_cannot_enter_applied_cartesian_formula(self):
        calc = fixture();stop = calc.stop(calc.ref(3), 3, "unproved derivative")
        with self.assertRaisesRegex(ValueError, "unproved"):
            FormulaArena().inline_formula(calc.nodes, stop)


if __name__ == "__main__":
    unittest.main(verbosity=2)
