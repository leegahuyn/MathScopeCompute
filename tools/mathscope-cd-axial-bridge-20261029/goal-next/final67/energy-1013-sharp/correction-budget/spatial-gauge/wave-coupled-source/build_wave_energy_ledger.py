"""Retain source curl factors and the joint P/F degrees of the initial primary wave."""

from fractions import Fraction as F
from hashlib import sha256
import json
from pathlib import Path
import sys

assert __debug__ and len(sys.argv) == 3
goal, output = map(Path, sys.argv[1:])
assert not output.exists()


def pinned(path, pin):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == pin, path
    return json.loads(data)


wave_pin = 'e6cfd19055479fbcb43dddcd17ae05ddc3fb075eb911620f485dfb7d29c6fe70'
lower_pin = '5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'
wave = pinned(goal/'primary-forced-weights/mixed-wave/mixed-wave-c4.json', wave_pin)
lower = pinned(goal/'whole-k-annular-pressure-lower/lower-covariance-pressure.json', lower_pin)
for graph in (wave, lower):
    assert sha256(json.dumps(graph['nodes'], separators=(',', ':')).encode()).hexdigest() == graph['graphSHA256']
assert wave['source']['graphSHA256'] == lower['sourceSHA256']
assert wave['source']['registrySHA256'] == lower['nativeRegistrySHA256']
assert wave['epsilonExponents'] == {'real':50000, 'imaginary':99999, 'pressure':100000}
assert wave['epsilonDenominator'] == 100000
assert lower['intermediate']['stableW'] == 27
assert lower['nodes'][27] == {'op':'exp','args':[26]}
assert lower['nodes'][3541] == {'op':'exp','args':[3540]}
nodes = list(lower['nodes'])
aliases = []
for i, node in enumerate(wave['nodes']):
    if node['op'] == 'authenticated_source_norm_root':
        namespace, original = node['args']
        if namespace == 'archived-lower-positive':
            aliases.append(original)
            continue
        mapped = {'archived-original':'hosted-original','archived-background-c8':'background-c8'}[namespace]
        nodes.append({'op':node['op'],'args':[mapped,original]})
    elif node['op'] == 'rational':
        nodes.append(node)
    else:
        children = node['args'][:1] if node['op'] == 'integer_power' else node['args']
        assert all(isinstance(j,int) and 0 <= j < i for j in children)
        mapped = [aliases[j] for j in children]
        if node['op'] == 'integer_power':
            mapped.append(node['args'][1])
        nodes.append({'op':node['op'],'args':mapped})
    aliases.append(len(nodes)-1)


def node(operation, arguments):
    nodes.append({'op':operation,'args':arguments})
    return len(nodes)-1


def q(n):
    return node('rational',[str(n),'1'])


def add(*arguments):
    return node('add',list(arguments))


def mul(*arguments):
    return node('multiply',list(arguments))


def maximum(arguments):
    return node('maximum',list(arguments))


rows = {tuple(row['orders']):row for row in wave['roots']['results']}
zero = rows[(0,0,0,0,0)]


def velocity(orders, component):
    row = rows[orders]
    return add(aliases[row['real'][component]], aliases[row['imaginary'][component]])


v0_components = [velocity((0,0,0,0,0),j) for j in range(3)]
v0 = maximum(v0_components)
normal = maximum([aliases[jet[0]] for jet in wave['roots']['n']])
a_fast = lower['intermediate']['aFast']
inverse_radius = aliases[wave['roots']['radiusUpper']]
v1 = maximum([
    add(velocity((1,0,0,0,0),j),
        mul(a_fast,velocity((0,0,0,1,0),j)),
        velocity((0,1,0,0,0),j),
        mul(q(2),normal,v0_components[j]),
        mul(inverse_radius,v0_components[j]))
    for j in range(3)
])
order_index = {tuple(order):i for i,order in enumerate(wave['normalizedOrder'])}
chi0, chi1 = [aliases[root] for root in wave['roots']['chi'][:2]]
potential0_components = [mul(chi0,aliases[jet[order_index[(0,0)]]])
                         for jet in wave['roots']['potential']]
potential0 = maximum(potential0_components)
potential1 = maximum([
    add(mul(q(2),chi0,aliases[jet[order_index[(1,0)]]]),
        mul(a_fast,chi1,aliases[jet[order_index[(0,0)]]]),
        mul(q(2),normal,potential0_components[j]),
        mul(inverse_radius,potential0_components[j]))
    for j,jet in enumerate(wave['roots']['potential'])
])
gaussian = lower['intermediate']['gaussianAbsorption']
assert lower['intermediate']['poleAbsorbed'] >= 48
# 162 original signed source rows; 64 covers every physical dyadic factor
# and the displayed source cutoff commutators, with all coefficients kept.
W = mul(q(162*64),gaussian,
        add(mul(q(21),v0),v1,mul(q(712),potential0),mul(q(20),potential1)))

