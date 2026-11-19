"""Package the actual angular stress and first forced shell checks."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation84 import PARENTS as EARLIER

PARENT = 'be3824991ac8371d806e03e240214b72d4a53224'
PARENTS = {
    **EARLIER,
    'MathScope_Goal_Continuation84_Delta_20261120.zip':
        '5693f442d4929b5aadc8220e639f7f72989e690a741f79e9c511282e7bdaad57',
}
ROOT = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/angular-order-one-shell/'
ADDITIONAL = {
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/AngularStressShell.lean':
        'ee082afb799b469d14e7ae5e52adaa46f15ec9002e53a644deb610082a01df8f',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':
        '55d9c14a222d551b403bae424148d6158f5e7e82776b69f5ef63a3769500cace',
}
PINS = {
    'transport/stress-transport.json': '3667d24bfaebfa135a019d7444d661286aa5e79fdb036e553b30e5b69e8138be',
    'transport/terminal-norms-order-two.json': '1911afdb24363767c1fca4271d28cd019bf53fb6430aadbbbaedd579bcd7171c',
    'transport/terminal-norms-binding-final.json': 'b2d4a4ad910e2e0f28b9527478a1f351e8ecde42c70612cc0286404a59948ed4',
    'transport/terminal-transport-bounds.json': 'eb94dc1483c3bce65eedd923fe157b1715d8f5fd790624a930517d3fabb28b98',
    'terminal/MANIFEST.json': 'd361f2ae096161f8136a62cebd5bf410b5222df7bba1e6d5a3e2b6dc61639778',
    'forced/forced-shell-final.json': '705013059e1f064c3f9826c7c1846128064a26fa777bab6e335ed98a8c133fdd',
    'lean/AngularStressShell.log': '3c0e3a1b477ebe492ffadcece1ea89fc0334b351ab7d77cec75a291a362a1cb9',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(ROOT + path))['sha256'] == pin, path
    owners = source(ROOT + 'terminal/MANIFEST.json')['files']
    for file in owners:
        assert entry(raw(ROOT + 'terminal/' + file['path'])) == {
            'sha256': file['sha256'], 'bytes': file['bytes'],
        }, file['path']

    stress = source(ROOT + 'transport/stress-transport.json')
    bindings = stress['positiveStressOrderBindings']
    assert [binding['physicalCoefficientOrder'] for binding in bindings] == [3, 2, 1]
    assert [binding['qPower'] for binding in bindings] == [17743840, 17743846, 17743852]
    assert [
        (binding['physicalCoefficientOrder'], component['component'])
        for binding in bindings
        for component in binding['components']
        if component['originalUpper'] == 28826
    ] == [(1, 'theta')]
    flux = stress['exactAngularFlux']
    assert flux['sourceRegistry']['body'] == 117048
    assert flux['sourcePrimitives']['stress'] == 117068
    assert flux['sourcePrimitives']['wholeAngularMoment'] == 117072
    assert flux['derivativeRemainderIntervalTerms'] == 0

    binding = source(ROOT + 'transport/terminal-norms-binding-final.json')
    assert binding['typedAlphaBinding']['actualB'] == 17717057
    assert binding['typedAlphaBinding']['actualB0'] == 17717108
    norms = binding['pureTerminalRectangularNorms']
    assert [row['bound'] for row in norms] == [117859, 118006, 118103]
    assert [row['faceCount'] for row in norms] == [4, 4, 4]
    bounds = source(ROOT + 'transport/terminal-transport-bounds.json')
    assert bounds['exponentsAndConstants']['uniformRoundedCoefficient'] == 8
    assert [int(row.rsplit('^(-', 1)[1][:-1]) for row in bounds['threeRadialBounds']] == [6, 9, 12]

    forced = source(ROOT + 'forced/forced-shell-final.json')
    assert len(forced['cases']) == 20 and forced['projectedComponents'] == 120
    assert forced['linearRawSourceControl']['atom'] == 21441797
    assert forced['linearRawSourceControl']['projected'] == 21661977
    assert len(forced['jetPremise']['commonOrders']) == 12
    assert forced['jetPremise']['covarianceCoefficientRoles'] == 330
    assert all(row['finalJets'] == 0 and row['release'] == 'HOLD' for row in (stress, bounds, forced))

    lean = source(ROOT + 'lean/receipt.json')
    assert lean['run'] == 44617281687 and lean['conclusion'] == 'success'
    assert lean['fileSHA256'] == ADDITIONAL[lean['file']]
    assert len(lean['theorems']) == 3
    log = raw(ROOT + 'lean/AngularStressShell.log').decode()
    assert all('MathScope.M3.CD.' + theorem in log for theorem in lean['theorems'])
    assert all(log.count(axiom) == 3 for axiom in lean['axioms'])
    assert 'sorryAx' not in log and 'error:' not in log
    shas = raw(ROOT + 'lean/source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256'] + '  MathScope/M3/CD/AngularStressShell.lean' in shas

    return {
        'physicalOuterThetaOrder': 1, 'wholeAngularMoment': 117072,
        'terminalOrdinaryDerivativeOrders': [0, 1, 2], 'exactTerminalFaces': 12,
        'forcedSystems': 20, 'projectedSourceScalars': 120,
        'sourceDerivativeOrders': 12, 'covarianceCoefficientRoles': 330,
        'hostedLeanRun': lean['run'], 'hostedLeanTheorems': 3,
        'finalN8Comparisons': 0, 'finalJets': 0,
    }


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation85', date='20261120',
                   verify=verify_evidence, additional_pins=ADDITIONAL)
