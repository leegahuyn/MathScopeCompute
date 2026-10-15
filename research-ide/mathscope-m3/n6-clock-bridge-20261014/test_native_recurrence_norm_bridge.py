import unittest
from fractions import Fraction as Q
from native_recurrence_norm_bridge import *

class NativeNormBridgeTests(unittest.TestCase):
    def test_exact_product_and_inverse_derivatives(self):
        x=('coordinate',7);f=inv(add(q(1),power(x,2)))
        arena=ExactRational()
        self.assertTrue(arena.equal(arena.at(differentiate(f,x)),arena.at(neg(mul(q(2),x,power(f,2))))))
    def test_finite_integral_differentiation_preserves_binder(self):
        x=('coordinate',7);body=mul(('b',0),power(x,2));value=integral(body,q(),q(3))
        self.assertEqual(differentiate(value,x),integral(mul(q(2),('b',0),x),q(),q(3)))
    def test_moving_integral_endpoint_is_stop(self):
        x=('coordinate',7)
        with self.assertRaises(ProofStop):differentiate(integral(exp(('b',0)),q(),x),x)
    def test_algebraic_integral_extensionality_and_mutation(self):
        x=('coordinate',7);a=integral(mul(add(x,q(1)),q(2)),q(),q(3));b=integral(add(mul(q(2),x),q(2)),q(),q(3));c=integral(add(mul(q(2),x),q(3)),q(),q(3))
        arena=ExactRational();self.assertTrue(arena.equal(arena.at(a),arena.at(b)));self.assertFalse(arena.equal(arena.at(a),arena.at(c)))
    def test_all_order_majorant_constants_exact(self):
        self.assertEqual(mixed_majorant_constants(0,0),Q(4,3))
        self.assertEqual(mixed_majorant_constants(1,0),Q(4,45))
        self.assertEqual(mixed_majorant_constants(0,1),Q(4,9))
        with self.assertRaises(ValueError):mixed_majorant_constants(0,0,1)
    def test_conditional_majorant_cannot_certify_native_norm_or_source_image(self):
        proof=conditional_majorant()
        self.assertTrue(proof['conditionalTheoremProved'])
        self.assertFalse(proof['hypothesisEstablishedForActualNativeSeries'])
        self.assertFalse(proof['actualAllCallDomainsCovered'])

if __name__=='__main__':unittest.main()
