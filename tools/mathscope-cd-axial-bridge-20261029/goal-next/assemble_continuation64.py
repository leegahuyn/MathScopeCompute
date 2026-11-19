"""Verify the exact Corollary 8.5 flux replay and the local operator transfer."""

import re

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation63 import PARENTS as EARLIER

PARENT = 'a3d53517a801a8010c95c24775f71aa0f5e7d598'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation63_Delta_20261120.zip':
           'ca68177fe1a4726419d601329fa943e1d3bcc96959d6d4c5103079f8397d4f68'}
FORCED = 'final67/local-forced-operator/'
SIGMA = 'final67/cor85-weighted-stress/'
CI = 'ci-44575285741/'
EXTRA = {
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml': '0f87daa5215507c451788a0f2cb01294def1d3848db6a703689c38f8ceafd0f3',
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/SignedStressEnergyGate.lean': '067474dc1693fa919caa6c540ef9f2cb5dc5bf1376a6a40f3f83820cb35badf5',
}
PINS = {
    'final67/local-forced-operator/local-forced-cost.json': 'e73562668961cf16705f59f2e4dd9fc4269d1b5bec5de958f9d6fc4307972fac',
    'final67/local-forced-operator/README.md': '2114639ba44c6e5e8b83bd1ee672655d11b52e3ff379208f1e439a089af97532',
    'final67/local-forced-operator/verify_local_forced_cost.mjs': 'b9df8b5293e02d19cb7190b83d89f85b81cc558f38c550c286ed675074a349ed',
    'final67/cor85-weighted-stress/MANIFEST.json': 'a4e6106351b5d70abf256698e09990e0a3dff93e6554edc63b996825111084d2',
    'final67/cor85-weighted-stress/README.md': '4bca7c218c87c538353f225f85a65e36ca114cac9115c5dcdd35db7c4041d573',
    'final67/cor85-weighted-stress/replay-log.json': '2b1630af2c9aab203c4d081c579df409298356fbd7251724dba81feefb0187c8',
    'final67/cor85-weighted-stress/sigma-transfer.json': 'b73b6cbe2e18275f634cf28e6c92698939672adaab7813829d39fc8d8f9a151c',
    'final67/cor85-weighted-stress/verify_sigma_transfer.py': '5cfaf6dbfb83b0f73e782cec2d731a0c22a9aed8d5bc6f0f5c3a71e6320d668c',
    'ci-44575285741/run.json': '76e5a004ba374247e9c86052cf2cfa4589ca04b0541e5f4d17a628dd4b8aa518',
    'ci-44575285741/SignedStressEnergyGate.log': '10eaa8ca79f07adc335a5b3ccacc4a27fcb72c230ce6f229b1e8b6f094681222',
    'ci-44575285741/source-sha256.txt': '323c0773fedd74c025eb454e9ddf729e4958c536119dfc4a8cad8f2407b88151',
    'ci-44575285741/version.txt': '355a9a028f81641782d75d6e6b58dec70f29d2f61238a9e271690259d9bf5680',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    stress = source(SIGMA + 'sigma-transfer.json')
    exact = stress['exactChecks']
    assert exact['fullPreHaarWeightedFluxDefects'] == ['0', '0']
    assert exact['fixedMeanCovarianceIncrementDefects'] == ['0', '0', '0']
    assert exact['omitting_cRho_Z_times_P_isDetected']
    assert stress['reducedSigma']['weights'] == [2, 1]
    assert stress['reducedSigma']['chiAndRhoMayDependOnZAndT']
    assert not stress['localPrimaryRebase']['existingPrivateClassSealReissued']
    assert stress['meanPositiveProgramTransfer']['pureSlowTotal_v_C3_Open']
    assert stress['scope']['finalJets'] == 0 and stress['scope']['release'] == 'HOLD'

    forced = source(FORCED + 'local-forced-cost.json')
    powers = forced['verifiedOrderPowers']
    assert [row['order'] for row in powers] == list(range(7))
    assert [row['backgroundOrder'] for row in powers] == list(range(2, 9))
    assert all(row['inputSeminormStillRequired'] for row in powers)
    assert [powers[-1]['amplitudePower'], powers[-1]['pressurePower']] == [1048, 1081]
    assert forced['largestLogUnits_H_over_2pow131'] == 34607 < 2**16
    assert forced['commonOperatorLogStrictUpper'] == 'H/2^115'
    assert forced['originalSystems'] == 20 and forced['scope']['actualStageCapsClosed'] == 0

    run = source(CI + 'run.json')
    assert run['databaseId'] == 44575285741
    assert run['headSha'] == '9dfb6ce5fd297612a0a688db163e122aaebe71ee'
    assert run['status'] == 'completed' and run['conclusion'] == 'success'
    assert run['url'].endswith('/actions/runs/44575285741')
    lean = 'MathScope/M3/CD/SignedStressEnergyGate.lean'
    assert f'{EXTRA["research-ide/mathscope-m3/p8/lean/" + lean]}  {lean}' in raw(CI + 'source-sha256.txt').decode()
    log = raw(CI + 'SignedStressEnergyGate.log').decode()
    names = re.findall(r"'MathScope\.M3\.CD\.([a-z0-9_]+)' depends on axioms: \[([^\]]+)\]", log)
    assert [name for name, _ in names] == ['cor85_weighted_flux_cap',
              'correction_quarter_power_cap', 'correction_energy_of_quarter_power']
    assert all(axioms.split(', ') == ['propext', 'Classical.choice', 'Quot.sound'] for _, axioms in names)
    assert 'warning:' not in log and 'error:' not in log
    return {'exactStressIdentities': 5, 'originalForcedSystems': 20, 'forcedOrders': 7,
            'conditionalOperatorLogBound': 'H/2^115', 'githubLeanRun': 44575285741,
            'leanTheorems': 3, 'actualStageCapsClosed': 0, 'finalJets': 0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation64', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
