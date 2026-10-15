"""Exact positive controls and fail-closed graph/binder negative controls."""
from fractions import Fraction as F
from math import factorial
import unittest

from natural_series_audit import (CORE_NAMES, binder_contexts, children,
                                  exact_range, inspect, positive_majorant,
                                  run, scope_environment, validate_call)


class Graph:
    def __init__(self):
        self.nodes = []
    def put(self, op, args):
        self.nodes.append({'op': op, 'args': args}); return len(self.nodes)-1
    def q(self, n, d=1):
        return self.put('rational', [str(n), str(d)])
    def node(self, i):
        return self.nodes[i]
    def closure(self, roots):
        out = set(); pending = list(roots)
        while pending:
            i = pending.pop()
            if i not in out:
                out.add(i); pending.extend(children(self.node(i)))
        return out
    def free(self, i):
        n = self.node(i); a = n['args']
        if n['op'] == 'coordinate':
            return {i}
        if n['op'] == 'definite_integral':
            return (self.free(a[0])-{a[1]}) | self.free(a[2]) | self.free(a[3])
        out = set()
        for child in children(n):
            out |= self.free(child)
        return out


def fixture():
    g = Graph(); zero = g.q(0); four = g.q(4)
    eta = g.put('coordinate', ['eta']); xi = g.put('coordinate', ['xi'])
    call = g.put('actual_natural_series', ['Phi', four, eta, 1, 2])
    system = {'eta': eta, 'xi': xi, 'A0': [[call]], 'A1': [[zero]], 'forcing': [zero]}
    groups = {'A0': g.closure([call]), 'A1': {zero}, 'forcing': {zero}}
    core = {k: zero for k in CORE_NAMES}; core['eta'] = eta
    return g, system, groups, set.union(*groups.values()), core, call


class NaturalSeriesTests(unittest.TestCase):
    def test_joint_complex_margin_and_exact_norm(self):
        for k in range(3):
            for m in range(4):
                row = positive_majorant(k, m)
                self.assertEqual(F(row['jointMargin']), F(1, 4))
                self.assertEqual(F(row['scaledSupNormUpper']),
                                 F(factorial(m+k)*4**(m+k+1), 20**k))
                self.assertLess(F(row['tailRatioUpper']), 1)
                self.assertTrue(row['coefficientNormSuppliedAsHypothesis'])

    def test_boundary_without_joint_margin_rejected(self):
        with self.assertRaises(ValueError):
            positive_majorant(0, 0, radius=10, eta_fraction=F(1, 2))
        with self.assertRaises(ValueError):
            positive_majorant(0, 0, eta_fraction=1)

    def test_tail_ratio_controls_all_later_terms(self):
        k, m, R, t, N = 2, 3, F(5), F(1, 2), 8
        row = positive_majorant(k, m, R, t, N)
        terms = []
        for n in range(N+1, N+30):
            terms.append(F(factorial(n+m), factorial(n-k)*20**n*(n+1)**2)*
                         R**(n-k)/(1-t)**(n+m+1))
        for a, b in zip(terms, terms[1:]):
            self.assertLessEqual(b/a, F(row['tailRatioUpper']))
        self.assertLess(sum(terms), F(row['scaledTailUpper']))

    def test_insufficient_tail_index_rejected(self):
        with self.assertRaises(ValueError):
            positive_majorant(2, 12, degree=2)

    def test_exact_radial_constant_and_unknown_parameter(self):
        g = Graph(); four = g.q(4); parameter = g.put('source_parameter', ['Lambda'])
        self.assertEqual(exact_range(g.node, four), (F(4), F(4)))
        self.assertIsNone(exact_range(g.node, parameter))

    def test_interval_even_power_and_inverse_crossing_zero(self):
        g = Graph(); x = g.put('coordinate', ['s']); square = g.put('integer_power', [x, 2])
        inverse = g.put('inverse', [x])
        env = ((x, (F(-2), F(1))),)
        self.assertEqual(exact_range(g.node, square, env), (F(0), F(4)))
        self.assertIsNone(exact_range(g.node, inverse, env))

    def test_actual_lexical_integral_range(self):
        g = Graph(); zero = g.q(0); four = g.q(4); eta = g.put('coordinate', ['eta'])
        s = g.put('coordinate', ['s']); call = g.put('actual_natural_series', ['u', s, eta, 0, 1])
        integral = g.put('definite_integral', [call, s, zero, four])
        scopes = binder_contexts(g.node, [integral], {call})[call]
        self.assertEqual(len(scopes), 1)
        env, records = scope_environment(g.node, next(iter(scopes)))
        self.assertEqual(exact_range(g.node, s, tuple(env.items())), (F(0), F(4)))
        self.assertEqual(records[0]['integralSourceNode'], integral)

    def test_integral_endpoints_are_outside_bound_variable_scope(self):
        g = Graph(); zero = g.q(0); eta = g.put('coordinate', ['eta'])
        s = g.put('coordinate', ['s']); call = g.put('actual_natural_series', ['u', s, eta, 0, 0])
        integral = g.put('definite_integral', [zero, s, zero, call])
        self.assertEqual(binder_contexts(g.node, [integral], {call})[call], {()})
        self.assertIsNone(exact_range(g.node, s))

    def test_same_call_in_bound_and_unbound_occurrences(self):
        g = Graph(); zero = g.q(0); four = g.q(4); eta = g.put('coordinate', ['eta'])
        s = g.put('coordinate', ['s']); call = g.put('actual_natural_series', ['u', s, eta, 0, 0])
        integral = g.put('definite_integral', [call, s, zero, four])
        scopes = binder_contexts(g.node, [integral, call], {call})[call]
        self.assertEqual(len(scopes), 2)
        self.assertIn((), scopes)

    def test_actual_family_is_not_a_kernel_norm_certificate(self):
        g, system, groups, ids, core, call = fixture()
        result = inspect(g.node, system, groups, ids, g, core)
        self.assertEqual(result['summary']['exactArgumentDomainProvedCalls'], 1)
        self.assertFalse(result['summary']['fullCoefficientNormProved'])
        self.assertFalse(result['convergenceLemma']['coefficientNormProved'])
        self.assertFalse(result['convergenceLemma']['quarterStadiumCovered'])
        self.assertEqual(result['N6TotalResidualUnchanged'], 1288)

    def test_hidden_recurrence_capture_rejected(self):
        g, system, groups, ids, core, call = fixture()
        core['Zstar'] = system['xi']
        with self.assertRaisesRegex(ValueError, 'Hidden recurrence'):
            inspect(g.node, system, groups, ids, g, core)

    def test_metadata_and_component_override_rejected(self):
        for args in (['Phi', True, 2, 0, 0], ['oracle', 1, 2, 0, 0], ['Phi', 1, 2, 0, 13]):
            with self.assertRaises(ValueError):
                validate_call(5, {'op': 'actual_natural_series', 'args': args})
        self.assertEqual(children({'op': 'actual_natural_series', 'args': ['Phi', 10, 20, 2, 3]}), [10, 20])

    def test_unknown_operator_and_unpinned_original_rejected(self):
        with self.assertRaises(ValueError):
            children({'op': 'caller_norm_oracle', 'args': []})
        g, system, groups, ids, core, call = fixture()
        with self.assertRaisesRegex(ValueError, 'Unpinned'):
            run(g.node, system, groups, ids, g, {}, {'fixed': {'core': core}})


if __name__ == '__main__':
    unittest.main()
