import unittest,copy
from fractions import Fraction as Q
from rigorous_rational_intervals import UncertifiedExpression
from pinned_n3_parameter_intervals import (
 pinned_profile,exact_pinned_parameter_interval,parameter_proof_metadata,
 UnavailablePinnedSourceParameter)
class OriginalN3SourceParameterControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.profile=pinned_profile()
    def test_original_profile_hash(self):
        self.assertEqual(self.profile['id'],'same-profile-2026-10-10.3')
    def test_exact_fixed_profile_parameters(self):
        self.assertEqual(exact_pinned_parameter_interval('Md',self.profile).lo,Q(1048576))
        self.assertEqual(exact_pinned_parameter_interval('Tf',self.profile).hi,Q(128))
        self.assertEqual(exact_pinned_parameter_interval('co',self.profile).hi,Q(1,256))
    def test_h_not_replaced_by_zero(self):
        a=exact_pinned_parameter_interval('h',self.profile)
        self.assertEqual(a.lo,0)
        self.assertEqual(a.hi,Q(1,2**4096))
        self.assertFalse(parameter_proof_metadata('h')['can_certify_reciprocal'])
    def test_lambda_positive_but_enclosed_from_zero(self):
        a=exact_pinned_parameter_interval('lambda',self.profile)
        self.assertEqual(a.hi,Q(1,2**4096))
        with self.assertRaises(UncertifiedExpression):a.reciprocal()
    def test_h_powers_moment_bounds(self):
        for name in ('muMoment','epsilonMoment','j0'):
            self.assertEqual(exact_pinned_parameter_interval(name,self.profile).hi,Q(1,2**8192))
    def test_shrunk_cutoff_scale_bounds(self):
        self.assertEqual(exact_pinned_parameter_interval('deltaStar',self.profile).hi,Q(1,10*2**8192))
        self.assertEqual(exact_pinned_parameter_interval('sigmaStar',self.profile).hi,Q(1,2000*2**8192))
    def test_symbolic_T_rejected_without_finite_upper(self):
        with self.assertRaises(UnavailablePinnedSourceParameter):
            exact_pinned_parameter_interval('T',self.profile)
    def test_parameter_profile_mutation_rejected(self):
        x=copy.deepcopy(self.profile);x['parameterExpressionSHA256']='0'*64
        with self.assertRaises(UnavailablePinnedSourceParameter):
            exact_pinned_parameter_interval('h',x)
    def test_changed_formula_cannot_keep_old_embedded_hash(self):
        for key,value in [('h',{'integer':0}),('XR',{'integer':1})]:
            x=copy.deepcopy(self.profile);x['parametersExactExpressions'][key]=value
            with self.assertRaises(UnavailablePinnedSourceParameter):
                exact_pinned_parameter_interval('h',x)
    def test_critical_nested_formula_changed_rejected(self):
        x=copy.deepcopy(self.profile);x['parametersExactExpressions']['h']={'integer':0}
        from pinned_n3_parameter_intervals import SOURCE
        # Verify critical formula check directly via available immutable bytes
        original=SOURCE.read_text()
        import tempfile,pathlib
        with tempfile.TemporaryDirectory() as d:
            file=pathlib.Path(d)/'modified.mjs'
            prefix='export const PINNED_N3 = '
            file.write_text('// changed\n'+prefix+__import__('json').dumps(x)+';')
            with self.assertRaises(UnavailablePinnedSourceParameter):
                pinned_profile(file)
if __name__=='__main__':unittest.main()
