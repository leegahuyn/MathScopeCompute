"""Scale-invariant projector derivatives with the original normal formula."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha1, sha256
import itertools
import json
import math
from pathlib import Path
import sympy as sp

if not __debug__:
    raise RuntimeError('Exact projection checks require Python assertions.')

parser = ArgumentParser(description=__doc__)
for argument in ('goal', 'original_runtime', 'prior_witness', 'output'):
    parser.add_argument(argument, type=Path)
args = parser.parse_args()
ROOT = args.goal
OLD = ROOT / 'primary-forced-join/active-n3-c5-binding/endpoint/forced-damping'
RUNTIME = args.original_runtime
RAW_PATH = Path(__file__).resolve().parent.parent / 'mode-two-bounds.json'


def load_pin(path, pin):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == pin, path
    return json.loads(raw)


raw = load_pin(RAW_PATH, 'ddb27e84bf7c860e52a7ec3ccf3401dec2686f315dd299642205e16bd32c9c70')
window = load_pin(OLD / 'two-pulse-source-windows.json',
                 '347ca74441e6a9861383bb146660b78d559702afc8a443dc900e5d9dc2d2254b')
damping = load_pin(OLD / 'n3-two-actual-pulse-damping-transport.json',
                  'ebae8e28350f3939cc37f97ae1252ce28a118ddb077ed41852e012ace1be1755')
old_witness_path = args.prior_witness
witness = load_pin(old_witness_path,
                   'a35bd111ef2f60b0e779a85433571db8caa00061616da91372782a28a16859e9')
assert raw['hostedRun'] == 44528954587 and len(raw['positiveSecondHarmonicRows']) == 10
assert {row['system'] for row in raw['positiveSecondHarmonicRows']} == set(range(1,20,2))
assert raw['pulsePullback']['fixedWOrder4PullbackFactor'] == '625/256'
assert raw['pulsePullback']['includingWOrder4PullbackFactor'] == '81/16'
assert raw['sourceDerivatives']['multipliersAtOrder4'] == {
    'radial': {'epsilon':32, 'inverseRadiusC4':162},
    'azimuthal': {'one':32, 'epsilon':32, 'radialFastVr1C4':162, 'radialFastVr2C4':162},
    'axial': {'one':32, 'inverseRadiusC4':81, 'radialFastVr1C4':162, 'radialFastVr2C4':162},
}
old_rows = {row['key']: row for row in witness['rows']}
new_rows = {row['key']: row for row in raw['positiveSecondHarmonicRows']}
assert old_rows['0:1']['projectedSource'] == new_rows['0:1']['projected']
assert old_rows['1:1']['projectedSource'] != new_rows['1:1']['projected']
source_files = {
    'frame': RUNTIME / 'mathscope-m2/navier/actual-covariance-matrix.mjs',
    'band': RUNTIME / 'mathscope-m3/navier/source-global-band.mjs',
}
source_git_blobs = {
    'frame': '80c0976b8bbd7b24a1f9e094937d1822726b240d',
    'band': '1f1c18a26372c998d8389b6c5138b3c9d3a66f36',
}
source_bytes = {}
for name, path in source_files.items():
    data = path.read_bytes()
    blob = sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    assert blob == source_git_blobs[name]
    source_bytes[name] = data
assert b'n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))]' in source_bytes['frame']
assert b'phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))' in source_bytes['band']
assert b'HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z)' in source_bytes['band']
assert b'p=G.div(roundedInteger,k)' in source_bytes['band']
assert b'nonzeroAngularInteger:true' in source_bytes['band']

# q=n dot n/N0^2 at a fixed anchor, N0=|n(anchor)|>0. The anchor
# normalization is held constant during differentiation, so q(anchor)=1.
reciprocal = [1]
for order in range(1, 5):
    reciprocal.append(sum(math.comb(order, j) * 2 ** j * reciprocal[order-j]
                          for j in range(1, order+1)))
assert reciprocal == [1, 2, 12, 104, 1200]
projector = [1]
for order in range(1, 5):
    bound = sum(math.comb(order, j) * 2 ** j * reciprocal[order-j]
                for j in range(order+1))
    assert bound == 2 * reciprocal[order]
    projector.append(bound)
assert projector == [1, 4, 24, 208, 2400]
counts = {}
for dimension in (5, 6):
    counts[dimension] = {}
    for alpha in itertools.product(range(5), repeat=dimension):
        order = sum(alpha)
        if order > 4:
            continue
        weights = [0] * (order+1)
        for beta in itertools.product(*(range(a+1) for a in alpha)):
            weights[sum(beta)] += math.prod(math.comb(a, b) for a, b in zip(alpha, beta))
        assert weights == [math.comb(order, j) for j in range(order+1)]
        counts[dimension][order] = counts[dimension].get(order, 0) + 1
assert sum(counts[5].values()) == 126 and sum(counts[6].values()) == 210

# Symbolic scale invariance of the actual Euclidean orthogonal projector.
v = sp.Matrix(sp.symbols('n0:3', real=True))
scale = sp.Symbol('scale', real=True, nonzero=True)
P = sp.eye(3) - v*v.T/(v.T*v)[0]
scaled = sp.eye(3) - (scale*v)*(scale*v).T/((scale*v).T*(scale*v))[0]
assert all(sp.factor(entry) == 0 for entry in P-scaled)
assert all(sp.factor(entry) == 0 for entry in P*P-P)
assert P.T == P

# Check every derivative of the source-defined normal through order four.
R = sp.Symbol('R', positive=True)
Z, T, Y1, Y2, w = sp.symbols('Z T Y1 Y2 w', real=True)
p, pz, x0 = sp.symbols('p pz x0', real=True)
epsilon = sp.Symbol('epsilon', positive=True)
F = sp.Function('F')(R, Z, T)
G = sp.Function('G')(R, Z, T)
speed = p*F+pz*G
HR, HZ = sp.diff(speed, R), sp.diff(speed, Z)
normal = sp.Matrix([x0-w*HR, p/R, pz-epsilon*w*HZ])
variables = (R, Z, T, Y1, Y2, w)
normal_counts = {}
for alpha in itertools.product(range(5), repeat=6):
    order = sum(alpha)
    if order > 4:
        continue
    normal_counts[order] = normal_counts.get(order, 0) + 1
    derivative = normal
    for coordinate, multiplicity in zip(variables, alpha):
        if multiplicity:
            derivative = derivative.diff(coordinate, multiplicity)
    if order == 0:
        expected = normal
    elif alpha[3] or alpha[4] or alpha[5] >= 2:
        expected = sp.zeros(3, 1)
    else:
        hR, hZ = HR, HZ
        for coordinate, multiplicity in zip((R,Z,T), alpha[:3]):
            if multiplicity:
                hR = sp.diff(hR, coordinate, multiplicity)
                hZ = sp.diff(hZ, coordinate, multiplicity)
        if alpha[5] == 1:
            expected = sp.Matrix([-hR, 0, -epsilon*hZ])
        else:
            angular = (-1)**order*math.factorial(order)*p/R**(order+1) if alpha[0] == order else 0
            expected = sp.Matrix([-w*hR, angular, -epsilon*w*hZ])
    assert all(sp.simplify(entry) == 0 for entry in derivative-expected), alpha
assert normal_counts == {0:1, 1:6, 2:21, 3:56, 4:126}

# For r=1/R>=0 and D>=0, m! r^m+D <= (1+4r+D)^m.
# The source normal estimate is D=2R Gamma (1+L) Bslow5.
r, D = sp.symbols('r D', nonnegative=True)
for order in range(1, 5):
    gap = sp.Poly(sp.expand((1+4*r+D)**order-math.factorial(order)*r**order-D), r, D)
    assert all(coefficient >= 0 for coefficient in gap.coeffs())

# Keep the original raw epsilon and metric coefficients separate.
eps, I4, J1, J2 = sp.symbols('epsilon I4 J1 J2', nonnegative=True)
raw_sums = []
for order in range(5):
    radial = 2*2**order*eps + 2*3**order*I4
    azimuthal = 2*2**order*(1+eps) + 2*3**order*(J1+J2)
    axial = 2*2**order + 3**order*I4 + 2*3**order*(J1+J2)
    total = sp.expand(radial+azimuthal+axial)
    expected = 4*2**order*(1+eps)+3*3**order*I4+4*3**order*(J1+J2)
    assert sp.expand(total-expected) == 0
    raw_sums.append(str(total))
projection_weights = {order:[math.comb(order,j)*projector[j] for j in range(order+1)]
                      for order in range(5)}
assert projection_weights[4] == [1,16,144,832,2400]

# A moving normalization cannot be treated as a constant anchor.
t = sp.Symbol('t', real=True)
assert sp.diff((1+t)**(-2),t).subs(t,0) == -2
assert sp.diff((1+t)**(-2),t,4).subs(t,0) == 120
rotating_normal = sp.Matrix([1,t,0])
rotating_P = sp.eye(3)-rotating_normal*rotating_normal.T/(rotating_normal.T*rotating_normal)[0]
assert rotating_P.diff(t).subs(t,0)[0,1] == -1

out = {
    'schema': 'MathScope.Forced.ScaleInvariantProjectionC4/1',
    'status': 'CONDITIONAL_SOURCE_NORMALIZED_PROJECTION_RECURRENCE',
    'normalization': 'At each derivative anchor hold N0=|n(anchor)|>0 constant; h=n/N0, q=h dot h and q(anchor)=1.',
    'hypothesis': 'For every multi-index alpha of total order m<=4, ||D^alpha n(anchor)||_2/N0<=A_n^m. Order0 is exactly1.',
    'squaredNormalDerivativeCoefficients': [1,2,4,8,16],
    'reciprocalDerivativeCoefficients': reciprocal,
    'projectorDerivativeCoefficients': projector,
    'projectorConclusion': '||D^alpha P(anchor)||_2<=p_m*A_n^m, P=I-n*n^T/(n dot n), p=[1,4,24,208,2400]. At m=0 the exact projector norm is<=1.',
    'recurrenceProof': 'Multi-index product weights at every total derivative degree j sum to binomial(m,j). Leibniz gives Q_m<=2^m A_n^m. Differentiating q*(1/q)=1 with q(anchor)=1 gives c_m=sum_{j=1}^m binomial(m,j)2^j c_(m-j). The derivative of h*h^T/q costs sum_{j=0}^m binomial(m,j)2^j c_(m-j)=2c_m for m>=1.',
    'verifiedMultiIndexCounts': counts,
    'actualSourceNormalFormula': '(x0-w*(p*FR+pz*GR), p/R, pz-epsilon*w*(p*FZ+pz*GZ)).',
    'sourceNormalDerivativeCounts': normal_counts,
    'sourceNormalPointwiseRatio': 'With R>0, p!=0, Gamma=(|p|+|pz|)/|p| and Bslow5>=1 bounding all slow derivatives of F,G through5, m! R^(-m)+2R*Gamma*(1+L)*Bslow5 bounds ||D^alpha n||/|n| for1<=m<=4 on0<=w<=L,0<epsilon<=1.',
    'sourceNormalSufficientAn': 'A_n=1+4/R+2R*Gamma*(1+L)*Bslow5.',
    'normalRatioProof': '|n|>=|p|/R. Pure radial derivatives of p/R cost m! R^(-m) after division by |n|. Radial/axial first and mixed pulse derivatives of the other two components keep their exact epsilon and are bounded by sqrt(1+epsilon^2)R Gamma max(1,L)Bslow5<=2R Gamma(1+L)Bslow5. Any Y derivative or at least two pulse derivatives vanishes. A nonnegative-coefficient polynomial check proves the displayed A_n dominates these bounds.',
    'scaleCaution': 'Gamma may depend on epsilon through the actual frozen carrier choice. The bound cancels a common magnitude rescaling of n and retains the original epsilon in the exact derivative formula; it does not establish an epsilon-uniform Gamma bound.',
    'rawVectorNormCoefficientSumsByOrder': raw_sums,
    'rawVectorDefinition': 'U_j=[4*2^j*(1+epsilon)+3*3^j*I4+4*3^j*(J1+J2)]*Bamp_(j+1)^2. This is a Euclidean vector bound obtained by summing the three phase-free component bounds from the pinned raw receipt.',
    'projectedFixedPulseCommonParameterBound': '||D^alpha(-P*f(H_w))||_2 <= sum_{j=0}^m binomial(m,j)*p_j*A_n^j*(5/4)^(m-j)*U_(m-j), |alpha|=m<=4 in (R,Z,T,Y1,Y2).',
    'projectionLeibnizWeights': projection_weights,
    'optionalPulseDerivativeBound': 'If the raw derivative envelopes also include the additional w-direction through H_w, replace5/4 by3/2 for six-variable derivatives; the current pinned raw receipt certifies only the five common parameter derivatives.',
    'earlierActualNormalWitnesses': [{'key':row['key'],'system':row['system'],
       'normalRoots':witness['rows'][i]['normal'],'oldProjected':old_rows[row['key']]['projectedSource']}
       for i,row in enumerate(damping['rows'])],
    'currentRawAssociations': [{'key':row['key'],'system':row['system'],
                               'originalSource':row['originalSource'],'projected':row['projected']}
                              for row in raw['positiveSecondHarmonicRows']],
    'currentRegistryNormalIdentity': 'OPEN. The current all-ten raw receipt does not export native normal definitions. The earlier0:1 projected roots match exactly; earlier1:1 roots differ by30 IDs and are not identified.',
    'negativeControls': ['The derivative of(1+t)^(-2) at0 is-2, so a moving normalization cannot be frozen silently.',
                         'For n=(1,t,0), Pprime(0)[0,1]=-1, so projection derivatives cannot be omitted.'],
    'pins': {'rawReceipt':sha256(RAW_PATH.read_bytes()).hexdigest(),
             'priorNormalWindow':sha256((OLD/'two-pulse-source-windows.json').read_bytes()).hexdigest(),
             'priorWitness':sha256(old_witness_path.read_bytes()).hexdigest(),
             'normalSourceGitBlobs':source_git_blobs},
    'scope': 'Conditional scale-invariant Euclidean projection derivative estimates for the original source normal recipe and actual raw first-forced branch associations. Actual Bslow5,Gamma,L and amplitude envelopes, source-domain derivative semantics and current native normal root binding remain explicit obligations. No Duhamel/output/final-jet or gate completion is asserted.',
    'release': 'HOLD',
}
with args.output.open('x', encoding='utf8', newline='\n') as report:
    json.dump(out, report, indent=2)
    report.write('\n')
print('PASS scale-invariant C4 recurrence,210 original normal derivatives,10 raw branch associations and preserved epsilon coefficients')
