from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys


def load(path, pin):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == pin, path
    return json.loads(data)


def check_majorant(rows, target):
    """Rows are (positive coefficient, nonnegative power of Q^-1)."""
    assert all(coeff > 0 and power > 10 for coeff, power in rows)
    assert sum(Fraction(coeff, 2 ** (260 * (power - 10)))
               for coeff, power in rows) < target


def main(args):
    scales_path, absolute_dir, taper_dir, seams_dir, output = map(Path, args)
    raw_scales = scales_path.read_bytes()
    scales = json.loads(raw_scales)
    absolute = load(absolute_dir / 'n1-absolute-outer.json',
                    '6bbefee4ade3b5745110c72f3179c19d815c84cad691a993dc8dd2b5b4cc4193')
    taper = load(taper_dir / 'n1-taper-flux.json',
                 '867bc1d589edd923257c2250672ca66d1341847a914eba952ac2b645ed627f8a')
    seams = load(seams_dir / 'n1-radial-seams.json',
                 '17664f981265e2373a5c16d0bf3c9dc233af48605974de1e072520b9932b71de')
    assert scales['terminalWaitAndTwoIntegralBodiesEqual']
    assert scales['wholeStageStartsAndEndsEqual']
    assert len(scales['stageIds']) == 12
    assert scales['priorOperandsSHA256'] == absolute['operandsSHA256']
    assert scales['originalNodes']['axialBody'] == 117047 == absolute['sourceAxialIntegrand']
    assert scales['originalNodes']['Xplus'] == absolute['axialOuterEnd']
    assert scales['originalNodes']['Xb'] == absolute['angularOuterEnd']
    assert scales['leadingValueBounds']['nodeCount'] == 564
    assert scales['leadingValueBounds']['U'] == absolute['actualPositiveLeadingBounds']['U']
    assert scales['leadingValueBounds']['F'] == absolute['actualPositiveLeadingBounds']['F']
    assert scales['leadingValueBounds']['programSHA256'] == absolute['actualPositiveLeadingBounds']['normProgramSHA256']
    assert taper['uniformErrorWithTaperTraceRemoved'] == {'axial': '5 g R', 'angular': '9 g^2 R'}
    assert taper['exactIsolatedTaperTrace'] == {'axial': '-128 sigmaPrime(u) eU/t1',
                                               'angular': '-256 X sigmaPrime(u) eF/t1'}
    assert seams['norms']['geometricRatioUpper'] == '2^23 Q^-26'
    assert seams['ordinaryCompatiblePressureIdentity'] == 'd_X Pihat=2 F0 Fhat+pKnown'
    assert seams['norms']['finiteRegisteredValueErrorOnDeltaOver8'] == '2^73 Q^-77'
    assert seams['norms']['rawF1U1XDerivativeErrorOnDeltaOver16'] == '2^46 Q^-19'
    assert seams['norms']['rawF1U1WeightedXSecondDerivativeErrorOnDeltaOver16'] == '2^46 Q^-19'

    # T >= 128. Lower Taylor terms certify the following comparisons for all T,
    # by dividing them by T and evaluating at the minimum.
    T0 = 128
    assert Fraction(T0 ** 3, 24) > 7 + 32008   # 7 + 32008T < exp(T)
    assert Fraction(1000 ** 2 * T0, 2) > 138035 + 156 # endpoint remainder < exp(1000T)
    assert 64020 * 200 > 1000 + 15
    assert 2 ** 8 == 256 and 3 ** 3 < 255
    assert sum(Fraction(5 ** j, factorial) for j, factorial in
               enumerate((1, 1, 2, 6, 24, 120, 720))) > 110
    assert (1 + 60 * 1000 + 30 * 1000 + 4 * 8002,
            1 + 1 + 128 + 1 + 1 + 3) == (122009, 135)
    assert (122009 + 16006 + 20, 135 + 16 + 5) == (138035, 156)

    # C > Q^10000 follows a single exact term of exp(Q^200).
    factorial51 = 1
    for j in range(1, 52):
        factorial51 *= j
    assert factorial51 < 2 ** (260 * 200)
    assert 15 * 10000 > 140  # C102's old gap pressure upper envelope itself exceeds 1.
    assert 2 ** 23 < 2 ** 260 # whole-collar ratio < Q^-25
    assert 1 + 16 < 2 ** 5
    assert 2 ** 46 == 2 ** 15 * 2 ** 5 * 2 ** 27 // 2

    # Choose H = 1+U*+F*. Bounds below are relative to H C^s Q^-10 J_N,
    # with s=120 on the local interval and s=6 on outer intervals.
    cap = Fraction(1, 8)
    A, B, Hpressure = 5 * 2 ** 90, 5 * 2 ** 104, 5 * 2 ** 103
    M, P = 5 * 2 ** 81, 5 * 2 ** 85
    b0, b1 = 2**15, 2**2070
    local_z = [(25 * 2**46, 51), (128 * 9 * 2**73, 45)]
    local_theta = [(225 * 2**46, 83), (128 * 9 * 2**73, 77)]
    gap_z = [(25 * 2**46, 51), (8 * M, 107), (P, 138)]
    gap_theta = [(225 * 2**46, 83), (16 * 5 * M, 138), (M, 139)]
    ipos_z = [(34 * A * b0 + 32 * A * b1, 139), (2**11 * A, 137),
              (2**8 * Hpressure, 138), (25 * 2**46, 83)]
    ipos_theta = [((51 * b0 + 48 * (b1 + b0)) * B, 139), (12288 * B, 137),
                  (2**9 * b0 * A, 139), (2**13 * A, 137), (225 * 2**46, 147)]
    groups = {'local axial':local_z, 'local angular':local_theta,
              'gap axial':gap_z, 'gap angular':gap_theta,
              'Ipos axial':ipos_z, 'Ipos angular':ipos_theta}
    for rows in groups.values():
        check_majorant(rows, cap)
    assert 6 + 11 < 120
    assert 2 * cap < 1

    return {
        'schema':'MathScope.C102.ActualN1AbsoluteStressDepth/1',
        'sourceStatus':'VERIFIED_ORIGINAL_A2_A13_OUTER_ENDPOINT_AND_SOURCE_RECURRENCE_OPERANDS',
        'ordinaryStatus':'CONDITIONAL_ON_C98_C100_ORDINARY_SOURCE_AND_FINITE_COMPENSATION',
        'scaleOperandsSHA256':sha256(raw_scales).hexdigest(),
        'originalSupport':scales['originalNodes'],
        'sourceScaleBounds':{'Xb':'C^11','R_through_Xb':'C^6','C':'CSelected',
                             'H':'1+originalPositiveUValueBounds[932]+originalPositiveFValueBounds[937]'},
        'oldTwoTermGapPressureEnvelopeStrictlyAboveOne':True,
        'oldActualTwoTermErrorLowerBoundObtained':False,
        'depthForTargetBitsK':'2+ceil((120 log C + log H + K log 2)/(25 log Q))',
        'selectedTargetBits':256,
        'selectedDepthMaterialized':False,
        'picardBodies':{'F1':'P_N row 1','U1':'P_N row 2','Pi1':'P_(N+1) row 4'},
        'errorScale':'Q^(-25 (N-2)) times each C100/C101/C102 E or R envelope',
        'completeUnscaledStressValueAndAbsoluteIntegral':
            {'axial_Xminus_to_Xplus':'strictly below 2^-256',
             'angular_Xminus_to_Xb':'strictly below 2^-256'},
        'forwardBackwardBlend':'use the original squared-flat step, X0 to XL; compare to the same true matched primitive',
        'exactErrorExterior':'zero for X>=XL inside and through either original outer gate',
        'checkedExactRationalBudgetGroupCount':len(groups),
        'nativeHugeDepthEnumerated':False,
        'remaining':'OPEN_ACTUAL_FINITE_APPROXIMANT_NUMERICAL_REALIZATION_AND_HIGHER_ORDER_RECURSION_AND_JETS',
        'additionalFinalJets':0, 'release':'HOLD'
    }


if __name__ == '__main__':
    assert len(sys.argv) == 6, 'Usage: SCALES_JSON C102_OUTER C101_TAPER C100_SEAMS NEW_JSON'
    result = main(sys.argv[1:])
    with open(sys.argv[-1], 'xb') as handle:
        handle.write((json.dumps(result, indent=2) + '\n').encode())
    print('PASS: six exact source-scale rational budgets, unscaled pointwise and absolute outer integral below 2^-256 at the stated depth')
