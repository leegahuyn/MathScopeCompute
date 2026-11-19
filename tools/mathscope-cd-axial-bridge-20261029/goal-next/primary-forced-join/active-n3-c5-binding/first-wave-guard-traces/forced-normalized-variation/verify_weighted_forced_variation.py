"""Apply ordered fixed-chart variation to the actual first Forced jet demand."""

from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
from math import comb, factorial
from pathlib import Path
import json


FILES = {
    'radial': ('temporal-weighted-inverse/first-forced-covariance/outer-covariance-final.json',
               'bd1974a286e1bb99f07c780b8a3ca29dc2ff65347231cfa36a31bb744133eb3d'),
    'frame': ('outer-normalized-amplitude/pulse-frame/pulse-frame-caps-final.json',
              '56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d'),
    'matrix': ('outer-fixed-label-norm/matrix/matrix-s-j.json',
               'e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36'),
    'background': ('outer-fixed-label-norm/background-transport.json',
                   '0b7c13076805acc97cd45e3e4e70e6f7620950744dc493dbff26d0644ff977cc'),
    'weight': ('outer-fixed-label-norm/band-weight.json',
               '4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0'),
    'outer': ('outer-normalized-amplitude/outer-scale.json',
              '71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa'),
    'temporal': ('temporal-weighted-inverse/temporal-weight-transfer.json',
                 'c347d10e54d4bfd2ff845892047b09d38ef1bcec596369694ad0a8e73dbbd45b'),
}
ZERO = (0,0,0)


def read(band, key):
    name, pin = FILES[key]
    raw=(band/name).read_bytes()
    assert sha256(raw).hexdigest()==pin, name
    return json.loads(raw)


def slow(alpha):
    return alpha[0]+alpha[1]


def sub(alpha,beta):
    return tuple(a-b for a,b in zip(alpha,beta,strict=True))


def cbinom(alpha,beta):
    a,b,c=(comb(x,y) for x,y in zip(alpha,beta,strict=True))
    return a*b*c


def slow_subindices(alpha):
    return product(range(alpha[0]+1),range(alpha[1]+1),(0,))


def quotient_terms(alpha, left, projector):
    # B_left*(-Pi)*f: only R and Z derivatives act on B_left or Pi.
    for beta in slow_subindices(alpha):
        intermediate=sub(alpha,beta)
        d=slow(beta)
        for gamma in slow_subindices(intermediate):
            o=slow(gamma)
            counter=cbinom(alpha,beta)*cbinom(intermediate,gamma)
            left_c,left_a,left_s=left[d]
            pi_c,pi_a,pi_s=projector[o]
            remainder=sub(intermediate,gamma)
            assert remainder[2]==alpha[2]
            yield remainder, counter*left_c*pi_c, left_a+pi_a, left_s+pi_s


@cache
def words(alpha):
    # Descending Leibniz words. Order is retained until after the exact weights are applied.
    result=[(alpha,(),1)]
    for beta in slow_subindices(alpha):
        if beta==ZERO:
            continue
        for rest, inner, weight in words(sub(alpha,beta)):
            result.append((rest, (beta,*inner), weight*cbinom(alpha,beta)))
    return result


def exact_coefficients(alpha, M, left, projector, frame):
    state=defaultdict(lambda: defaultdict(Q))
    for remainder, indices, weight in words(alpha):
        k=len(indices)
        assert k<=slow(alpha)
        assert remainder[2]==alpha[2]
        assert slow(remainder)+sum(map(slow,indices))==slow(alpha)
        co=Q(weight,factorial(k))
        ao=so=0
        for beta in indices:
            c,a,s=M[slow(beta)]
            co,ao,so=co*c,ao+a,so+s
        for beta, q, a, s in quotient_terms(remainder,left,projector):
            assert beta[2]==alpha[2]
            assert so+s+2*slow(beta)+k <= 2*slow(alpha)
            state[k][ao+a]+=co*q
    # The final expansion evaluates U/P = B z at the same slow argument.
    physical=defaultdict(lambda: defaultdict(Q))
    for beta in slow_subindices(alpha):
        c,a,s=frame[slow(beta)]
        rest=sub(alpha,beta)
        assert s+2*slow(rest)<=2*slow(alpha)
        inner=state if beta==ZERO else ordinary_state(rest,M,left,projector)
        for k, row in inner.items():
            for a_inner, value in row.items():
                physical[k][a+a_inner]+=cbinom(alpha,beta)*c*value

    def bound(table):
        return [{'orderedMatrixInsertions':k,'coefficient':str(sum(row.values())),
                 'maxSourceConstantPower':max(row),'propagatorPower':k+1,
                 'remainingOrderedWindowPower':k} for k,row in sorted(table.items())]
    return bound(state),bound(physical)


