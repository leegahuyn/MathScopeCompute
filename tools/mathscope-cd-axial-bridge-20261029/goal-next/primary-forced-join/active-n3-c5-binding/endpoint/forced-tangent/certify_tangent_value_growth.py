"""Exact source-specific energy growth for the two actual forced mode-two inputs."""

from fractions import Fraction
import hashlib
import json
from pathlib import Path
import sympy as sp

ROOT = Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next')
PREVIOUS = ROOT / 'primary-forced-join/active-n3-c5-binding/endpoint/forced-damping'
OUT = Path('work/goal-next/continuation45/forced')


def pinned(path, digest):
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == digest, path
    return json.loads(raw)


window = pinned(PREVIOUS / 'two-pulse-source-windows.json',
                '347ca74441e6a9861383bb146660b78d559702afc8a443dc900e5d9dc2d2254b')
old = pinned(PREVIOUS / 'n3-two-actual-pulse-damping-transport.json',
             'ebae8e28350f3939cc37f97ae1252ce28a118ddb077ed41852e012ace1be1755')
floor = pinned(PREVIOUS / 'n3-two-actual-pulse-damping-floor.json',
               'd691b408fc4c74b374da0f3156625c95b76fd8f82180d0849ead2954f39cf453')
original = Path('work/goal-next/continuation36/hosted-43363985266/mathscope-original-n3-primary-c5/witness')
witness_path = original / 'original-active-mode-two-witness.json'
witness = pinned(witness_path, 'a35bd111ef2f60b0e779a85433571db8caa00061616da91372782a28a16859e9')
assert witness['snapshot']['node_stream_sha256'] == window['witnessGraphSHA256']
assert witness['snapshot']['definitions_sha256'] == window['witnessRegistrySHA256']
registry = pinned(original / 'original-source-functions.json', window['witnessRegistrySHA256'])
expressions = json.loads(registry['base']['base']['expression'])
assert expressions[32027]['name'] == 'M3GlobalBandSlow_F'
assert expressions[32028]['name'] == 'M3GlobalBandSlow_G'
nodes = {int(key): value for key, value in window['nodes'].items()}


def check(root, operation, operands):
    assert nodes[root] == {'op': operation, 'args': operands}, (root, nodes[root])


def expression(root, atoms, cache):
    if root in atoms:
        return atoms[root]
    if root in cache:
        return cache[root]
    node = nodes.get(root)
    if node is None:
        return sp.Symbol(f'outside_{root}')
    operation, operands = node['op'], node['args']
    if operation == 'rational':
        value = sp.Rational(int(operands[0]), int(operands[1]))
    elif operation == 'add':
        value = sum((expression(i, atoms, cache) for i in operands), sp.Integer(0))
    elif operation == 'multiply':
        value = sp.prod(expression(i, atoms, cache) for i in operands)
    elif operation == 'inverse':
        value = 1 / expression(operands[0], atoms, cache)
    elif operation == 'integer_power':
        value = expression(operands[0], atoms, cache) ** operands[1]
    else:
        value = sp.Symbol(f'opaque_{root}')
    cache[root] = value
    return value


checks = []
for source, verified in zip(witness['rows'], old['rows'], strict=True):
    assert source['key'] == verified['key'] and source['system'] == verified['system']
    assert source['system'] in (1, 5) and source['m'] == 2
    matrix = source['K']
    assert matrix == [[0, 17733152, 0], [17733154, 0, 0], [17733121, 0, 0]]
    check(17733152, 'multiply', [20, 17733151])
    check(20, 'rational', ['-1', '1'])
    check(17733151, 'multiply', [24, 17732934])
    check(24, 'rational', ['2', '1'])
    check(17733154, 'add', [17733151, 17733153])
    check(17733153, 'multiply', [17732748, 17733119])
    parameters = [17732748, 17732749, 17732750, 17732737]
    check(17732934, 'actual_expression_partial', [32027, parameters, [0, 0, 0, 0]])
    check(17733119, 'actual_expression_partial', [32027, parameters, [1, 0, 0, 0]])
    check(17733121, 'actual_expression_partial', [32028, parameters, [1, 0, 0, 0]])
    assert expressions[32027]['parameters'] == expressions[32028]['parameters'] == parameters
    normal = source['normal']['value']
    normroot = source['normal']['squared']
    actual_n = sp.Matrix(sp.symbols('actual_n0:3', real=True))
    actual_atoms = dict(zip(normal, actual_n))
    actual_atoms[normroot] = (actual_n.T * actual_n)[0]
    tangencies = []
    for part in ('real', 'imaginary'):
        actual_forcing = sp.Matrix([expression(item[part], actual_atoms, {}) for item in source['projectedSource']])
        tangent_residual = sp.factor((actual_n.T * actual_forcing)[0])
        assert tangent_residual == 0, (source['key'], part, str(tangent_residual))
        tangencies.append(part)
    checks.append({'key': source['key'], 'system': source['system'], 'principalK': matrix,
                   'F': 17732934, 'FR': 17733119, 'GR': 17733121, 'R': 17732748,
                   'actualProjectedTangencies': tangencies})

