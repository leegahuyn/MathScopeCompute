import unittest
from analytic_primitives import next_laurent,step_calls

class PrimitiveControls(unittest.TestCase):
    def test_ordinary_derivative_uses_negative_derivative_of_reciprocal(self):
        self.assertEqual(next_laurent({0:1}),{3:2})
        self.assertEqual(next_laurent({3:2}),{6:4,4:-6})
        self.assertEqual(next_laurent({6:4,4:-6}),{9:8,7:-36,5:24})

    def test_changed_operator_is_rejected(self):
        with self.assertRaises(ValueError):step_calls([{'sourceNode':1,'node':{'op':'another_step','args':[3,0]}}])

    def test_unlicensed_derivative_or_argument_is_rejected(self):
        for args in [[3,13],[-1,0],[3,-1],[3,1.5],[3]]:
            with self.subTest(args=args):
                with self.assertRaises(ValueError):step_calls([{'sourceNode':1,'node':{'op':'source_step_derivative','args':args}}])

    def test_step_primitive_does_not_promote_composed_argument_domain(self):
        row=step_calls([{'sourceNode':1,'node':{'op':'source_step_derivative','args':[3,2]}}])[0]
        self.assertTrue(row['primitiveGlobalRealDomainProved'])
        self.assertFalse(row['composedArgumentGloballyFiniteAndSmoothProved'])

if __name__=='__main__':unittest.main()
