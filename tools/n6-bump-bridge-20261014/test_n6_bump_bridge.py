"""Exact source and algebra tests; no finite sample is a PDE proof."""
import copy
import json
import os
from pathlib import Path
import unittest
from fractions import Fraction as Q
import sympy as s
import n6_bump_bridge as b

PREPARED = Path(os.environ.get('N6_PREPARED','/mnt/data/n6-source/prepared'))
FRONTIER = Path(os.environ.get('N6_FRONTIER','/mnt/data/n6-final/OBLIGATION_MATRIX.json'))

class SourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cp=b.read_locked(PREPARED/'cartesian/checkpoints/cartesian-source-checkpoint.json',b.CHECKPOINT_SHA)
        cls.program=cls.cp['cartesian']['scalarProgram']
        cls.params=b.parameters(cls.cp)
        cls.frontier=b.read_locked(FRONTIER,b.FRONTIER_SHA)

    def test_real_source_binding(self):
        self.assertEqual(len(b.verify_binding(self.program,self.params,self.frontier)),8)

    def mutated_node(self, i, op=None, args=None):
        p=copy.deepcopy(self.program)
        if op is not None:p[i]['op']=op
        if args is not None:p[i]['args']=args
        with self.assertRaises(ValueError):b.verify_binding(p,self.params,self.frontier)

    def test_reject_mass_binder_change(self):self.mutated_node(230,args=[130,232,132,229])
    def test_reject_mass_endpoint_change(self):self.mutated_node(230,args=[130,119,132,2])
    def test_reject_nonzero_inactive_branch(self):self.mutated_node(129,args=[122,0,1,1,128,0])
    def test_reject_exponential_sign_change(self):self.mutated_node(127,args=[1,126])
    def test_reject_hidden_clock_operand_change(self):self.mutated_node(206,args=[205,0])
    def test_reject_second_join_capture_change(self):self.mutated_node(233,args=[117,119])
    def test_reject_unrelated_source_tamper(self):self.mutated_node(250,op='fake_zero')

    def test_reject_exact_parameter_change(self):
        p=copy.deepcopy(self.params);p['h']={'rational':'0'}
        with self.assertRaises(ValueError):b.verify_binding(self.program,p,self.frontier)

    def test_reject_dropped_guard(self):
        f=copy.deepcopy(self.frontier);f['remainingGlobalGuardIDs'].pop()
        with self.assertRaises(ValueError):b.verify_binding(self.program,self.params,f)

    def test_reject_jet_zero_counter(self):
        f=copy.deepcopy(self.frontier);f['remainingJetIDs']=[]
        with self.assertRaises(ValueError):b.verify_binding(self.program,self.params,f)

    def test_reject_false_target_promotion(self):
        f=copy.deepcopy(self.frontier)
        next(r for r in f['cumulativeGlobalGuardRows'] if r['id'].startswith('N6-C-025-'))['status']='PASS'
        with self.assertRaises(ValueError):b.verify_binding(self.program,self.params,f)

    def test_native_profile_parameters(self):
        self.assertEqual(self.params['Xa'],{'quotient':[{'integer':4},{'ref':'Lambda'}]})
        self.assertEqual(self.params['BOuter'],{'product':[{'integer':1000},{'ref':'T'}]})

class ExactAlgebraTests(unittest.TestCase):
    def test_all_twelve_polynomial_recurrences_independent_cas(self):
        t=s.symbols('t');u=t*(1-t);rows=b.polynomials(12)
        polys=[sum(s.Integer(x)*t**i for i,x in enumerate(row['P_ascending'])) for row in rows]
        for n in range(12):
            # Differentiate the rational prefactor times the exponential independently.
            expected=s.diff(polys[n]/u**(2*n),t)+(polys[n]/u**(2*n))*s.diff(-1/u,t)
            self.assertEqual(s.cancel(expected-polys[n+1]/u**(2*n+2)),0)

    def test_every_regression_l1_bound(self):
        for r in b.polynomials(32):
            self.assertLessEqual(r['coefficient_l1'],r['B'])
            self.assertLessEqual(len(r['P_ascending'])-1,3*r['order'])

    def test_affine_substitution_and_jacobian(self):
        a,t=s.symbols('a t',positive=True);r=a*(1+t/10)
        self.assertEqual(s.simplify(10*(r/a-1)),t)
        self.assertEqual(s.simplify(s.diff(r,t)/a),s.Rational(1,10))

    def test_exponential_lower_bound_interval_polynomial(self):
        t=s.symbols('t')
        self.assertEqual(s.expand(t*(1-t)-s.Rational(3,16)-(t-s.Rational(1,4))*(s.Rational(3,4)-t)),0)

    def test_log_scale_differential_operator_on_monomials(self):
        a,r=s.symbols('a r',positive=True)
        for degree in range(6):
            for n in range(3):
                radial=s.diff((10*(r/a-1))**degree/a,r,n)
                for m in range(4):
                    if m:radial=s.expand(a*s.diff(radial,a))
                    y=r/a;t=s.symbols('t')
                    rhs=sum(s.Integer(c)*y**j*s.diff(t**degree,t,n+j).subs(t,10*(y-1))
                            for j,c in enumerate(b.log_scale_coefficients(m,n)))
                    rhs*=s.Integer(10)**n/a**(n+1)
                    self.assertEqual(s.cancel(radial-rhs),0)

    def test_native_squared_scale_support_conditions(self):
        # All boundary comparisons are over positive scales, so squaring is equivalent.
        self.assertEqual((Q(11,10))**2*6,Q(363,50))
        self.assertEqual(Q(8)-Q(363,50),Q(37,50))
        self.assertEqual(b.finite_margins()['inverse_mass_strict_upper'],'14580')

    def test_plateau(self):self.assertEqual(b.support_regime(Q(2),Q(1),Q(4)),'FULL_MASS_CONSTANT')
    def test_lower_tangency_zero_mass(self):self.assertEqual(b.support_regime(Q(10),Q(11),Q(20)),'ZERO_MASS')
    def test_upper_tangency_zero_mass(self):self.assertEqual(b.support_regime(Q(2),Q(1),Q(2)),'ZERO_MASS')
    def test_partial_overlap_not_constant(self):self.assertEqual(b.support_regime(Q(1),Q(21,20),Q(2)),'POSITIVE_PARTIAL_MASS')
    def test_counterexample_to_unrestricted_nonzero_scale(self):
        self.assertEqual(b.support_regime(Q(4),Q(1),Q(2)),'ZERO_MASS')
    def test_reject_negative_scale(self):
        with self.assertRaises(ValueError):b.support_regime(Q(-1),Q(1),Q(2))
    def test_reject_reversed_endpoints(self):
        with self.assertRaises(ValueError):b.support_regime(Q(1),Q(3),Q(2))
    def test_reject_unbounded_regression_request(self):
        with self.assertRaises(ValueError):b.polynomials(100000)

if __name__=='__main__':unittest.main(verbosity=2)
