import unittest
from natural_outer_context_extract import extend_contexts, body_uses


class OuterContextTests(unittest.TestCase):
    def setUp(self):
        self.nodes = {0: {'op': 'rational', 'args': ['0', '1']},
                      1: {'op': 'rational', 'args': ['1', '1']},
                      2: {'op': 'coordinate', 'args': ['x']},
                      3: {'op': 'definite_integral', 'args': [2, 2, 0, 1]},
                      4: {'op': 'definite_integral', 'args': [3, 2, 0, 1]},
                      5: {'op': 'multiply', 'args': [1, 4]},
                      6: {'op': 'smooth_piecewise', 'args': [2, 0, 1, 0, 5, 0]}}
        self.get = self.nodes.__getitem__

    def test_crosses_intermediate_integral_before_guard(self):
        result = extend_contexts(self.get, {3: {4}, 4: {5}, 5: {6}}, {}, 3)
        self.assertEqual(result['nextContexts'][0]['path'], [3, 4, 5, 6])
        self.assertEqual(result['nextContexts'][0]['piecewiseRoles'], ['inside'])
        self.assertEqual([x['id'] for x in result['crossedIntegrals']], [3, 4])

    def test_exact_native_body_map_without_domain_promotion(self):
        self.nodes[7] = {'op': 'actual_expression_partial', 'args': [0, [1], [0]]}
        uses = body_uses(self.get, {'expression': [{'body': 3, 'parameters': [2]}]}, {7})
        record = uses[3][0]
        self.assertEqual(record['formalParameterMap'], [(2, 1)])
        self.assertTrue(record['formalParameterMapProved'])
        self.assertFalse(record['domainApplicationProved'])

    def test_unattached_boundary_is_preserved(self):
        result = extend_contexts(self.get, {}, {}, 3)
        self.assertEqual(result['unattachedBoundaries'][0]['source'], 3)
        self.assertFalse(result['allOriginalDomainPremisesProved'])

    def test_arity_change_fails(self):
        self.nodes[7] = {'op': 'actual_expression_partial', 'args': [0, [1], [0]]}
        with self.assertRaises(ValueError):
            body_uses(self.get, {'expression': [{'body': 3, 'parameters': [2, 1]}]}, {7})

    def test_budget_exhaustion_is_not_reported_as_complete(self):
        with self.assertRaises(ValueError):
            extend_contexts(self.get, {3: {4}, 4: {5}}, {}, 3, max_nodes=1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
