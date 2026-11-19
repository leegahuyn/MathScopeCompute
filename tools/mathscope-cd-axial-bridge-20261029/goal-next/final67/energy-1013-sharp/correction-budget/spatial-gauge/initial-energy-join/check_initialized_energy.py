"""Join three original initialized energy receipts in one physical annulus."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


SPATIAL = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/'
ANGULAR = 'final67/initial-fourier/'
COMMON_KEYS = ('coefficients', 'valuation', 'fixed', 'background', 'thresholds', 'historical')
MEAN = SPATIAL + 'mean-coupled-source/coupled-mean-final.json'
PINS = {
    MEAN:
        '9564ba16886f5c26c2367e5a77332cbd5882494dd3a07f4d295d9ef4dd42b721',
    SPATIAL + 'slow-coupled-source/slow-energy-final.json':
        '9d575f06fa7e540e02e14a1555bac5dc0c428d94251ac3fbf32ba86a4089f28c',
    SPATIAL + 'mean-coupled-source/initial-energy-budget.json':
        '341927d7223f1c0d036f9b1dc3c3317e7d84998e7cb35aebce96445d555a8be5',
    ANGULAR + 'initialized-angular-split.json':
        '0545658bf1dc4d5b373639c562ce537be1600a2210089faaa90aa6f77a8ed0b2',
    ANGULAR + 'localized-initialized-modes.json':
        '3c7062d62abe83ddad8291051fabe5004a19311114f085a7256611ec8f83d4f3',
}
WAVE = SPATIAL + 'wave-coupled-source/initial-wave-energy.json'
LEDGER = SPATIAL + 'wave-coupled-source/wave-energy-ledger.json'


def derive(read):
    """Check source pins and exact fraction arithmetic using a supplied byte reader."""
    def evidence(name, expected=None):
        raw = read(name)
        digest = sha256(raw).hexdigest()
        if expected is not None:
            assert digest == expected, name
        observed[name] = digest
        return json.loads(raw)

    observed = {}
    mean, slow, split, angular, modes = (evidence(path, pin) for path, pin in PINS.items())
    wave = evidence(WAVE)
    ledger = evidence(LEDGER, wave['ledgerSHA256'])
    assert mean['status'] == 'CONDITIONAL_COMPLETE_INITIALIZED_MEAN_WITHIN_RESERVED_BUDGET'
    assert slow['status'] == 'CONDITIONAL_COMPLETE_LOCALIZED_SLOW_WITHIN_RESERVED_BUDGET'
    assert wave['status'] == 'CONDITIONAL_COMPLETE_INITIAL_PRIMARY_WAVE_WITHIN_2_POW_NEG_32_BUDGET'
    assert wave['root'] == ledger['root'] and wave['positiveDegrees'] == ledger['positiveDegrees']
    assert wave['consumedRecords'] == 1070
    assert wave['positiveDegrees'] == ['34', '2']
    assert mean['energyBelowOne'] == -1 and mean['budgetAboveOne'] == 1
    assert slow['comparison'] == -1 and slow['radialComparison'] == -1
    for check in ('coefficientComparison', 'geometryComparison', 'budgetComparison', 'ratioBelowOne'):
        assert wave[check] == -1, check
    assert angular['status'] == 'VERIFIED_ORIGINAL_INITIALIZED_ZERO_MODE_SPLIT'
    assert modes['status'] == 'CONDITIONAL_INITIALIZED_LOCALIZED_OUTPUTS_HAVE_FINITE_PHYSICAL_MODE_SUPPORT'
    source = mean['sourceSHA256']
    assert source == wave['sourceSHA256'] == ledger['sourceSHA256'] == angular['sourceSHA256'] == modes['sourceSHA256']
    assert angular['nodeCount'] == 4456994 and len(angular['joins']) == 4
    assert [row['signedRows'] for row in angular['fields']] == [162] * 4
    assert ledger['rows'] == 162 and modes['stencilTerms'] == 540
    assert len(modes['sourceAngleFreePotentialBodies']) == 6
    common = {key: mean['sourcePins'][key] for key in COMMON_KEYS}
    for term in (slow, wave):
        assert {key: term['sourcePins'][key] for key in COMMON_KEYS} == common
        assert term['arithmetic']['precisionBits'] == mean['arithmetic']['precisionBits'] == 96
        assert not term['arithmetic']['binary64UsedForNumericalDecisions']
    assert not mean['arithmetic']['binary64UsedForNumericalDecisions']
    assert wave['sourcePins']['threshold'] == mean['sourcePins']['commonThresholdSource']
    assert wave['registrySHA256'] == angular['registrySHA256']
    assert wave['normalization']['sourceTau0'] == '2^(-(ellMinimum+15))'
    assert wave['normalization']['A'] == '1/2+h'
    assert set(wave['parameters']) == {'h', 'ellMinimum', 'hLogTau', 'Xb'}
    assert mean['sourcePins']['cutoffIdentities'] == slow['sourcePins']['outerCutoffSource']
    assert split['meanInputSHA256'] == observed[MEAN]
    assert split['originalModeBindingSHA256'] == PINS[ANGULAR + 'localized-initialized-modes.json']
    assert [term['reservedForceFraction'] for term in (mean, slow, wave)] == ['2^-32', '2^-28', '2^-32']

    mean_norm, slow_norm, wave_norm = (Fraction(1, 2**power) for power in (16, 14, 16))
    norm_triangle = (mean_norm + slow_norm + wave_norm)**2
    initialized = (mean_norm + slow_norm)**2 + wave_norm**2
    assert initialized == Fraction(26, 2**32) < norm_triangle == Fraction(9, 2**30)
    assert Fraction(split['sufficientInitializedFraction']) == Fraction(41, 2**32)
    correction = Fraction(split['eachLaterCorrectionSufficientFraction'])
    assert norm_triangle < correction == Fraction(1, 2**26)
    combined = 25 * correction
    budget = Fraction(split['annularBudgetFraction'])
    assert combined == Fraction(split['combinedAnnularSufficientFraction']) < budget == Fraction(1, 2**21)

    return {
        'schema': 'MathScope.N7.OriginalInitializedEnergyJoin/1',
        'status': 'CONDITIONAL_ORIGINAL_INITIALIZED_ANNULAR_ENERGY_WITHIN_2_POW_NEG_26_BUDGET',
        'sourceSHA256': source,
        'commonScalePins': common,
        'evidenceSHA256': observed,
        'sourceScale': {
            'tau0': '2^(-(ell+15))',
            'ell': 'fixed.hostedOriginal[617432]',
            'h': 'historical.definitions.h',
            'Xb': 'background.Xb',
            'forceScale': 'S_R',
        },
        'originalComponentFractions': {
            'mean': str(mean_norm**2), 'slow': str(slow_norm**2), 'primaryWave': str(wave_norm**2),
        },
        'initializedEnergyFractionStrictUpper': str(initialized),
        'triangleOnlyFractionStrictUpper': str(norm_triangle),
        'initializedBudgetFraction': str(correction),
        'sufficientLaterCorrectionFractionEach': str(correction),
        'combinedAnnularFractionIfFourActiveCorrectionsMeetBudget': str(combined),
        'annularBudgetFraction': str(budget),
        'combination': 'Full-circle orthogonality of the nonzero primary wave against the '
                       'axisymmetric mean and slow subtotal holds for the kinetic and physical '
                       'gradient terms. Apply the Hilbert norm triangle inequality to the slow '
                       'and mean fields, then add the square of the primary-wave norm.',
        'conditions': ['All three component receipts retain their source norm, physical chart, '
                       'cutoff plateau, regularity and zero-extension premises.',
                       *angular['conditions']],
        'open': ['Original active correction energies and the remaining full N7-06 bounds',
                 'Whole-field N8-05 refinement and numerical tail',
                 'Numerical intervals for all final-field jets after active corrections'],
        'N706': 'OPEN', 'N805': 'OPEN', 'finalJets': 0, 'release': 'HOLD',
    }


if __name__ == '__main__':
    assert __debug__
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('goal', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    result = derive(lambda path: (args.goal / path).read_bytes())
    with args.output.open('x', encoding='utf-8', newline='\n') as file:
        json.dump(result, file, indent=2)
        file.write('\n')
    print('PASS source-normalized initialized energy fractions 26/2^32 < 9/2^30 < 2^-26')
