"""Package same-live first-wave gauge, N4 domain and isolated angular refinement."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation79 import PARENTS as EARLIER


PARENT = 'f3e2c7b24a23ced6aa5d6e8f2df851d7ce84006d'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation79_Delta_20261120.zip':
           'c571662ff5ec470c1c45f2a7c7bd75c7729df6e4df3280a7e760e963b1777246'}
LEAN = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/WaveReferenceCurl.lean'
WORKFLOW = '.github/workflows/mathscope-cd-axial-bridge-20261029.yml'
EXTRA = {LEAN:'4138cf7c7b259547c3c1b25b08b63a27a222681d6857e1a7ebd732faf2783938',
         WORKFLOW:'305651f7c9f6de346e2c4c55e26cd3c1f0127ea0749e79f995f4af2eefbf2215'}
CI = 'ci-44604053598/'
WAVE = 'primary-forced-join/active-n3-c5-binding/live-wave-gauge/'
Y = 'y-higher-flow/n4-first-ordinary-112/'
N8 = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/active-n3-five-map-fourier/'
PINS = {
    WAVE+'wave-join-verified.json':'56aa2e6f1092435b63712fdf64ca2070e6bc4515f57e899dae9405424dfd3b4b',
    WAVE+'admitted-uncut-gauge.json':'e02d4c200e6c0950a3fa65fbee063b9f838ecbb34613edbfea536b09f6024263',
    WAVE+'forced/forced-wave.json':'40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b',
    WAVE+'signed/signed-wave-reduction.json':'429918bd2cd4a167bcbc8e76e7d04b42b6ac11e4a2dbaa7ec06e14caffcd19ef',
    Y+'rollup.json':'1ff961c19e2d3aafbbd49aa24a3c909a6b0cfde95716ab531c04938c8161835f',
    N8+'fivemap-fourier-verified.json':'582eda176935ded2bd2a3f7243281c29f28b45c698185ceb106d21aa9aeca11f',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path

    exact = source(WAVE+'admitted-uncut-gauge.json')
    assert exact['run']==44582875351 and exact['leanRun']==44604053598
    assert exact['nativeGaugeDifferenceRoots'] == [22154926,22154928,22154930]
    assert exact['uncutDifferencesOnOpenBranches'] == [0,0,0]
    assert (exact['forcedModes'], exact['signedTemplates'], exact['originalGuardedRows'],
            exact['initialCoefficientsCancelled'], exact['liftCoordinates']) == (20,10,162,60,1620)
    assert exact['matchedWaveGradientSlots'] == 9
    assert exact['classicalDerivativesAcrossSeams'] == exact['globalStage1WeightedCaps'] == 'OPEN'
    assert exact['finalJets']==0 and exact['release']=='HOLD'
    wave = source(WAVE+'wave-join-verified.json')
    assert wave['fastLiftChain']['exactYDerivativeIdentities'] == 20
    assert wave['initialSubtraction']['sameLocalGuardPredicates'] == 210

    y = source(Y+'rollup.json')
    assert y['status']=='PASS_N4_112_FIRST_ORDINARY_FRESH_ARGUMENTS'
    old, new = set(y['previously_verified_sites']), set(y['newly_verified_sites'])
    assert len(old)==41 and len(new)==71 and not old & new
    assert y['new_totals'] == {'rows':71,'ordinary_nodes':1319012,'fresh_y':15000,
                              'inherited_y':9651,'native_frames':25125,'top':19,'lower':52}

    fourier = source(N8+'fivemap-fourier-verified.json')
    assert fourier['source']['liveRun']==44582875351 and fourier['finalFourComparisonsCompleted']==0
    assert fourier['fourier']['cartesianVelocitySupport']==[[-1,1],[-1,1],[0]]
    assert fourier['fourier']['cartesianGradientSupport'][0][0] == [-2,0,2]
    assert fourier['fourier']['cartesianFourNodeAlias']['fullFrobenius']=='the four componentwise biases sum exactly to zero'

    run = source(CI+'github-run.json')
    assert (run['databaseId'],run['headSha'],run['status'],run['conclusion']) == (
        44604053598,'04b9b7b11b733a40d08ad73c394744001472105f','completed','success')
    assert (EXTRA[LEAN]+'  MathScope/M3/CD/WaveReferenceCurl.lean').encode() in raw(CI+'source-sha256.txt')
    log = raw(CI+'WaveReferenceCurl.log')
    assert b'error:' not in log and b'sorryAx' not in log
    assert sum(b'depends on axioms:' in line for line in log.splitlines())==3
    return {'firstCorrectionOpenBranchGaugeComponents':3,'signedTemplates':10,'forcedModes':20,
            'originalN4FirstOrdinarySites':112,'actualN8IsolatedAngularGradientCutoff':2,
            'completedFinalN8Comparisons':0,'githubLeanRun':44604053598,'finalJets':0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation80', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
