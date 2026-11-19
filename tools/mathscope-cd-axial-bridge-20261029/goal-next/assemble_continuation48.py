"""Package the original localized slow-background energy enclosure."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation47 import PARENTS as EARLIER


PARENT = 'd76c420abbc3a438bd4ad7db36b99a6303126248'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation47_Delta_20261119.zip':
           'b4d79c3850fe41f25d191e3a431cd81f0974482e0c22606fcb85ab2d658c8e8b'}
SLOW = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/slow-coupled-source/'
PINS = {
    'MANIFEST.json': 'a2ea1d9fc94b7e35d39e2498191a05d84e0b93f7f4be470e03107a13d4470412',
    'slow-energy-ledger.json': '390feae633688fbc21140885501a8d06066bb717be55acdbc17bb5cba0a0ab65',
    'slow-energy-algebra.json': '19b6013b104d52c3afdc69dcb3806ad3e391c4595564b446d7f36836461f5c2f',
    'slow-energy-final.json': '9d575f06fa7e540e02e14a1555bac5dc0c428d94251ac3fbf32ba86a4089f28c',
    'slow-energy-readback.json': 'e5fdfc346cabc88cd1fbc71f8d8b628e553bfec55ea44ba26109fbf888fd82a3',
}


def verify_evidence(raw, source):
    for path, digest in PINS.items():
        assert entry(raw(SLOW + path))['sha256'] == digest, path
    ledger = source(SLOW + 'slow-energy-ledger.json')
    assert ledger['status'] == 'VERIFIED_ORIGINAL_SLOW_SPATIAL_ENERGY_TAU_POWER_LEDGER'
    assert ledger['positiveRows'] == len(ledger['rows']) == 360 and ledger['zeroPolynomialTerms'] == 58
    assert {tuple(row['remainingTau0Power']) for row in ledger['rows']} == {
        ('0', str(degree)) for degree in range(6)
    }
    algebra = source(SLOW + 'slow-energy-algebra.json')
    assert algebra['ledgerSHA256'] == PINS['slow-energy-ledger.json']
    assert algebra['checkedContributions'] == 360 and algebra['zeroPolynomialTerms'] == 58
    assert algebra['status'] == 'VERIFIED_INDEPENDENT_SYMBOLIC_COMPLETE_SLOW_TAU_COLLECTION'
    slow = source(SLOW + 'slow-energy-final.json')
    assert slow['status'] == 'CONDITIONAL_COMPLETE_LOCALIZED_SLOW_WITHIN_RESERVED_BUDGET'
    assert slow['comparison'] == -1 and slow['reservedForceFraction'] == '2^-28'
    assert slow['sourcePins']['ledger'] == PINS['slow-energy-ledger.json']
    assert len(slow['normalizedVelocityUpper']) == 3 and len(slow['normalizedGradientUpper']) == 9
    readback = source(SLOW + 'slow-energy-readback.json')
    assert readback['receiptSHA256'] == PINS['slow-energy-final.json']
    assert readback['comparison'] == -1 and readback['reservedForceFraction'] == '2^-28'
    return {'positiveSlowTerms': 360, 'zeroSlowTerms': 58,
            'conditionalSlowForceFraction': '2^-28', 'conditionalMeanForceFraction': '2^-32'}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label='MathScope_Goal_Continuation48',
                   date='20261119', verify=verify_evidence)
