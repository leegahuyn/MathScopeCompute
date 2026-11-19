"""Read back the complete original selector census and localized initial Fourier caps."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation42 import PARENTS as EARLIER


PARENT = 'c21d9d0ac940ccd9922aab8603ee7b518247fac8'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation42_Delta_20261119.zip':
           '07a7e520db196a362b83dacbb4aadb1d915893429e3992aff39a6687b032dd01'}
ANGLE = 'final67/initial-fourier/'
Y = 'y-higher-flow/n4-selector-frame/'
M4 = 'm4/production-readback-20261119/'
PINS = {
    ANGLE + 'localized-initialized-modes.json': '3c7062d62abe83ddad8291051fabe5004a19311114f085a7256611ec8f83d4f3',
    Y + 'selector-flow.json': '2a3793078d70f1e5310175c547366475c42459309f7c9c379f79f39a72e09c85',
    Y + 'selector-no-guards.json': '90468a9a79dea534974f861ddb1704d56a21e4afe45bd4f874c171ae857b9fbb',
    Y + 'selector-no-integrals.json': 'f1684a0f00d35b743e818190414d1a1b5fa42f2bf2381c0ca1a9dbd2a0bf1a58',
    Y + 'remaining-roots.json': '390e75cb57fcf39e44db4ba1806bbdcd9da2f8a00aa46b425952ccc7db6d6475',
    M4 + 'public-http.json': '7c3b47a1b974dcf7f2c440f0b06ce4df00c80cf6d274a831ce9496d1ea1b2dd6',
}


def verify_evidence(raw, source):
    for path, digest in PINS.items():
        assert entry(raw(path))['sha256'] == digest, path
    modes = source(ANGLE + 'localized-initialized-modes.json')
    assert modes['stencilTerms'] == 540 and modes['potentialScopeNodes'] == 128437
    assert len(modes['sourceAngleFreePotentialBodies']) == 6
    assert modes['cylindricalFrameBoundsAsAffinePairs']['force'] == [[2, 1], [2, 1], [2, 0]]
    selector = source(Y + 'selector-flow.json')
    assert selector['selectorRoots'] == [4582068, 4582117, 4582180, 4582258, 4582351]
    assert selector['sourceNodes'] == 7358162 and selector['activeAncestorNodes'] == 468209
    assert selector['sourceProfileDescendants'] == 259 and not selector['failures']
    assert not selector['unresolvedNativeKinds'] and not selector['physicalInputFactsSupplied']
    assert len(source(Y + 'selector-no-guards.json')['failures']) == 245
    assert len(source(Y + 'selector-no-integrals.json')['failures']) == 259
    remaining = source(Y + 'remaining-roots.json')
    assert remaining['remainingProfiles'] == remaining['remainingBelowSelectorRoots'] == 77
    assert remaining['remainingOutsideSelectorRoots'] == []
    public = source(M4 + 'public-http.json')
    assert public['http'] == 200 and public['bytes'] == 30707818 and public['matchesPriorPublicSnapshot']
    return {'originalLocalizationStencilTerms': 540, 'physicalWavePotentialBodies': 6,
            'selectorProfiles': 259, 'additionalProfiles': 77}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label='MathScope_Goal_Continuation43',
                   date='20261119', verify=verify_evidence)
