import unittest
from fractions import Fraction as Q
from source_clock_bridge import (clock_derivative_certificates,SourceCanonical,
    add,mul,q,sigma,integral,primitive_sigma,parameter,power,exp,log,inv)


class ClockBridgeTests(unittest.TestCase):
    def test_every_finite_stage_and_both_tails_has_equal_log_derivative(self):
        rows=clock_derivative_certificates()
        self.assertEqual(len(rows),14)
        self.assertEqual(rows[0]['stage'],'negativeInfinitePrefix')
        self.assertEqual(rows[-1]['stage'],'positiveInfiniteTail')
        self.assertTrue(all(r['firstExactResidualTerms']==r['independentExactResidualTerms']==0 for r in rows))

    def test_changed_stage_derivative_is_rejected(self):
        for name in ['initial','interpolation','flatten','terminal']:
            with self.assertRaisesRegex(ValueError,'clock derivative mismatch'):
                clock_derivative_certificates(mutation=name)

    def test_integral_source_binder_names_are_alpha_invariant(self):
        source={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['1','1']},
            2:{'op':'coordinate','args':['first-binder']},3:{'op':'coordinate','args':['second-binder']},
            4:{'op':'source_step_derivative','args':[2,0]},5:{'op':'source_step_derivative','args':[3,0]},
            6:{'op':'definite_integral','args':[4,2,0,1]},7:{'op':'definite_integral','args':[5,3,0,1]}}
        c=SourceCanonical(source)
        self.assertEqual(c.at(6),c.at(7));self.assertEqual(c.at(6),q(Q(1,2)))

    def test_nested_integral_keeps_the_outer_coordinate_free_in_endpoint(self):
        source={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['1','1']},
          2:{'op':'coordinate','args':['outer']},3:{'op':'coordinate','args':['inner']},
          4:{'op':'source_step_derivative','args':[3,0]},
          5:{'op':'definite_integral','args':[4,3,0,2]},
          6:{'op':'definite_integral','args':[5,2,0,1]}}
        actual=SourceCanonical(source).at(6)
        self.assertEqual(actual,integral(primitive_sigma(('b',0)),q(),q(1)))
        self.assertNotEqual(actual,q(Q(1,2)))

    def test_unreviewed_native_value_cannot_enter_source_partition_proof(self):
        with self.assertRaisesRegex(ValueError,'unreviewed operation'):
            SourceCanonical({0:{'op':'actual_background_picard','args':[0,0,1,2,0]}}).at(0)

    def test_exact_source_normalization_retains_pressure_factor(self):
        P=parameter('Pstar');inside=add(q(5),q(1));good=mul(q(Q(-1,2)),power(P,2),inside)
        changed=mul(q(-1),power(P,2),inside)
        self.assertNotEqual(good,changed)
        self.assertEqual(add(q(Q(1,10)),q(Q(-3,10))),q(Q(-1,5)))


if __name__=='__main__':unittest.main()