# The authenticated source Aphi identity supplies the exact rank-one term.
# Verify the tangent algebra and the real orthogonal forcing projection.
n = sp.Matrix(sp.symbols('n0:3', real=True))
np = sp.Matrix(sp.symbols('np0:3', real=True))
normsq = (n.T * n)[0]
F, a, b = sp.symbols('F a b', real=True)
K = sp.Matrix([[0, -2 * F, 0], [2 * F + a, 0, 0], [b, 0, 0]])
P = sp.eye(3) - n * n.T / normsq
Aphi = -K + n * (n.T * K - np.T) / normsq
assert all(sp.factor(z) == 0 for z in n.T * Aphi + np.T)
assert all(sp.factor(z) == 0 for z in P.T - P)
assert all(sp.factor(z) == 0 for z in P * P - P)
assert all(sp.factor(z) == 0 for z in n.T * P)

u = sp.Matrix(sp.symbols('u0:3', real=True))
dotnu = (n.T * u)[0]
energy = (u.T * Aphi * u)[0]
rankone = dotnu * ((n.T * K - np.T) * u)[0] / normsq
assert sp.factor(energy - rankone + a * u[0] * u[1] + b * u[0] * u[2]) == 0
assert sp.factor(energy - (u.T * (-K) * u)[0] - rankone) == 0
forcing = sp.Matrix(sp.symbols('f0:3', real=True))
assert sp.factor((forcing.T * forcing)[0] - ((P * forcing).T * (P * forcing))[0]
                 - (n.T * forcing)[0] ** 2 / normsq) == 0

# A negative control catches dropping the tangent constraint. At this exact
# real example rank-one growth is positive even though the shear rate is zero.
control_n = sp.Matrix([1, 0, 0])
control_np = sp.Matrix([-1, 0, 0])
control_u = sp.Matrix([1, 0, 0])
control_A = control_n * (-control_np.T)
assert (control_u.T * control_A * control_u)[0] == 1
assert (control_n.T * control_u)[0] == 1

# Each of the two real parts of the complex system obeys the same real
# tangent identity. Complex Euclidean energy is the sum of these two.
# |a u0 u1+b u0 u2| <= sqrt(a^2+b^2)*|u0|*sqrt(u1^2+u2^2)
# <= (sqrt(a^2+b^2)/2)*|u|^2 by two exact square inequalities.
x, y = sp.symbols('x y', real=True)
assert sp.expand((x - y) ** 2 - (x * x + y * y - 2 * x * y)) == 0
assert sp.expand((a * u[2] - b * u[1]) ** 2
                 - ((a * a + b * b) * (u[1] ** 2 + u[2] ** 2)
                    - (a * u[1] + b * u[2]) ** 2)) == 0

whole = pinned(ROOT / 'primary-forced-join/active-n3-c5-binding/norm-leading/n3-whole-k.json',
               '0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb')
chart_path = Path('work/goal-next/continuation37/slow-chart-directed.json')
chart = pinned(chart_path, '81f5a9ad2d0141a495d0e6a99e07e453fd754aaa6473d006a6426423a9352ddd')
assert chart['parameterExpressionSHA256'] == witness['source']['parameterExpressionSHA256']


def tower_seed(endpoint, depth):
    for _ in range(depth):
        assert list(endpoint) == ['exp']
        endpoint = endpoint['exp']
    assert list(endpoint) == ['rational']
    return Fraction(endpoint['rational'])


