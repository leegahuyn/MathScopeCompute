"""Check the actual fixed-lift endpoint and its original spatial derivative chain."""

import hashlib
import itertools
import json
from pathlib import Path
import sympy as sp

ROOT = Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next')
WITNESS = Path('work/goal-next/continuation36/hosted-43363985266/mathscope-original-n3-primary-c5/witness/original-active-mode-two-witness.json')
WINDOW = ROOT / 'primary-forced-join/active-n3-c5-binding/endpoint/forced-damping/two-pulse-source-windows.json'
RUNTIME = Path('work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier')
DEST = Path('work/goal-next/continuation47/forced')


def pinned(path, digest):
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == digest, path
    return json.loads(raw)


W = pinned(WITNESS, 'a35bd111ef2f60b0e779a85433571db8caa00061616da91372782a28a16859e9')
X = pinned(WINDOW, '347ca74441e6a9861383bb146660b78d559702afc8a443dc900e5d9dc2d2254b')
assert W['snapshot']['node_stream_sha256'] == X['witnessGraphSHA256']
nodes = {int(key): node for key, node in X['nodes'].items()}
source = {}
for name, digest in (
    ('source-initialized-angular.mjs', '3e4f32a554e8e2ceccd3e003aa220c2f191c23b98cceb3b07f1f2d81e4bf2f1d'),
    ('source-harmonic-assembly.mjs', '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20'),
):
    raw = (RUNTIME / name).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == digest
    source[name] = raw
lift_source = source['source-initialized-angular.mjs']
for fragment in (b'offset=matrix.value.map', b'v=G.div(G.add(eta,r0),ci)',
                 b"check('source-lift-longitudinal-radial-derivative-zero'",
                 b'factor=G.div(ci,G.pow(Tg,delta))',
                 b'difference=G.sub(w,lift.v),Hw=Y.map'):
    assert fragment in lift_source, fragment
operators = source['source-harmonic-assembly.mjs']
for fragment in (b'Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))',
                 b'time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))',
                 b'Dz=x=>G.mul(epsilon,G.derivative(x,Z))',
                 b'angular=x=>G.div(thetaDerivative(x),R)'):
    assert fragment in operators, fragment

R, Z, T, theta, y1, y2, w = sp.symbols('R Z T theta y1 y2 w', real=True)
c1, c2, z1, z2, r0 = sp.symbols('center1 center2 copy1 copy2 r0', real=True)
ci = sp.Symbol('ci', positive=True)
eps = sp.Symbol('epsilon', positive=True)
Y = sp.Matrix([y1, y2])
vt = sp.Matrix([sp.sqrt(2) - 1, 1])
vr = sp.Matrix([1, 1 - sp.sqrt(2)])
D = sp.simplify((vt.T * vt)[0])
Tg = 4 + sp.sqrt(2)
J = sp.Matrix([[3, 1], [1, 5]])
assert sp.simplify((vr.T * vt)[0]) == 0
assert J * vt == sp.simplify(Tg * vt)
independent = (R, Z, T, theta, y1, y2, w)
# A universal polynomial jet through degree two avoids opaque Subs
# normalization in SymPy. Every coefficient is algebraically independent.
jet_terms = []
for order in range(3):
    for choices in itertools.combinations_with_replacement(range(7), order):
        name = 'U_' + ('_'.join(map(str, choices)) if choices else 'value')
        jet_terms.append(sp.Symbol(name) * sp.prod(independent[i] for i in choices))
U = sum(jet_terms)
assert len(jet_terms) == 36
a = sp.Function('a')(R, Z, T)


def L(body):
    return sp.expand(vr[0] * sp.diff(body, y1) + vr[1] * sp.diff(body, y2))


def N(body):
    return sp.expand(vt[0] * sp.diff(body, y1) + vt[1] * sp.diff(body, y2))


def Dr(body):
    return sp.diff(body, R) + a * L(body)


def Dz(body):
    return eps * sp.diff(body, Z)


def angular(body):
    return sp.diff(body, theta) / R


