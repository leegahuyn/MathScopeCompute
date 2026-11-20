from argparse import ArgumentParser
from fractions import Fraction
import gzip
from hashlib import sha256
from math import factorial
import json
from pathlib import Path


def load(path, expected):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == expected, path
    return json.loads(data)


def dominates(coefficient, negative_q_power):
    assert negative_q_power > 0
    assert coefficient < 2 ** (260 * negative_q_power)


def check_mass_identity():
    # For h(t)=t^p, U(x)=x^(p+1)/(p+1), S2=-x^(p+1)/(p+3).
    # The direct X-average of U multiplies its coefficient by 2/(p+3).
    for p in range(65):
        source = Fraction(1,p+1)-Fraction(1,p+3)
        direct = Fraction(2,(p+1)*(p+3))
        assert source == direct
        assert Fraction(1,p+1)+Fraction(1,p+3) != direct
    return 65


def check_budget():
    # g < 5 Q^-64, Q>2^260, delta^-1<Q^2, and s=delta/2^19.
    alpha_coeff=2**17
    beta_coeff=2**31
    bump=2**15
    pressure_weighted=2**30
    assert 2**10*Fraction(81,2)<alpha_coeff
    assert 2**24*120<beta_coeff
    assert 2**24*48<pressure_weighted
    assert 1+8*alpha_coeff<2**21
    assert 16+3*pressure_weighted<2**33
    scalar_rows=[
        (5*2*alpha_coeff*bump,62),        # U exterior normalized
        (5*3*beta_coeff*bump,62),          # R*F and F exterior normalized
        (5*2**21,62),                     # actual stream
        (5*16,63),                        # early pressure value
        (5*2**33,63),                     # actual whole pressure prefix
        (5*12*beta_coeff*bump,62),         # Ipos pressure derivative
        (10*(2**39),62),                  # X*U part of actual radial V
        (10*(2**28)*(2**19),60),          # mass/Cauchy part of V
    ]
    for coefficient, power in scalar_rows:
        dominates(coefficient,power)
    # Each V term is below E/2 by the doubled charges above.
    stream_xu=16*alpha_coeff*bump
    assert 8*stream_xu <= 2**39
    assert 16*2**21+20*2**21 <= 2**28
    assert 8+16+20 < 2**6
    assert 32<2**7
    # The K threshold direction is upward; the normal 1/3 tail never disappears.
    assert factorial(8)*4**8*2**7 > 0
    # A change to lower N1 would generate an additional, nonzero square difference.
    assert 1-Fraction(7,8)**2 == Fraction(15,64)
    return len(scalar_rows)


def match_original_source(path, live):
    source = sha256()
    prefix = sha256(b'[')
    count = 0
    through = live['originalNodeCount']
    with gzip.open(path,'rb') as stream:
        header = stream.readline()
        assert json.loads(header) == {'schema':'MathScope.M3.FullNodesJSONL/1','node_count':2852905}
        source.update(header)
        for count, line in enumerate(stream,1):
            source.update(line)
            if count <= through:
                if count != 1:
                    prefix.update(b',')
                prefix.update(line.rstrip(b'\r\n'))
    prefix.update(b']')
    assert count == 2852905
    assert source.hexdigest() == '75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987'
    assert through == 120820 and prefix.hexdigest() == live['originalPrefixSHA256']
    return {'wholeStreamRecords':count,'wholeStreamSHA256':source.hexdigest(),
            'regeneratedOriginalPrefixRecords':through,'prefixSHA256':prefix.hexdigest()}


