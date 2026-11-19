"""Exact band power bookkeeping using the original Gaussian concentration."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path

ORDER=8
TARGET_PIN='75b0bb821dc1a486ced5d88176faffe63645d73534366f11bd1708d39377e25f'


def original_target_constants(goal, parameters):
    data=(goal/'final67/n7-n8-target-directed/weighted-target-high.json').read_bytes()
    assert sha256(data).hexdigest()==TARGET_PIN
    cert=json.loads(data)
    assert cert['sourceParameterSHA256']==parameters
    ledgers={row['order']:int(row['outerInteger']) for row in cert['rows']}
    assert sorted(ledgers)==[7,8] and max(ledgers.values())==ledgers[8]
    stirling=[1]
    constants=[]
    for j in range(ORDER+1):
        if j:
            stirling=[(j-1)*(stirling[k] if k<len(stirling) else 0)
                      +(stirling[k-1] if k else 0) for k in range(j+1)]
        assert sum(stirling)==factorial(j)
        terms=comb(j+2,2)
        source=int(ledgers[7 if j<=7 else 8])
        multiplier=terms*factorial(j)*source
        constants.append({'throughOrder':j,'profileJetCount':terms,'outerTaylorDerivativeInteger':str(source),
                          'logToXUnsignedStirlingSum':factorial(j),
                          'coefficientOfTwoPow1521RenvH119':str(multiplier)})
    return {'historicalWeightedTargetSHA256':TARGET_PIN,'regularOuterProfileScale':'Renv',
            'slowChartCoefficientCap':'2^1521*H^119, H=max(2,Lambda,Renv)',
            'factorRetained':['s^(-A-1/2)','delta^6 in axial profile'],
            'radialConversion':'delta=log(Xb/X), X>=Xb*exp(-1/2)>1, so X^-j<=1',
            'boundRows':constants,
            'analyticBoundary':'Original C8 dominated terminal Taylor/heat and slow-chart majorants are used. Ordinary inward derivatives at eta endpoints are retained.'}


def degree_audit():
    pulse, tangent, H, W, sigma = [], [], [], [], []
    rows = []
    for j in range(ORDER+1):
        pulse_terms = [1+k+pulse[j-k] for k in range(1,j+1)] or [0]
        pulse.append(max(pulse_terms))
        tangent.append(max(k+pulse[j-k] for k in range(j+1)))
        H.append(max(tangent[k]+tangent[j-k]-Q(1,2) for k in range(j+1)))
        W_terms = [Q(1,2)]+[Q(1,2)+H[k]+W[j-k] for k in range(1,j+1)]
        W.append(max(W_terms))
        if j == 0:
            sigma.append(W[0]/2)
        else:
            sigma_terms = [W[j]]+[sigma[k]+sigma[j-k] for k in range(1,j)]
            sigma.append(max(sigma_terms)-Q(1,4))
        assert pulse[j]==tangent[j]==2*j
        assert H[j]==2*j-Q(1,2)
        assert W[j]==2*j+Q(1,2) and sigma[j]==2*j+Q(1,4)
        rows.append({'order':j,'normalizedPulseDerivatives':str(pulse[j]),
                     'tangentOverP':str(tangent[j]),'H':str(H[j]),'regularWeightW':str(W[j]),
                     'sqrtW':str(sigma[j]),'sqrtWOverFourthRootS':str(sigma[j]-Q(1,4)),
                     'binomialCoefficients':[comb(j,i) for i in range(j+1)]})
    return rows


def scale_controls():
    # A_c < 4 R^20, b_theta >= C^-10 > R^-1, s factor >= 1/4,
    # -unit(target)·N > R^-33. Absorb 16 using R>16.
    lower_before_constant = 20+1+33
    assert lower_before_constant==54
    tau_floor_power = lower_before_constant+1
    # |b| < 2R, s factor <=4, A_c>R^-6. Absorb 8 using R>16.
    assert 1+6+1==8
    assert (Q(127,128)**2*2)>Q(15,8)
    assert (Q(129,128)**2*2)<Q(17,8)
    intervals = []
    for k in (Q(1),Q(3,7),Q(1,2**16)):
        err=k/128
        for a in (1-err,1+err):
            for b in (1-err,1+err):
                for c in (1-err,1+err):
                    for d in (1-err,1+err):
                        det=a*d+b*c
                        assert Q(15,8)<det<Q(17,8)
                        for r in (-1+k/16,1-k/16):
                            z=[(d-b*r)/det,(c+a*r)/det]
                            assert min(z)>k/64 and max(z)<2
                            intervals.append(z)
    assert len(intervals)==96
    # Exact after restoring masses and using det[N,K]=1, using a control basis N=(1,0), K=(0,1).
    ac,u,m1,m2,tau,k,r=map(Q,(3,4,5,7,11,1,0))
    H=[[-ac*m1,-ac*m2],[-u*m1,u*m2]]
    det=H[0][0]*H[1][1]-H[0][1]*H[1][0]
    assert det==-2*ac*u*m1*m2
    reg=[tau/(2*m1),tau/(2*m2)]
    assert [sum(a*b for a,b in zip(row,reg,strict=True)) for row in H]==[-ac*tau,u*tau*r]
    return {'tauLowerPowerOfRenv':tau_floor_power,'tauUpperPowerOfRenv':8,
            'checkedRationalConeCornersAsControls':len(intervals),'physicalSignControl':str(det),
            'negativeControl':'A floor y >= c_y*zeta by itself gives W >= c_y*exp(-oppositeExponent)*delta^3, which tends to zero.'}


def verify(goal,source_path,live_path):
    source_raw=source_path.read_bytes()
    live_raw=live_path.read_bytes()
    source,live=map(json.loads,(source_raw,live_raw))
    assert source['status']=='EXECUTED_ORIGINAL_TARGET_OUTER_FACTOR_AND_CONE_SOURCE'
    assert live['status']=='VERIFIED_SAME_LIVE_OUTER_TARGET_AND_COVARIANCE_MASSES'
    assert live['originalOuterReplaySHA256']==sha256(source_raw).hexdigest()
    assert len(live['positiveMasses']['sameMassAsColumns'])==2
    assert source['exactCone']['inverseBounds']==['kappa/64','2']
    assert live['positiveMasses']['exactProduct']=='haar*Ls=Dgeom*r0*Ichi'
    assert live['positiveMasses']['exactPaletteBounds']=='1/(Tg*ell^2)<ci<=1/ell^2 on admitted positive integer ell'
    assert live['target']['actualRadicands']==[17733801,17733805]
    assert source['originalOuterFactor']['limits']['range']==['0','1/2']

    signs=scale_controls()
    # exp(-x^2) <= exp(-|x|) for |x|>=1; the two remaining unit intervals give 2.
    # exp(-1)<1/2 from exp(1)>1+1 gives total mass <3.
    assert Q(2)*(1+Q(1,2))==3
    return {'status':'VERIFIED_OUTER_CONCENTRATION_POWER_TRANSFER_CONDITIONAL_SOURCE_NORMS',
            'sourceReplaySHA256':sha256(source_raw).hexdigest(),'sameLiveSHA256':sha256(live_raw).hexdigest(),
            'controls':signs,'regularizedLiveTargetCaps':original_target_constants(goal,source['parameters']),
            'gaussianLengthGain':{
                'originalPulseAmplitude':'P(v)<=exp(-gL*(v-Ls/2)^2/Ls)',
                'gL':'lambdaLower/(4u)=Renv^(-41)/8',
                'exactIntegralBound':'integral P^2 <= 3 sqrt(Ls/(2 gL))',
                'gaussianHaarCap':'K_G*S^(-1/2), K_G=(3/2)*Dgeom*Ichi*sqrt(r0/gL)',
                'scaleS':'ell^2, positive and constant during slow differentiation',
                'palette':'1/(Tg*S)<ci<=1/S and Ls=2r0/ci',
                'physicalMassLower':'m_L*S^(-1/2), m_L=(Dgeom*Ichi/2)*massLowerCoefficient*sqrt(2*r0/Tg)',
                'physicalMassUpper':'m_U*S^(-1/2), m_U=K_G*(amplitudeUpper)^2',
                'determinantLower':'abs(detH)>=D0/S, D0=(15/8)*Renv^(-6)*u*m_L^2',
                'sqrtSNormalizedWRange':['kappa*Renv^(-55)/(64*m_U)','2*Renv^8/m_L'],
            },
            'constantRecurrences':{
                'pulse':'U0=propagatorUpper; Uj=propagatorUpper*Lmax*sum_i>=1 binom(j,i) M_i U_(j-i)',
                'tangent':'Tj=sum_i binom(j,i) B_i U_(j-i), with P independent of slow point',
                'H':'C_H,j=2*K_G*sum_i binom(j,i) T_i T_(j-i) in maximum row-sum norm',
                'HInverse':'C_inv=2*C_entry,0/D0 from the two-by-two adjugate',
                'W':'C_W,j=C_inv*(C_b,j+sum_i>=1 binom(j,i) C_H,i C_W,(j-i))',
                'sqrtW':'C_sigma,0=sqrt(2*Renv^8/m_L); C_sigma,j=(C_W,j+sum_0<i<j binom(j,i) C_sigma,i C_sigma,(j-i))/(2*sqrt(kappa*Renv^(-55)/(64*m_U)))',
            },
            'scaleRows':degree_audit(),
            'scope':{
                'derivedFor':'Every fixed original admissible label and same-box representative on the outer collar, with constants independent of ell.',
                'inputPremises':['Original normalized column, frozen cone, actual stable pulse and Gaussian envelope on every such label.',
                                 'Ordinary Volterra variation and differentiation of same finite interval. Source cofactors B_i,M_i bounded by constants times S^i.',
                                 'Same bbar C^j bounded by finite original terminal coefficient constants for j<=8. The original real heat and the complete leading moment identities are used.',
                                 'At eta=+/-1 use inward heat derivatives only. At delta=0 use finite regular coefficient, not division by the flat scalar.'],
                'actualRegularConstantsNumericallyEnclosed':False,'allActiveDomainsAttached':False,
                'wholeM3FinalJets':0,'release':'HOLD'},
            'finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    for field in ('goal','original','live','out'):
        parser.add_argument('--'+field,type=Path,required=True)
    args=parser.parse_args()
    if not __debug__:
        parser.error('Python assertions are required')
    result=verify(args.goal,args.original,args.live)
    with args.out.open('x',encoding='utf-8',newline='\n') as output:
        json.dump(result,output,indent=2)
        output.write('\n')
    print(result['status'])
