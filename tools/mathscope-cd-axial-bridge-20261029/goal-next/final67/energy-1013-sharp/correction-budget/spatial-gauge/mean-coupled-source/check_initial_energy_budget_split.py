"""Reuse exact angular orthogonality to allocate the initial-field energy budget."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


MODES_SHA256 = '3c7062d62abe83ddad8291051fabe5004a19311114f085a7256611ec8f83d4f3'


def read(path):
    data = path.read_bytes()
    return sha256(data).hexdigest(), json.loads(data)


def main():
    if not __debug__:
        raise RuntimeError('Exact budget comparisons require assertions.')
    p = ArgumentParser(description=__doc__)
    for name in ('mean', 'localized_modes', 'output'):
        p.add_argument(name, type=Path)
    a = p.parse_args()
    mean_sha, mean = read(a.mean)
    mode_sha, modes = read(a.localized_modes)
    assert mode_sha == MODES_SHA256
    assert mean['sourceSHA256'] == modes['sourceSHA256']
    assert mean['status'] == 'CONDITIONAL_COMPLETE_INITIALIZED_MEAN_WITHIN_RESERVED_BUDGET'
    assert mean['reservedForceFraction'] == '2^-32'
    assert mean['energyBelowOne'] == -1 and mean['budgetAboveOne'] == 1
    assert modes['status'] == 'CONDITIONAL_INITIALIZED_LOCALIZED_OUTPUTS_HAVE_FINITE_PHYSICAL_MODE_SUPPORT'
    assert len(modes['sourceAngleFreePotentialBodies']) == 6
    assert modes['stencilTerms'] == 540

    # Normalize each J² bound by the same positive S_R. Only slow and
    # mean share the zero angular mode, so only that sum uses triangle.
    mean_norm = Fraction(1, 2 ** 16)
    slow_norm = Fraction(1, 2 ** 14)
    wave_norm = Fraction(1, 2 ** 14)
    initialized = (mean_norm + slow_norm) ** 2 + wave_norm ** 2
    assert initialized == Fraction(41, 2 ** 32) < Fraction(1, 2 ** 26)
    annular = 25 * Fraction(1, 2 ** 26)
    assert annular < Fraction(1, 2 ** 21)
    result = {
        'schema': 'MathScope.N7.InitializedEnergyOrthogonalBudget/1',
        'status': 'CONDITIONAL_SUFFICIENT_INITIALIZED_AND_CORRECTION_ENERGY_BUDGETS',
        'meanInputSHA256': mean_sha, 'originalModeBindingSHA256': mode_sha,
        'verifiedConditionalMeanFraction': str(mean_norm ** 2),
        'sufficientSlowFraction': str(slow_norm ** 2),
        'sufficientWaveFraction': str(wave_norm ** 2),
        'sufficientInitializedFraction': str(initialized),
        'eachLaterCorrectionSufficientFraction': str(Fraction(1, 2 ** 26)),
        'combinedAnnularSufficientFraction': str(annular),
        'annularBudgetFraction': str(Fraction(1, 2 ** 21)),
        'orthogonality': 'The localized slow and mean fields are axisymmetric in the '
                         'cylindrical frame. The initial wave has zero mean with the '
                         'original fixed labels and cutoff. Derivatives in the physical '
                         'gradient preserve this orthogonality on full circles.',
        'remaining': ['original initialized slow bound', 'original initialized wave bound',
                      'active correction bounds and final field numerics'],
        'N706': 'OPEN', 'N805': 'OPEN', 'finalJets': 0, 'release': 'HOLD',
    }
    with a.output.open('x', encoding='utf8', newline='\n') as out:
        json.dump(result, out, indent=2)
        out.write('\n')
    print('PASS exact phase-separated initialized fraction 41/2^32 and annular allocation')


if __name__ == '__main__':
    main()
