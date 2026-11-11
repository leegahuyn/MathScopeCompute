"""Bind the independently replayed raw projection identities to the live candidate."""
from argparse import ArgumentParser
from pathlib import Path
import json

from replay_repeat_conservative import pinned

HERE = Path(__file__).resolve().parent
INPUTS = {
    'independent-repeat-conservative.json': 'e3b4ce2d25c1f351bcf11c664dfda60aedbba407f3aac7dcf2d27f1f0b269b88',
    'repeat-row-transport.json': '7279768a0510b1eee2ee56976d3c1fa2a63a0fd4f554fcbef4c179521355d79a',
    'repeat-own-wave-operands-detailed.json': '7ac31a18079dd4cabf9f190dfbca0559d1ade8ea779aa4866238cd7b935eba67',
    '../repeat-mean-projection/repeat-mean-projection.json': 'c9948b40ba1c13bdfe2a4045c0bc92bb9ac0b10923aa823df7a029d5c171fe21',
    'live-stencil-support.json': '71fd8a8e26b5db757206b11e28ac8936bbe7e098a115bd444a0037b972e7dacb',
    'independent-second-forced-candidates.json': '3e3911a19698f1f59187a34665a86be9b1e2f6296a3fa113be1b5f12be2d5285',
}


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    residual, transport, wave, mean, stencil, official = [pinned(HERE / path, digest) for path, digest in INPUTS.items()]
    graph, native = official['graphSHA256'], official['registrySHA256']
    assert all(row['graphSHA256'] == graph and row['registrySHA256'] == native
               for row in (residual, transport, wave, stencil))
    assert mean['candidateGraphSHA256'] == graph and mean['candidateRegistrySHA256'] == native
    roots = {(row['key'], row['mode'], j, part): value[part]
             for row in official['systems'] for j, value in enumerate(row['rawRoots'])
             for part in ('real', 'imaginary')}
    computed = {(row['key'], c['mode'], c['component'], c['part']): c['rawRoot']
                for row in residual['cases'] for c in row['rawComponents']}
    assert computed == roots and len(roots) == residual['positiveRawComponentCount'] == 240
    phases = {row['key']: row['ownPhase'] for row in residual['cases']}
    assert len(phases) == 10
    assert all(phases[row['key']] == row['phase'] for row in wave['waves'])
    assert len(wave['waves']) == 20 and sum(2 * len(row['fields']) for row in wave['waves']) == 160
    assert wave['indexedRowCount'] == transport['bindings']['signedRows'] == stencil['signedRows'] == 162
    assert mean['coverComposition']['sameRowBindingsChecked'] == 1296
    assert mean['meanDerivativePolarization']['checks'] == 120
    assert mean['meanDerivativePolarization']['missingRadialScaleRejected'] == 120
    global_roots = [r['root'] for r in residual['referenceRealConservativeReplay']['conservativeRoots']]
    assert len(global_roots) == 3 and len(wave['meanDecomposition']) == 4
    assert [row['fullPhysicalRoot'] for row in wave['meanDecomposition']] == residual['referenceRealConservativeReplay']['fields']
    result = {
        'schema': 'MathScope.M3.ActualRepeatFixedRowRawProjection/1',
        'inputSHA256': INPUTS, 'graphSHA256': graph, 'registrySHA256': native,
        'referenceConservativeRoots': global_roots, 'actualRawRealAndImaginaryComponents': len(roots),
        'actualWaveOperands': 160, 'actualSignedRows': 162, 'meanDerivativeComparisons': 120,
        'rowMultiplier': 'rho^(2A+1/2)',
        'verifiedImplication': 'On each admitted fixed-row ordinary derivative domain, '
                               'the raw candidate equals the nonzero Fourier projection of the original full conservative residual '
                               'after scaling from the reference chart to that row.',
        'ordinaryDerivativeAndWeightedSeamClosure': 'OPEN',
        'completeFlatSubtractionAndGuardedSupportedInput': 'OPEN',
        'completeSecondForcedState': False, 'finalClosedCellJets': 0, 'release': 'HOLD',
    }
    args.out.write_bytes((json.dumps(result, indent=2) + '\n').encode())
    print('PASS fixed-row raw projection, all 240 live source components, conditional on ordinary source derivatives')


if __name__ == '__main__':
    main()
