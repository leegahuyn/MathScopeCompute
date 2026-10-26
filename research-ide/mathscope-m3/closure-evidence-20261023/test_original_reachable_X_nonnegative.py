import unittest
from original_reachable_X_nonnegative import (
    NEG,ZERO,POS,UNKNOWN,NONNEG,sign_node,nonnegative,CoordinateScope)

class ExactRealSignConstructors(unittest.TestCase):
    def test_squares_and_half_sum_are_nonnegative_for_signed_real_bases(self):
        for base in (NEG,ZERO,POS,UNKNOWN):
            square=sign_node('integer_power',[0,2],[base],{})
            self.assertTrue(nonnegative(square))
        previous=[NONNEG,NONNEG]
        half_sum=sign_node('multiply',[0,1],[POS,sign_node('add',[0,1],previous,{})],{})
        self.assertTrue(nonnegative(half_sum))

    def test_square_divided_by_defined_positive_monotone_inverse(self):
        s=sign_node('actual_monotone_root',[2,0,1],[UNKNOWN,UNKNOWN],{})
        denominator=sign_node('multiply',[0,1],[POS,s],{})
        reciprocal=sign_node('inverse',[0],[denominator],{})
        self.assertTrue(nonnegative(sign_node('multiply',[0,1],[NONNEG,reciprocal],{})))

    def test_other_implicit_system_does_not_receive_system2_bracket(self):
        self.assertEqual(sign_node('actual_monotone_root',[1,0,1],[UNKNOWN,UNKNOWN],{}),UNKNOWN)

    def test_odd_power_and_unproved_denominator_do_not_prove_nonnegative(self):
        self.assertFalse(nonnegative(sign_node('integer_power',[0,3],[UNKNOWN],{})))
        inv=sign_node('inverse',[0],[UNKNOWN],{})
        self.assertFalse(nonnegative(sign_node('multiply',[0,1],[NONNEG,inv],{})))

    def test_opposite_signed_addition_remains_unproved(self):
        self.assertEqual(sign_node('add',[0,1],[NEG,POS],{}),UNKNOWN)
        self.assertFalse(nonnegative(UNKNOWN))

    def test_exp_positive_is_separate_from_its_argument_sign(self):
        self.assertEqual(sign_node('exp',[0],[NEG],{}),POS)

class NativeCoordinateScopeTests(unittest.TestCase):
    def initial(self):
        f=CoordinateScope();s=[]
        for op,args,sign in [('rational',['0','1'],ZERO),('coordinate',['X'],NONNEG),('coordinate',['dummy'],UNKNOWN)]:
            f.add(op,args,s);s.append(sign)
        return f,s

    def test_exact_original_input_variable_binder_closes_required_sign(self):
        f,s=self.initial();f.add('actual_expression_partial',[0,[2],[]],s,2);s.append(UNKNOWN)
        f.add('definite_integral',[3,2,0,1],s)
        self.assertEqual(f.unresolved(4),0)

    def test_signed_reversed_nonnegative_endpoints_stay_in_nonnegative_domain(self):
        f,s=self.initial();f.add('actual_expression_partial',[0,[2],[]],s,2);s.append(UNKNOWN)
        f.add('definite_integral',[3,2,1,0],s)
        self.assertEqual(f.unresolved(4),0)

    def test_wrong_variable_or_negative_endpoint_keeps_debt(self):
        for bound_variable in (1,2):
            f,s=self.initial();f.add('actual_expression_partial',[0,[2],[]],s,2);s.append(UNKNOWN)
            # An unrelated variable fails even with good endpoints;
            # an unbounded signed endpoint fails for the right variable.
            hi=1 if bound_variable==1 else 2
            f.add('definite_integral',[3,bound_variable,0,hi],s)
            self.assertEqual(f.unresolved(4),1)

    def test_endpoint_expression_is_outside_binding_scope(self):
        f,s=self.initial();f.add('actual_expression_partial',[0,[2],[]],s,2);s.append(UNKNOWN)
        f.add('definite_integral',[0,2,3,1],s)
        self.assertEqual(f.unresolved(4),1)

    def test_shadowed_inner_unknown_bound_cannot_be_fixed_by_outer_binder(self):
        f,s=self.initial();f.add('actual_expression_partial',[0,[2],[]],s,2);s.append(UNKNOWN)
        f.add('definite_integral',[3,2,0,2],s);s.append(UNKNOWN)
        f.add('definite_integral',[4,2,0,1],s)
        self.assertEqual(f.unresolved(5),1)

    def test_first_safe_path_does_not_erase_an_unbound_second_use(self):
        f,s=self.initial();f.add('actual_expression_partial',[0,[2],[]],s,2);s.append(UNKNOWN)
        f.add('definite_integral',[3,2,0,1],s);s.append(UNKNOWN)
        f.add('add',[4,3],s)
        self.assertEqual(f.unresolved(5),1)

if __name__=='__main__':unittest.main()
