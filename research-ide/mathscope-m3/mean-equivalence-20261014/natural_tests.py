"""Meaningful negative controls for the actual natural/B8 proof audit."""
import copy, json, re, sys, unittest
from fractions import Fraction as F
import natural_actual as n


class Poly:
    """Small exact multivariate polynomial, with no numerical substitution."""
    def __init__(self,value=0):
        self.p=value if isinstance(value,dict) else ({():F(value)} if value else {})
    def __add__(self,other):
        other=other if isinstance(other,Poly) else Poly(other);p=self.p.copy()
        for m,c in other.p.items():p[m]=p.get(m,F(0))+c
        return Poly({m:c for m,c in p.items() if c})
    __radd__=__add__
    def __neg__(self):return Poly({m:-c for m,c in self.p.items()})
    def __sub__(self,other):return self+-other if isinstance(other,Poly) else self+Poly(-other)
    def __rsub__(self,other):return Poly(other)+-self
    def __mul__(self,other):
        other=other if isinstance(other,Poly) else Poly(other);p={}
        for a,c in self.p.items():
            for b,d in other.p.items():
                m=tuple(sorted(a+b));p[m]=p.get(m,F(0))+c*d
        return Poly({m:c for m,c in p.items() if c})
    __rmul__=__mul__
    def zero(self):return not self.p

def symbol(name):return Poly({(name,):F(1)})

def angular_identity():
    t,h,D,eta,d,U,W,H,kappa,phi,u,B,Beta,dot,phieta=map(symbol,
        ['t','h','D','eta','d','U','W','H','kappa','phi','u','B','Beta','dot','phieta'])
    wc=W-t*(2*D*eta*B+d*Beta)
    literal=(wc+h*(1-2*eta*(U+t*u))+d*u*kappa)*phi+wc*dot+(H+t*d*u)*phieta
    mixed=d*Beta*phi+d*Beta*dot
    grouped=(W+h-2*h*eta*U)*phi+W*dot+H*phieta+d*kappa*u*phi-t*(
        (2*D*eta*B+2*h*eta*u)*phi+mixed+2*D*eta*B*dot-d*u*phieta)
    return literal,grouped,mixed,t


class NaturalControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.branch=n.continuous_preconditioner_proof([])
        cls.module=sys.modules['dyadic_interval']
        def interval(x):return cls.module.I(int(x['lowerNumerator']),int(x['upperNumerator']),raw=True)
        cls.A=[[interval(x) for x in row] for row in cls.branch['linearMatrix']]
        cls.Q=[[interval(x) for x in row] for row in cls.branch['quadraticMatrix']]
        cls.R=[[F(x) for x in row] for row in cls.branch['preconditioner']]

    def test_actual_operator_and_missing_mixed_term(self):
        literal,grouped,mixed,t=angular_identity()
        self.assertTrue((literal-grouped).zero())
        self.assertFalse((literal-(grouped+t*mixed)).zero())
        self.assertFalse((literal-(grouped+2*t*mixed)).zero())

    def test_energy_linear_debt_cancels_before_derivative(self):
        u,c,delta=map(symbol,['u','c','delta'])
        # Substitute u=c+delta exactly, without assigning sample values.
        u=c+delta
        self.assertTrue((u*u-c*c-2*c*(u-c)-delta*delta).zero())
        self.assertFalse((u*u-c*c-c*(u-c)-delta*delta).zero())

    def test_actual_source_parameter_mutation_rejected(self):
        path=n.M2+'source-profile-data.mjs';raw=n.source_bytes(path)
        changed=raw.replace(b'8002',b'8003',1)
        self.assertNotEqual(raw,changed)
        with self.assertRaises(ValueError):n.check_source_bytes(path,changed)

    def test_omitted_actual_history_rejected(self):
        path=n.M2+'actual-continuation-exact-pregluing.mjs';raw=n.source_bytes(path)
        needle=b"increment(idealEAt,()=>Gi,Xsep,restLeft,'ideal_gap_moments')"
        self.assertIn(needle,raw)
        changed=raw.replace(needle,b'Array(5).fill(G.zero)',1)
        with self.assertRaises(ValueError):n.check_source_bytes(path,changed)

    def test_changed_eta_capture_and_point_rejected(self):
        actual={4483:{'op':'actual_natural_series','args':['average',474,2,0,0]},
                474:{'op':'rational','args':['4','1']},5029:{'op':'actual_quadratic_root','args':[0,4,2]}}
        n.selected_gate_guard(actual.__getitem__)
        changed=copy.deepcopy(actual);changed[4483]['args'][2]=3452
        with self.assertRaises(ValueError):n.selected_gate_guard(changed.__getitem__)
        changed=copy.deepcopy(actual);changed[474]['args'][0]='5'
        with self.assertRaises(ValueError):n.selected_gate_guard(changed.__getitem__)

    def test_actual_preconditioner_sign_mutation_rejected(self):
        n.selected_branch_guards(self.module,self.A,self.Q,self.R)
        wrong=copy.deepcopy(self.R);wrong[0]=[-x for x in wrong[0]]
        with self.assertRaises(ValueError):n.selected_branch_guards(self.module,self.A,self.Q,wrong)

    def test_remainder_aggregate_half_factor(self):
        (b,l),_=n.bound_tree()
        self.assertEqual(sum(b.values()),58);self.assertEqual(sum(l.values()),102)
        self.assertEqual(sum(b.values())/2,29);self.assertEqual(sum(l.values())/2,51)
        # Removing the pressure tree changes the actual polynomial.
        self.assertNotEqual(b,n.pa(b,n.ps({11:F(1)},-1)))


if __name__=='__main__':unittest.main()
