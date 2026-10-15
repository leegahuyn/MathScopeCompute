"""Small range-logic controls; fixtures authenticate no original graph."""
from fractions import Fraction as Q
import unittest

import picard_domain_proof as p


class RangeControls(unittest.TestCase):
    def setUp(self):
        self.x = ('coordinate', 91)
        self.y = ('coordinate', 92)

    def test_closed_endpoint_is_not_empty(self):
        # Both sides of a lazy join are retained at equality.  Strict > is
        # required before discarding a closed interval.
        self.assertEqual(p.compare(p.rat(1), p.rat(1)), 0)
        self.assertIsNotNone(p.constrain({self.x: (p.rat(0), p.rat(1))},
                                        self.x, p.rat(1), p.rat(1)))

    def test_strictly_empty_interval_is_rejected(self):
        self.assertIsNone(p.constrain({}, self.x, p.rat(2), p.rat(1)))

    def test_unknown_order_fails_closed(self):
        with self.assertRaises(p.Unproved):
            p.compare(self.x, self.y)

    def test_nonnegative_is_not_strictly_positive(self):
        with self.assertRaises(p.Unproved):
            p.compare(p.rat(0), p.pw(self.x, 2))

    def test_nested_binder_retains_outer_upper_scope(self):
        outer = {self.x: (p.rat(0), p.rat(4))}
        inner = dict(outer)
        inner[self.y] = (p.rat(0), p.interval(self.x, outer)[1])
        self.assertEqual(p.interval(self.y, inner), (p.rat(0), p.rat(4)))
        self.assertNotIn(self.y, outer)

    def test_nonzero_variable_binder_lower_scope(self):
        outer = {self.x: (p.rat(2), p.rat(3))}
        lo, hi = p.interval(self.x, outer)
        inner = dict(outer)
        inner[self.y] = (lo, hi)
        self.assertEqual(p.interval(self.y, inner), (p.rat(2), p.rat(3)))
        self.assertGreater(p.compare(lo, p.rat(0)), 0)

    def test_shared_expression_is_evaluated_in_each_environment(self):
        expression = p.multiply(p.rat(2), self.x)
        first = {self.x: (p.rat(0), p.rat(1))}
        second = {self.x: (p.rat(3), p.rat(4))}
        self.assertEqual(p.interval(expression, first), (p.rat(0), p.rat(2)))
        self.assertEqual(p.interval(expression, second), (p.rat(6), p.rat(8)))
        self.assertNotEqual((71, tuple(sorted(first.items(), key=repr))),
                            (71, tuple(sorted(second.items(), key=repr))))

    def test_negative_natural_y_is_rejected(self):
        lo = p.rat(-1)
        self.assertFalse(p.compare(lo, p.rat(0)) >= 0)

    def test_too_large_natural_y_is_rejected(self):
        for hi in (p.rat(Q(41, 10)), p.rat(5)):
            self.assertFalse(p.compare(hi, p.rat(p.LIMIT)) < 0)

    def test_log_zero_and_inverse_zero_are_rejected(self):
        with self.assertRaises(p.Unproved):
            p.interval(('log', self.x), {self.x: (p.rat(0), p.rat(1))})
        with self.assertRaises(p.Unproved):
            p.pw(p.rat(0), -1)

    def test_unknown_native_cannot_be_normalized(self):
        normal = p.RadialNormal({7: {'op': 'unproved_native', 'args': []}})
        with self.assertRaises(p.Unproved):
            normal.at(7)

    def test_source_small_positive_exponential_order(self):
        tau = ('parameter', 't1')
        self.assertLess(p.compare(p.rat(1), p.ex(p.multiply(p.rat(Q(1, 16)), tau))), 0)
        self.assertLess(p.compare(p.multiply(p.rat(4), p.ex(p.multiply(p.rat(2), tau))), p.rat(p.LIMIT)), 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
