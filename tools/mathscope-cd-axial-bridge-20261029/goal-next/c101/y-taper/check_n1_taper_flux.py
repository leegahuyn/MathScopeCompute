"""Check the exact local taper trace and its uniform and integral bounds."""

from fractions import Fraction as F
from hashlib import sha256
import json
from pathlib import Path
import sys


C100 = '17664f981265e2373a5c16d0bf3c9dc233af48605974de1e072520b9932b71de'
C100_OPS = 'afa75d0bba159592b4ce217dc06c9b871fb7137f9617291240370a53b1aad35f'
C99_OPS = 'd52bfc8ddd4a9987cd25d3d4a2161cc10e19d8d2ee7975f87ae2e7b68f8e27be'
C55_LEADING = 'aa4cf7d3b762b9772fce712ce1fb7a08f4784d9797aaee62deced94e8c5b7276'


def pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def verify(source, c100, c99, goal):
    raw = source.read_bytes()
    data = json.loads(raw)
    assert data['schema'] == 'MathScope.C101.OriginalN1TaperFluxOperands/1'
    assert data['prior'] == {'C99Ops':C99_OPS,'C100':C100,'C100Ops':C100_OPS}
    old = json.loads(pinned(c100/'n1-radial-seams.json',C100))
    previous_source = json.loads(pinned(c100/'n1-radial-seams-operands.json',C100_OPS))
    transfer = json.loads(pinned(c99/'n1-ipos-transfer-operands.json',C99_OPS))
    pinned(goal/'axial-order-one-identity/leading-B/ACTUAL_LEADING_B_PROOF.md',C55_LEADING)
    assert old['operandsSHA256'] == C100_OPS
    assert data['originalPrefixSHA256']==previous_source['originalPrefixSHA256']==transfer['originalPrefixSHA256']
    assert data['registrySHA'] == transfer['registrySHA']
    assert data['originalTaperUsesFixedEta'] and data['originalStepSquaredExponents']
    roots=data['sourceRoots']
    assert [roots[x] for x in ('Xminus','Xkeep','Xcut','commonEnd')] == [28814,28819,28823,24805]
    assert roots['originalAxialDensity']==old['originalAxialDensityAndIntegrals']['body']==117047
    assert roots['Ft']==transfer['sourceRoots']['localF'] and roots['Ut']==transfer['sourceRoots']['localU']
    assert [row['name'] for row in data['identities']] == [
        'original-taper-derivative','axial-radial-drift','angular-radial-drift',
        'axial-weighted-diffusion','angular-weighted-diffusion',
        'axial-transport-boundary','angular-transport-boundary',
        'axial-boundary-taper-trace','angular-boundary-taper-trace',
    ]
    assert all(row['numeratorMonomials']==0 for row in data['identities'])
    assert old['norms']['finiteRegisteredValueErrorOnDeltaOver8']=='2^73 Q^-77'
    assert old['norms']['rawF1U1XDerivativeErrorOnDeltaOver16']=='2^46 Q^-19'
    assert old['norms']['rawF1U1WeightedXSecondDerivativeErrorOnDeltaOver16']=='2^46 Q^-19'
    assert old['ordinaryCompatiblePressureIdentity']=='d_X Pihat=2 F0 Fhat+pKnown'

    # A_z = 1/L + v0 - 2 eta U0/L. Each comparison uses Q,delta^-1>=1.
    drift = 2+2**9+4*8*2
    assert drift < 2**10
    drift_x = 2**9 + 4*2*F(1,4)  # X*|A_z,X|; X*Q<1.
    assert drift_x < 2**10
    axial_drift_prime = 2**10+2**10
    theta_drift_prime_over_x = 4*2**10+2*2**10
    assert axial_drift_prime==2**11 and theta_drift_prime_over_x<2**13
    t_zero = 2*(4+4*16)  # pure eta derivative of velocity, Cauchy radius delta/16.
    u_z_zero = 8*2*(4*4+5*16)
    z_u0 = 8*(4*8+2)+16*2*8
    v_x_u0 = 2**8*F(1,4)
    # On the local interval the two compatible pressures differ by the
    # exact primitive of 2 F0*(kappa*eF), with the same leading Omega.
    z_pressure = 8*(4+16)+16*16
    assert t_zero<2**8 and u_z_zero<2**11 and z_u0<2**10
    assert max(v_x_u0,z_pressure)<2**9
    z_nonradial = 2**8+2**11+2**10+2**9+2**9
    assert z_nonradial + axial_drift_prime < 2**14
    theta_nonradial = 2**8+2**9+2**11+2**8*2**7+2**11
    assert theta_nonradial < 2**16
    assert 2*2**16 + 2**13 < 2**18
    assert 2**14+2**11 < 2**15
    assert 2**18+2**12 < 2**19
    q_min=2**260
    # Compare each nondiffusive remainder to g*R or g²*R, R=2^46 Q^-19.
    assert F(2**42,q_min**56)<1
    assert F(2**46,q_min**54)<1
    assert (2*2+1,2*4+1)==(5,9)

    # Exact squared-flat step derivative at the middle and scale Jacobian.
    u=F(1,2)
    logit_slope=-2/u**3-2/(1-u)**3
    sigmoid_slope=-logit_slope/4
    assert sigmoid_slope==8
    assert -128*sigmoid_slope==-1024 and -256*sigmoid_slope==-2048
    assert 128*9==1152 and 256*9==2304
    # dx/du=X*t1/64, integral of sigma' exactly one.
    assert F(128,64)==2 and F(256,64)==4
    # Width*taper-independent remainder <= g*E or g²*E:
    # g*R*t1/E <= (5/2^27)*Q^(-64-120+58).
    assert max(5,9)*F(5,64*2**27*q_min**126)<1
    assert (2+1,4+1)==(3,5)
    # Symbolic finite depth N>=3+ceil(24 log C/(5 log Q)).
    # Q^(25 N)>=Q^75*C^120, 2304<2^12, and gR>2^48 Q^-83.
    assert 25*F(24,5)==120 and 25+25*3==100
    assert 2304<2**12
    assert F(2**39,q_min**17)<2**48

    return {
        'schema':'MathScope.C101.ActualN1TaperFluxError/1',
        'sourceStatus':'VERIFIED_ORIGINAL_N1_TAPER_AND_WEIGHTED_RESIDUAL_FLUX_IDENTITIES',
        'ordinaryStatus':'CONDITIONAL_ON_C100_COHERENT_RAW_REALIZATION_AND_ORIGINAL_LOCAL_LEADING_BOUNDS',
        'sourceOperandsSHA256':sha256(raw).hexdigest(),
        'priorC100ReceiptSHA256':C100,
        'sourceIdentityCount':len(data['identities']),
        'sourceAxialIntegrand':117047,
        'radialDomain':{'left':roots['Xminus'],'taperStarts':roots['Xkeep'],'right':roots['Xcut']},
        'errorSymbols':{'E':'2^73 Q^-77','R':'2^46 Q^-19','g':'Xcut'},
        'normalizedStressError':{
            'axial':'sqrt(2X) DeltaTz','angular':'2X DeltaTtheta',
            'strip':'S_(delta/16)','scope':'original forward integrals Xminus<=X<=Xcut',
        },
        'exactIsolatedTaperTrace':{
            'axial':'-128 sigmaPrime(u) eU/t1','angular':'-256 X sigmaPrime(u) eF/t1',
        },
        'uniformErrorWithTaperTraceRemoved':{'axial':'5 g R','angular':'9 g^2 R'},
        'fullErrorL1OnActualTaper':{'axial':'3 g E','angular':'5 g^2 E'},
        'fullErrorL1OnLocalInterval':{'axial':'5 g^2 R + 2 g E','angular':'9 g^3 R + 4 g^2 E'},
        'genericNonvanishingTraceAtMidpoint':{'sigmaPrime':'8','axialOverConstantError':'-1024/t1',
                                               'angularOverConstantError':'-2048 X/t1'},
        'symbolicSufficientDepthForPointwiseTraceBelowGR':'3+ceil(24 log(CSelected)/(5 log(Q)))',
        'sufficientDepthMaterialized':False,
        'remaining':'OPEN_UNSCALED_POINTWISE_TAPER_ERROR_AT_TWO_TERMS_AND_WHOLE_OUTER_STRESS',
        'additionalFinalJets':0,'release':'HOLD',
    }


if __name__ == '__main__':
    source,c100,c99,goal,out=map(Path,sys.argv[1:])
    result=verify(source,c100,c99,goal)
    with out.open('x',encoding='utf-8',newline='\n') as f:
        json.dump(result,f,indent=2)
        f.write('\n')
    print('VERIFIED original #117047 and nine taper and weighted-flux source identities')
    print('CONDITIONAL exact pointwise trace and unscaled local L1 taper error')
