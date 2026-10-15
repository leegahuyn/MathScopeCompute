import unittest
from fractions import Fraction as F
from complex_polynomial_bounds import certify_inverse, DOMAIN


class ExactInverseLeaves(unittest.TestCase):
    def test_l_bound_replays_exact_open_parameter_domain(self):
        proof = certify_inverse({(0, 0): F(1), (1, 2): F(-2)})
        self.assertEqual(proof['operandAbsStrictLower'], '31/32')
        self.assertEqual(proof['inverseAbsStrictUpper'], '32/31')
        self.assertEqual(proof['domain'], DOMAIN)

    def test_stadium_pole_separation_not_enclosing_disk(self):
        proof = certify_inverse({(0, 0): F(1), (0, 2): F(1)})
        self.assertEqual(proof['operandAbsStrictLower'], '9/16')
        self.assertEqual(proof['inverseAbsStrictUpper'], '16/9')
        self.assertIn('dist(eta,[-1,1])<1/4', proof['domain'])
        self.assertIn('|eta-i|>3/4', proof['exactProof'])
        # +/-i lies within the convenient |eta|<5/4 envelope but is a pole.
        self.assertLess(abs(1j), 5 / 4)
        self.assertEqual(1 + 1j ** 2, 0)
        self.assertNotIn('|eta|<5/4', proof['domain'])

    def test_real_parameter_inverse_bounds(self):
        minus = certify_inverse({(0, 0): F(1), (1, 0): F(-1)})
        plus = certify_inverse({(0, 0): F(1), (1, 0): F(2)})
        self.assertEqual(minus['operandAbsStrictLower'], '99/100')
        self.assertEqual(minus['inverseAbsStrictUpper'], '100/99')
        self.assertEqual(plus['operandAbsStrictLower'], '1')
        self.assertEqual(plus['inverseAbsStrictUpper'], '1')

    def test_sign_changes_and_unknown_polynomials_fail_closed(self):
        self.assertIsNone(certify_inverse({(0, 0): F(1), (0, 2): F(-1)}))
        self.assertIsNone(certify_inverse({(0, 0): F(1), (1, 2): F(-200)}))
        self.assertIsNone(certify_inverse({(0, 0): F(1), (0, 2): F(1), (0, 1): F(1)}))
        self.assertIsNone(certify_inverse({(0, 0): F(0)}))

    def test_unsupported_coefficients_and_metadata_are_not_proof(self):
        for poly in [None, {'proofID': 'PASS'}, {(0, 0): 1.0},
                     {(False, 0): F(1)}, {(-1, 0): F(1)}]:
            self.assertIsNone(certify_inverse(poly))

    def test_source_binding_and_global_scope_remain_explicit(self):
        proof = certify_inverse({(0, 0): F(1), (0, 2): F(1), (3, 2): F(0)})
        self.assertTrue(proof['sourceNodeBindingRequired'])
        self.assertTrue(proof['sourceParameterHBoundIsHypothesis'])
        self.assertFalse(proof['finitePointSampleUsed'])
        self.assertFalse(proof['nativeA0A1ForcingNormProvedByThisLeaf'])
        self.assertFalse(proof['globalGuardOfficiallyClosedByThisLeaf'])


if __name__ == '__main__':
    unittest.main()
