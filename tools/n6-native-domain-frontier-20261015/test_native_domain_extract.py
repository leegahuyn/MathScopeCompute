"""Small extractor controls only; no fixture authenticates the original source."""
import unittest
from native_domain_extract import argument_children, argument_graph, conservative_capture, native_definition, nearest_contexts, syntactic_coordinates


class NativeDomainExtractorTests(unittest.TestCase):
    def setUp(self):
        self.nodes = {
            0: {'op': 'rational', 'args': ['0', '1']},
            1: {'op': 'rational', 'args': ['1', '1']},
            2: {'op': 'coordinate', 'args': ['x']},
            3: {'op': 'coordinate', 'args': ['eta']},
            4: {'op': 'actual_natural_series', 'args': ['Phi', 2, 3, 0, 1]},
            5: {'op': 'multiply', 'args': [1, 4]},
            6: {'op': 'smooth_piecewise', 'args': [2, 0, 1, 0, 5, 0]},
            7: {'op': 'definite_integral', 'args': [6, 2, 0, 1]},
        }
        self.reg = {'fixed': {'core': {'eta': 3}}}
        self.g = self.nodes.__getitem__

    def test_unknown_operation_fails_closed(self):
        self.nodes[5] = {'op': 'unreviewed_limit', 'args': [4]}
        with self.assertRaises(ValueError):
            conservative_capture(self.g, self.reg, 5, node_count=8)

    def test_missing_registry_fails_closed(self):
        with self.assertRaises(ValueError):
            conservative_capture(self.g, {}, 4, node_count=8)

    def test_native_tuple_metadata_is_not_an_argument_coordinate(self):
        self.assertEqual(argument_children(self.nodes[4]), [2, 3])
        self.assertEqual(syntactic_coordinates(self.g, 4), [2, 3])

    def test_bound_coordinate_removed_but_endpoints_preserved(self):
        self.assertEqual(syntactic_coordinates(self.g, 7), [3])

    def test_nearest_guard_has_exact_inside_path(self):
        parents = {4: {5}, 5: {6}, 6: {7}}
        contexts = nearest_contexts(self.g, parents, 4)
        self.assertEqual(len(contexts), 1)
        self.assertEqual(contexts[0]['path'], [4, 5, 6])
        self.assertEqual(contexts[0]['piecewiseRoles'], ['inside'])
        self.assertFalse(contexts[0]['activeContextProved'])

    def test_argument_boundary_retains_definedness_debt(self):
        graph, boundaries, domains = argument_graph(self.g, self.reg, [4])
        self.assertEqual(set(graph), {2, 3, 4})
        self.assertEqual(boundaries[4]['registry'], 'fixed')
        self.assertFalse(boundaries[4]['nativeDefinednessProved'])
        self.assertEqual(domains, [])

    def test_missing_indexed_registry_fails_closed(self):
        with self.assertRaises(ValueError):
            native_definition({'op': 'm3_aux_expression_partial', 'args': [-22, [2], [0]]}, {})

    def test_encoded_definition_payload_is_conservatively_traversed(self):
        self.reg['fixed']['encoded'] = '{"hidden":7}'
        seen, definitions, operations = conservative_capture(self.g, self.reg, 4, node_count=8)
        self.assertIn(7, seen)
        self.assertIn('fixed', definitions)
        self.assertEqual(operations['actual_natural_series'], 1)

    def test_explicit_capture_budget_is_not_silently_partial(self):
        with self.assertRaises(ValueError):
            conservative_capture(self.g, self.reg, 7, node_count=8, max_nodes=2)


if __name__ == '__main__':
    unittest.main(verbosity=2)
