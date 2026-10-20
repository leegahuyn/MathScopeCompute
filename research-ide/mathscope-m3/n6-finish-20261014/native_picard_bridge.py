"""Exact all-variable recurrence identities; native analytic bridge stays open.

The identity applies coefficientwise at EVERY radial order. It proves no
equality between the native pressure DAG and the separately constructed
Lean pressure integral, and never imports a declared norm as a proved norm.
"""
from collections import Counter
from dataclasses import dataclass
import hashlib
import itertools
import json
from pathlib import Path

PINS = {
    'research-ide/mathscope-m2/navier/actual-continuation-exact-core.mjs': 'd657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
    'research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs': '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
    'research-ide/mathscope-m2/navier/actual-continuation-exact-inner.mjs': '3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
    'research-ide/mathscope-m1/navier/sources/official-repo/NavierStokes/AxisContraction.lean': 'd9151673815948eef8e8e2db3e93c95119ce7be80fc6a01d8a83f2bc4cd4df9d',
}


@dataclass(frozen=True)
class E:
    op: str
    args: tuple
    def __add__(self, other): return E('add', (self, expression(other)))
    def __radd__(self, other): return expression(other)+self
    def __neg__(self): return E('mul', (expression(-1), self))
    def __sub__(self, other): return self+-expression(other)
    def __rsub__(self, other): return expression(other)+-self
    def __mul__(self, other): return E('mul', (self, expression(other)))
    def __rmul__(self, other): return expression(other)*self


def expression(x): return x if isinstance(x, E) else E('integer', (int(x),))
def variables(names): return [E('variable', (name,)) for name in names.split()]


def normalize(e):
    """Backend 1: grouped sparse polynomial arithmetic at every AST node."""
    if e.op == 'integer': return {(): e.args[0]} if e.args[0] else {}
    if e.op == 'variable': return {(e.args[0],): 1}
    left, right = map(normalize, e.args)
    result = Counter(left) if e.op == 'add' else Counter()
    if e.op == 'add': result.update(right)
    else:
        for a, b in itertools.product(left, right): result[tuple(sorted(a+b))] += left[a]*right[b]
    return {m: c for m, c in result.items() if c}


def independent_distribute(e):
    """Backend 2: distribute complete signed monomials, group only at end."""
    def terms(x):
        if x.op == 'integer': return [((), x.args[0])]
        if x.op == 'variable': return [((x.args[0],), 1)]
        a, b = map(terms, x.args)
        if x.op == 'add': return a+b
        return [(tuple(sorted(m+n)), c*d) for m, c in a for n, d in b]
    total = Counter()
    for monomial, coefficient in terms(e): total[monomial] += coefficient
    return {m: c for m, c in total.items() if c}


def identities(mutate_angular=False, mutate_pressure=False):
    t,h,D,eta,d,Us,w,H,kappa,phi,u,b,beta,phidot,phieta = variables('t h D eta d Us w H kappa phi u b beta phidot phieta')
    W = w-t*(2*D*eta*b+d*beta)
    actual1 = (W+h*(1-2*eta*(Us+t*u))+d*u*kappa)*phi+W*phidot+(H+t*d*u)*phieta
    expanded1 = ((w+h-2*h*eta*Us)*phi+w*phidot+H*phieta)+d*kappa*u*phi-t*((2*D*eta*b+2*h*eta*u)*phi+d*beta*phi+2*D*eta*b*phidot+d*beta*phidot-d*u*phieta)
    if mutate_angular: expanded1 += 2*t*d*u*phieta
    A,Useta,udot,ueta,P,Peta,Pdot = variables('A Useta udot ueta P Peta Pdot')
    actual2 = A*(1-4*eta*Us)*u-2*A*eta*t*u*u+W*udot+H*ueta+d*Useta*u+t*d*u*ueta-4*A*eta*P+d*Peta-2*eta*Pdot
    expanded2 = ((A-4*A*eta*Us+d*Useta)*u+w*udot+H*ueta)-t*(2*A*eta*u*u+2*D*eta*b*udot+d*beta*udot-d*u*ueta)+(-4*A*eta*P+d*Peta-2*eta*Pdot)
    if mutate_pressure: expanded2 += 4*eta*Pdot
    return {'angular_B14': (actual1, expanded1), 'axial_B15': (actual2, expanded2)}


def certificate():
    records = []
    for name, (a, b) in identities().items():
        residual = a-b
        first, second = normalize(residual), independent_distribute(residual)
        if first or second or first != second: raise ValueError('All-variable source recurrence identity failed: '+name)
        records.append({'id': name, 'allVariablesArbitrary': True, 'firstResidualTerms': len(first),
                        'independentResidualTerms': len(second), 'exactArithmetic': 'integers',
                        'appliesAtEveryRadialOrderByCoefficientComparison': True})
    controls = []
    for kind, kwargs in [('angular-mixed-sign', {'mutate_angular': True}), ('pressure-Euler-factor', {'mutate_pressure': True})]:
        rejected = any(normalize(a-b) and independent_distribute(a-b) for a, b in identities(**kwargs).values())
        if not rejected: raise ValueError('A deliberately changed recurrence survived')
        controls.append({'mutation': kind, 'rejected': bool(rejected)})
    return {'schema': 'MathScope.N6.NativePicardRecurrenceBridge/1', 'exactUniversalScalarIdentities': records,
            'negativeControls': controls,
            'allOrderRecurrenceUniquenessArgument': 'For n>=0, initial Phi_0=1,u_0=0 and p_0=0 are fixed; p_(n+1)=g^2*sum_(i=0)^n Phi_i*Phi_(n-i)/(n+1). Both R1_n and R2_n use only radial coefficients through n and their actual eta derivatives. The positive denominators 2(n+1)(n+2),2(n+1)^2 uniquely fix Phi_(n+1),u_(n+1). Thus equality of all input FUNCTIONS and remainders transfers every coefficient by induction, not by finite sampling.',
            'nativeB_rhoNormBoundProved': False, 'nativePressureEqualsLeanNewPressureProved': False,
            'actualAllCallArgumentDomainsProved': False, 'newClosedJets': 0,
            'pendingExactSourceFunctionEquality': ['native appendActualPressure P0 versus Lean newClockWeight/newShapeExponent integral, including all clock partitions, wait and exterior tails', 'native g primitive versus realAmplitude with exactly the same source parameters and integration constant', 'native stored coefficient semantics versus the fixed-point coefficient recurrence on the complete common parameter domain'],
            'N6-01': 'OPEN', 'N6-02': 'PARTIAL'}


def run(context, out):
    out = Path(out);out.mkdir(parents=True, exist_ok=True)
    result = certificate()
    bindings = []
    for name, expected in PINS.items():
        data = (Path(context['repo'])/name).read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        if digest != expected: raise ValueError('Original native recurrence source changed: '+name)
        bindings.append({'path': name, 'bytes': len(data), 'sha256': digest})
    result['originalSourceByteBindings'] = bindings
    result['bindingScope'] = 'Pinned original source bytes plus explicit universal scalar equations; full native/Lean input-function equality remains pending.'
    path = out/'native-picard-recurrence-bridge.json'
    path.write_text(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2)+'\n', encoding='utf8')
    return result
