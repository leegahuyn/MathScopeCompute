import unittest
from original_omega_binder_domains import ScopeFlow,digest_ids

class ScopedIntegralRadiusFlow(unittest.TestCase):
    def fixture(self,alias=False):
        f=ScopeFlow()
        f.add('rational',['0','1']);f.add('rational',['1','1'])
        f.add('coordinate',['eta']);f.add('coordinate',['dummy_t'])
        f.add('multiply',[1,3])
        while len(f.all)<4756:f.add('rational',['1','1'])
        f.add('coordinate',['physical_X'])
        target=len(f.all)
        f.add('actual_natural_series',['Phi',4,2,0,0],{
            'node_id':target,'variable':3,'actual_X_node':4 if alias else 3,'positive_exp_alias':alias})
        return f,target

    def test_before_guard_closes_upper_only(self):
        f,n=self.fixture()
        f.add('smooth_piecewise',[3,3617,3618,n,0,0])
        self.assertEqual(f.debts(len(f.all)-1),{'upper':0,'lower':1,'log':0})

    def test_zero_to_X_binder_closes_lower_in_its_body(self):
        f,n=self.fixture()
        f.add('smooth_piecewise',[3,3617,3618,n,0,0]);body=len(f.all)-1
        f.add('definite_integral',[body,3,0,4756])
        self.assertEqual(f.debts(len(f.all)-1),{'upper':0,'lower':0,'log':0})

    def test_free_unprotected_second_path_is_not_hidden_by_first_guard(self):
        f,n=self.fixture()
        f.add('smooth_piecewise',[3,3617,3618,n,0,0]);safe=len(f.all)-1
        f.add('add',[safe,n]);body=len(f.all)-1
        f.add('definite_integral',[body,3,0,4756])
        self.assertEqual(f.debts(len(f.all)-1)['upper'],1)

    def test_inside_and_after_arms_do_not_inherit_before_upper(self):
        for arm in (4,5):
            f,n=self.fixture();args=[3,3617,3618,0,0,0];args[arm]=n
            f.add('smooth_piecewise',args)
            self.assertEqual(f.debts(len(f.all)-1)['upper'],1)

    def test_wrong_coordinate_guard_cannot_certify_the_call(self):
        f,n=self.fixture()
        f.add('smooth_piecewise',[2,3617,3618,n,0,0])
        self.assertEqual(f.debts(len(f.all)-1)['upper'],1)

    def test_alias_log_needs_positive_outer_branch(self):
        f,n=self.fixture(alias=True)
        f.add('smooth_piecewise',[4,3624,3627,n,0,0]);inner=len(f.all)-1
        self.assertEqual(f.debts(inner),{'upper':0,'lower':0,'log':1})
        f.add('smooth_piecewise',[3,3617,3618,0,inner,inner])
        self.assertEqual(f.debts(len(f.all)-1),{'upper':0,'lower':0,'log':0})

    def test_nonnegative_integral_variable_alone_cannot_justify_log_at_zero(self):
        f,n=self.fixture(alias=True)
        f.add('smooth_piecewise',[4,3624,3627,n,0,0]);inner=len(f.all)-1
        f.add('definite_integral',[inner,3,0,4756])
        self.assertEqual(f.debts(len(f.all)-1)['log'],1)

    def test_binding_does_not_apply_to_endpoint_expression(self):
        f,n=self.fixture()
        f.add('smooth_piecewise',[3,3617,3618,n,0,0]);endpoint=len(f.all)-1
        f.add('definite_integral',[0,3,endpoint,4756])
        self.assertEqual(f.debts(len(f.all)-1)['lower'],1)

    def test_unknown_upper_endpoint_does_not_establish_nonnegativity(self):
        f,n=self.fixture()
        f.add('smooth_piecewise',[3,3617,3618,n,0,0]);inner=len(f.all)-1
        f.add('definite_integral',[inner,3,0,2])
        self.assertEqual(f.debts(len(f.all)-1)['lower'],1)

    def test_guard_control_expression_is_evaluated_outside_its_arms(self):
        f,n=self.fixture()
        f.add('smooth_piecewise',[n,3617,3618,0,0,0])
        self.assertEqual(f.debts(len(f.all)-1)['upper'],1)

    def test_inner_shadowed_variable_cannot_receive_outer_binder_lower_bound(self):
        f,n=self.fixture()
        f.add('smooth_piecewise',[3,3617,3618,n,0,0]);body=len(f.all)-1
        f.add('definite_integral',[body,3,0,2]);inner=len(f.all)-1
        f.add('definite_integral',[inner,3,0,4756])
        self.assertEqual(f.debts(len(f.all)-1)['lower'],1)

    def test_outer_guard_does_not_bound_a_shadowed_inner_integration_variable(self):
        f,n=self.fixture()
        f.add('definite_integral',[n,3,0,2]);inner=len(f.all)-1
        f.add('smooth_piecewise',[3,3617,3618,inner,0,0])
        self.assertEqual(f.debts(len(f.all)-1)['upper'],1)

    def test_outer_positive_guard_does_not_validate_shadowed_log_at_zero(self):
        f,n=self.fixture(alias=True)
        f.add('smooth_piecewise',[4,3624,3627,n,0,0]);body=len(f.all)-1
        f.add('definite_integral',[body,3,0,4756]);inner=len(f.all)-1
        f.add('smooth_piecewise',[3,3617,3618,0,inner,inner])
        self.assertEqual(f.debts(len(f.all)-1)['log'],1)

    def test_root_entry_id_list_digest_detects_missing_or_reordered_ids(self):
        self.assertNotEqual(digest_ids([1,2,3]),digest_ids([1,3]))
        self.assertNotEqual(digest_ids([1,2,3]),digest_ids([3,2,1]))

if __name__=='__main__':unittest.main()
