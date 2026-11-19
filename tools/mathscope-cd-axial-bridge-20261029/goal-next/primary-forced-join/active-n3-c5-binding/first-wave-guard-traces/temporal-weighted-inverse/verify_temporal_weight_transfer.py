"""Propagate the actual initial Temporal estimates through its two radial operators."""

from argparse import ArgumentParser
from fractions import Fraction
from functools import cache
from hashlib import sha256
from itertools import product
import json
from math import comb, factorial
from pathlib import Path

ORDER = 5
PRIMITIVE_GAIN = 3
PINS = {
    'fourier':'12cc99ba7c3b47c88555e5eaca310fab7471d307e720c40340de78e104d9634d',
    'anisotropic':'f549235f4f126ffc2141f4d1a3b3280d25206402a8ba332a961121da0295e013',
    'forcedPrior':'705013059e1f064c3f9826c7c1846128064a26fa777bab6e335ed98a8c133fdd',
    'signedPrimitive':'ccb89be13cc70fc69257ffe594b3f4bf5e4fd7d9a8a99c23cd1a3bdf784f18aa',
    'meanDirection':'65c7c4dedd18a6dcc25ed5d8a4e5b274d0a3911b923f737d7df21dd50c76e42d',
}


def load(path, pin):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == PINS[pin], path
    return json.loads(data)


def shift(jet, direction, amount=1):
    return tuple(value + (amount if index==direction else 0) for index,value in enumerate(jet))


