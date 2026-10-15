"""Meaningful controls for local range implications; fixtures are not originals."""
import unittest
from fractions import Fraction as Q
from natural_domain_proof import Normalize, context_upper, numerical_upper, rat, multiply, power


class NaturalRangeRuleTests(unittest.TestCase):
    def setUp(self):
        self.nodes = {
            0: {'op': 'rational', 'args': ['0', '1']},
            1: {'op': 'rational', 'args': ['1', '1']},
            2: {'op': 'coordinate', 'args': ['X']},
            3: {'op': 'source_parameter', 'args': ['Lambda']},
            4: {'op': 'source_parameter', 'args': ['Xa']},
            5: {'op': 'multiply', 'args': [3, 2]},
            6: {'op': 'smooth_piecewise', 'args': [2, 4, 1, 5, 0, 0]},
            7: {'op': 'log_positive', 'args': [2]},
            8: {'op': 'exp', 'args': [7]},
            9: {'op': 'source_parameter', 'args': ['t1']},
            10: {'op': 'exp', 'args': [2]},
            11: {'op': 'rational', 'args': ['4', '1']},
            12: {'op': 'multiply', 'args': [11, 10]},
            13: {'op': 'rational', 'args': ['2', '1']},
            14: {'op': 'multiply', 'args': [13, 9]},
            15: {'op': 'definite_integral', 'args': [12, 2, 9, 14]},
            16: {'op': 'rational', 'args': ['100', '1']},
            17: {'op': 'definite_integral', 'args': [12, 2, 9, 16]},
        }

    def test_positive_scaled_selector_guard_caps_Y_at_four(self):
        proof = context_upper({'Y': 5}, {'surface': 6, 'piecewiseRoles': ['outsideLeft']}, self.nodes, Normalize(self.nodes))
        self.assertTrue(proof['proved'])
        self.assertEqual(proof['YUpper'], '4')
        self.assertTrue(proof['nonnegativeRadialCallerStillRequired'])

    def test_dropping_guard_upper_role_cannot_pass(self):
        proof = context_upper({'Y': 5}, {'surface': 6, 'piecewiseRoles': ['outsideRight']}, self.nodes, Normalize(self.nodes))
        self.assertFalse(proof['proved'])

    def test_exact_log_cancellation_keeps_definedness_prerequisite(self):
        normal = Normalize(self.nodes)
        self.assertEqual(normal.at(8), normal.at(2))
        self.assertIn(2, normal.log_domains)

    def test_binder_on_actual_small_log_interval(self):
        proof = context_upper({'Y': 12}, {'surface': 15}, self.nodes, Normalize(self.nodes))
        self.assertTrue(proof['proved'])
        self.assertLess(Q(proof['YUpper']), Q(41, 10))

    def test_large_binder_endpoint_not_silently_capped(self):
        proof = context_upper({'Y': 12}, {'surface': 17}, self.nodes, Normalize(self.nodes))
        self.assertFalse(proof['proved'])

    def test_unknown_operation_not_replaced_by_zero(self):
        self.nodes[2] = {'op': 'unreviewed_parameter_root', 'args': []}
        with self.assertRaises(ValueError):
            Normalize(self.nodes).at(5)

    def test_negative_unknown_factor_cannot_be_squared_using_upper_only(self):
        unknown = ('add', (rat(-100), ('parameter', 't1')))
        self.assertIsNone(numerical_upper(power(unknown, 2)))

    def test_symbolic_source_scale_cancels_exactly(self):
        normal = Normalize(self.nodes)
        self.assertEqual(multiply(normal.at(3), normal.at(4)), rat(4))


if __name__ == '__main__':
    unittest.main(verbosity=2)
