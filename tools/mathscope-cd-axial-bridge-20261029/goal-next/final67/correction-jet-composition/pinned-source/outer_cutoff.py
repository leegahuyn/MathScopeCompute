"""New, source-pinned evaluator of the ORIGINAL N7 outer cutoff.

This module evaluates cutoff jets and the global exact-zero branch.  It never
fills in a missing nonzero potential, pressure, force, or energy value.
The archived primitive is sigma_1 based, not the distinct sigma_2 bump used by
the inner profile. All interval endpoints are rational and outward rounded.
"""
from dataclasses import dataclass
from fractions import Fraction as Q
from functools import lru_cache
from math import comb, factorial
from pathlib import Path
import hashlib
import json

REPO = Path(__file__).resolve().parents[3]
RECOVERY = Path('research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1')
LOCALIZATION = Path('research-ide/mathscope-m3/navier/evidence/source-localization-20261012/attempt1/localization.json')
BINDING = RECOVERY/'work/prune_recovery/energy/evidence/ACTUAL_ENERGY_OPERATOR_BINDING.json'
FAMILY = RECOVERY/'recovered/base/work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json'
PINS = {
    str(LOCALIZATION): 'fa2acf400bb1fe8705bdb716d171882a3343562be3c5167e0fcb153d96cbf24e',
    str(FAMILY): 'b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78',
    'research-ide/mathscope-m3/navier/source-localization.mjs': '5f6480f9799a9a83945f696833b9213585572efbe65e9e755b2935726e6f1036',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


@dataclass(frozen=True)
class I:
    lo: Q
    hi: Q

    def __post_init__(self):
        object.__setattr__(self, 'lo', Q(self.lo))
        object.__setattr__(self, 'hi', Q(self.hi))
        if self.lo > self.hi:
            raise ValueError('REVERSED_INTERVAL')

    @staticmethod
    def point(x):
        return I(x, x)

    def __add__(self, other):
        other = coerce(other)
        return I(self.lo+other.lo, self.hi+other.hi)

    __radd__ = __add__

    def __neg__(self):
        return I(-self.hi, -self.lo)

    def __sub__(self, other):
        return self+-coerce(other)

    def __mul__(self, other):
        other = coerce(other)
        v = [x*y for x in (self.lo, self.hi) for y in (other.lo, other.hi)]
        return I(min(v), max(v))

    __rmul__ = __mul__

    def reciprocal(self):
        if self.lo <= 0 <= self.hi:
            raise ValueError('DIVISION_THROUGH_ZERO')
        return I(1/self.hi, 1/self.lo)

    def __truediv__(self, other):
        return self*coerce(other).reciprocal()

    def square(self):
        return I(0 if self.lo <= 0 <= self.hi else min(self.lo**2,self.hi**2),
                 max(self.lo**2,self.hi**2))

    def encoded(self):
        return [str(self.lo), str(self.hi)]


def coerce(x):
    return x if isinstance(x, I) else I.point(x)


def rounded(v, bits):
    scale = 1 << bits
    low, high = v.lo*scale, v.hi*scale
    return I(Q(low.numerator//low.denominator, scale),
             Q(-((-high.numerator)//high.denominator), scale))


@lru_cache(maxsize=10000)
def exp_negative(x, bits=96):
    """Enclose exp(-x), x >= 0, by rational Taylor remainder and squaring."""
    x = Q(x)
    # chi_jets uses at most 32 extra bits inside its public 4096-bit limit.
    if x < 0 or type(bits) is not int or not 16 <= bits <= 4128:
        raise ValueError('INVALID_EXPONENTIAL_INPUT')
    if not x:
        return I.point(1)
    # e > 2 proves this enclosure; the positive value is never declared zero.
    if x >= bits:
        return I(0, Q(1, 1 << bits))
    y, squares = x, 0
    while y > Q(1, 8):
        y /= 2
        squares += 1
    work_bits = bits+squares+12
    total = term = Q(1)
    n = 0
    while True:
        next_term = term*y/(n+1)
        remainder = next_term/(1-y/(n+2))
        if remainder < Q(1, 1 << work_bits):
            value = rounded(I(total, total+remainder).reciprocal(), work_bits)
            break
        n += 1
        term = next_term
        total += term
    for _ in range(squares):
        value = rounded(value.square(), work_bits)
    return rounded(value, bits)


def flat_polynomial(order):
    if type(order) is not int or not 0 <= order <= 3:
        raise ValueError('SUPPORTED_ORDERS_ZERO_THROUGH_THREE')
    out = [1]
    for _ in range(order):
        nxt = [0]*(len(out)+2)
        for k, coefficient in enumerate(out):
            nxt[k+2] += coefficient
            if k:
                nxt[k+1] -= k*coefficient
        out = nxt
    return out


def monomial_exp_range(power, low_v, high_v, bits):
    """v**power exp(-v) on [low_v,high_v], high_v=None means infinity."""
    def at(v):
        return v**power*exp_negative(v, bits+16)
    left = at(low_v)
    right = at(high_v) if high_v is not None else I.point(0)
    if power and low_v <= power and (high_v is None or high_v >= power):
        maximum = at(Q(power)).hi
    else:
        maximum = max(left.hi, right.hi)
    return I(min(left.lo,right.lo), maximum)


def flat_jet(interval, order, bits):
    """Ordinary derivatives of exp(-1/u), flat at u=0, on 0<=u<=1."""
    if interval.lo < 0 or interval.hi > 1:
        raise ValueError('FLAT_EXPONENTIAL_DOMAIN')
    if interval.hi == 0:
        return I.point(0)
    low_v = 1/interval.hi
    high_v = 1/interval.lo if interval.lo else None
    result = I.point(0)
    for power, coefficient in enumerate(flat_polynomial(order)):
        if coefficient:
            result += coefficient*monomial_exp_range(power,low_v,high_v,bits)
    return rounded(result,bits)


@lru_cache(maxsize=10000)
def chi_jets(low, high, bits=80):
    """Closed-interval, ordinary s derivatives of the exact archived chi(s)."""
    interval = I(low,high)
    if interval.hi <= Q(1,2):
        return (I.point(1),I.point(0),I.point(0),I.point(0))
    if interval.lo >= 1:
        return (I.point(0),)*4
    if interval.lo == interval.hi == Q(3,4):
        return tuple(I.point(x) for x in (Q(1,2),-4,0,128))
    active = I(max(interval.lo,Q(1,2)),min(interval.hi,Q(1)))
    u = 2*active-1
    complement = I(1-u.hi,1-u.lo)
    f = [flat_jet(u,n,bits+16) for n in range(4)]
    g = [(-1)**n*flat_jet(complement,n,bits+16) for n in range(4)]
    h = [f[n]+g[n] for n in range(4)]
    # One of u,1-u is >=1/2: the original denominator is >= exp(-2).
    h[0] = I(max(h[0].lo,exp_negative(Q(2),bits+24).lo),min(h[0].hi,2))
    quotient = []
    for n in range(4):
        numerator = g[n]-sum((comb(n,k)*h[k]*quotient[n-k] for k in range(1,n+1)),I.point(0))
        quotient.append(rounded(numerator/h[0],bits+12))
    result = [rounded((2**n)*quotient[n],bits) for n in range(4)]
    # The literal quotient and its derivative signs give these intersections.
    result[0] = I(max(0,result[0].lo),min(1,result[0].hi))
    result[1] = I(result[1].lo,min(0,result[1].hi))
    if interval.lo <= Q(1,2):
        result[0] = I(result[0].lo,1)
    if interval.hi >= 1:
        result[0] = I(0,result[0].hi)
    # Outside the transition all positive derivatives are exactly zero.
    if interval.lo <= Q(1,2) or interval.hi >= 1:
        result[1:] = [I(min(0,v.lo),max(0,v.hi)) for v in result[1:]]
    return tuple(result)


class ActualOuterCutoff:
    def __init__(self, repo=REPO):
        self.repo = Path(repo)
        for relative, expected in PINS.items():
            if sha(self.repo/relative) != expected:
                raise ValueError('CHANGED_BOUND_SOURCE: '+relative)
        self.archive = json.loads((self.repo/LOCALIZATION).read_text())
        self.binding = json.loads((self.repo/BINDING).read_text())
        encoded = json.dumps(self.binding,sort_keys=True,separators=(',',':')).encode()
        if hashlib.sha256(encoded).hexdigest() != 'f706a250da0c4f1ea003a1cdb9da062998361e8e69831e9625212edf59d3251d':
            raise ValueError('CHANGED_ENERGY_OPERATOR')
        program = self.archive['formulaProgram']
        nodes = program['nodes']
        def expression(index):
            node = nodes[index]
            return (node['op'],tuple(node['args']) if node['op'] in ('coordinate','rational') else tuple(expression(x) for x in node['args']))
        def e(op,*args):
            return (op,tuple(args))
        def rat(x):
            x=Q(x)
            return e('rational',str(x.numerator),str(x.denominator))
        s = expression(program['roots']['primitiveArgument'])
        u = e('add',rat(-1),e('multiply',rat(2),s))
        a = e('exp',e('multiply',rat(-1),e('inverse',u)))
        b = e('exp',e('multiply',rat(-1),e('inverse',e('add',rat(1),e('multiply',rat(-1),u)))))
        primitive = e('smooth_piecewise',s,rat(Q(1,2)),rat(1),rat(1),e('multiply',b,e('inverse',e('add',a,b))),rat(0))
        if expression(program['roots']['primitive']) != primitive:
            raise ValueError('ORIGINAL_PRIMITIVE_AST_MISMATCH')
        self.atoms = tuple(a for a in self.binding['requiredAtoms'] if a.startswith('C@'))
        if len(self.atoms) != 13:
            raise ValueError('CHANGED_ORIGINAL_CUTOFF_JET_REQUEST')

    def evaluate(self, x, y, zeta, rho, bits=80):
        """Physical cutoff jets as normalized rational coefficients times scales."""
        if type(bits) is not int or not 16 <= bits <= 4096:
            raise ValueError('INVALID_ARITHMETIC_PRECISION')
        if any(v.lo < -1 or v.hi > 1 for v in (x,y,zeta)) or rho.lo <= 0 or rho.hi > 1:
            raise ValueError('NORMALIZED_WHOLE_K_POSITIVE_TIME_DOMAIN')
        radial = x.square()+y.square()
        axial = zeta.square()
        zero = radial.lo >= Q(1,2) or axial.lo >= Q(1,2) or rho.lo >= 1
        r = chi_jets(2*radial.lo,2*radial.hi,bits)
        z = chi_jets(2*axial.lo,2*axial.hi,bits)
        t = chi_jets(rho.lo,rho.hi,bits)
        dz = [z[0],4*zeta*z[1],4*z[1]+16*axial*z[2],48*zeta*z[2]+64*(zeta*axial)*z[3]]
        jets = {}
        for atom in self.atoms:
            a,b,c = map(int,atom.split('@')[1].split(','))
            coefficient = I.point(0) if zero else rounded((2**a)*r[a]*dz[b]*t[c],bits)
            jets[atom] = {'coefficient_interval':coefficient.encoded(),'z0_power':-b,'tau0_power':-c}
        return {'status':'EXACT_ZERO' if zero else 'MISSING_ACTUAL_FIELD_JETS',
                'cutoff_jets':jets,'normalized_radial_squared':radial.encoded(),
                'normalized_axial':zeta.encoded(),'normalized_time':rho.encoded(),
                'global_field':{'velocity':[['0','0']]*3,'gradient':[[['0','0']]*3]*3,'pressure':['0','0'],'force':[['0','0']]*3} if zero else None,
                'zero_branch_reason':'Original global smooth zero extension and flat cutoff; no undefined local field is multiplied by zero.' if zero else None,
                'nonzero_field_authenticated':False,'whole_K_energy':None,'actual_last_resolved_tau':None}