seedK = tower_seed(whole['enclosure']['upper'], 10)
seedH = tower_seed(chart['H']['upper'], 4)
seed = max(seedK, seedH)
assert seed > 13 and seed + 1 < 2 ** 21
upper = {'rational': str(seed + 1)}
for _ in range(10):
    upper = {'exp': upper}

out = {
    'status': 'CONDITIONAL_ACTUAL_TANGENT_PROPAGATOR_VALUE_GROWTH',
    'rows': checks,
    'exactPrincipalK': '[[0,-2F,0],[2F+R*FR,0,0],[GR,0,0]]',
    'constraintIdentity': 'n^T*Aphi+nprime^T=0; n^T*(-P*rawForcing)=0.',
    'invariant': 'The exact source zero-data solution has n(w)^T*u(w)=0 throughout every admitted pulse interval.',
    'energyIdentity': 'For tangent complex u, Re(u* Aphi u)=-R*FR*Re(conj(u0)*u1)-GR*Re(conj(u0)*u2).',
    'rate': 'a(w)=sqrt((R*FR)^2+GR^2)/2; Re(u* Aphi u)<=a(w)*|u|_2^2.',
    'dampedTangentPropagator': '|U(t,s)z|_2<=exp(integral_s^t[a(w)-4*epsilon*k^2*|n(w)|^2]dw)*|z|_2 for n(s)^T z=0.',
    'sourceForcingContraction': '|-P(w) rawForcing(w)|_2<=|rawForcing(w)|_2.',
    'zeroDataValueBound': '|u(t)|_2<=integral_0^t exp(integral_s^t[a(w)-4*epsilon*k^2*|n(w)|^2]dw)*|rawForcing(s)|_2 ds.',
    'finiteValueEnvelope': '|u(t)|_2<=Fraw*t*exp(max(Abg-mu,0)*t), with Fraw>=sup|rawForcing|_2, Abg>=sup a and mu=4epsilon/Renv^2.',
    'sourceBackgroundReduction': 'If the original same-family C8 bound dominates |FR|,|GR| on the actual band and R<=Renv, then Abg=(Renv+1)*K/2<=H*K, where H>=max(2,Renv).',
    'directedConditionalRateUpper': upper,
    'directedGapProof': 'Kupper=exp^10(a), Hupper=exp^4(b). For a,b>13 and c=max(a,b), Hupper<=exp^10(c), Kupper<=exp^10(c), and exp^10(c)^2<=exp^10(c+1). The last follows by repeated exp growth, using exp(x+1)>=2exp(x) for x>=0. The rational seed c+1<2^21 gives this exact positive numeric rate majorant below T25.',
    'negativeControl': 'At n=(1,0,0), nprime=(-1,0,0), K=0 and u=(1,0,0), the rank-one term gives growth 1 while the shear rate is 0. Such u is outside n-perp; the tangent premise is essential.',
    'pins': {
        'matrixWindow': hashlib.sha256((PREVIOUS / 'two-pulse-source-windows.json').read_bytes()).hexdigest(),
        'dampingTransport': hashlib.sha256((PREVIOUS / 'n3-two-actual-pulse-damping-transport.json').read_bytes()).hexdigest(),
        'dampingFloor': hashlib.sha256((PREVIOUS / 'n3-two-actual-pulse-damping-floor.json').read_bytes()).hexdigest(),
        'registry': window['witnessRegistrySHA256'],
        'selectedWitness': hashlib.sha256(witness_path.read_bytes()).hexdigest(),
        'wholeK': hashlib.sha256((ROOT / 'primary-forced-join/active-n3-c5-binding/norm-leading/n3-whole-k.json').read_bytes()).hexdigest(),
        'slowChart': hashlib.sha256(chart_path.read_bytes()).hexdigest(),
    },
    'scope': 'The source-pinned tangent value propagator and conditional numeric background rate for two selected original witness systems. Admitted source domain, ordered-limit differentiation, same-family background norm transfer and a bound on actual raw forcing remain premises. No Fraw numeric enclosure, parameter derivatives, endpoint chain, final output class or final jets are certified.',
    'release': 'HOLD',
}
OUT.mkdir(parents=True, exist_ok=True)
destination = OUT / 'n3-tangent-value-growth.json'
destination.write_text(json.dumps(out, indent=2) + '\n', encoding='utf8')
print('PASS actual two principal matrices, tangent energy cancellation, projection contraction and conditional numeric shear rate')
