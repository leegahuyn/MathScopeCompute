"""Source-bound parameter transport with a shear exponent and polynomial normal factors."""

from fractions import Fraction
import hashlib
import itertools
import json
import math
from pathlib import Path
import sympy as sp

ROOT = Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next')
OLD = ROOT / 'primary-forced-join/active-n3-c5-binding/endpoint/forced-damping'
PRIOR = Path('work/goal-next/continuation45/forced')
DEST = Path('work/goal-next/continuation47/forced')


def load_pinned(path, pin):
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == pin, path
    return json.loads(raw)


value = load_pinned(PRIOR / 'n3-tangent-value-growth.json',
                    '430415e806b361e7bf3cb93ec7933fb3550927f7ebd0a98d7332003990bcaac8')
matrices = load_pinned(OLD / 'n3-two-actual-pulse-damping-transport.json',
                       'ebae8e28350f3939cc37f97ae1252ce28a118ddb077ed41852e012ace1be1755')
floor = load_pinned(OLD / 'n3-two-actual-pulse-damping-floor.json',
                    'd691b408fc4c74b374da0f3156625c95b76fd8f82180d0849ead2954f39cf453')
assert [row['system'] for row in matrices['rows']] == [1, 5]
assert [row['system'] for row in value['rows']] == [1, 5]
for row in value['rows']:
    assert row['actualProjectedTangencies'] == ['real', 'imaginary']

n = sp.Matrix(sp.symbols('n0:3', real=True))
np = sp.Matrix(sp.symbols('np0:3', real=True))
K = sp.Matrix(3, 3, sp.symbols('K0:9', real=True))
u = sp.Matrix(sp.symbols('u0:3', real=True))
d = sp.Symbol('d', real=True)
nsq = (n.T * n)[0]
g = (n.T * np)[0] / nsq
P = sp.eye(3) - n * n.T / nsq
Pprime = -(np * n.T + n * np.T) / nsq + 2 * n * n.T * g / nsq
M = -P * K - n * np.T / nsq - d * sp.eye(3)


def zero(matrix):
    assert all(sp.factor(entry) == 0 for entry in matrix), matrix


zero(n.T * M + np.T + d * n.T)
zero(Pprime + P * M - M * P + P * (K * n + np) * n.T / nsq)
zero(n.T * P * (K * n + np))
c = (n.T * u)[0]
zero(Pprime * u + P * M * u - M * P * u + c * P * (K * n + np) / nsq)

# Differentiated systems use five admitted smooth parameters. The largest
# off-diagonal binomial row sum through total order four is 2^4-1.
counts = {}
for alpha in itertools.product(range(5), repeat=5):
    order = sum(alpha)
    if order > 4:
        continue
    row_sum = sum(math.prod(math.comb(a, b) for a, b in zip(alpha, beta))
                  for beta in itertools.product(*(range(a + 1) for a in alpha)) if any(beta))
    assert row_sum == 2 ** order - 1
    counts[order] = counts.get(order, 0) + 1
assert counts == {0: 1, 1: 5, 2: 15, 3: 35, 4: 70}
polynomial = [str(Fraction(15 ** j, math.factorial(j + 1))) for j in range(5)]

# Two exact homogeneous controls test the normal component outside the
# tangent subspace, and catch a reversed sign in the lifting source.
z = sp.Matrix([1, 0, 0])
n0 = sp.Matrix([1, 0, 0])
np0 = sp.Matrix([-1, 0, 0])
K0 = sp.zeros(3)
M0 = n0 * (-np0.T)
assert (n0.T * z)[0] == 1 and (z.T * M0 * z)[0] == 1
n1 = sp.Matrix([1, 0, 0])
np1 = sp.Matrix([0, 1, 0])
P1 = sp.eye(3) - n1 * n1.T
assert -P1 * np1 == sp.Matrix([0, -1, 0])

