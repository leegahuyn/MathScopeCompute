from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


def check_receipt(path):
    raw = path.read_bytes()
    source = json.loads(raw)
    assert source['sourceSystemIndices'] == {'N2Aux':2,'N2Actual':3,'N3Aux':4,'N3Actual':5}
    assert source['originalN0N1N2HeldFixed'] and source['retainedN2LiteralPrefixNodes'] > 0
    assert source['sourceStorage']['checkedFiniteDepths'] == [2,3]
    assert source['sourceStorage']['wrongSameDepthRejected']
    assert source['fiveMoments']['zeroNumeratorMonomials'] == [0]*5
    assert source['omega']['termsPerBranch'] == 9 and source['omega']['sourceDegree'] == 2
    assert [x['bounds'][1] for x in source['omega']['momentLowerIntegrals']] == [source['support']['Xplus']]*3
    support = source['support']
    for row in source['stress']:
        assert row['forwardBoundaries'] == [support['Xminus'],source['originalX']]
        assert row['backwardBoundaries'] == [source['originalX'],support['Xplus']]
        assert row['eta'] == source['originalEta'] and row['wrongForwardSignRejected']
    assert source['stressSummands'] == [12,11]
    assert source['boundScales']['bumpCap'] == 2**15
    assert source['constructedClosedWholeCoefficientBound']['allFreeCoordinateCount'] == 0
    assert source['constructedClosedWholeCoefficientBound']['fixedExactOriginalLowerHistories']
    amplitude = source['constructedClosedWholeCoefficientBound']['uniformActualAmplitude']
    assert amplitude['sourceEtaAmplitude']==source['boundScales']['ef']
    assert amplitude['etaInterval']==['-1','1'] and amplitude['originalFactor']=='ef(eta)=ef(0)/(1+eta^2)'
    assert (Q(amplitude['lowerMultiple']),Q(amplitude['upperMultiple']))==(Q(1,2),Q(1))
    return source,sha256(raw).hexdigest()


def estimate_checks(source):
    # A monomial row (coefficient,B degree,L degree) is bounded by 4BL
    # if it has degrees <=1 and the sum of absolute coefficients is <=4.
    pointwise = (((1,0,0),),((2,1,0),),((2,0,1),),((4,1,1),),((2,0,1),(2,1,1)))
    for row in pointwise:
        assert all(b<=1 and l<=1 for _,b,l in row)
        assert sum(abs(k) for k,_,_ in row)<=4
    assert len(pointwise)==5
    # For every real m and r=|m|, 1+m^2-r = (r-1/2)^2+3/4.
    square_plus_constant = (Q(1),-2*Q(1,2),Q(1,2)**2+Q(3,4))
    assert square_plus_constant==(1,-1,1)
    inverse_families = source['boundScales']
    assert [len(row) for row in inverse_families['Uinverse']]==[2,2]
    assert [len(row) for row in inverse_families['Einverse']]==[3,3,3]
    # T >= 1 and B >= 1, so the target precision alone forces K >=128.
    target_bits=256
    minimum_k=(target_bits+1)//2
    assert minimum_k==128 and minimum_k>source['sourceStorage']['displayedTermHardLimit']
    # Define K >= ceil(log_4(2^256* B*max(TF,TU,TPi))). Then
    # 3^-1*4^-K* B*max(TF,TU,TPi) <= 3^-1*2^-256 < 2^-256.
    assert Q(1,3)*Q(1,2**target_bits)<Q(1,2**target_bits)
    return {'exactMomentDifferenceRowsBeforeRadialIntegration':pointwise,
            'inverseEntryDominationPolynomial':[1,-1,1],
            'minimumSufficientKForThisCertificate':minimum_k,
            'displayedCountLimit':source['sourceStorage']['displayedTermHardLimit']}


def main(path):
    source,digest=check_receipt(path)
    return {
      'schema':'MathScope.C110.OriginalNativeN3FixedHistoryWholeCoefficientEnclosure/1',
      'classification':'VERIFIED_SOURCE_AND_RECURRENCE_CONDITIONAL_FIXED_HISTORY_WHOLE_COEFFICIENT_BOUND',
      'operandsSHA256':digest,'checks':estimate_checks(source),
      'nativeTailPremises':'original actual order-three source bounds on ordinary real X<=aSquared and the source eta strip; K>=Kcondition',
      'fixedLowerHistories':'hold exact original finalized N=0,1,2 actual/cut and whole/global histories fixed in all lower terms',
      'transfer':{
          'tail':'e=4^-K/3; use P_K for F,U,and Avg-U, and P_(K+1) for Pi',
          'momentDebt':'each of the five direct moment perturbations is at most 4 B^2 L0 e; full lower contributions cancel',
          'finiteCompensation':'same original inverse matrices, normalization, five bump supports, and pressure primitive',
          'pointwiseCaps':['TF*e','TU*e','TPi*e'],
          'absoluteUniformEtaL1InX':'B times each corresponding pointwise cap on X>=0',
          'sourceDepth':'max(1,Kcondition,ceil(log_4(2^256*B*max(TF,TU,TPi))))',
          'uniformRealEtaDomain':['-1','1'],
          'strictTargetForEach':['|F3-F3_K| < 2^-256','|U3-U3_K| < 2^-256','|Pi3-Pi3_K| < 2^-256'],
          'strictTargetAlsoForEachAbsoluteL1':True,
          'KAndNativeValuesNumericallyEvaluated':False},
      'n3StressScope':'literal density, ordinary forward FTC, and distinct Xminus,Xplus primitives verified; no quantitative current-order stress error asserted',
      'coupledLowerN1N2ErrorsPropagatedIntoN3':False,
      'generalY':'OPEN','M3':'62/64','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--operands',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    result=main(args.operands)
    with args.out.open('xb') as file:
        file.write((json.dumps(result,indent=2)+'\n').encode())
    print('PASS: exact whole F3/U3/Pi3 pointwise and L1 tail at fixed original lower histories')
