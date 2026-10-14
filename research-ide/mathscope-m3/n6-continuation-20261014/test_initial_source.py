"""Controls for singular/ambiguous gaps and the scope of the actual bracket."""
import unittest
from fractions import Fraction as Q

from initial_source_lemmas import FixedSource, atom, lit, op, substitute


class InitialSourceControls(unittest.TestCase):
    def test_an_equal_exponential_gap_cannot_receive_nonzero_authority(self):
        nodes = {
            0:{'op':'rational','args':['0','1']},
            1:{'op':'rational','args':['1','1']},
            20:{'op':'rational','args':['-1','1']},
            200:{'op':'exp','args':[0]},
            201:{'op':'multiply','args':[20,200]},
            202:{'op':'add','args':[1,201]},
        }
        with self.assertRaises(ValueError):
            FixedSource(nodes).sign(202)

    def test_no_sign_claim_when_a_lambda_gap_can_cross_zero(self):
        nodes = {
            0:{'op':'rational','args':['0','1']},
            1:{'op':'rational','args':['1','1']},
            8:{'op':'source_parameter','args':['lambda']},
            20:{'op':'rational','args':['-1','1']},
            200:{'op':'add','args':[8,20]},
            201:{'op':'exp','args':[200]},
            202:{'op':'multiply','args':[1,20]},
            203:{'op':'add','args':[201,202]},
        }
        with self.assertRaises(ValueError):
            FixedSource(nodes).sign(203)

    def test_a_strict_positive_lambda_gap_keeps_its_sign_without_evaluation(self):
        nodes = {
            1:{'op':'rational','args':['1','1']},
            8:{'op':'source_parameter','args':['lambda']},
            20:{'op':'rational','args':['-1','1']},
            52:{'op':'rational','args':['-2','5']},
            200:{'op':'multiply','args':[8,52]},
            201:{'op':'exp','args':[200]},
            202:{'op':'multiply','args':[20,201]},
            203:{'op':'add','args':[1,202]},
        }
        self.assertEqual(FixedSource(nodes).sign(203),1)

    def test_the_actual_finite_bracket_does_not_cover_arbitrary_coordinates(self):
        # Z=0,T=3 removes the fractional-power term for every allowed h.
        # Both endpoint values are negative, so this is outside source image.
        self.assertLess(Q(1,2)-3,0)
        self.assertLess(Q(2)-3,0)

    def test_collar_perturbation_can_break_endpoints_if_it_is_too_large(self):
        # The selected 1/256 collar is safe; a unit collar is not certified.
        self.assertGreater(Q(1,8)-13*Q(1,256),0)
        self.assertLess(Q(1,8)-13,0)
        self.assertGreater(Q(1,2)-13*Q(1,256),0)

    def test_copy_substitution_retains_exact_prefactor_and_scaled_argument(self):
        x=atom('x');scale=op('exp',lit(Q(1,5)))
        kernel=op('exp',op('multiply',lit(-1),op('inverse',x)))
        correct=op('multiply',op('inverse',scale),substitute(kernel,'x',op('multiply',x,op('inverse',scale))))
        omit_prefactor=substitute(kernel,'x',op('multiply',x,op('inverse',scale)))
        omit_argument_scale=op('multiply',op('inverse',scale),kernel)
        self.assertNotEqual(correct,omit_prefactor)
        self.assertNotEqual(correct,omit_argument_scale)


if __name__=='__main__':
    unittest.main()