checks = []
for row in W['rows']:
    delta = row['lift']['levelDifference']
    assert delta in (0, 1)
    assert row['mappedEndpoint']['pulseValue'] == row['path']['pulse'] == row['lift']['v']
    assert row['mappedEndpoint']['variable'] == row['path']['w']
    assert row['mappedEndpoint']['pathValueSubstitutedBeforeSpatialDerivative']
    assert row['lift']['geometry']['R'] == 17732748
    assert row['lift']['geometry']['Z'] == 17732749
    assert row['lift']['geometry']['T'] == 17732750
    assert row['lift']['geometry']['Y'] == [17745430, 17745431]
    for component, output in enumerate(row['output']):
        for part in ('real', 'imaginary'):
            actual = nodes[output[part]]
            assert actual['op'] == 'm3_forced_pulse_partial'
            assert actual['args'] == [row['system'], part, component, row['path']['w'],
                                      row['mappedEndpoint']['parameters'], [0, 0, 0, 0, 0]]
    recorded = {test['id']: test['pass'] for test in row['lift']['checks']}
    assert recorded['source-lift-longitudinal-radial-derivative-zero']
    assert recorded['source-lift-normalized-pulse-time-one']
    matrix = J ** delta
    assert row['lift']['matrix']['matrices'][delta] == [[str(x) for x in line] for line in matrix.tolist()]
    offset = matrix * Y - sp.Matrix([c1 + z1, c2 + z2])
    v = sp.simplify(((vt.T * offset)[0] / D + r0) / ci)
    assert sp.simplify(L(v)) == 0
    assert sp.simplify(N(v) - Tg ** delta / ci) == 0
    assert all(sp.diff(v, coord) == 0 for coord in (R, Z, T, theta, w))
    assert all(sp.diff(v, x, y) == 0 for x in (y1, y2) for y in (y1, y2))
    E = lambda expression: expression.subs(w, v)
    endpoint_u = E(U)
    first = []
    for name, operator in (('Dr', Dr), ('Dz', Dz), ('angular', angular)):
        residual = sp.simplify(operator(endpoint_u) - E(operator(U)))
        assert residual == 0, (delta, name, str(residual))
        first.append(name)
    # Two spatial derivatives are exactly the order required when a
    # vector potential is curled and the velocity is differentiated.
    second = []
    for name1, op1 in (('Dr', Dr), ('Dz', Dz), ('angular', angular)):
        for name2, op2 in (('Dr', Dr), ('Dz', Dz), ('angular', angular)):
            assert sp.simplify(op1(op2(endpoint_u)) - E(op1(op2(U)))) == 0
            second.append(name1 + '.' + name2)
    time = lambda body: -eps * sp.diff(body, T) + ci / Tg ** delta * N(body)
    assert sp.simplify(time(endpoint_u) - E(time(U) + sp.diff(U, w))) == 0
    Hw = Y + ci / Tg ** delta * (w - v) * vt
    assert all(sp.simplify(E(Hw[i]) - Y[i]) == 0 for i in range(2))
    assert all(sp.simplify(N(Hw[i])) == 0 for i in range(2))
    checks.append({
        'key': row['key'], 'system': row['system'], 'delta': delta,
        'actualPulse': row['path']['pulse'], 'independentPulse': row['path']['w'],
        'actualOutputParts': row['output'], 'firstSpatialOperators': first,
        'secondSpatialOperatorPairs': second,
        'normalizedTimeCoefficient': '1',
    })

# An exact control catches treating an arbitrary Y direction as radial.
v0 = ((vt.T * Y)[0] / D + r0) / ci
assert sp.simplify(sp.diff(v0, y1)) != 0

out = {
    'status': 'VERIFIED_ACTUAL_TWO_SPATIAL_ENDPOINT_OPERATOR_IDENTITIES',
    'rows': checks,
    'independentArguments': ['R', 'Z', 'T', 'theta', 'Y1', 'Y2', 'w'],
    'frozen': 'Original palette label, center, nearest copy, ci, epsilon and delta are frozen before differentiation.',
    'actualPulse': 'v=((vt dot (Jg^delta Y-center-copy))/Dgeom+r0)/ci, delta=0 or 1.',
    'pulseIdentities': ['Dr(v)=0', 'Dz(v)=0', 'angular(v)=0',
                        'normalized_time(v)=1', 'N(H_w)=0', 'H_w at w=v is Y'],
    'spatialEndpointChain': 'For E(U)=U(R,Z,T,theta,Y,w=v(Y)), each original spatial operator D satisfies D(E(U))=E(D_parameter(U)); compositions of these spatial operators retain this property at every order on an admitted fixed-label chart.',
    'checkedSpatialOrders': [1, 2],
    'universalJetBasisSize': 36,
    'higherOrderArgument': 'The first-operator chain rule holds for every smooth U. Induction applies it to each smooth parameter-operator expression; derivatives of the slow coefficient a are retained.',
    'normalizedTimeEndpointChain': 'time(E(U))=E(time_parameter(U)+partial_w U), where time_parameter=-epsilon*partial_T+(ci/Tg^delta)*N.',
    'spatialConsequence': 'A spatial value/curl/gradient estimate of the actual endpoint amplitudes uses fixed-pulse parameter derivatives. It requires no endpoint pulse-time derivative for these spatial operators.',
    'caution': 'Ordinary Y partials have nonzero endpoint pulse derivatives. Time derivatives retain partial_w U, and Cartesian rotations plus phase derivatives retain their original explicit coefficient terms.',
    'negativeControl': 'At delta=0, partial_Y1 v=(sqrt(2)-1)/(Dgeom*ci) is nonzero, so the spatial-operator cancellation cannot be used for arbitrary coordinate derivatives.',
    'pins': {
        'selectedWitness': hashlib.sha256(WITNESS.read_bytes()).hexdigest(),
        'matrixWindow': hashlib.sha256(WINDOW.read_bytes()).hexdigest(),
        'initializedSource': hashlib.sha256(source['source-initialized-angular.mjs']).hexdigest(),
        'operatorSource': hashlib.sha256(source['source-harmonic-assembly.mjs']).hexdigest(),
    },
    'scope': 'Actual selected same-live two source branch endpoint records and the pinned original fixed-label operator formulas. Smooth admitted source domain, capture-free native substitution and endpoint extension remain analytic/source premises. This does not evaluate the forced amplitudes or their parameter derivatives, normal quotient potential, phase/curl coefficients, pressure, global labels or final jets.',
    'release': 'HOLD',
}
DEST.mkdir(parents=True, exist_ok=True)
(DEST / 'n3-spatial-endpoint-chain.json').write_text(json.dumps(out, indent=2) + '\n', encoding='utf8')
print('PASS two actual endpoint records, 6 first and 18 second spatial identities, exact normalized-time chain')