def ordinary_state(alpha, M, left, projector):
    table=defaultdict(lambda: defaultdict(Q))
    for remainder, indices, weight in words(alpha):
        coeff, degree=Q(weight,factorial(len(indices))),0
        for beta in indices:
            c,a,_=M[slow(beta)]
            coeff,degree=coeff*c,degree+a
        for _,q,a,_ in quotient_terms(remainder,left,projector):
            table[len(indices)][degree+a]+=coeff*q
    return table


def verify(band):
    radial,frame,matrix,background,weight,outer,temporal=(read(band,k) for k in FILES)
    stream=frame['sourceStream']
    assert stream==matrix['sourceStream'] and stream['nodes']==background['sourceNodes']==22155584
    assert radial['sourceStream']['sha256']==stream['sha256']==background['inputPins']['stream']
    assert weight['inputPins']['sameLiveBackground']==FILES['background'][1]
    assert weight['inputPins']['matrix']==FILES['matrix'][1]
    assert background['scope']['derivativeOrder']==10 and background['scope']['nativeOperandTransport']
    assert matrix['sharpBandDegreeAudit']['zeroDerivativeInCommonTorusDirections']
    assert matrix['sharpBandDegreeAudit']['normalizedForwardPropagatorC0'].startswith('exp(3*Bnorm^256*Lmax)')
    systems=frame['firstForcedRows']
    assert len(systems)==20 and {row['system'] for row in systems}==set(range(20))
    assert all(row['noYDerivativeOnMatrix'] and row['normalIsOriginalFrozen'] and row['samePositiveKAndEpsilon']
               and row['exactNegativeOrthogonalProjectionScalars']==6 for row in systems)
    assert len({row['key'] for row in systems})==10 and len({row['boundPulse'] for row in systems})>=10
    assert all({x['mode'] for x in systems if x['key']==y['key']}=={1,2} for y in systems)
    assert len(frame['actualPrimaryFactorOnEveryChart'])==10
    assert len(matrix['sameLiveMatrixBinding']['registeredHomogeneousSystems'])==2
    length=17733029
    assert all(r['length']==length for r in matrix['sameLiveMatrixBinding']['registeredHomogeneousSystems'])
    assert [r['P'] for r in background['actualCovarianceFamilies']]==[17733391,17733724]
    assert all(r['length']==length and r['GaussianFixedSlow'] for r in background['actualCovarianceFamilies'])
    assert outer['gaussianLengthGain']['gL']=='lambdaLower/(4u)=Renv^(-41)/8'
    assert outer['gaussianLengthGain']['originalPulseAmplitude']=='P(v)<=exp(-gL*(v-Ls/2)^2/Ls)'
    assert Q(2)*(1+Q(1,2))==3
    # (a-b)^2 <= 2(a^2+b^2). Keep half of the physical output P,
    # half of the input Gaussian for integration, and use the remaining
    # two centered halves to bound the time gap to the power k.
    for a,b in product(map(Q,range(-3,4)),repeat=2):
        assert 2*(a*a+b*b)-(a-b)**2==(a+b)**2

    demand=radial['radialJetDemand']
    alphas=tuple(map(tuple,demand['forcingAndMatrixDirections']))
    assert len(alphas)==len(set(alphas))==23 and max(map(sum,alphas))==4
    assert ZERO in alphas and {beta for alpha in alphas for beta in slow_subindices(alpha)}<=set(alphas)
    assert {(a,b,l) for a,b,k in alphas for l in range(k+1)}<=set(alphas)
    assert demand['aggregateLabelledComplexProjectedRHSRoles']==20*3*len(alphas)==1380
    assert demand['aggregateLabelledComplexVelocityRoles']==750
    cold=temporal['exactFirstForcedMeanDemand']
    assert cold['distinctTargetJets']==129 and cold['allSourceRequests']==600
    assert cold['covarianceRequests']['W_rz']['maxSlowTotal']==7
    data=matrix['sharpBandDegreeAudit']['exactDerivativeLedgers']

    def ledger(key, norm_factor=1):
        result=[(norm_factor*Q(c),a,s) for c,a,s in data[key][:5]]
        assert [row[2] for row in result]==list(range(5))
        return result

    rows=[]
    M=ledger('normalizedMode1And2MatrixInfinityNorm')
    left=ledger('BLeft',3)
    projector=ledger('projector',3)
    B=ledger('movingBasisInfinityNorm')
    for alpha in alphas:
        rz=slow(alpha)
        state,velocity=exact_coefficients(alpha,M,left,projector,B)
        k=[i['orderedMatrixInsertions'] for i in state]
        assert k==[i['orderedMatrixInsertions'] for i in velocity]==list(range(rz+1))
        # F^(alpha) supplies S^(b+2rz); lower radial poles can be replaced by the
        # same leading pole plus 3rz since the collar has 0<delta<=1/4.
        physical_mode_two = [{'orderedMatrixInsertions':j,
                              'sourceBandPowerAboveBase':str(2*rz+Q(1-j,2)),
                              'newWindowFactor':'3*sqrt(k!)*(2*Lmax/gL)^((k+1)/2)',
                              'factorialUnderSquareRoot':factorial(j)}
                             for j in k]
        rows.append({'RZL':alpha,'slowOrder':rz,'orderedWords':len(words(alpha)),
                     'statePolynomial':state,'physicalOverPPolynomial':velocity,
                     'physicalModeTwoWindowTerms':physical_mode_two,
                     'mode1BandPowerAddedToInputBase':str(2*rz+1),
                     'mode2BandPowerAddedToInputBase':str(2*rz+Q(1,2)),
                     'additionalRadialPole':0})
    tangential=next(row for row in rows if row['RZL']==(0,0,1))
    fourth=next(row for row in rows if row['RZL']==(4,0,0))
    assert tangential['orderedWords']==1 and len(tangential['statePolynomial'])==1
    assert fourth['orderedWords']==16 and len(fourth['statePolynomial'])==5
    assert fourth['mode2BandPowerAddedToInputBase']=='17/2'
    assert [x['sourceBandPowerAboveBase'] for x in fourth['physicalModeTwoWindowTerms']]==['17/2','8','15/2','7','13/2']
    # With no captured pulse reserve, the same 2-mode ODE length cost is a
    # whole power. Keeping a scalar P(t0) is essential to the half-power result.
    assert all(Q(r['mode1BandPowerAddedToInputBase'])-Q(r['mode2BandPowerAddedToInputBase'])==Q(1,2)
               for r in rows)
    return {'status':'VERIFIED_ACTUAL_FORCED_JET_DEMAND_AND_CONDITIONAL_CONCENTRATED_VARIATION',
            'inputPins':{k:FILES[k][1] for k in FILES},'sourceNodes':stream['nodes'],
            'nativeSystems':[{'key':r['key'],'mode':r['mode'],'system':r['system'],'pulse':r['boundPulse']}
                             for r in systems],
            'realAndImaginaryShareCoefficients':True,
            'baseForcingCondition':'For each m=1,2, on the same admitted H_w path f_m=P(w)^m*fhat_m. For alpha=(r,z,l), with s=r+z, |D^alpha fhat_m|_inf<=F_m*S^(b_m+2s) times the given radial weight with pole growth 3s. P, L_s, labels and representatives are fixed for these derivatives.',
            'projectionAndLeftBasis':'-BLeft*Pi times the original raw forcing. The two matrix factors cost S^r+z, and their L derivatives vanish.',
            'massBounds':{'mode1':'Lmax*S','mode2':'3*sqrt(Lmax/gL)*S^(1/2)',
                          'retainedSourcePulse':'P(t0) at innermost forcing time of mode 2',
                          'gL':'Renv^(-41)/8','orderedVolume':'(v-t0)^k/k!',
                          'onlySameAdmittedInterval':'0<=t0<=v<=L_s'},
            'optionalPhysicalModeTwo':{
                'bound':'P(v)*integral_0^v P(t)*(v-t)^k/k! dt <= sqrt(P(v))*3*(2*L_s/gL)^((k+1)/2)/sqrt(k!)',
                'origin':'With c=gL/L_s and a=v-L_s/2, b=t-L_s/2, use (a-b)^2<=2(a^2+b^2). Retain exp(-c*b^2/2) for integration and bound |a-b|^k*exp(-c*(a-b)^2/4) by sqrt(k!)*(2/c)^(k/2) from the nonnegative exponential series.',
                'application':'Keep sqrt(P(v)) on the physical mode-two field. Use physicalOverPPolynomial coefficients, replacing their innermost mass and Lmax^k by newWindowFactor, and taking the listed power of S plus b_2.',
                'windowMonomialControlPairs':49,
            },
            'coefficientMeaning':'Multiply F_m and the appropriate innermost mass bound no S included, then sum the row coefficients times A^maxSourceConstantPower C0^propagatorPower Lmax^remainingOrderedWindowPower. Multiply by the total listed S power including input b_m and radial weight. A>=1 as in the original C89 source norm.',
            'rows':rows,'distinctDirections':len(rows),'complexProjectedRoleDemand':1380,'velocityRoleDemand':750,
            'initialTemporalDemand':{'outputJets':129,'covarianceRequests':600,'WrzSlowOrder':7},
            'scope':{'originalForwardPropagatorAndDifferentiationPremisesRetained':True,
                     'wholeRawSourceNormEvaluated':False,'normalizedSolutionNumericalInterval':False,
                     'closedFinalN8Comparisons':0,'finalJets':0,'release':'HOLD'},
            'finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    for field in ('band','out'):
        parser.add_argument('--'+field,type=Path,required=True)
    args=parser.parse_args()
    if not __debug__:
        parser.error('Python assertions are required')
    result=verify(args.band)
    with args.out.open('x',encoding='utf-8',newline='\n') as file:
        json.dump(result,file,indent=2)
        file.write('\n')
    print(result['status'])