memo = {}


def degree(i):
    if i in memo:
        return memo[i]
    if i == 27:
        lo = hi = (F(1),F(0))
    elif i == 3541:
        lo = hi = (F(0),F(1))
    else:
        operation, arguments = nodes[i]['op'], nodes[i]['args']
        if operation in ('rational','authenticated_source_norm_root'):
            lo = hi = (F(0),F(0))
        else:
            children = arguments[:1] if operation == 'integer_power' else arguments
            values = [degree(child) for child in children]
            if operation in ('add','maximum'):
                lo = tuple(min(v[0][k] for v in values) for k in range(2))
                hi = tuple(max(v[1][k] for v in values) for k in range(2))
            elif operation == 'multiply':
                lo = tuple(sum(v[0][k] for v in values) for k in range(2))
                hi = tuple(sum(v[1][k] for v in values) for k in range(2))
            elif operation == 'inverse':
                lo = tuple(-entry for entry in values[0][1])
                hi = tuple(-entry for entry in values[0][0])
            elif operation == 'sqrt_positive':
                lo = tuple(entry/2 for entry in values[0][0])
                hi = tuple(entry/2 for entry in values[0][1])
            elif operation == 'integer_power':
                assert isinstance(arguments[1],int) and arguments[1] >= 0
                lo = tuple(entry*arguments[1] for entry in values[0][0])
                hi = tuple(entry*arguments[1] for entry in values[0][1])
            elif operation == 'exp':
                assert values[0] == ((F(0),F(0)),(F(0),F(0))), (i,values[0])
                lo = hi = (F(0),F(0))
            else:
                raise AssertionError((i,operation))
    memo[i] = (lo,hi)
    return lo,hi


lo,hi = degree(W)
positive = [max(F(0),entry) for entry in hi]
loss = positive[0]/2**33 + positive[1]/100000
result = {
    'schema':'MathScope.Initialized.PrimaryWaveCoupledEnergyLedger/1',
    'status':'VERIFIED_SOURCE_GRAPH_PRIMARY_WAVE_ENERGY_COEFFICIENT_LEDGER',
    'sourceSHA256':lower['sourceSHA256'],'waveGraphSHA256':wave['graphSHA256'],
    'wavePin':wave_pin,'lowerPin':lower_pin,
    'nodes':nodes,'graphSHA256':sha256(json.dumps(nodes,separators=(',',':')).encode()).hexdigest(),
    'root':W,'componentRoots':{'velocity':v0,'spatialGradient':v1,
                             'potential':potential0,'potentialGradient':potential1,
                             'normal':normal,'gaussian':gaussian},
    'symbols':{'P':27,'F':3541},
    'positiveDegrees':list(map(str,positive)),'logarithmicLoss':str(loss),
    'rows':162,'cutoffConstants':{'value':1,'z':20,'zz':692,'radial':0},
    'coefficientRule':'W=162*64*Gauss*(21V0+V1+712A0+20A1).',
    'velocityRule':'V0=max(real0+imag0).',
    'gradientRule':'V1=max(R+imagR+a_fast*(xi+imagXi)+Z+imagZ+2*nmax*(real0+imag0)+inverseRadius*(real0+imag0)).',
    'potentialRule':'A0 is the primary cross-normal potential coefficient at value order; A1 keeps ordinary R/Z, radial-fast xi, phase normal and polar connection.',
    'scalingPremises':[
        'The original leading and curl-remainder wave factors retain epsilon^(1/2) and epsilon^(1-kappa_s).',
        'k*sqrt(epsilon)<=2 and k*epsilon^(1-kappa_s)<=2 for 0<epsilon<=1 and kappa_s=1/100000.',
        'The original pre-curl potential factor is Q^(-h)*sqrt(epsilon)/k<=Q^(-h)*epsilon=1.',
        'Q lies in [tau0/4,4tau0], h<1/64 and A=1/2+h, D=1/2-h.',
        'The actual outer axial cutoff has derivatives20*tau0^(-D),692*tau0^(-2D). Its mixed potential terms retain nonnegative tau0 powers.',
        'The source Gaussian absorption dominates all retained primary poles through degree48; its saved common bound uses at least that degree.',
        'All original stable pulse, source determinant and normal lower bounds, field/derivative classes, fixed chart and flat joins apply.',
    ],
    'scope':'Only original initial primary wave and its complete source axial-cutoff curl. Later active corrections and final jets remain separate.',
    'release':'HOLD',
}
output.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps({'positiveDegrees':result['positiveDegrees'],'logarithmicLoss':str(loss),'used':len(memo),'nodes':len(nodes)}))
