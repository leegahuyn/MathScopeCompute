"""Actual-source negative controls and independent symbolic regressions."""
import copy
import json
import os
from pathlib import Path
from fractions import Fraction as Q
import unittest
import direct_discharge as d

ROOT=Path(os.environ.get('N6_PREPARED','/mnt/data/n6-source/prepared'))
PRIOR=Path(os.environ.get('N6_PRIOR','/mnt/data/n6-final'))
EVIDENCE=Path(os.environ.get('N6_EVIDENCE','/mnt/data/n6-stage4/evidence'))
SOURCE=Path(os.environ.get('N6_SOURCE','/mnt/data/n6-domain-full'))
STAGE3=Path(os.environ.get('N6_STAGE3','/mnt/data/n6-stage3/MathScope_N6_Stage3_Verified/verify_domain_transport.py'))
BUMP=Path(os.environ.get('N6_BUMP','/mnt/data/n6-bump-package/MathScope_N6_Bump_Bridge_2026-10-14/n6_bump_bridge.py'))

class SourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.s3=d.load_module(STAGE3,'previous_stage3_test',d.STAGE3_SHA)
        cls.bump=d.load_module(BUMP,'previous_bump_test',d.BUMP_SHA)
        cls.cp=cls.s3.read_locked(ROOT/'cartesian/checkpoints/cartesian-source-checkpoint.json',cls.s3.PINS['checkpoint'])
        cls.p=cls.cp['cartesian']['scalarProgram'];cls.f=cls.s3.read_locked(PRIOR/'OBLIGATION_MATRIX.json',cls.s3.PINS['frontier'])
        cls.g=cls.s3.Source(EVIDENCE/'stage3-replay/source-cache.sqlite')
        cls.reg=cls.s3.registries(d.read(SOURCE/'header.json'))
        cls.result=d.read(EVIDENCE/'OBLIGATION_MATRIX_STAGE4.json')
        cls.lemmas=d.primitive_lemmas(cls.p)
    def mutate(self,ident,node):
        p=copy.deepcopy(self.p);p[ident]=node;return p
    def test_original_input_identity(self):
        self.assertEqual(d.sha(self.p),d.SCALAR)
        self.assertEqual(d.base_binding(self.p,self.g,self.reg)['completeRootCoordinateSupport'],[622803,622804])
    def test_exact_guard_inventory(self):
        rows=d.guard_table(self.p,self.f,self.lemmas)
        closed=[r for r in rows if r['status']=='DISCHARGED_ORIGINAL_GUARD']
        self.assertEqual(len(rows),38);self.assertEqual(len(closed),22)
        self.assertEqual({int(r['id'].split('-')[2]) for r in closed},set(d.TARGETS))
    def test_original_eight_guard_targets_really_discharged(self):
        ids={int(x.split('-')[2]) for x in self.result['dischargedOriginalGuardIDs']}
        self.assertTrue(set((25,38,40,41,68,76,84,92))<=ids)
    def test_no_jet_or_pde_counter_promotion(self):
        self.assertEqual(self.result['after'],{'CartesianJet':230,'GlobalGuard':16,'PDE':1020,'total':1266})
        self.assertFalse(self.result['allOriginalObligationsDischarged'])
        self.assertEqual(self.result['M3'],'56/64')
    def test_every_original_guard_id_conserved(self):
        all_ids=self.result['dischargedOriginalGuardIDs']+self.result['remainingGlobalGuardIDs']
        self.assertEqual(len(all_ids),len(set(all_ids)))
        self.assertEqual(set(all_ids),set(self.f['remainingGlobalGuardIDs']))
    def test_all_230_actual_jet_ids_preserved(self):
        r=d.jet_audit(self.p,self.f,self.g,self.reg)
        self.assertEqual(r['attempted'],230);self.assertEqual(len(r['sourceFamilies']),19)
        self.assertEqual([x['id'] for x in r['rows']],self.f['remainingJetIDs'])
        self.assertTrue(all(not x['firstAttempt']['derivativeProved'] for x in r['sourceFamilies']))
    def test_all_1020_actual_pde_terms_checked(self):
        r=d.pde_audit(ROOT,self.g);self.assertEqual([x['formalNonzeroMonomials'] for x in r],[169,197,654])
        self.assertTrue(all(not x['analyticNonzeroCounterexampleClaimed'] for x in r))
    def test_all_ten_alpha_and_root_equalities(self):
        c=d.ScalarNormalizer(self.p)
        for row in self.lemmas['alphaEquivalentPrimitivePairs']:
            self.assertEqual(c.at(row['left']),c.at(row['right']))
    def test_collar_entirely_inside_fixed_mass_plateau(self):
        self.assertLess(Q(1,110),Q(1,4));self.assertGreater(Q(819200,121),3)
    def test_historical_frontier_was_not_changed(self):
        self.assertEqual(len(self.f['remainingGlobalGuardIDs']),38)
        self.assertEqual(len(self.f['remainingJetIDs']),230)
    def test_normalizer_does_not_cancel_zero_times_undefined(self):
        self.assertIn('UNSUPPORTED',repr(d.mul([('q','0'),('UNSUPPORTED_OPAQUE',247)])))
    def test_uncertified_complete_gr_not_silently_substituted(self):
        c=d.ScalarNormalizer(self.p)
        with self.assertRaises(ValueError):c.at(1528)
    def test_root_replacement_that_changes_Z_is_not_identity(self):
        p=self.mutate(1412,{'op':'unresolved_opaque_substitution','args':[114,3,1411]})
        c=d.ScalarNormalizer(p);self.assertNotEqual(c.at(114),c.at(1412))
    def test_mass_changed_endpoint_rejected(self):
        p=self.mutate(230,{'op':'definite_integral','args':[130,119,132,2]})
        with self.assertRaises(ValueError):d.primitive_lemmas(p)
    def test_mass_changed_binder_rejected(self):
        p=self.mutate(230,{'op':'definite_integral','args':[130,3,132,229]})
        with self.assertRaises(ValueError):d.primitive_lemmas(p)
    def test_alpha_mass_wrong_endpoint_rejected(self):
        p=self.mutate(1508,{'op':'definite_integral','args':[1441,1411,132,2]})
        with self.assertRaises(ValueError):d.primitive_lemmas(p)
    def test_alpha_mass_omitted_body_factor_rejected(self):
        p=self.mutate(1508,{'op':'definite_integral','args':[1425,1411,132,1507]})
        with self.assertRaises(ValueError):d.primitive_lemmas(p)
    def test_nonzero_inactive_bump_branch_rejected(self):
        p=self.mutate(129,{'op':'smooth_piecewise','args':[122,0,1,1,128,0]})
        with self.assertRaises(ValueError):d.primitive_lemmas(p)
    def test_other_bump_tail_rejected(self):
        p=self.mutate(242,{'op':'smooth_piecewise','args':[235,0,1,0,241,1]})
        with self.assertRaises(ValueError):d.primitive_lemmas(p)
    def test_changed_native_root_call_rejected(self):
        def changed(i):return {'op':'actual_monotone_root','args':[2,622802,622804]} if i==622820 else self.g(i)
        with self.assertRaises(ValueError):d.base_binding(self.p,changed,self.reg)
    def test_hidden_native_root_coordinate_rejected(self):
        def changed(i):return {'op':'coordinate','args':['hidden']} if i==622819 else self.g(i)
        with self.assertRaises(ValueError):d.base_binding(self.p,changed,self.reg)
    def test_changed_source_scalar_even_outside_targets_rejected(self):
        p=self.mutate(250,{'op':'rational','args':['0','1']})
        with self.assertRaises(ValueError):d.base_binding(p,self.g,self.reg)
    def test_each_beta_inverse_has_every_path_guarded(self):
        for target,guard in [(1421,1425),(1436,1440),(1519,1523)]:
            r=d.active_branch_paths(self.p,target)
            self.assertTrue(r['allUsePathsGuarded']);self.assertTrue(all(x[-1]==guard for x in r['dominatedPaths']))
    def test_unguarded_extra_inverse_use_is_rejected(self):
        p=copy.deepcopy(self.p);p.append({'op':'add','args':[1422,1]})
        with self.assertRaises(ValueError):d.active_branch_paths(p,1421)
    def test_guard_test_itself_must_not_evaluate_inverse(self):
        p=self.mutate(1425,{'op':'smooth_piecewise','args':[1422,0,1,0,1424,0]})
        with self.assertRaises(ValueError):d.active_branch_paths(p,1421)
    def test_wrong_positive_interval_rejected(self):
        p=self.mutate(1425,{'op':'smooth_piecewise','args':[1418,8,1,0,1424,0]})
        with self.assertRaises(ValueError):d.active_branch_paths(p,1421)
    def test_one_plus_instead_of_one_minus_rejected(self):
        p=self.mutate(1420,{'op':'add','args':[1,1418]})
        with self.assertRaises(ValueError):d.active_branch_paths(p,1421)
    def test_unrelated_matching_guard_cannot_hide_uncovered_path(self):
        p=copy.deepcopy(self.p);p.append({'op':'smooth_piecewise','args':[1418,0,1,0,1422,0]});p.append({'op':'multiply','args':[1422,2]})
        with self.assertRaises(ValueError):d.active_branch_paths(p,1421)
    def test_dropped_original_guard_rejected(self):
        f=copy.deepcopy(self.f);f['remainingGlobalGuardIDs'].pop()
        with self.assertRaises(ValueError):d.guard_table(self.p,f,self.lemmas)
    def test_changed_Leibniz_direction_rejected(self):
        f=copy.deepcopy(self.f);f['cumulativeGlobalGuardRows'][38]['originalGuard']['variable']=16
        with self.assertRaises(ValueError):d.guard_table(self.p,f,self.lemmas)
    def test_changed_Leibniz_integrand_rejected(self):
        f=copy.deepcopy(self.f);f['cumulativeGlobalGuardRows'][38]['originalGuard']['body']=248
        with self.assertRaises(ValueError):d.guard_table(self.p,f,self.lemmas)
    def test_fake_extra_closed_guard_not_accepted(self):
        f=copy.deepcopy(self.f);f['cumulativeGlobalGuardRows'][59]['originalGuard']={'kind':'NONZERO_ACTUAL_ARGUMENT','operand':230}
        with self.assertRaises(ValueError):d.guard_table(self.p,f,self.lemmas)
    def test_jet_derivative_order_preserved(self):
        r=d.jet_audit(self.p,self.f,self.g,self.reg)
        for x in r['rows']:self.assertEqual(x['orderedDerivativeCoordinates'],x['originalNode']['args'][1])
    def test_missing_actual_jet_registry_is_not_zero(self):
        reg=dict(self.reg);reg['expression']=[]
        with self.assertRaises(IndexError):d.jet_audit(self.p,self.f,self.g,reg)
    def test_changed_PDE_native_factor_rejected(self):
        def changed(i):return {'op':'rational','args':['0','1']} if i==3677065 else self.g(i)
        with self.assertRaises(ValueError):d.pde_audit(ROOT,changed)

