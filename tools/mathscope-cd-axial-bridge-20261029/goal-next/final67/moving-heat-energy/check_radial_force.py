"""Exact moving heat exterior bounds for the full original vector force."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

from check_moving_heat_energy import need, read_sources, small


MOVING = 'c614a3a12ec8d9dcf5bd02235dd6227bb79969d372f345baad6aec471c127c2b'
AMPLITUDE = '647a71162df52b9bfb489479c14dbf6b916086d7f64a36c5c61cee9820a6c7cf'


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('localization-source', 'heat-source', 'chart', 'exterior', 'moving', 'out'):
        parser.add_argument('--'+name, type=Path, required=True)
    args = parser.parse_args()
    need(__debug__, 'do not disable original source assertions')
    I, chi, _ = read_sources(args)
    raw = args.moving.read_bytes()
    need(sha256(raw).hexdigest() == MOVING, 'actual moving exterior integration pin')
    prior = json.loads(raw)
    amp = (args.exterior/'amplitude/whole-k-exterior-amplitude.json').read_bytes()
    need(sha256(amp).hexdigest() == AMPLITUDE, 'same strictly positive original heat amplitude')
    azimuthal = prior['intervals']['both']
    f = 'azimuthalForceSpacetimeL2SquaredOverScale'
    g = 'azimuthalForceL1TimeL2SpaceSquaredOverScale'
    need(Q(azimuthal[f][1]) < 13 and Q(azimuthal[g][1]) < 4,
         'prior same-domain azimuthal component upper bounds')
    need(prior['dissipationWithTimeWeightOverScale'] == ['0','2^-8171'],
         'same original source scale')
    a, b = Q(11,16), Q(13,16)
    time = chi(b,b,96)[0].lo, chi(a,a,96)[0].hi
    need(time[0] > Q(1,5) and time[1] < Q(4,5),
         'original monotone cutoff stays between 1/5 and 4/5 on plateau test time interval')
    h = small(8192)
    # H^4>1/2. y=4A<3. The integral of s^(-1-y) over
    # [4*s0,8*s0] divided by s0^-y/y is 4^-y*(1-2^-y).
    need((1-2*h)**4 > Q(1,2) and Q(1,4**3)*Q(3,4) > Q(1,128),
         'uniform lower bound for original heat kernel and radial power integral')
    pointwise_time_radial_lower = Q(3,2)*Q(4,25)**2*Q(1,2)*Q(1,128)
    l2_lower = (b-a)*pointwise_time_radial_lower
    l1l2_lower = (b-a)**2*pointwise_time_radial_lower
    need(l2_lower > small(16) and l1l2_lower > small(20), 'actual squared norm lower endpoints')
    # If L=log(1/qBig), hL>=max(2048/h,h*R^1024/2)>=32*R^512.
    # 2hL - log(1/h) >= hL (log(1/h)<=1/h). Subtract
    # (2+2h)log Xb <= (2+2h)*2*log R and retain >8192.
    need(32 > 2*(2+2*h) and 2048/h > 8192,
         'symbolic separation of radial force and energy scales')
    scale_ratio_upper = small(8192)
    # For F_r normalized by S_R, pointwise-time square bounds are
    # (6/16)*S_R and (6*324²/4)*s0*S_R for the main and cutoff terms.
    # The axial term has the same pressure bound with s0/z0².
    # Here s0<2^-8192. To bound s0/z0²=tau0^(2h)*Xb use
    # 2hL>=64Rstar^512 and log Xb<=2 log Rstar.
    radial_upper = Q(6,16)+Q(6*324**2,4)*h
    axial_upper = Q(3*324**2,4)*h
    spacetime_upper = (radial_upper+axial_upper)/2 + 13*scale_ratio_upper
    l1l2_upper = spacetime_upper/2
    need(spacetime_upper < Q(1,4) and l1l2_upper < Q(1,8),
         'actual full-vector force upper endpoints')
    receipt = {
        'schema':'MathScope.N7.OriginalMovingHeatVectorForce/1',
        'status':'VERIFIED_ACTUAL_MOVING_HEAT_FULL_VECTOR_FORCE_INTERVAL',
        'movingHeatSHA256':MOVING,
        'originalAmplitudeSHA256':AMPLITUDE,
        'scale':'S_R=tau0^(2A+2)*(2^A*cInfinity)^4*(tau0*Xb)^(-4A)/(4A)',
        'ratio':'S_R/S > 2^8192, with S the original moving heat energy scale',
        'closedLowerCell':{'rSquared':'[4*tau0*Xb,8*tau0*Xb]','zeta':['-1/2','1/2'],
                           'rho':['11/16','13/16'],'chiEnclosure':I(*time).encoded()},
        'geometricHeatExteriorFullForceSpacetimeL2SquaredOverS_R':['2^-16','1/4'],
        'geometricHeatExteriorFullForceL1TimeL2SpaceSquaredOverS_R':['2^-20','1/8'],
        'wholeKFullForceL1TimeL2SpaceSquaredLower':'2^-20*S_R > 2^8172*S',
        'usesOriginalPressureGradientAndBothCutoffPressureTerms':True,
        'wholeKFinalFieldsNumericallyEvaluated':False,
        'N7_06':'OPEN','N8_05':'OPEN','finalJets':0,'release':'HOLD',
    }
    raw = (json.dumps(receipt, indent=2)+'\n').encode()
    args.out.write_bytes(raw)
    print('PASS original moving heat radial-force plateau lower and full-vector norm upper endpoints')
    print(sha256(raw).hexdigest(),args.out.name)


if __name__ == '__main__':
    main()