def covariance_cutoff_constants(last):
    # P_j(1/t) in D_t^j exp(-1/t^2).
    polynomial = {0:1}
    seed = []
    for order in range(last+1):
        seed.append(sum(abs(c)*factorial((power+1)//2) for power,c in polynomial.items()))
        next_polynomial = {}
        for power,coefficient in polynomial.items():
            next_polynomial[power+3] = next_polynomial.get(power+3,0) + 2*coefficient
            if power:
                next_polynomial[power+1] = next_polynomial.get(power+1,0) - power*coefficient
        polynomial = next_polynomial
    assert seed[:2] == [1,4]
    # One of t and 1-t is >= 1/2. Thus the step denominator exceeds 1/64.
    assert sum(Fraction(1,factorial(k)) for k in range(4)) + Fraction(1,24)/Fraction(4,5) < Fraction(11,4)
    assert Fraction(11,4)**4 < 64
    inverse = [64]
    for order in range(1,last+1):
        inverse.append(64 * sum(comb(order,k)*2*seed[k]*inverse[order-k]
                                for k in range(1,order+1)))
    step = [sum(comb(j,k)*seed[k]*inverse[j-k] for k in range(j+1))
            for j in range(last+1)]
    scale = 2**35
    chi = [1]+[scale**j*step[j] for j in range(1,last+1)]
    r0 = Fraction(1,2**34)
    midpoint = Fraction(1,2)
    step_slope = midpoint*(1-midpoint)*(2/midpoint**3 + 2/(1-midpoint)**3)
    assert step_slope == 8
    k = 2*step_slope/r0
    assert k*midpoint == 8/r0
    assert 2/k == Fraction(1,2**37) and Fraction(5,4)/k**2 == Fraction(5,2**78)
    # At the two half-radius points, cutoff value = 1/2 and slopes = ∓16/r0.
    derivative_caps = []
    for j in range(last):
        squares = [sum(comb(j,k)*chi[k+i]*chi[j-k+l] for k in range(j+1))
                   for i,l in ((0,0),(0,1),(1,1))]
        multiplier = squares[0]+Fraction(2,k)*squares[1]+Fraction(5,4)/k**2*squares[2]
        derivative_caps.append({'order':j,'log2Upper':multiplier.numerator.bit_length(),
                                'exactRational':str(multiplier)})
    return {'sampleSlope':str(k),'sampleChiTimesSlope':str(k*midpoint),
            'BUpperOverM':'1','CUpperOverM':str(2/k),
            'DUpperOverM':str(Fraction(5,4)/k**2),
            'cutoffDerivativeLog2Upper':[x.bit_length() for x in chi],
            'localTransverseMultipliers':derivative_caps}


def certify_temporal_jet_transfer(base_pole=9, pole_step=3, *, spatial_only=False, required=None):
    """All roles act in fixed R,Z,T,L, with repeated radial endpoints."""
    inputs = set()
    fft_calls = set()
    close_primitives = set()

    @cache
    def weight(name,jet):
        r,z,t,l = jet
        if name.startswith('W_'):
            inputs.add((name,jet))
            return base_pole + pole_step*(r+z+t)
        if name in ('pressure_source','gamma_Z'):
            if name == 'pressure_source':
                # Bound of - W_rr,Z / r - eps W_rz,ZZ + W_thetatheta,Z / r.
                return max(weight('W_rr',shift(jet,1)),weight('W_rz',shift(jet,1,2)),
                           weight('W_thetatheta',shift(jet,1)))
            return weight('gamma',shift(jet,1))
        if name.startswith('T0_'):
            base = name[3:]
            close_primitives.add((base,jet))
            if r == 0:
                return weight(base,jet)-PRIMITIVE_GAIN
            # D_R T0 F = F with fixed cutoff on either collar.
            # The R derivatives landing on a(R) are bounded cofactor terms.
            return max(weight(base,(r-1,z,t,l)),
                       *(weight(name,(k,z,t,l+1)) for k in range(r)))
        if name == 'pZ':
            return max(weight('W_rr',shift(jet,1)),weight('T0_pressure_source',jet))
        if name in ('E_theta','E_z'):
            radial,axial = ('W_rtheta','W_thetaz') if name=='E_theta' else ('W_rz','W_zz')
            parts = [weight(radial,shift(jet,0)),weight(radial,shift(jet,3)),
                     weight(radial,jet),weight(axial,shift(jet,1))]
            if name=='E_z':
                parts.append(weight('pZ',jet))
            return max(parts)
        if name in ('v_theta','gamma'):
            source = 'E_theta' if name=='v_theta' else 'E_z'
            fft_calls.add((source,jet))
            # Anisotropic Fourier estimate of f and L² f has the same pole.
            return max(weight(source,jet),weight(source,shift(jet,3,2)))
        assert name == 'beta', name
        # R and R^-1 multiplication in T1 allocate radial cofactors.
        return max(weight('T0_gamma_Z',(k,z,t,l)) for k in range(r+1))

    reports = {}
    jets = [jet for jet in product(range(ORDER+1), repeat=4) if sum(jet)<=ORDER]
    if spatial_only:
        jets = [jet for jet in jets if jet[2]==0 and jet[1]<=4]
    if required is not None:
        assert set(required) <= set(jets)
        jets = sorted(required)
    primes = {}
    for k,name in enumerate(('v_theta','gamma','beta')):
        caps = [weight(name,jet) for jet in jets]
        bound = base_pole + pole_step + k*(pole_step-PRIMITIVE_GAIN)
        assert all(pole<=bound+pole_step*sum(jet[:3]) for pole,jet in zip(caps,jets,strict=True)), name
        if pole_step == PRIMITIVE_GAIN:
            assert all(pole==bound+pole_step*sum(jet[:3]) for pole,jet in zip(caps,jets,strict=True)), name
        reports[name] = {'targetJets':len(caps),'largestPole':max(caps),
                         'poleAtFixedSlowTotal':[bound+pole_step*s for s in range(ORDER+1)]}
    for name in sorted({n for n,_ in inputs}):
        field = [jet for n,jet in inputs if n==name]
        primes[name] = {'requests':len(field),'maxSlowTotal':max(sum(j[:3]) for j in field),
                        'maxLOrder': max(j[3] for j in field),
                        'maxRZTOrder':[max(j[k] for j in field) for k in range(3)]}
    maximum_slow = max(sum(jet[:3]) for _,jet in inputs)
    assert maximum_slow==(7 if spatial_only else 8)
    deepest_l = max(jet[3] for _,jet in inputs)
    assert deepest_l<=8 and (required is not None or deepest_l==8)
    rates = [base_pole+pole_step*k for k in range(maximum_slow+1)]
    assert max(rates)<=60<63
    return {'coordinates':['R','Z','T','L'],'maximumOutputTotal':ORDER,'distinctTargetJets':3*len(jets),
            'restriction':('actual first Forced mean derivative tuples' if required is not None
                           else 'T=0, Z<=4' if spatial_only else 'all four derivative directions through order 5'),
            'outputPoles':reports,'sourceCovariancePoles':rates,'covarianceRequests':primes,
            'allSourceRequests':len(inputs),'distinctFourierRequests':len(fft_calls),
            'distinctPrimitiveRequests':len(close_primitives),'maxLOrder':deepest_l}


def verify(goal, shape):
    raw = shape.read_bytes()
    shapes = json.loads(raw)
    assert shapes['status']=='VERIFIED_ALL_SIX_ACTUAL_TRANSVERSE_COVARIANCE_SHAPES_AND_TEMPORAL_BINDER'
    assert len(shapes['localCovariances']) == 12
    assert shapes['commonTorus']['rows'] == 162
    assert shapes['commonTorus']['admittedDelta'] == [0,1,2,3,4]
    old = load(goal/'whole-k-annular-wrz/transverse-wrz-bound.json','fourier')
    anisotropic = load(goal/'final67/temporal-wrz-anisotropic/anisotropic-final.json','anisotropic')
    base = goal/'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces'
    forced = load(base/'angular-order-one-shell/forced/forced-shell-final.json','forcedPrior')
    signed = load(base/'signed-polynomial-shell/signed-cubic-transfer.json','signedPrimitive')
    direction = load(base/'temporal-weighted-inverse/first-forced-covariance/mean-direction.json','meanDirection')
    assert old['fourier']['pointwiseL2Constant']=='85/6'
    assert old['fourier']['pointwiseL2TransverseSecondConstant']=='85/216'
    assert old['fourier']['weightedInverseSquareSumUpper']=='7104'
    assert 85**2>7104 and 85**2<2*7104
    assert anisotropic['additionalSlowDerivativesForAnisotropicPart']==0
    assert forced['jetPremise']['sourceMaxInputOrders']['mode1WholeMean']==4
    assert signed['outerOriginalCutoff']['maximumGuaranteedPole']==63
    results = certify_temporal_jet_transfer()
    spatial = certify_temporal_jet_transfer(spatial_only=True)
    wider_pole = certify_temporal_jet_transfer(12,6,spatial_only=True)
    assert direction['status']=='VERIFIED_ACTUAL_MEAN_DERIVATIVE_COEFFICIENTS_PURE_L'
    assert sum(direction['testedRawModeOneGroupsByChart'].values())==100
    raw_orders = direction['meanNativeSourceDemand']['commonOrdersForBetaVAndGamma']
    orders = {(r,z,0,l) for r,z,l in raw_orders}
    assert len(raw_orders)==len(orders)==43
    actual = certify_temporal_jet_transfer(spatial_only=True,required=orders)
    assert actual['distinctTargetJets']==129 and actual['covarianceRequests']['W_rz']['maxSlowTotal']==7
    # One-sided shells use a=4 outer and a=t1² inner. Both obey the cubic bound on a sufficiently small original collar.
    assert Fraction(60,16)+2*Fraction(1,128)**2/Fraction(7)**3 < 4
    return {'status':'VERIFIED_FINITE_TEMPORAL_JET_AND_CUBIC_GAIN_ACCOUNTING_CONDITIONAL_SOURCE_NORMS',
            'sourceShapeSHA256':sha256(raw).hexdigest(),'inputPins':PINS,'proof':results,
            'spatialDemandEnvelope':spatial,'spatialWithLargerInputPoles':wider_pole,
            'exactFirstForcedMeanDemand':actual,
            'localCovarianceCutoffValues':covariance_cutoff_constants(results['maxLOrder']+1),
            'inverse':'N^-1 P_perp f <= (85/6)||f||_2+(85/216)||L² f||_2 in sup norm',
            'radialIdentities':{'pZ':'-Wrr,Z+T0(-Wrr,Z/R-eps*Wrz,ZZ+Wthetatheta,Z/R)',
                                'primitive':'partial_R T0 f=f-a*L T0 f on a constant-cutoff collar',
                                'beta':'-eps*partial_Z[R^-1 T0(R gamma)]',
                                'gamma':'-N^-1 P_perp Ez/ci with chi_R=0 on the collar',
                                'theta':'-N^-1 P_perp Etheta/ci'},
            'conditional':'On an admitted constant-cutoff collar the six actual positive Primary covariances have full-weight slow inputs W_s at poles 9+3s; the original charts, flat extension, ordinary differentiation and fixed-cover bounds are required. The operator estimates then give the full Gaussian times poles 12+3s for all three nonlinear-input velocity components. The result bounds only the initial Temporal increment, which is the initial mean increment on the collar because the original FiveMap has interior support.',
            'remaining':['Same-live finite constants for the actual source slow covariance rows and their uniform chart attachment.',
                         'Full effective covariance, renewed pressure and higher active correction intervals.'],
            'finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    for name in ('goal','shape','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    if not __debug__:
        parser.error('assertions are required')
    report=verify(args.goal,args.shape)
    with args.out.open('x',encoding='utf-8',newline='\n') as file:
        json.dump(report,file,indent=2)
        file.write('\n')
    print(report['status'])