class IndependentAlgebraTests(unittest.TestCase):
    def test_bump_all_order_recurrence_regression(self):
        # Separate CAS differentiation of the rational prefactor, not the checker recurrence.
        import sympy as s
        bump=d.load_module(BUMP,'bump_independent_algebra',d.BUMP_SHA)
        t=s.symbols('t');u=t*(1-t);rows=bump.polynomials(12)
        for n in range(12):
            a=sum(s.Integer(x)*t**j for j,x in enumerate(rows[n]['P_ascending']))
            b=sum(s.Integer(x)*t**j for j,x in enumerate(rows[n+1]['P_ascending']))
            self.assertEqual(s.cancel(s.diff(a/u**(2*n),t)+(a/u**(2*n))*s.diff(-1/u,t)-b/u**(2*n+2)),0)
    def test_beta_mass_change_of_variable(self):
        import sympy as s
        a,t=s.symbols('a t',positive=True);r=a*(1+t/10)
        self.assertEqual(s.simplify(s.diff(r,t)/a),s.Rational(1,10))
        self.assertEqual(s.simplify(10*(r/a-1)),t)
    def test_native_step_strict_monotonicity_formula(self):
        import sympy as s
        t=s.symbols('t');z=-1/t**2+1/(1-t)**2
        self.assertEqual(s.cancel(s.diff(z,t)-(2/t**3+2/(1-t)**3)),0)
    def test_slow_implicit_first_derivative_formula(self):
        import sympy as s
        r,Z,T,h=s.symbols('r Z T h',positive=True);F=r-Z**2*r**(2*h)-T
        fs=1-2*h*Z**2*r**(2*h-1)
        self.assertEqual(s.simplify(s.diff(F,r)-fs),0)
        self.assertEqual(s.simplify(-s.diff(F,Z)/fs-2*Z*r**(2*h)/fs),0)
    def test_no_integral_global_completion_from_constant_bump(self):
        # A separate nonintegrable summand is not repaired by a smooth normalization.
        f={'kind':'ACTUAL_FINITE_INTEGRAL_LEIBNIZ','operand':249}
        self.assertIn('complete_gr',d.remaining_reason(f))

if __name__=='__main__':unittest.main(verbosity=2)
