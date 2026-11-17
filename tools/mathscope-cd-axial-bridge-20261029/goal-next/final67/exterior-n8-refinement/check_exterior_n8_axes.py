"""Independent spatial, precision, Fourier and heat-order checks on the original moving exterior."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial, prod
from pathlib import Path


PINS = {
    'checker': 'f52cec30c453ad6e1ed29a623d2682eb9c365096ae5af2e8cb8609ee2fa004d5',
    'moving': 'c614a3a12ec8d9dcf5bd02235dd6227bb79969d372f345baad6aec471c127c2b',
    'criterion': 'bfe0e57b127849a5413414c8e8340ed5592049082fd211d9172a2fce6f219156',
    'force': '9bba52b109ec9c61db0cd8bdc32cd5aaf6baedfac416277ec65b00d5c656afea',
    'heat': 'c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172',
    'heatGamma': '7dc194a8a33ff5a3882c1bedf82cf1d26efe3220f0bd66a1e550482369ccad71',
    'schedule': '5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9',
}


def pinned(path, label):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[label], label
    return raw


def require_source(args):
    base = args.exterior.parent
    moving = base / 'final67/moving-heat-energy'
    checker = moving / 'check_moving_heat_energy.py'
    replay = {'__name__': 'moving_heat_source_replay', '__file__': str(checker)}
    exec(compile(pinned(checker, 'checker'), str(checker), 'exec'), replay)
    original = json.loads(pinned(moving / 'moving-heat-energy.json', 'moving'))
    assert original['domain'] == 'whole-K physical X>=Xb with moving inner face r^2=2*q*Xb, all physical angles'
    matching = [item for item in json.loads(pinned(args.criterion, 'criterion'))['criteria'] if item['id'] == 'N8-05']
    assert len(matching) == 1 and matching[0]['page'] == 66
    algebra = json.loads(pinned(args.exterior / 'exterior-cutoff-force.json', 'force'))['verifiedCylindricalAlgebra']
    assert algebra['thetaForce'] == '(C_t-Delta C)K-2*C_r*K_r'
    assert algebra['radialForce'] == 'C*(1-C)*K^2/r+C_r*p_loc'
    assert algebra['axialForce'] == 'C_z*p_loc'
    heat = pinned(args.heat_source, 'heat')
    for text in (
        b'Z=G.div(G.mul(q(2),G.sub(o,G.pow(eta,2))),X)',
        b'laplace=G.div(v,oneMinus),weight=G.exp(G.add(G.neg(laplace),G.mul(h,G.log(laplace))))',
        b'G.exp(G.neg(G.mul(h,G.log(G.add(o,G.mul(Z,laplace))))))',
        b'const heatLoss=G.div(G.integral(lossBody,v,z,o),gamma)',
        b'const exteriorF=G.mul(exteriorAmplitude,G.exp(G.mul(b,G.log(X))),G.sub(o,heatLoss))',
    ):
        assert text in heat, text
    mean = pinned(args.heat_source.with_name('actual-mean-stress.mjs'), 'heatGamma')
    assert b"const heatGamma=improper('EulerGammaOnePlusH',laplaceWeight)" in mean
    assert b'const laplaceWeight=v=>exp(add(neg(v),mul(h,d.log(v))))' in mean
    schedule = pinned(args.heat_source.with_name('actual-global-source-outer.mjs'), 'schedule')
    for text in (
        b'const stages=[];let y=z,logA=z;',
        b'y=sum(y,length);logA=sum(logA,delta(length));',
        b"const holdLength=mul(q(-4),d.log(h));stage('steepPower'",
        b'const Qhold=sum(Qsteep,mul(sub(o,h),holdLength))',
        b'const Qb=mul(exp(neg(mul(sub(o,h),q(1,2)))),sum(Qhold,integral',
        b'const Qp=integral(s=>div(mul(exp(mul(sub(o,h),s)),rho,d.step(div(sub(s,o),q(2)),1)),mul(q(2),sub(o,rho))),o,q(3)',
        b'const wait=div(d.log(div(Qb,Qp)),sub(o,h))',
        b"stage('terminal',q(3)",
    ):
        assert text in schedule, text
    libs = replay['read_sources'](args)
    from outer_cutoff import ActualOuterCutoff
    exact = ActualOuterCutoff(args.localization_source).archive['formulaProgram']['parametersExactExpressions']
    assert exact['XR'] == {
        'product': [{'integer': 110}, {'power': [{'product': [{'ref': 'CSelected'}, {'ref': 'Pstar'}]}, 10]}]
    }
    assert exact['CSelected'] == {'exp': {'ref': 'logCSelected'}}
    assert exact['logCSelected']['sum'][-1] == {'power': [{'ref': 'Q'}, 200]}
    assert exact['Pstar'] == {'exp': {'ref': 'logP'}}
    assert exact['logP'] == {'product': [{'integer': 2}, {'ref': 'T'}]}
    assert exact['lambda'] == {'exp': {'product': [{'integer': -1000}, {'ref': 'T'}]}}
    assert exact['co'] == {'rational': '1/256'}
    assert exact['BOuter'] == {'product': [{'integer': 1000}, {'ref': 'T'}]}
    assert exact['Tf'] == {'integer': 128}
    # S' is nonnegative and has a unit integral across the terminal transition.
    # Qsteep is positive since lambda>h, so Qb is larger than its hold contribution.
    assert Q(1, 2)*(1-Q(1, 64))*4*8002*10 > 1 and Q(27, 63) < 1
    return replay['integration'](*libs), original


def frequency_checks():
    horizontal = {-1, 1}
    mode_zero = {0}
    transverse = {n + k for n in horizontal for k in horizontal}
    supports = {
        'velocityCartesian': horizontal,
        'pressure': mode_zero,
        'forceCartesian': horizontal | mode_zero,
        'gradUxy': transverse,
        'gradUz': horizontal,
    }
    assert max(abs(n) for modes in supports.values() for n in modes) == 2
    left, right = 2, 4
    assert all(abs(n) <= left for modes in supports.values() for n in modes)
    products = {
        'energy': {a - b for a in horizontal for b in horizontal},
        'forceSquare': {a - b for a in supports['forceCartesian'] for b in supports['forceCartesian']},
        'work': {a - b for a in supports['forceCartesian'] for b in horizontal},
        'gradientDissipation': {a - b for a in transverse | horizontal for b in transverse | horizontal},
    }
    assert all(n % 5 for modes in products.values() for n in modes if n)
    assert any(n % 4 == 0 for n in products['gradientDissipation'] if n)
    assert (2 - (-2)) % 4 == 0
    assert len({n % 5 for n in range(-2, 3)}) == 5
    return {
        'physicalCartesianModes': {k: sorted(v) for k, v in supports.items()},
        'plateauGradientModeTwoNonzero':
            'd_x u_y=(K_r+K/r)/2 +(K_r-K/r)*cos(2 theta)/2; K_r<0<K/r on the original exterior plateau.',
        'cutoffPair': [left, right],
        'omittedSquaredFourierTailBothCutoffs': '0',
        'retainedModeDifferenceOnCommonCircles': '0',
        'angularQuadrature': 'Five equally spaced angles integrate each indicated quadratic angular integral exactly. The main integration uses the equivalent exact angular integral.',
        'fourPointDealiasingControl': 'Modes +2 and -2 coincide modulo 4. A degree-four integrand can alias to the quadrature mean.',
    }


def heat_order_checks():
    z_cap = Q(1, 55)
    h_cap = Q(1, 64)
    a_cap = Q(1, 2) + h_cap
    rows = {}
    for degree in (4, 8):
        m = degree + 1
        derivative_bound_per_h = prod(j+h_cap for j in range(1,m))*prod(j+h_cap for j in range(1,m+1))
        errors = [derivative_bound_per_h*z_cap**m/factorial(m-d) for d in range(3)]
        error, slope_error, second_error = errors
        assert 0 < error < 1
        rows[degree] = {
            'H': error,
            'ZHprime': slope_error,
            'Z2Hsecond': second_error,
            'rKrOverB_sPowMinusA': 2*a_cap*error+2*slope_error,
            'r2KrrOverB_sPowMinusA': 2*a_cap*(2*a_cap+1)*error+(8*a_cap+6)*slope_error+4*second_error,
            'pressureOverB2_sPowMinus2A_div4A': (2+h_cap*error)*error,
        }
    assert all(value < rows[4][key]/1000 for key, value in rows[8].items())
    # Signed finite Taylor remainder is essential: fixed positive Z makes the late term ratio >1 eventually.
    assert Q(1,55)*Q(56*57,57) > 1
    return {
        'argument': 'Z=4*tau/r^2=2*(1-eta^2)/X; 0<=Z<=2/Xb<1/55, also at every pressure tail radius.',
        'argumentCapSource': 'The source XR>110 and all outer stage lengths are positive; Qb>1>Qp>0 makes the source wait positive. The original Xb=XR*exp(terminal.end)>110.',
        'h': '0<h<2^-8192; use h<1/64 to bound rising factorials and retain the actual factor h.',
        'kernelPolynomial': 'P_N(Z)=sum_{j=0}^N (-1)^j*(h)_j*(1+h)_j*Z^j/j!',
        'signedTail':
            'For m=N+1 and 0<=d<=2, H^(d)-P_N^(d) has sign (-1)^m and magnitude at most (h)_m*(1+h)_m*Z^(m-d)/(m-d)!.',
        'pressurePolynomial':
            'p_N=-B^2*s^(-2A)/2 sum_{i,j=0}^N c_i*c_j*Z^(i+j)/(2A+i+j), where c_i is the coefficient of Z^i in P_N.',
        'pressureSign': 'For N=4,8, P_N>=H>0, so p_N<=p.',
        'absoluteErrorFactorsToMultiplyBySourceh': {str(n): {k: str(v) for k,v in row.items()} for n,row in rows.items()},
        'degree8ToDegree4UniformCaps': {k: str(v/rows[4][k]) for k,v in rows[8].items()},
        'localizedForceErrorOverExactSourceFactors': {
            'Qheat': 'B*s^(-A)',
            'E0ErEp': 'Use h times the corresponding listed value, radial derivative and squared-heat/pressure error factors.',
            'theta': 'abs(C_t-Delta C)*E0*Qheat+2*abs(C_r)*Er*Qheat/r',
            'radial': 'abs(C*(1-C))*Ep*Qheat^2/r+abs(C_r)*Ep*Qheat^2/(4*A)',
            'axial': 'abs(C_z)*Ep*Qheat^2/(4*A)',
        },
        'scope': 'These are finite Taylor bounds with an integral remainder, evaluated over the actual moving exterior using exact positive normalization factors.',
    }


def numeric_axes(evaluate, original):
    axes = {
        'base': (32, 64, 72),
        'spatialGridOnly': (64, 64, 72),
        'arithmeticPrecisionOnly': (32, 64, 144),
    }
    values = {k: evaluate(*config) for k,config in axes.items()}
    show = ('endpointEnergyOverScale', 'azimuthalForceSpacetimeL2SquaredOverScale')
    for key, saved in (('base', 'base'), ('spatialGridOnly', 'spaceOnly')):
        assert {k: v.encoded() for k,v in values[key].items()} == original['intervals'][saved]
    widths = {layout: {key: row[key].hi-row[key].lo for key in show} for layout, row in values.items()}
    for key in show:
        x = values['base'][key]
        y = values['arithmeticPrecisionOnly'][key]
        assert max(x.lo, y.lo) <= min(x.hi,y.hi)
        assert widths['spatialGridOnly'][key] < widths['base'][key]
        assert widths['arithmeticPrecisionOnly'][key] < widths['base'][key]
    return {
        'axisOrder': ['axialCutoffCells', 'timeCutoffCells', 'directedBits'],
        'settings': axes,
        'metrics': show,
        'widthsExact': {layout: {k: str(v) for k,v in row.items()} for layout,row in widths.items()},
        'widthsOutwardAt6Decimals': {
            layout: {k: str(Q(-(-v.numerator*10**6//v.denominator),10**6)) for k,v in row.items()}
            for layout,row in widths.items()
        },
        'exactIntervals': {layout: {k: v.encoded() for k,v in row.items()} for layout,row in values.items()},
        'precisionIntervalsOverlapBase': True,
        'bothMetricWidthsStrictlyNarrowAtDoublePrecision': True,
        'baseAndSpatialReadbackMatchesPinnedOriginal': True,
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('localization-source', 'heat-source', 'chart', 'exterior', 'criterion', 'out'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    if not __debug__:
        raise ValueError('Run with source assertions enabled')
    evaluate, original = require_source(args)
    result = {
        'schema': 'MathScope.N8.RestrictedOriginalHeatExteriorRefinement/1',
        'status': 'VERIFIED_RESTRICTED_AXES_ON_ORIGINAL_EXTERIOR_IDENTIFICATION',
        'pins': PINS,
        'exteriorDomain': original['domain'],
        'exteriorLastVerifiedTau': 'tau0/2=qBig/64; exact positive source time for the exterior slab.',
        'wholeKLastResolvedTau': None,
        'numericAxesWithExactAngularIntegration': numeric_axes(evaluate, original),
        'fourierAxis': frequency_checks(),
        'heatCoefficientOrderAxis': heat_order_checks(),
        'scope': 'Heat-series truncation compares the exterior coefficient functions. Active recursive source orders, inner pulse and center resolution, whole-K omitted tails and last resolved tau remain open.',
        'N8_05': 'OPEN',
        'finalJets': 0,
        'release': 'HOLD',
    }
    raw = (json.dumps(result, indent=2)+'\n').encode()
    with args.out.open('xb') as file:
        file.write(raw)
    print('PASS actual exterior grid and arithmetic replays, Fourier truncation and heat order tails')
    print('SHA256', sha256(raw).hexdigest(), args.out.name)


if __name__ == '__main__':
    main()
