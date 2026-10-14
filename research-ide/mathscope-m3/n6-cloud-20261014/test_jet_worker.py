"""Small exact negative controls; actual source runs only on cloud runners."""
from fractions import Fraction
import copy
import unittest

from jet_worker import BudgetStop, SourceCalculus, definition_key, js_hash
from jet_apply import rebuild


def binding(key, parameters, body, **extra):
    definition = {"parameters": parameters, "body": body, "derivativeLimits": [8]*len(parameters), **extra}
    return {"key": key, "definition": definition, "definitionSHA256": js_hash(definition)}


class JetTests(unittest.TestCase):
    def setUp(self):
        self.source = {
            0: {"op": "coordinate", "args": ["x"]},
            1: {"op": "coordinate", "args": ["y"]},
            2: {"op": "rational", "args": ["3", "7"]},
            3: {"op": "integer_power", "args": [0, 3]},
            4: {"op": "multiply", "args": [2, 3]},
            5: {"op": "actual_expression_partial", "args": [0, [0], [0]]},
        }
        self.defs = {"expression:0": binding("expression:0", [0], 4)}

    def calc(self):
        return SourceCalculus(self.source, self.defs)

    def exact_eval(self, calc, ident, values):
        n = calc.nodes[ident]
        op, a = n["op"], n["args"]
        ev = lambda i: self.exact_eval(calc, i, values)
        if op == "rational":
            return Fraction(*map(int, a))
        if op == "coordinate":
            return Fraction(values[a[1]])
        if op == "source_value":
            if a[0] == 622820 and a[0] in values:
                return Fraction(values[a[0]])
            expanded = calc.expand(a[0], tuple(map(tuple, a[1])))
            return ev(expanded)
        if op == "add":
            return sum(map(ev, a), Fraction(0))
        if op == "multiply":
            result = Fraction(1)
            for value in a:
                result *= ev(value)
            return result
        if op == "integer_power":
            return ev(a[0])**a[1]
        if op == "inverse":
            return 1/ev(a[0])
        if op == "exp" and ev(a[0]) == 0:
            return Fraction(1)
        if op == "log_positive" and ev(a[0]) == 1:
            return Fraction(0)
        if op == "source_image_conditional_formula":
            return ev(a[0])
        raise AssertionError(op)

    def test_exact_rational_first_and_second_derivative(self):
        calc = self.calc()
        first = calc.d(calc.ref(5), 0)
        second = calc.d(first, 0)
        self.assertEqual(self.exact_eval(calc, first, {0: 2}), Fraction(36, 7))
        self.assertEqual(self.exact_eval(calc, second, {0: 2}), Fraction(36, 7))
        self.assertFalse(calc.reachable(second)["stops"])

    def test_first_absent_coordinate_does_not_require_other_derivative(self):
        self.source[4] = {"op": "ceiling", "args": [0]}
        calc = self.calc()
        self.assertTrue(calc.capture_audit(5)["pass"])
        absent = calc.d(calc.ref(5), 1)
        self.assertEqual(absent, calc.zero)
        self.assertEqual(calc.d(absent, 0), calc.zero)

    def test_later_absence_cannot_erase_first_unknown_derivative(self):
        self.source[4] = {"op": "ceiling", "args": [0]}
        calc = self.calc()
        varying = calc.d(calc.ref(5), 0)
        self.assertTrue(calc.reachable(varying)["stops"])
        later = calc.d(varying, 1)
        self.assertTrue(calc.reachable(later)["stops"])
        self.assertNotEqual(later, calc.zero)

    def test_direct_hidden_capture_mutation_is_rejected(self):
        self.source[4] = {"op": "multiply", "args": [0, 1]}
        calc = self.calc()
        audit = calc.capture_audit(5)
        self.assertFalse(audit["pass"])
        self.assertEqual(audit["unboundCapturedCoordinates"], [1])

    def test_nested_hidden_capture_mutation_is_rejected(self):
        self.source[6] = {"op": "multiply", "args": [0, 1]}
        self.source[4] = {"op": "actual_expression_partial", "args": [1, [0], [0]]}
        self.defs["expression:1"] = binding("expression:1", [0], 6)
        audit = self.calc().capture_audit(5)
        self.assertFalse(audit["pass"])
        self.assertTrue(audit["unreviewedSupport"])

    def test_incomplete_application_tuple_is_rejected(self):
        self.source[5]["args"][1] = []
        with self.assertRaisesRegex(ValueError, "argument tuple"):
            self.calc().capture_audit(5)

    def test_changed_source_and_definition_hash_negative_controls(self):
        source_hash = js_hash(self.source[4])
        self.source[4]["args"] = [2, 0]
        self.assertNotEqual(js_hash(self.source[4]), source_hash)
        definition = self.defs["expression:0"]
        bad = copy.deepcopy(definition["definition"])
        bad["body"] = 0
        self.assertNotEqual(js_hash(bad), definition["definitionSHA256"])

    def test_stored_partial_differentiated_before_application(self):
        # f(p)=3*p^3/7, evaluate f'(y), then differentiate in y.
        self.source[5] = {"op": "actual_expression_partial", "args": [0, [1], [1]]}
        calc = self.calc()
        result = calc.d(calc.ref(5), 1)
        self.assertEqual(self.exact_eval(calc, result, {0: 99, 1: 2}), Fraction(36, 7))

    def test_simultaneous_swap_is_not_sequential_substitution(self):
        self.source[6] = {"op": "add", "args": [0, 1]}
        self.source[7] = {"op": "actual_expression_partial", "args": [1, [1, 0], [0, 0]]}
        self.defs["expression:1"] = binding("expression:1", [0, 1], 6)
        calc = self.calc()
        expanded = calc.expand(7)
        self.assertEqual(self.exact_eval(calc, expanded, {0: 2, 1: 7}), 9)

    def test_infinite_limit_is_not_promoted_by_symbolic_body(self):
        self.source[4] = {"op": "actual_background_picard", "args": [0, 0, 0, 0]}
        calc = self.calc()
        self.assertTrue(calc.reachable(calc.d(calc.ref(5), 0))["stops"])

    def test_integral_leibniz_stays_pending(self):
        self.source[4] = {"op": "definite_integral", "args": [0, 1, 2, 0]}
        calc = self.calc()
        self.assertTrue(calc.reachable(calc.d(calc.ref(5), 0))["stops"])

    def test_source_finite_derivative_budget_not_silently_extended(self):
        self.source[5]["args"][2] = [9]
        with self.assertRaisesRegex(ValueError, "finite source declaration"):
            self.calc().capture_audit(5)

    def test_applied_zero_is_reconstructed_and_unknown_preserved(self):
        program = [
            {"op": "coordinate", "args": ["x", 77]},
            {"op": "actual_opaque_value", "args": [1234, "actual_expression_partial"]},
            {"op": "unresolved_total_source_jet", "args": [1, [0]]},
            {"op": "unresolved_total_source_jet", "args": [1, [0, 0]]},
            {"op": "multiply", "args": [2, 3]},
        ]
        nodes, mapping, zero = rebuild(program, {2: {"exactValue": "0"}})
        self.assertEqual(mapping[2], zero)
        self.assertEqual(mapping[4], zero)
        self.assertEqual(nodes[mapping[3]]["op"], "unresolved_total_source_jet")
        self.assertEqual(nodes[mapping[1]]["args"][0], 1234)
        self.assertEqual(len(mapping), len(program))

    def test_application_rejects_unknown_scalar_grammar(self):
        with self.assertRaisesRegex(ValueError, "unreviewed Cartesian"):
            rebuild([{"op": "unproved_magic_zero", "args": []}], {})

    def test_actual_monotone_hidden_capture_is_rejected(self):
        self.source[4] = {"op": "actual_monotone_root", "args": [0, 0]}
        self.source[6] = {"op": "coordinate", "args": ["bound-root"]}
        self.source[7] = {"op": "add", "args": [6, 1]}
        definition = {"variable": 6, "parameters": [0], "body": 7, "left": 2, "right": 2, "derivativeLower": 2, "derivativeUpper": 2}
        self.defs["monotone:0"] = {"key": "monotone:0", "definition": definition, "definitionSHA256": js_hash(definition)}
        calc = self.calc()
        self.assertFalse(calc.capture_audit(5)["pass"])
        self.assertEqual(calc.system_capture_cache["monotone:0"]["hiddenCapturedCoordinates"], [1])
        self.assertNotEqual(calc.d(calc.ref(5), 1), calc.zero)

    def test_actual_monotone_closed_coefficient_body_support_is_proved(self):
        self.source[4] = {"op": "actual_monotone_root", "args": [0, 0]}
        self.source[6] = {"op": "coordinate", "args": ["bound-root"]}
        self.source[7] = {"op": "add", "args": [6, 0]}
        definition = {"variable": 6, "parameters": [0], "body": 7, "left": 2, "right": 2, "derivativeLower": 2, "derivativeUpper": 2}
        self.defs["monotone:0"] = {"key": "monotone:0", "definition": definition, "definitionSHA256": js_hash(definition)}
        calc = self.calc()
        self.assertTrue(calc.capture_audit(5)["pass"])
        self.assertEqual(calc.d(calc.ref(5), 1), calc.zero)

    def test_actual_picard_hidden_coefficient_capture_is_rejected(self):
        self.source[4] = {"op": "actual_background_picard", "args": [0, 0, 0, 0]}
        self.source[6] = {"op": "coordinate", "args": ["xi"]}
        definition = {"xi": 6, "eta": 0, "A0": [[2]*6 for _ in range(6)], "A1": [[2]*6 for _ in range(6)], "forcing": [1]*6}
        self.defs["picard:0"] = {"key": "picard:0", "definition": definition, "definitionSHA256": js_hash(definition)}
        calc = self.calc()
        self.assertFalse(calc.capture_audit(5)["pass"])
        self.assertEqual(calc.system_capture_cache["picard:0"]["hiddenCapturedCoordinates"], [1])

    def test_actual_natural_fixed_core_hidden_capture_is_rejected(self):
        self.source[4] = {"op": "actual_natural_series", "args": ["Phi", 0, 0, 0, 0]}
        self.source[6] = {"op": "coordinate", "args": ["hidden-natural-datum"]}
        core = {key: 2 for key in ["L", "Ustar", "Hstar", "Wstar", "Zstar", "chi", "zeta", "g", "gSquared", "P0"]}
        core.update(Y=0, eta=1, zeta=6)
        definition = {"core": core}
        self.defs["fixed:null"] = {"key": "fixed:null", "definition": definition, "definitionSHA256": js_hash(definition)}
        calc = self.calc()
        self.assertFalse(calc.capture_audit(5)["pass"])
        self.assertEqual(calc.system_capture_cache["fixed:null"]["hiddenCapturedCoordinates"], [6])

    def test_actual_quadratic_hidden_matrix_capture_is_rejected(self):
        self.source[4] = {"op": "actual_quadratic_root", "args": [0, 0, 0]}
        definition = {"rhs": [2], "linear": [[1]], "quadraticDiagonal": [[2]], "scale": 2}
        self.defs["fixed:null"] = {"key": "fixed:null", "definition": {"core": {"eta": 0}}, "definitionSHA256": "synthetic"}
        self.defs["quadratic:0"] = {"key": "quadratic:0", "definition": definition, "definitionSHA256": js_hash(definition)}
        calc = self.calc()
        self.assertFalse(calc.capture_audit(5)["pass"])
        self.assertEqual(calc.system_capture_cache["quadratic:0"]["hiddenCapturedCoordinates"], [1])

    def test_resource_stop_cleans_all_active_sets_and_can_retry(self):
        calc = self.calc()
        calc.max_work = 5
        with self.assertRaises(BudgetStop):
            calc.capture_audit(5)
        self.assertFalse(calc.support_active)
        self.assertFalse(calc.capture_active)
        self.assertFalse(calc.system_capture_active)
        calc.max_work = 1000
        self.assertTrue(calc.capture_audit(5)["pass"])

    def test_slow_implicit_exact_formula_retains_image_premise(self):
        source = {
            9: {"op": "rational", "args": ["1", "64"]},
            622803: {"op": "coordinate", "args": ["Z"]},
            622804: {"op": "coordinate", "args": ["T"]},
            622820: {"op": "actual_monotone_root", "args": [2, 622803, 622804]},
        }
        calc = SourceCalculus(source, {})
        calc.slow_root_image_theorem = {"syntheticAlgebraFixture": True}
        dz = calc.d(calc.ref(622820), 622803)
        dt = calc.d(calc.ref(622820), 622804)
        point = {622803: 1, 622804: 0, 622820: 1}
        self.assertEqual(self.exact_eval(calc, dz, point), Fraction(64, 31))
        self.assertEqual(self.exact_eval(calc, dt, point), Fraction(32, 31))
        self.assertEqual(calc.nodes[dz]["op"], "source_image_conditional_formula")
        self.assertFalse(calc.nodes[dz]["args"][1]["allOriginalPDEApplicationsInsideProvedImageOrCollar"])
        self.assertTrue(calc.reachable(dz)["stops"])
        second = calc.d(dz, 622803)
        self.assertEqual(calc.nodes[second]["op"], "source_image_conditional_formula")


if __name__ == "__main__":
    unittest.main(verbosity=2)
