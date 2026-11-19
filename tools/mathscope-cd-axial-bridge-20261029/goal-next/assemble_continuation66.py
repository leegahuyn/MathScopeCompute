"""Verify the original annular force-transfer replay and hosted Lean proofs."""
import re

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation65 import PARENTS as EARLIER

PARENT = 'a9990deead29e70ce2a5a0130d0f732c5d17ffa2'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation65_Delta_20261120.zip':
           '925e0beb0d5fb6507ec3c25ceec51ed06e47034c37a3d31d9ed6380d4e5d3ac8'}
FORCE = 'final67/annular-force-transfer/'
CI = 'ci-44577382404/'
EXTRA = {
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml': 'e4519ffa571a0497fed08a20570df91bfb7a6cc74110a15d4227d3dd643e7102',
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/AnnularForceTransfer.lean': 'c03ce55df1967141869afaa785804c25f8fcc1e219cdc71130df01957c1b5e40',
}
MANIFEST = 'f6d476824e83344929e7ebdbf3b74d8878230a7d52ffeaf98e039554a60d868f'


def verify_evidence(raw, source):
    assert entry(raw(FORCE + 'MANIFEST.json'))['sha256'] == MANIFEST
    manifest = source(FORCE + 'MANIFEST.json')
    for name, pin in manifest['payload'].items():
        assert entry(raw(FORCE + name))['sha256'] == pin, name
    receipt = source(FORCE + 'annular-force-transfer.json')
    assert receipt['sourceSupport']['maxStrictTransitionsAtOnePoint'] == 1
    assert receipt['sourceSupport']['stage5AndLaterExactZeroOnSlab']
    assert receipt['exactSymbolic']['forceComponentChecks'] == 3
    assert receipt['exactSymbolic']['flatBranchComponentChecks'] == 12
    assert receipt['cylindrical']['vectorConnectionAndAxialProductComponentsChecked'] == 12
    controls = receipt['negativeControls']['nonzeroDefects']
    assert len(controls) == 7 and all(any(value != '0' for value in row) for row in controls.values())
    caps = receipt['normalizedCutoffCaps']['physicalProductCtimesKappa']
    assert caps == {'0,0': 1, '0,1': 12, '1,0': 22, '1,1': 359, '2,0': 740, '3,0': 55722}
    assert len(receipt['normalizedEndpoint']['exactProductExponents']) == 16
    assert not receipt['normalizedEndpoint']['realEndpointExecuted'] and receipt['finalJets'] == 0
    energy = receipt['conditionalEnergyTransfer']
    for row, coefficient in zip(energy['referenceCases'], [237240288, 312885936], strict=True):
        assert int(row['sharpened96EnergyCoefficient']) == coefficient and coefficient * 49 < 2**34
    assert energy['sameSufficientPhysicalWCAPBothCharts'] == '(7/8)*2^-27*Xb^-2*tau0^-h'
    assert energy['noActualSourceEndpoint']
    assert receipt['N7_06'] == receipt['N8_05'] == 'OPEN' and receipt['release'] == 'HOLD'

    run = source(CI + 'run.json')
    assert run['databaseId'] == 44577382404
    assert run['headSha'] == '76f2433b7b415072868486ac5d8ef75dacb6e8e9'
    assert run['status'] == 'completed' and run['conclusion'] == 'success'
    assert run['url'].endswith('/actions/runs/44577382404')
    lean = 'MathScope/M3/CD/AnnularForceTransfer.lean'
    assert f'{EXTRA["research-ide/mathscope-m3/p8/lean/" + lean]}  {lean}' in raw(CI + 'source-sha256.txt').decode()
    log = raw(CI + 'AnnularForceTransfer.log').decode()
    theorems = re.findall(r"'MathScope\.M3\.CD\.([a-z0-9_]+)' depends on axioms: \[([^\]]+)\]", log)
    assert [name for name, _ in theorems] == [
        'annular_stage_transitions_disjoint', 'annular_adjacent_convection_component',
        'annular_gauge_heat_component', 'annular_adjacent_residual_square',
        'annular_sharper_spatial_energy_gate']
    assert all(set(axioms.split(', ')) <= {'propext','Classical.choice','Quot.sound'} for _, axioms in theorems)
    assert 'warning:' not in log and 'error:' not in log
    return {'actualTransitionsAtMost': 1, 'exactForceComponents': 3, 'seamComponents': 12,
            'cylindricalComponents': 12, 'negativeControls': 7, 'sharpSpatialConstants': [22, 740],
            'githubLeanRun': 44577382404, 'leanTheorems': 5, 'actualResidualEndpoint': 'OPEN', 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation66', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
