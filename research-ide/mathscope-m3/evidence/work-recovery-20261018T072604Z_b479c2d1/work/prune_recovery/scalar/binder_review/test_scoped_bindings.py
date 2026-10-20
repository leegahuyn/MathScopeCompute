"""Synthetic negative controls for scoping only; not actual numerical evidence."""
import unittest
from scoped_bindings import (BindingAdapter, BindingError, BoundSymbol,
                             DerivativeBodyRequired, Scope, ScopedRef)


class BindingControls(unittest.TestCase):
    def setUp(self):
        self.nodes = {
            0: {"op": "coordinate", "args": ["x"]},
            1: {"op": "coordinate", "args": ["t"]},
            2: {"op": "coordinate", "args": ["unlisted"]},
            3: {"op": "rational", "args": ["0", "1"]},
            4: {"op": "rational", "args": ["1", "1"]},
            5: {"op": "multiply", "args": [0, 1]},
            6: {"op": "definite_integral", "args": [5, 1, 3, 1]},
            7: {"op": "actual_expression_partial", "args": [0, [1], [0]]},
            8: {"op": "actual_expression_partial", "args": [1, [1, 0], [0, 0]]},
            9: {"op": "definite_integral", "args": [6, 1, 3, 1]},
        }
        self.adapter = BindingAdapter(self.nodes.__getitem__)
        self.x, self.t = BoundSymbol("caller x"), BoundSymbol("caller t")
        self.caller = Scope(((0, self.x), (1, self.t), (2, BoundSymbol("caller unlisted"))))
        self.definition = {"parameters": [0], "body": 6, "derivativeLimits": [4]}

    def resolve(self, reference):
        value = self.adapter.resolve_coordinate(reference)
        return self.resolve(value) if isinstance(value, ScopedRef) else value

    def test_integral_endpoint_and_body_have_different_scope(self):
        integral = self.adapter.integral(ScopedRef(6, self.caller))
        sample = BoundSymbol("integration sample")
        body = integral.integrand_at(sample)
        self.assertIs(self.resolve(integral.right), self.t)
        self.assertIs(self.resolve(ScopedRef(1, body.scope)), sample)
        self.assertIs(self.resolve(ScopedRef(0, body.scope)), self.x)
        self.assertIs(self.caller.lookup(1), self.t)

    def test_actual_argument_is_not_captured_by_callee_integral(self):
        # f(x)=int t*x dt; f(caller_t) retains caller_t through x.
        # Use a constant upper endpoint so the function is closed in x.
        self.nodes[6]["args"][3] = 4
        call = self.adapter.expression(ScopedRef(7, self.caller), "expression:0", self.definition)
        integral = self.adapter.integral(call.zero_order_body())
        sample = BoundSymbol("integration sample")
        body = integral.integrand_at(sample)
        self.assertIs(self.resolve(ScopedRef(0, body.scope)), self.t)
        self.assertIs(self.resolve(ScopedRef(1, body.scope)), sample)

    def test_simultaneous_swap_keeps_original_actual_environments(self):
        definition = {"parameters": [0, 1], "body": 5, "derivativeLimits": [4, 4]}
        body = self.adapter.expression(ScopedRef(8, self.caller), "expression:1", definition).zero_order_body()
        self.assertIs(self.resolve(ScopedRef(0, body.scope)), self.t)
        self.assertIs(self.resolve(ScopedRef(1, body.scope)), self.x)

    def test_unlisted_formal_does_not_inherit_caller_coordinate(self):
        self.definition["body"] = 2
        body = self.adapter.expression(ScopedRef(7, self.caller), "expression:0", self.definition).zero_order_body()
        with self.assertRaisesRegex(BindingError, "Unbound coordinate"):
            self.resolve(body)

    def test_nested_same_id_binder_shadows_only_inner_body(self):
        outer = self.adapter.integral(ScopedRef(9, self.caller))
        outer_sample, inner_sample = BoundSymbol("outer sample"), BoundSymbol("inner sample")
        inner = self.adapter.integral(outer.integrand_at(outer_sample))
        self.assertIs(self.resolve(inner.right), outer_sample)
        body = inner.integrand_at(inner_sample)
        self.assertIs(self.resolve(ScopedRef(1, body.scope)), inner_sample)
        self.assertIs(self.resolve(outer.right), self.t)

    def test_nonzero_orders_cannot_use_underived_body(self):
        self.nodes[7]["args"][2] = [2]
        plan = self.adapter.expression(ScopedRef(7, self.caller), "expression:0", self.definition)
        self.assertEqual(plan.formal_derivative_sequence, (0, 0))
        with self.assertRaises(DerivativeBodyRequired):
            plan.zero_order_body()

    def test_budget_and_missing_source_fail_closed(self):
        self.nodes[7]["args"][2] = [5]
        with self.assertRaisesRegex(BindingError, "derivative order"):
            self.adapter.expression(ScopedRef(7, self.caller), "expression:0", self.definition)
        self.nodes[7]["args"] = [0, [99], [0]]
        with self.assertRaisesRegex(BindingError, "Missing source"):
            self.adapter.expression(ScopedRef(7, self.caller), "expression:0", self.definition)

    def test_facade_total_order_guard_is_not_per_coordinate_guard(self):
        self.nodes[8] = {"op": "m3_aux_expression_partial", "args": [-1, [1, 0], [3, 3]]}
        definition = {"parameters": [0, 1], "body": 5, "derivativeLimits": [4, 4]}
        with self.assertRaisesRegex(BindingError, "owning header"):
            self.adapter.expression(ScopedRef(8, self.caller), "expressionDefinitions:0", definition)
        with self.assertRaisesRegex(BindingError, "total derivative budget"):
            self.adapter.expression(ScopedRef(8, self.caller), "expressionDefinitions:0", definition, maximum_total_order=4)

    def test_duplicate_formals_and_noncoordinate_binder_rejected(self):
        with self.assertRaisesRegex(BindingError, "Duplicate"):
            Scope(((0, self.x), (0, self.t)))
        self.nodes[6]["args"][1] = 4
        with self.assertRaisesRegex(BindingError, "coordinate"):
            self.adapter.integral(ScopedRef(6, self.caller))

    def test_cache_key_includes_immutable_environment(self):
        other = self.caller.shadow(0, BoundSymbol("another x"))
        first, second = ScopedRef(0, self.caller), ScopedRef(0, other)
        self.assertNotEqual(first.cache_key, second.cache_key)
        self.assertEqual(first.cache_key, ScopedRef(0, self.caller).cache_key)


if __name__ == "__main__":
    unittest.main(verbosity=2)