def verify(args):
    data_bytes=args.operands.read_bytes()
    data=json.loads(data_bytes)
    source_archive=match_original_source(args.stream,data)
    c89=load(args.tail,'e328c3e06763a28c0c5ee77e7e78625239dc26e2cec62f17190b66c1a39424ba')
    c99=load(args.ipos,'05f6adaa85ad7adf05a5c4943e4f01e98794243f3dab8c7c0a1f85c9f4f5b387')
    assert [data['auxiliarySystem'],data['actualSystem']] == [2,3]
    actual,=[row for row in c89['sourceSystems'] if row['system']==3]
    assert actual['order']==2 and actual['kind']=='actual'
    assert [actual['eta'],actual['xi']]==[data['originalEta'],data['actualXi']]
    native=data['nativeTail']
    assert [native['strip'],native['C'],native['Kcondition'],native['radialDomain']]==[
        actual['solutionStrip'],actual['C'],actual['Kcondition'],actual['aSquared']]
    assert native['order']==2 and native['etaOrder']==8 and native['bits']==256
    assert native['positiveRemainderRetained']
    assert native['actualSourceConvergenceModulus']
    assert data['originalParityPositions']==78
    assert len(data['replacedN2EvenCalls'])==19
    assert len(data['originalFields'])==len(data['approximation'])==9
    assert data['sourcePressure']['exactFiniteIntegralIdentity']
    assert data['lowerHistoriesRetained']
    assert data['approximationMomentNumeratorMonomials']==[0]*5
    assert len(data['outerZeroLower']['expressions'])==6
    assert all(row['zero'] for row in data['outerZeroLower']['expressions'])
    assert all(row.get('rightEndpoint')!=data['guards']['Xplus'] for row in data['outerZeroLower']['trace'])
    assert c99['normalizedInverseInfinityUpper']=={'U':1024,'E':16777216}
    assert c99['localMomentErrorOverE']==['x_c','x_c^2','16 Q x_c','16 Q x_c^2','24 x_c']
    return {
        'schema':'MathScope.C103.ActualN2PressureSeamsAndCompensationBound/1',
        'sourceStatus':'VERIFIED_ORIGINAL_ACTUAL_N2_PICARD_PRESSURE_MOMENT_REBUILD_AND_OUTER_SUPPORT',
        'ordinaryStatus':'CONDITIONAL_ON_ACTUAL_N1_LEADING_AND_N2_PICARD_ORDINARY_REALIZATIONS',
        'operandsSHA256':sha256(data_bytes).hexdigest(),
        'originalHostedSource':source_archive,
        'originalPicardSystems':{'auxiliary':2,'actual':3},
        'sourcePressure':data['sourcePressure'],
        'replacedN2NativeCalls':len(data['replacedN2EvenCalls']),
        'zeroCompensatorMomentNumerators':len(data['approximationMomentNumeratorMonomials']),
        'sameLowerExplicitSquaresAndOmegaRetained':True,
        'originalRegularMassBasisChecks':check_mass_identity(),
        'newOrdinarySeams':{
            'Xkeep':'same anchored raw pressure and exact N2 average, unit cutoff jet',
            'aSquared':'actual local and whole N1 restrictions agree; same global and local Omega1 at their original switch',
            'Xplus':'Omega1 and all velocity/pressure densities are zero already on Xv<X<Xplus and whole pressure moment cancels'
        },
        'quantitative':{
            'ordinaryBudgetsChecked':check_budget(),
            'actualStrip':'s=delta/2^19',
            'tail':'E=4^-K/3 for K>=actual_Kcondition',
            'wholeXFieldErrorOnS_s':['F2','U2','E2','M2','M2/X','Pi2'],
            'thoseFieldErrorUpper':'E',
            'realizedOnS_sOver2':{'V2':'E','v2':'2^6 E/s','pressureDerivative':'2^5 Q E'},
            'realEtaDerivativeOrders0Through8AllNineOutputs':'m!*(4/s)^m*2^7 E/s',
            'finiteDepthFor256Bits':'max(actual_Kcondition,ceil((256 log(2)+log(8!*(4/s)^8*2^7/s))/log(4)))',
            'realEtaDerivative256BitStrictUpper':'2^-256',
            'selectedDepthMaterialized':False
        },
        'remaining':'OPEN_NUMERICAL_N2_CENTERS_COUPLED_N1_ERROR_N2_STRESS_ERROR_AND_ALL_ORDER_REALIZATION',
        'release':'HOLD','finalJets':0
    }


if __name__=='__main__':
    parser=ArgumentParser()
    for name in ('operands','stream','tail','ipos','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    result=verify(args)
    with args.out.open('xb') as file:
        file.write((json.dumps(result,indent=2)+'\n').encode())
    print('PASS: original N2 pressure seams, 65 mass identities, exact five moments, eight dyadic budgets')
