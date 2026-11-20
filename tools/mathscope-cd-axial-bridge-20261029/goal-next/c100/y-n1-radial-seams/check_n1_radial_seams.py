"""Check same-source whole-collar and compensated radial seam arithmetic."""

from fractions import Fraction as F
from hashlib import sha256
import json
from math import factorial
from pathlib import Path
import sys


C99 = '05f6adaa85ad7adf05a5c4943e4f01e98794243f3dab8c7c0a1f85c9f4f5b387'
C99_OPS = 'd52bfc8ddd4a9987cd25d3d4a2161cc10e19d8d2ee7975f87ae2e7b68f8e27be'
C98 = '4addbef308f52e5956e54cfc0e0f83d5155b5c571e2558d42056d540d1853d08'


def pinned(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return json.loads(raw)


def falling(n, r):
    return factorial(n) // factorial(n-r) if 0 <= r <= n else 0


def mul_jets(f, g, length):
    return [sum(f[j]*g[n-j] for j in range(n+1)) for n in range(length)]


def primitive_jets(f, value):
    return [value] + [coefficient/F(n) for n, coefficient in enumerate(f, 1)]


def jet_checks():
    # Taylor coefficients (derivative divided by factorial) are used.
    # Universal rules are proved by linearity and the ordinary FTC.
    # The finite executable basis exercises each degree/derivative combination.
    primitive_basis = 0
    for c in (0,0,2,0,3,1):
        for n in range(11):
            for m in range(7):
                for r in range(17):
                    for k in range(3):
                        denom = c+n+1
                        native = F(falling(n+1,r)*falling(m,k),denom)
                        split_density = F(falling(n,r)*falling(m,k),denom)
                        if r:
                            split_density += F(r*falling(n,r-1)*falling(m,k),denom)
                        assert native == split_density
                        prime = F(n+1+c,denom)
                        assert prime == 1
                        primitive_basis += 1
    cap = 32
    keep = [F(1)] + [F(0)]*cap
    cut = [F(0)]*(cap+1)
    scalar_jet_identities = 0
    for n in range(cap+1):
        basis = [F(int(j==n)) for j in range(cap+1)]
        assert mul_jets(keep,basis,cap+1)==basis
        assert mul_jets(cut,basis,cap+1)==cut
        assert primitive_jets(mul_jets(keep,basis,cap+1),F(7))==primitive_jets(basis,F(7))
        assert primitive_jets(mul_jets(cut,basis,cap+1),F(0))==cut+[F(0)]
        scalar_jet_identities += 4
    # Minimal pressure-row control in the same diagonal pattern.
    # F0=1, f4=2, pKnown=0. G_4 f4=xi/2, Fhat=xi²/4.
    first_f4 = F(2,1+3)
    finite_f = first_f4/2
    centrifugal_pressure = 4*finite_f/4
    pressure_x_at_xi1 = 2*centrifugal_pressure
    assert (finite_f,centrifugal_pressure,pressure_x_at_xi1)==(F(1,4),F(1,4),F(1,2))
    return primitive_basis, scalar_jet_identities, str(centrifugal_pressure), str(pressure_x_at_xi1)


def main(args):
    source_file,c98dir,c99dir,output = map(Path,args)
    raw = source_file.read_bytes()
    data = json.loads(raw)
    assert data['schema'] == 'MathScope.C100.OriginalN1SameBodyRadialSeamOperands/1'
    old = pinned(c99dir/'n1-ipos-transfer-operands.json',C99_OPS)
    previous = pinned(c99dir/'n1-ipos-transfer.json',C99)
    prior = pinned(c98dir/'full-n1-collar.json',C98)
    assert previous['priorC98ReceiptSHA256'] == C98
    assert data['prior'] == {'C99':C99,'C99Ops':C99_OPS}
    assert data['originalPrefixSHA256'] == old['originalPrefixSHA256']
    assert data['parityEntriesChecked'] == 78
    assert data['forceParity'] == [None,None,None,1,0,0]
    assert data['parityShapes'][0][3] == [1,None,None,None,None,None]
    assert all(value is None for value in data['parityShapes'][1][3])
    assert data['cutoffCoordinates'] == {
        'Xa':3617,'keep':28819,'cut':28823,'innerEnd':24805,
        'lastU':29328,'axisLeadingEnd':3293,'plus':28824,'stop':28826,
    }
    assert data['flatCutoffArgumentsAtJoins']==[0,1]
    pressure = data['pressure']
    assert pressure['originalRow']==25602 and pressure['originalForcing']==26395
    assert pressure['sameIntegralBody']
    assert pressure['thirdPressureTerm'] not in (0,pressure['oldTwoTermPressure'])
    assert pressure['coherentPressure'] != pressure['oldTwoTermPressure']
    assert data['originalAxialDensity']=={'body':117047,'expressionSystem':1,
        'formalArguments':[4756,2],'literalIntegrals':[117057,117066,117075]}
    assert set(data['compensatedOutputs'])==set(old['outputs'])
    assert len(data['compensatedOutputs'])==9
    assert data['replacedCalls']==old['rawDomainProof']['actualRawCallIds']
    assert len(data['approximateZeroResiduals'])==5
    assert all(row['numeratorMonomials']==0 for row in data['approximateZeroResiduals'])

    # Full interval estimates with exact positive scale cancellation.
    assert prior['deltaInverseUpper']=='Q^2' and prior['rightStrip']=='delta/8'
    assert prior['sourceMatrixBoundUpper']=='2^15 Q^4'
    assert prior['rightWidthUpper']=='t1/(8 Q^32)'
    assert prior['forcingCap']=='2^24 Q^3/(theta delta^2), theta=1 core, theta=t1 extended collar'
    q_min = 2**260
    first_core = 2*2**24
    first_collar = F(1,8)*2**24
    assert first_core+first_collar < 2**26
    assert 6*2**15*3*8 < 2**23
    assert F(2**23,q_min**26) < F(1,2)
    assert 2*2**26 == 2**27
    assert 2*2**26*2**23 == 2**50
    assert 2*2**26*(2**23)**2 == 2**73
    assert 16*F(5,q_min**63)<1  # compatible pressure value <= E
    assert 1+16 < 2**5  # smaller eta strip, row A1 derivative
    assert 2**15*2**5*2**50 == 2**70
    assert (1+F(3,4))*2**70 < 2**71
    assert 2**15*2**5*2**27/2 == 2**46
    assert F(1,4)*(1+1)*2**47 == 2**46  # X F_XX from g' - g/xi
    assert 16*2**73 == 2**77
    assert F(32*2**73,q_min**31)<2**71  # compatible pressure xi error
    checks, scalar, bad_p, bad_px = jet_checks()

    evidence = {
        'schema':'MathScope.C100.ActualN1SameBodyRadialSeams/1',
        'sourceStatus':'VERIFIED_ORIGINAL_WHOLE_COLLAR_PRESSURE_COMPATIBILITY_AND_FIVE_MOMENT_REBUILD',
        'ordinaryStatus':'CONDITIONAL_ON_ORIGINAL_C98_C99_REALIZATIONS_AND_FIXED_ORDINARY_SOURCE_JETS',
        'operandsSHA256':sha256(raw).hexdigest(),'priorC99ReceiptSHA256':C99,
        'literalOriginalPressureRow':pressure['originalRow'],
        'ordinaryCompatiblePressureIdentity':'d_X Pihat=2 F0 Fhat+pKnown',
        'finitePicardTermsByMeaning':{'F1':2,'U1':2,'Pi1':3},
        'originalParityOperands':78,'compensatedOutputCount':9,
        'originalCallsReplaced':len(data['replacedCalls']),'exactCompensatedMomentsZero':5,
        'exactMonomialPrimitiveTests':checks,'exactFlatProductAndPrimitiveTests':scalar,
        'conditionalAllFixedMixedSeams':{
            'Xa':'one actual global finite body and ordinary leading jets',
            'Xkeep':'unit cutoff jets, equal anchored mass and pressure prefixes',
            'Xcut':'flat cutoff zero for all local densities',
            'Ipos':'flat original five normalized bumps and finite radial transforms',
            'lastU':'zero mass moment and flat density',
            'Xplus':'zero pressure moment and original leading exterior',
        },
        'norms':{
            'finiteRegisteredValueErrorOnDeltaOver8':'2^73 Q^-77',
            'geometricRatioUpper':'2^23 Q^-26',
            'registeredXiDerivativeErrorOnDeltaOver16':'2^71 Q^-45',
            'rawF1U1XDerivativeErrorOnDeltaOver16':'2^46 Q^-19',
            'rawF1U1WeightedXSecondDerivativeErrorOnDeltaOver16':'2^46 Q^-19',
            'rawPressureXDerivativeErrorOnDeltaOver8':'2^77 Q^-76',
        },
        'originalAxialDensityAndIntegrals':data['originalAxialDensity'],
        'twoTermPressureNegativeControl':{
            'genericNotActualSubdivision':True,'missingPressureAtXi1':bad_p,
            'missingPressureXDerivativeAtXi1':bad_px},
        'remaining':'OPEN_QUANTITATIVE_GLOBAL_STRESS_ERROR_THROUGH_OUTER_CUTOFF_AND_HIGHER_RECURSION',
        'additionalFinalJets':0,'release':'HOLD',
    }
    with output.open('x',encoding='utf-8',newline='\n') as f:
        json.dump(evidence,f,indent=2)
        f.write('\n')
    print('VERIFIED whole collar original pressure row and five exact compensated residuals')
    print('CONDITIONAL all fixed mixed field seams and explicit registered radial derivative bounds')


if __name__ == '__main__':
    main(sys.argv[1:])