out = {
    'status': 'CONDITIONAL_ACTUAL_FULL_PROPAGATOR_AND_PARAMETER_JETS',
    'systems': [1, 5],
    'normalScalarEquation': 'c=n^T*u, cprime=-d*c in the homogeneous equation, d=4*epsilon*k^2*|n|^2.',
    'normalScalarSolution': 'c(t)=c(s)*exp(-integral_s^t d).',
    'tangentLifting': 'v=P*u; vprime=M*v-c*P*(K*n+nprime)/|n|^2.',
    'exactMatrixIdentity': 'Pprime+P*M-M*P=-P*(K*n+nprime)*n^T/|n|^2.',
    'algebraicLiftingFactor': 'C=1+H*(1+(K0+N1/Nmin)*L), H=Nmax/Nmin>=1.',
    'factorDefinitions': {
        'Nmin': 'A positive lower bound for |n(w)| on the admitted closed pulse.',
        'Nmax': 'An upper bound for |n(w)| on that same pulse.',
        'N1': 'An upper bound for |nprime(w)| there.',
        'K0': 'An upper bound for the Euclidean operator norm of the original K matrix.',
        'L': 'The admitted closed pulse length, with 0<=s<=t<=L.',
        'Abg': 'A uniform upper bound for sqrt((R*FR)^2+GR^2)/2 on the same original band.',
        'mu': '4*epsilon/Renv^2, using the prior actual nonzero carrier bound.',
    },
    'fullPropagator': '||U_M(t,s)||_2 <= C*exp((Abg-mu)*(t-s)) for arbitrary complex input.',
    'liftingProof': 'The normal component has norm |c(t)|/|n(t)|<=H*exp(-integral d)*|u(s)|. The tangent initial component has norm <=|u(s)|. Its additional tangent source has norm <=|c|*(K0+N1/Nmin)/|n|. Integrating with the source shear bound gives a further H*(K0+N1/Nmin)*(t-s) factor. All three terms retain the same scalar damping; bounding the interval by L gives C.',
    'parameterJetBound': 'max_|alpha|<=4 ||D^alpha u(t)||_2 <= C*F*t*exp(max(Abg-mu,0)*t)*sum_{j=0}^4 (15*C*B*t)^j/(j+1)! at fixed pulse time.',
    'F': 'A bound for the Euclidean norms of all actual projected source parameter derivatives through order four.',
    'B': 'A bound for ||D^beta M||_2 for every admitted nonzero five-parameter multi-index with order<=4.',
    'triangularProof': 'The initial data are zero at the parameter-independent lower endpoint 0. Each parameter coupling strictly lowers total derivative order, so at most four occur. Each homogeneous interval has the source shear exponent and one factor C. Binomial row sums are at most 15; ordered integration gives t^(j+1)/(j+1)!. This uses C^(j+1), retaining every derivative of damping in B.',
    'polynomialCoefficients': polynomial,
    'multiIndexCounts': counts,
    'negativeControls': [
        'A non-tangent input can have positive rank-one growth at zero shear; the separate normal lift is required.',
        'For n=(1,0,0), nprime=(0,1,0), K=0 the lifting source for c=1 is (0,-1,0).',
    ],
    'pins': {
        'tangentValueReceipt': hashlib.sha256((PRIOR / 'n3-tangent-value-growth.json').read_bytes()).hexdigest(),
        'dampingTransport': hashlib.sha256((OLD / 'n3-two-actual-pulse-damping-transport.json').read_bytes()).hexdigest(),
        'dampingFloor': hashlib.sha256((OLD / 'n3-two-actual-pulse-damping-floor.json').read_bytes()).hexdigest(),
    },
    'scope': 'The two source-bound selected systems under their admitted smooth fixed-label domain. F,B,Nmin,Nmax,N1,K0 and source-domain analytic proofs still need actual enclosures. The result gives a full-input propagator with the shear exponent and algebraic normal factors, then fixed-time parameter jets. Endpoint substitution, physical curl and pressure require their source operators. No final jets or release gate is advanced.',
    'release': 'HOLD',
}
DEST.mkdir(parents=True, exist_ok=True)
(DEST / 'n3-full-propagator-parameter-transport.json').write_text(
    json.dumps(out, indent=2) + '\n', encoding='utf8')
print('PASS full-input normal lifting identity and five-parameter C4 triangular transport')
