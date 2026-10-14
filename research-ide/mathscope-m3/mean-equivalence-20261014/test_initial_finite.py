import unittest
from fractions import Fraction
from initial_finite import FractionVerifier
class IndependentFiveRowControls(unittest.TestCase):
    def test_identity_and_omitted_cross_term(self):
        n={0:{'op':'coordinate','args':['x']},1:{'op':'coordinate','args':['y']},2:{'op':'rational','args':['-1','1']},3:{'op':'add','args':[0,1]},4:{'op':'multiply','args':[3,3]},5:{'op':'multiply','args':[0,0]},6:{'op':'multiply','args':[1,1]},7:{'op':'rational','args':['2','1']},8:{'op':'multiply','args':[7,0,1]},9:{'op':'add','args':[5,6,8]},10:{'op':'multiply','args':[2,9]},11:{'op':'add','args':[4,10]},12:{'op':'add','args':[5,6]},13:{'op':'multiply','args':[2,12]},14:{'op':'add','args':[4,13]}}
        self.assertFalse(FractionVerifier(n).eval(11)[0]);self.assertTrue(FractionVerifier(n).eval(14)[0])
    def test_undefined_inverse_cannot_pass(self):
        with self.assertRaises(ValueError):FractionVerifier({0:{'op':'rational','args':['0','1']},1:{'op':'inverse','args':[0]}}).eval(1)
    def test_distinct_actual_functions_not_merged(self):
        n={0:{'op':'actual_quadratic_root','args':[0,1,2]},1:{'op':'actual_quadratic_root','args':[1,1,2]},2:{'op':'rational','args':['-1','1']},3:{'op':'multiply','args':[2,1]},4:{'op':'add','args':[0,3]}}
        self.assertTrue(FractionVerifier(n).eval(4)[0])
if __name__=='__main__':unittest.main()
