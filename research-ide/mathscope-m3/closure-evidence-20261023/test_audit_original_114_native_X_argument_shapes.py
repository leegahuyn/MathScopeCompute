import unittest
from audit_original_114_native_X_argument_shapes import describe,UnprovedNativeArgumentShape

class ExactOriginalActualXOperands(unittest.TestCase):
    def test_original_coordinate(self):
        self.assertEqual(describe(10,{'op':'coordinate','args':['X']})['name'],'X')
    def test_zero_exact_rational(self):
        x=describe(10,{'op':'rational','args':['0','1']})
        self.assertTrue(x['exactly_zero'])
        self.assertEqual((x['numerator'],x['denominator']),(0,1))
    def test_rational_fraction_no_float(self):
        x=describe(10,{'op':'rational','args':['2','4']})
        self.assertEqual((x['numerator'],x['denominator']),(1,2))
        self.assertFalse(x['exactly_zero'])
    def test_product_needs_external_bound(self):
        x=describe(200,{'op':'multiply','args':[190,195]})
        self.assertFalse(x['factor_domains_checked'])
        self.assertEqual(x['operand_source_AST_IDs'],[190,195])
    def test_bad_forward_operand_rejected(self):
        with self.assertRaises(UnprovedNativeArgumentShape):
            describe(200,{'op':'multiply','args':[205,190]})
    def test_unhandled_function_x_requires_new_proof(self):
        with self.assertRaises(UnprovedNativeArgumentShape):
            describe(200,{'op':'exp','args':[15]})
if __name__=='__main__':unittest.main()
