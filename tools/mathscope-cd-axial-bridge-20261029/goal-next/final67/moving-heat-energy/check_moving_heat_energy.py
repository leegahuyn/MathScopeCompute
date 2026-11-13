"""Directed integration of the original moving X>=Xb heat exterior."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys


PINS = {
    'whole-k-chart': 'af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9',
    'geometric-heat-exterior': '0093f4866779b5bcc61284a7bccedb45ab425436889d8a9f2e97122b70329267',
    'exterior-energy-refinement': '54b1d16542837fa9e165ed8051c928da6f1c4f942f420460c8a5b32dad22ff66',
    'exterior-cutoff-force': '9bba52b109ec9c61db0cd8bdc32cd5aaf6baedfac416277ec65b00d5c656afea',
    'outer_cutoff.py': '535e1126c6450627bd61cf0e5a94c33938b12e71886a995175493dddfe6b8ced',
    'actual-continuation-exact-heat.mjs': 'c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172',
}


def need(condition, name):
    if not condition:
        raise ValueError(name)


def pin(path, label):
    raw = path.read_bytes()
    need(sha256(raw).hexdigest() == PINS[label], f'original {label} SHA256')
    return raw


def read(path, label):
    return json.loads(pin(path, label))


def small(exponent):
    return Q(1, 2**exponent)


def arc_tan_inverse(base, terms):
    lo = sum(Q((-1)**j, (2*j+1)*base**(2*j+1)) for j in range(terms))
    return lo, lo + Q(1, (2*terms+1)*base**(2*terms+1))


def read_sources(args):
    source = args.localization_source / 'research-ide/mathscope-m3/recovery-20261019'
    pin(source / 'outer_cutoff.py', 'outer_cutoff.py')
    sys.path.insert(0, str(source))
    from outer_cutoff import ActualOuterCutoff, I, chi_jets, rounded
    outer = ActualOuterCutoff(args.localization_source)
    exact = outer.archive['formulaProgram']['parametersExactExpressions']
    need(exact['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}}
         and exact['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]}, 'original positive h')
    program = outer.archive['formulaProgram']

    def op(root, tag):
        record = program['nodes'][root]
        need(record['op'] == tag, f'source node {root} is {tag}')
        return record['args']

    roots = program['roots']
    ell = roots['ellMinimum']
    [ell_max] = op(ell, 'ceiling')
    _, geometric, frequency = op(ell_max, 'maximum')
    [ratio, power] = op(frequency, 'integer_power')
    num, inv_h = op(ratio, 'multiply')
    radius_power = op(geometric, 'maximum')[-1]
    radius, radius_exponent = op(radius_power, 'integer_power')
    need(power == 2 and op(num, 'rational') == ['64', '1']
         and op(inv_h, 'inverse') == [roots['h']]
         and radius_exponent == 1024 and op(radius, 'source_parameter') == ['C12EnvelopeR'],
         'actual ellMinimum majorizes (64/h)^2 and Rstar^1024')
    [q_exp] = op(roots['qStar'], 'exp')
    minus, log_band = op(q_exp, 'multiply')
    log_two, band = op(log_band, 'multiply')
    [two] = op(log_two, 'log_positive')
    four, band_tail = op(band, 'add')
    six, actual_ell = op(band_tail, 'add')
    tau_factor, tau_q = op(roots['tau0'], 'multiply')
    need(actual_ell == ell and op(four, 'rational') == ['4', '1']
         and op(six, 'rational') == ['6', '1'] and op(two, 'rational') == ['2', '1']
         and op(minus, 'rational') == ['-1', '1'] and tau_q == roots['qStar']
         and op(tau_factor, 'rational') == ['1', '32'], 'actual qBig and tau0 normalization')
    heat_module = pin(args.heat_source, 'actual-continuation-exact-heat.mjs')
    need(b'const Xb=G.mul(XR,G.exp(last.end))' in heat_module
         and b'argument:Z,terminalFoOneAfter:Xb' in heat_module, 'actual terminal Xb and heat kernel')
    chart = read(args.chart, 'whole-k-chart')
    heat = read(args.exterior / 'geometric-heat-exterior.json', 'geometric-heat-exterior')
    fixed = read(args.exterior / 'exterior-energy-refinement.json', 'exterior-energy-refinement')
    force = read(args.exterior / 'exterior-cutoff-force.json', 'exterior-cutoff-force')
    need(chart['variables']['rho'] == 'tau/tau0 with tau=1-t and tau0=qBig/32'
         and chart['variables']['bounds'] == ['1/2 <= Q < 2', '|eta| < 3/4', 'q < qBig/16']
         and heat['geometry']['movingLowerFace'] == 'r^2>=2*q*Xb>=tau0*Xb=s0>0', 'original moving exterior domain')
    need(force['verifiedCylindricalAlgebra']['thetaForce'] == '(C_t-Delta C)K-2*C_r*K_r'
         and force['coarseFactoredBounds']['cutoffDerivatives'] == {
             'chiPrime': 108, 'chiSecond': 19440, 'CtTau0': 108, 'Cr': 324, 'CzZ0': 324,
             'radialLaplacian': 156384, 'axialLaplacianZ0Squared': 155952,
         }, 'original complete exterior azimuthal force and derivative bounds')
    need(max(Q(v) for v in fixed['intervals']['both']['endpointEnergyOverM']) < 2048,
         'prior fixed exterior normalized comparison')
    return I, chi_jets, rounded


def arithmetic_controls():
    h_max = small(8192)
    # Source h=exp(-8002T), T>10, log(2)<1.
    need(8002*10 > 8192, 'h dyadic bound')
    # B> (64/h)^2/2 and log(4*tau0*Xb)<-(255/256)B.
    need(4096*Q(255,256)/h_max > 8192 and 2048/h_max**2 > 8192,
         'both tiny powers of the physical scale')
    need(2*(1+h_max)/110 < 1 and Q(1,8)*(1-2*h_max) > Q(1,10),
         'heat argument at the genuine terminal radius and positive radial derivative denominator')
    # Radial lower error is bounded by 4h (H²), 4h (2Q), and 2^-8192 (upper radial face).
    delta = small(8188)
    need(9*h_max < delta, 'relative radial endpoint and time uniform error')
    sigma = small(8173)
    need((156384+2*324*4+155952)*h_max < sigma, 'azimuthal commutator norm')
    work_error = small(8170)
    force_error = small(8162)
    l1l2_squared_error = small(8168)
    need(4*delta+3*sigma < work_error, 'work error')
    need(864*delta+3*(216*sigma+sigma*sigma) < force_error, 'azimuthal force L2-square error')
    need((6+3*delta+2*sigma)*(3*delta+2*sigma) < l1l2_squared_error, 'azimuthal L1L2-square error')
    # Transverse dissipation uses (R_r*K+R*K_r)^2+(R*K/r)^2.
    transverse = 3*(2*324**2+18)*h_max
    axial = 3*324**2*h_max
    # Moving face and oriented viscous flux, including the tilted axial term.
    radial_flux, axial_flux, movement = 16*h_max, 10368*h_max**2, 16*h_max
    dissipation_cap = small(8171)
    flux_cap = small(8184)
    need(transverse+axial < dissipation_cap and radial_flux+axial_flux+movement < flux_cap,
         'full dissipation and inner-face energy flux')
    need(8191-11 == 8180, 'strict fixed-exterior energy comparison')
    defect_cap = small(8168)
    need(3*delta+work_error+dissipation_cap+flux_cap < defect_cap,
         'correlated shared leading term cancels in energy defect')
    return delta, work_error, force_error, l1l2_squared_error, dissipation_cap, flux_cap, defect_cap


def integration(I, chi, rounded):
    @cache
    def pi(bits):
        a,b = arc_tan_inverse(5, bits//2)
        c,d = arc_tan_inverse(239, bits//4)
        return rounded(I(16*a-4*d, 16*b-4*c), bits)

    @cache
    def axial(count, bits):
        # |zeta|<=1/2 is a unit-length plateau. Outside 1/sqrt(2)
        # the cutoff is exactly zero, so integrating to 3/4 is exact.
        step = Q(1, 4*count)
        lo = hi = Q(1)
        for j in range(count):
            a = Q(1,2) + j*step
            b = a + step
            lo += 2*step*chi(2*b*b, 2*b*b, bits)[0].square().lo
            hi += 2*step*chi(2*a*a, 2*a*a, bits)[0].square().hi
        return rounded(I(lo, hi), bits)

    @cache
    def temporal(count, bits):
        step = Q(1, 2*count)
        lo = hi = Q(0)
        for j in range(count):
            a = Q(1,2)+j*step
            b = a+step
            value = chi(a,b,bits)[1].square()
            lo += step*value.lo
            hi += step*value.hi
        interval = rounded(I(lo,hi), bits)
        return I(max(2,interval.lo),min(108,interval.hi))

    delta, work_error, f_error, l1l2_error, d_cap, flux_cap, defect_cap = arithmetic_controls()

    def evaluate(n_space,n_time,bits):
        iz = axial(n_space,bits)
        time_f = temporal(n_time,bits)
        angular = pi(bits)*iz
        e = I(1-delta,1)*angular/2
        w = angular/2+I(-work_error,work_error)
        f = angular*time_f+I(-f_error,f_error)
        f_l1l2 = angular+I(-l1l2_error,l1l2_error)
        return {k:rounded(v,bits) for k,v in {
            'axialCutoffSquareIntegral': iz, 'temporalCutoffDerivativeSquareIntegral': time_f,
            'endpointEnergyOverScale': e, 'workOverScale': w,
            'azimuthalForceSpacetimeL2SquaredOverScale': f,
            'azimuthalForceL1TimeL2SpaceSquaredOverScale': f_l1l2,
        }.items()}

    return evaluate


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('localization-source','heat-source','chart','exterior','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args = parser.parse_args()
    need(__debug__, 'do not disable original source assertions')
    evaluate = integration(*read_sources(args))
    layouts = {'base':(32,64,72), 'spaceOnly':(64,64,72), 'timeOnly':(32,128,72),
               'both':(64,128,72), 'precisionOnly':(32,64,96)}
    results = {name:evaluate(*setting) for name,setting in layouts.items()}
    e = 'endpointEnergyOverScale'
    f = 'azimuthalForceSpacetimeL2SquaredOverScale'
    norm = 'azimuthalForceL1TimeL2SpaceSquaredOverScale'

    def width(layout,key):
        i = results[layout][key]
        return i.hi-i.lo

    need(width('spaceOnly',e)<width('base',e), 'independent spatial narrowing')
    for refined in ('spaceOnly','timeOnly'):
        need(width(refined,f)<width('base',f), f'independent {refined} force narrowing')
    need(width('both',f)<min(width('spaceOnly',f),width('timeOnly',f)), 'combined narrowing')
    need(results['both'][e].lo>1 and results['both'][norm].lo>3, 'strict physical lower bounds')
    output = {
        'status':'DIRECTED_ACTUAL_MOVING_HEAT_EXTERIOR_INTEGRALS', 'inputSHA256':PINS,
        'scale':'S=M*(tau0*Xb)^(-2h)/(2h)=tau0*(2^A*cInfinity)^2*Xb^(-2h)/(2h); M=tau0^(2A)*(2^A*cInfinity)^2',
        'domain':'whole-K physical X>=Xb with moving inner face r^2=2*q*Xb, all physical angles',
        'layoutKeys':['axialCutoffCells','timeCutoffCells','directedBits'], 'layouts':layouts,
        'intervals':{k:{name:v.encoded() for name,v in r.items()} for k,r in results.items()},
        'widthsExact':{k:{name:str(width(k,name)) for name in (e,f)} for k in layouts},
        'relativeErrors':{'uniformRadialHeatFactor':'2^-8188','workOverScale':'2^-8170',
                          'azimuthalForceSpacetimeL2SquaredOverScale':'2^-8162',
                          'azimuthalForceL1TimeL2SpaceSquaredOverScale':'2^-8168'},
        'dissipationWithTimeWeightOverScale':['0','2^-8171'],
        'absoluteViscousPlusMovingInnerFaceFluxOverScale':['0','2^-8184'],
        'absoluteCorrelatedExteriorDefectOverScale':['0','2^-8168'],
        'wholeKLowerBounds':{'endpointEnergyOverScale':'1','forceL1TimeL2SpaceSquaredOverScale':'3'},
        'actualGeometricExteriorEndpointEnergyOverPriorFixedExterior':'greater than 2^8180',
        'forceLowerBoundUsesAzimuthalComponentOnly':True,
        'wholeKFinalFieldsNumericallyEvaluated':False, 'N7_06':'OPEN','N8_05':'OPEN','finalJets':0,'release':'HOLD',
    }
    raw = (json.dumps(output,indent=2)+'\n').encode()
    args.out.write_bytes(raw)
    print('PASS original moving heat exterior endpoint, work and azimuthal force; independent axial/time narrowing')
    for key in (e,f,norm):
        interval = results['both'][key]
        print(key, float(interval.lo), float(interval.hi))
    print(sha256(raw).hexdigest(),args.out.name)


if __name__ == '__main__':
    main()
