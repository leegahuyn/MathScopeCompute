"""Exact coefficients transporting the terminal angular density to the actual Haar arm."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


TARGET_SHA='75b0bb821dc1a486ced5d88176faffe63645d73534366f11bd1708d39377e25f'
TRANSPORT_SHA='3667d24bfaebfa135a019d7444d661286aa5e79fdb036e553b30e5b69e8138be'
BINDING_SHA='b2d4a4ad910e2e0f28b9527478a1f351e8ecde42c70612cc0286404a59948ed4'
TERMINAL_SHA='4135a53d40c87b97307771265f0ce86a277a3151c94d82e8cda8190be792b827'
TERM_SLOT=17717045
B_SLOT=17717057
B0_SLOT=17717108


def read(path,pin):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==pin,path
    return json.loads(raw)


def exact_coefficients():
    d=Q(1,4)
    # The original source geometry supplies width>2, t1<1/128.
    wide=2-d
    exponent=(Q(1,128)/wide)**2
    assert exponent==Q(1,50176)
    # exp x <= sum_{k>=0} x^k = 1/(1-x), since k!>=1.
    complement=1/(1-exponent)
    # One enclosing rational series bound for exp(2*d).
    p=2*d
    series=sum((p**k/factorial(k) for k in range(4)),Q(0))
    series+=p**4/factorial(4)/(1-p/5)
    assert series==Q(2849,1728)<Q(5,3)
    scale=Q(17,8)
    assert scale**16>2**17  # 2^(1+h) < 17/8 for original h<1/16.
    combined=2*scale*series*complement
    assert combined<8

    # Logarithmic derivative of exp(-4/delta^2+2 delta)*delta^-6.
    L={0:2,-1:-6,-3:8}
    DL={k-1:k*c for k,c in L.items() if k}
    assert DL=={-2:6,-4:-24}
    L_times_delta3=sum(abs(c)*d**(k+3) for k,c in L.items())
    dL_times_delta6=sum(abs(c)*d**(k+6) for k,c in DL.items())
    assert L_times_delta3==Q(269,32)<Q(17,2)
    assert dL_times_delta6==Q(195,128)
    assert Q(17,2)**2+dL_times_delta6<74
    return {'deltaUpper':str(d),'oppositeExponentUpper':str(exponent),
            'oppositeGaussianRatioUpper':str(complement),'exp2DeltaUpper':str(series),
            'slowScaleUpper':str(scale),'comparisonCoefficientBeforeRoundUp':str(combined),
            'uniformRoundedCoefficient':8,
            'normalizedLogDerivativeUpper':'17/2 delta^-3',
            'normalizedSecondDerivativeUpper':'74 delta^-6',
            'deltaCubeUpper':str(d**3),'deltaSixthUpper':str(d**6)}


def main():
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    cli=ArgumentParser(description=__doc__)
    for f in ('goal','transport','binding','terminal','out'):
        cli.add_argument('--'+f,type=Path,required=True)
    a=cli.parse_args()
    target=read(a.goal/'final67/n7-n8-target-directed/weighted-target-high.json',TARGET_SHA)
    checks=target['geometryChecks']
    assert all(checks[k] is True for k in ('XaLessThan1','XbGreaterThanExp2','t1LessThanOneOver128'))
    transport=read(a.transport,TRANSPORT_SHA)
    assert transport['exactAngularFlux']['directRemainder']=='K*(R/s)*A_theta(X,eta)'
    actual=read(a.terminal,TERMINAL_SHA)
    bound=read(a.binding,BINDING_SHA)
    assert actual['terminalRawDensity']['literalRawCoefficient']==TERM_SLOT
    assert actual['terminalRawDensity']['BBody']==bound['typedAlphaBinding']['actualB']==B_SLOT
    assert actual['sourceC0Bound']['B0']==bound['typedAlphaBinding']['actualB0']==B0_SLOT
    rebuilt = [r['bound'] for r in bound['pureTerminalRectangularNorms']]
    assert rebuilt==[117859,118006,118103]
    terms=exact_coefficients()
    result={'status':'VERIFIED_ORIGINAL_TERMINAL_FTC_ENVELOPES_AND_EXACT_TRANSPORT_CONDITIONAL_REAL_SEMANTICS',
            'priorPins':{'geometry':TARGET_SHA,'liveFlux':TRANSPORT_SHA,'terminal':TERMINAL_SHA,'binding':BINDING_SHA},
            'originalTerminalRoots':{'regularAngularDensity':TERM_SLOT,'B':B_SLOT,'B0PositiveNorm':B0_SLOT},
            'idsInIndependentOriginalReplay':rebuilt,
            'exponentsAndConstants':terms,
            'sourceFormulas':['A_theta=g*delta^-6*B, g=exp(-4/delta^2+2*delta)',
                              'M=K*R/s*A_theta','M_R=K/s*(A_theta-2*A_theta_delta)',
                              'M_RR=K/(s*R)*(4*A_theta_deltadelta-2*A_theta_delta)'],
            'bInventory':{'B0':'Original finite rectangular FTC majorant on the admitted terminal box.',
                          'B1':'Rebuilt finite rectangular FTC majorant on the same original B_delta.',
                          'B2':'Rebuilt finite rectangular FTC majorant on the same original B_delta_delta.'},
            'sharpFactors':['L1=B1/64+(17/2)*B0','L2=B2/4096+17*B1/64+74*B0'],
            'threeRadialBounds':['8*epsilon*q^(2h)*sqrt(Xb)*B0*zeta*delta^(-6)',
                                 '8*epsilon*q^(2h)*(B0/64+2*L1)*zeta*delta^(-9)',
                                 '8*epsilon*q^(2h)/R_min*(4*L2+L1/32)*zeta*delta^(-12)'],
            'premises':['Original terminal factorization and weighted real source semantics.',
                        'delta in (0,1/4], R>=R_min>0, s in [1/2,2], and the actual q cutoff in [0,1].',
                        'The stated ordinary derivatives and corresponding bounds for B exist on the actual box.',
                        'This is the isolated generated angular stress arm, with fixed Z,T and original label.'],
            'open':['Numerical evaluation of the positive norms B0,B1,B2, whole native angular moment and ordinary stress matching.',
                    'Effective covariance and full pressure residual weighted norms.'],
            'finalJets':0,'release':'HOLD'}
    with a.out.open('x',encoding='utf-8',newline='\n') as file:
        file.write(json.dumps(result,indent=2)+'\n')
    print(result['status'],terms['uniformRoundedCoefficient'])


if __name__=='__main__':
    main()
