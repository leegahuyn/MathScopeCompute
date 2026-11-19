"""Verify the original Picard realization, inner force error and hosted Lean logs."""

import re

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation55 import PARENTS as EARLIER

PARENT = 'd9879ed6032960de4c5dc84c55aafb813884b5e0'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation55_Delta_20261120.zip':
           '7b58e245d6db6cb906f1955c2a40363086c5ad0244f4911ceb039e581de2bde0'}
LEADING = 'axial-order-one-identity/leading-B/'
GENERAL = 'axial-order-one-identity/general-source-picard/'
INNER = 'final67/inner-n8-absolute-error/'
CI = 'ci-44562112347/'
EXTRA = {
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':
        '557dd930b5b43036ee0ce753948ac0d6d86bef3ec6ceba448c2369d22b6d5f97',
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/SourceNaturalFirstIntegrals.lean':
        '15dd287a260236f24f72ebd4967f258f3420364bfaf9135e4bfc38af5f6ebb9c',
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ActualPicardNormEnvelope.lean':
        'd1e650e06fa45420c6d207818bc20cf8439c7778a41c9791135a9f7ace42ee03',
}
PINS = {
    LEADING + 'activation-source.json': '9061704c10b553ed44f43d0021ebe22c656ec5b8082dfd06079b2e1fbe5163c0',
    LEADING + 'leading-B.json': '11fdc71bb1975637193b1808962d07c0c648eceda5e11667ab6898f8958755cd',
    GENERAL + 'source-picard-scope.json': 'b5ee46e2cdf6007b121ba469deb4e4a52ee6a4f5c913d34fc0b48e40c35785fb',
    GENERAL + 'SOURCE_PICARD_SCOPE.md': '16562ca42c89ab5a598a036522ee80169399f9d652651822efcd349faa2067b1',
    GENERAL + 'check_source_picard_scope.mjs': 'ed8a9f4e158393f219d89ff163b7fcf4ced3e9f17fec1069a3ce84942fcf3fd4',
    INNER + 'MANIFEST.json': 'b9b910028dca8eddde9c068b6f0a3291d37ff4e86af447f5b6d58a2c826007d1',
    INNER + 'absolute-force-readback.json': 'bfdb940dca0ba09628d5187787b2f75ca6893ba1c7dc22a84d9d0931a1c9b942',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    leading = source(LEADING + 'leading-B.json')
    assert leading['status'] == 'PASS_SOURCE_MODE_IDENTITIES_AND_HISTORICAL_B_CONSTANTS'
    assert leading['sourceSHA256'] == PINS[LEADING + 'activation-source.json']
    assert all(leading['modeFirstIntegralIdentities'].values())
    assert all(row['pass'] for row in leading['exactScalarChecks'].values())
    n1 = source(GENERAL + 'source-picard-scope.json')
    exact = n1['exactNativeOrderOne']
    assert len(set(exact['matched'])) == 78 and exact['omega0']
    assert exact['firstNestedOmegaViscosityUsesLeadingV'] and len(n1['exactSharedLeadingCoreBodies']) == 3
    assert len(n1['lexicalScopeChecks']) == 20 and len(n1['negativeControls']) == 7

    manifest = source(INNER + 'MANIFEST.json')
    for path, row in manifest['files'].items():
        assert entry(raw(INNER + path)) == row, path
    error = source(INNER + 'absolute-force-readback.json')
    assert error['checkedPhysicalMonomials'] == 396 and len(error['endpointProofs']) == 4
    assert {x['degree'] for x in error['endpointProofs']} == {4, 8}
    assert all(x['strictPositiveUpper'] and x['seedGreaterThan256'] for x in error['endpointProofs'])
    assert error['storedUpperEndpointComparison'] == 0
    assert error['N706'] == error['N805'] == 'OPEN' and error['finalJets'] == 0

    run = source(CI + 'run.json')
    assert run['headSha'] == '00ee2bfe20e18e9e1c2806245a7f0570b794c0e4'
    assert run['status'] == 'completed' and run['conclusion'] == 'success'
    assert run['url'].endswith('/actions/runs/44562112347')
    manifest_text = raw(CI + 'source-sha256.txt').decode()
    for module, count in (('SourceNaturalFirstIntegrals', 4), ('ActualPicardNormEnvelope', 2)):
        lean_source = f'MathScope/M3/CD/{module}.lean'
        pin, = [value for path, value in EXTRA.items() if path.endswith(lean_source)]
        assert f'{pin}  {lean_source}' in manifest_text
        log = raw(CI + module + '.log').decode()
        axioms = re.findall(r'depends on axioms: \[([^\]]+)\]', log)
        assert len(axioms) == count and 'warning:' not in log and 'error:' not in log
        assert all(set(row.replace(' ', '').replace('\n', '').split(',')) ==
                   {'propext', 'Classical.choice', 'Quot.sound'} for row in axioms)
    return {'nativeKernelComparisons': 78, 'sourceScopeNegativeControls': 7,
            'innerPhysicalMonomials': 396, 'strictPositiveDyadicBounds': 4,
            'supportedDegrees': [4, 8], 'githubLeanRun': 44562112347, 'leanTheorems': 6}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation56', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
