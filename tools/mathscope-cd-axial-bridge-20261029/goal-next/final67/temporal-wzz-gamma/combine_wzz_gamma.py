"""Reconcile original Wzz and Temporal gamma bounds through their actual paths."""
import argparse
from hashlib import sha256
import json
from pathlib import Path

PINS = {
    'wzz': ('final67/temporal-wzz-three-point/wzz-cutoff.json', '08619494bba81a5d9aa2ed33b5a5c5b2634aee00a9e92dd2178581157974cc35'),
    'gamma': ('final67/temporal-wzz-gamma/exact-gamma-shift.json', '9d7889d5250115870a41613f2a8857d8c8d1953c4ab6e8df45d20369c2fad029'),
    'cutoff': ('final67/original-mean-radial-cutoff-coefficients/mean-cutoff-coefficients.json', '0d6065d41dd235fb56cc620af0e1242d8f0ff265256410f7e724e862f67f59b6'),
    'cutoff_at_gamma_check': ('final67/original-mean-radial-cutoff-coefficients/mean-cutoff-at-gamma-check.json', '7509f35b8af4091b97832de72cd5743b2d5592bed9c81cfbe76872450e200061'),
    'radial': ('final67/original-radial-time-length/radial-length-cost.json', '609040736c97e77747f2bb5d191f5dcf6c8fabb7a939e133246a03185d16a4aa'),
    'primary': ('final67/external-primary-high/external-primary-k.json', '5aef7c09a25a84a573ea43047a152461776e3feeb4a4c2fc8308dea5012cb824'),
}


def main():
    assert __debug__
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('goal', type=Path)
    parser.add_argument('out', type=Path)
    args = parser.parse_args()
    data = {}
    for key, (path, pin) in PINS.items():
        payload = (args.goal / path).read_bytes()
        assert sha256(payload).hexdigest() == pin, key
        data[key] = json.loads(payload)
    wzz, gamma, cutoff, old, radial, primary = data.values()

    case = wzz['arithmetic']['referenceCases'][0]
    assert case['maximumWzzSlowOrder'] == [0, 3, 1]
    assert case['strictOverallFactorUpper'] == '2^130'
    assert wzz['actual']['rowsWithExactC75SiblingMaps'] == 162
    assert gamma['exactFTCPolynomial'] == [[['g'],1],[['Jg','chiR','invR'],-1]]
    assert gamma['inputSHA256']['cutoff'] == PINS['cutoff_at_gamma_check'][1]
    assert cutoff['logCap'] == old['logCap']
    assert 'neg' in cutoff['logCap']['upper']
    assert cutoff['comparison'] == cutoff['radialLengthCompare3HOver2Pow128'] == -1
    assert radial['comparison'] == -1 and radial['logTwoLessThanHOverTwoPow128']
    assert primary['unaveragedRadialWeight']['halfGaussianCompareHOver2Pow115'] == -1
    assert all(x['kComparison'] == -1 for x in primary['horizon'])

    # Units are H/2^128. The source verifies log S < one unit for the
    # admitted labels. The epsilon reference comparison has 3/L < 2^-128.
    charges = {
        'coefficientPowerAndReferenceLabel': 4*3813,
        'oneHalfGaussianAndPole': 2**13,
        'anisotropicInverseFactor': 130,
        'twoAngularCovarianceProducts': 1,
        'firstEpsilonScaleConversion': 1,
        'additionalEpsilonScaleConversion': 1,
        'inverseOriginalCi': 7,
        'originalWholeRadialGammaTransfer': 2**8,
    }
    inverse_charge = sum(list(charges.values())[:5])
    gamma_charge = sum(charges.values())
    square_charge = 2*gamma_charge + 3 + 3
    assert inverse_charge == 23576 < 2**15
    assert gamma_charge == 23840 < 2**15
    assert square_charge == 47686 < 2**16
    result = {
        'status':'CONDITIONAL_ORIGINAL_WZZ_ONLY_TEMPORAL_GAMMA_SQUARE_BOUND',
        'sourcePins':PINS,
        'exactHashBoundGammaFTC':True,'ordinaryMixedIndices':[[z,t] for z in range(3) for t in range(2)],
        'units':'H/2^128', 'charges':charges,
        'inverseCharge':inverse_charge,'gammaCharge':gamma_charge,'wholeHaarSquareCharge':square_charge,
        'originalGammaWzzDerivativeBound':'sup_binder sqrt(zeta) * exp[(-2+2^-113)H]',
        'actualJz0WzzSelfProductContributionBound':'sup_binder(zeta) * exp[(-4+2^-112)H]',
        'retainedActualContribution':'ordinary ZZT jet of whole radial Haar of R times the square of the Wzz-driven Temporal gamma',
        'assumptions':['Original admitted fixed-label chart and every shifted radial input',
                       'External source Primary coefficient and common-Y transport premises',
                       'Original periodic Fourier inverse and ordinary differentiated integral meanings',
                       'Log S below H/2^128, epsilon gains at least one, and 3/L < 2^-128'],
        'scope':'This is the Wzz-only square. Mixed gamma products, remaining pressure and covariance terms, actual Jz0 and final spatial intervals remain open.',
        'finalJets':0,'release':'HOLD',
    }
    with args.out.open('xb') as out:
        out.write((json.dumps(result,indent=2)+'\n').encode())
    print(json.dumps({'gammaCharge':gamma_charge,'squareCharge':square_charge}))


if __name__ == '__main__':
    main()
