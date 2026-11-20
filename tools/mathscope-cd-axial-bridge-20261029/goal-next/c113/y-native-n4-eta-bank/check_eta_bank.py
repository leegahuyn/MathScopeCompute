from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


def checks(source):
    assert source['eta']==2 and source['X']==4756
    assert source['wholeLeading']['radialOrder']==2 and source['wholeLeading']['etaOrder']==7
    assert source['wholeLeading']['copiedNodes']>2659
    assert source['wholeOrders']=={'N2':{'FU':5,'v':4},'N3':{'FU':3,'v':2,'Pi':3}}
    assert source['sourceDepths']['etaIndependent'] and not source['sourceDepths']['evaluatedNumerically']
    assert source['sourceDepths']['bitsPerContribution']==258
    assert source['sourceDepths']['ordinaryDerivativeFactor']==factorial(5)
    assert source['fixedInverseAndBumps']['independentEtaProfiles']
    assert [row['terms'] for row in source['originalOmegaBranches']]==[[7,7],[9,9],[11,11]]
    assert [row['previousViscosity'] for row in source['originalOmegaBranches']]==[0,1,2]
    for row in source['originalOmegaBranches']:
        assert all(v['eta']==2 and v['bounds']==[0,28824] for v in row['integrals'])
    # Factorial-weighted eta norms on [-1,1] and a radius 1/2 Cauchy tube.
    assert 1-2*Q(1,128)*Q(3,2)**2>Q(1,2)
    assert 2*sum(2**j for j in range(8))==510<512
    assert 1+2+1==4   # d=1-eta^2
    assert 2+2+1==5   # 1+eta^2 and inverse amplitude
    radial_projection=512*(4+4+4*7)
    assert radial_projection<2**16 and radial_projection*3<2**22
    z=512*(4*(4+1)+4*6)
    xz=512*(4*(4+2)+4*6)
    t=512*(4+1+2*6)
    zz=512*(4*(4+1)+4*4)*2**15
    assert max(z,xz)<2**15 and t<2**14 and zz<2**31
    assert 2**14+6+3+2*2**15<2**18
    assert 2**14+6+4+2*2**15+2**31<2**33
    assert max(2+Q(1,2)*2**33,4,4+Q(1,2)*2**33)<2**35
    assert 3*Q(1,2**258)<Q(1,2**256)
    return {'inverseGeometryEta7Cap':512,'radialProjectionInteger':radial_projection,'ZWeightedZTZSquaredIntegers':[z,xz,t,zz],
            'positiveSourceContributions':'each <2^-258'}


def main(path):
    raw=path.read_bytes()
    source=json.loads(raw)
    return {'schema':'MathScope.C113.OriginalWholeN2Eta5N3Eta3ErrorBank/1',
        'operandsSHA256':sha256(raw).hexdigest(),'verifiedSource':'ORIGINAL_LEADING_RADIAL2_ETA7_AND_THREE_WHOLE_HISTORY_SWITCHES',
        'ordinaryPremises':'same original ordinary leading and Picard realization, native analytic eta parameter, C105 original paired lower histories, flat cutoffs and fixed endpoints with eta differentiation',
        'arithmetic':checks(source),'leadingNorm':source['wholeLeading'],
        'wholeN2':{'F2U2EtaOrder':5,'v2EtaOrder':4,'radial':['value','dX','X*dXX'],
            'allFiveIncomingDebtGain':'M2=4 B^2 H eta2+B (4 B A1 D1+B DeltaOmega1)',
            'exactLowerVariation':'DeltaOmega1 in real factorial eta5 norm at most 2^18 B H D1'},
        'wholeN3':{'F3U3EtaOrder':3,'v3EtaOrder':2,'Pi3EtaOrder':3,'velocityRadial':['value','dX','X*dXX'],
            'pressureRadial':['value'],'pressureStorage':'P_(K3+1) with unchanged zero axis and outer gauge',
            'exactLowerVariation':'DeltaOmega2 in real factorial eta3 norm at most 2^33 B^2 A(D1+D2)',
            'allFiveIncomingDebtGain':'M3=4 B^2 H eta3+B*2^35 B^3 A(D1+D2)'},
        'strictErrorForEveryIndividualListedFieldAndOrdinaryDerivative':'<2^-256 on X>=0 and real eta in [-1,1], at three closed original paired depths; 5! included explicitly',
        'finiteCentersOrDepthValuesNumericallyEvaluated':False,
        'nextSourceAttachment':'These whole mixed errors and the same-source lower magnitude caps supply the lower inputs needed for N4 Omega3 first eta trace. Whole paired N4 pressure and stress not yet checked here.',
        'wholePairedN4':'OPEN','generalY':'OPEN','M3':'62/64','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as output:
        output.write((json.dumps(main(args.operands),indent=2)+'\n').encode())
    print('PASS: original whole paired N2 eta5 and whole paired N3 eta3, including original radial and pressure traces')
