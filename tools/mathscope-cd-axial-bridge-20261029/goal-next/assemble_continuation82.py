"""Package first-correction guard traces, hosted Lean logs and the exact angular Gram."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation81 import PARENTS as EARLIER

PARENT = '4e3167a866c44144e0b9954404cebfb2e4bd4cf5'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation81_Delta_20261120.zip':
           'e0fd0b6ff5e2810a693caa4a3cbdf600ec4320e039b243d9ca4880b1fd441d92'}
GUARDS = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/'
GRAM = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/active-n3-angular-gram/'
ADDITIONAL = {
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/GuardSeamPulse.lean':'a39997138aa0a148285cb1615dfac1e31117d238938b15aaf79388c739b1e68c',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':'4a7e2f246762df475b286c2cf5d1e35329f2d4d9abd414e121f4c3da72dca8df',
}
PINS = {
    GUARDS+'forced-fast/forced-seams-final.json':'888b8575fb5f02c9fac90e37cc757261b2bb7eaf8fea62d1a6ca6b4c544532b1',
    GUARDS+'forced-slow/forced-slow.json':'32760448f9d6ed97715421eb2899133aa45b7b19bee6eaba0a8b45bd43e72f24',
    GUARDS+'signed/signed-seams.json':'65c08c86d7682f989e9bf6c98f7ae04a42d2f1594488287da2548e85ca0a2815',
    GUARDS+'lean/GuardSeamPulse.log':'cd7c910c127e0cc67aaa3e020c3a31543c5f7620eca4f88d6f3e5cbe41e2313a',
    GRAM+'first-correction-gram.json':'9dd999693a6d3f142c0709f67412ab3bbd716eebee69f3642bd680bb12f5f448',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256']==pin, path
    fast = source(GUARDS+'forced-fast/forced-seams-final.json')
    slow = source(GUARDS+'forced-slow/forced-slow.json')
    signed = source(GUARDS+'signed/signed-seams.json')
    gram = source(GRAM+'first-correction-gram.json')
    lean = source(GUARDS+'lean/receipt.json')
    assert len(fast['cases'])==len(slow['cases'])==20
    assert fast['nodeCount']==slow['nodeCount']==22155584
    assert fast['counts']['nativeProjectedComponentsInExactWholePullbackIdeal']==120
    assert len(slow['axisFactors'])==4 and slow['seedsAcrossFourAxes']==400
    assert all(x['denominatorAtBothFaces']==1 for x in slow['axisFactors'].values())
    assert slow['literalZeroInitialOrderedPulseRecurrences']==20
    assert slow['scalarChecks']==dict(raw=120,supported=120,principal=60,pulledBack=120,projected=120)
    assert signed['verifiedCounts']==dict(fixedCases=10,nativeBodies=6,guardFaces=40,
        pureNormalComponentOrderFaceTraceClaims=480,potentialNormalOrder=3,velocityNormalOrder=2)
    assert len(signed['definitions'])==6 and len(signed['cases'])==10
    assert signed['radialFaces']['status']=='OPEN_WEIGHTED_SQRT_TARGET_TRANSFER'
    for row in source(GUARDS+'signed/MANIFEST.json')['files']:
        assert entry(raw(GUARDS+'signed/'+row['path']))=={'sha256':row['sha256'],'bytes':row['bytes']}
    assert 'collision' in gram['harmonicGram']['grouping'] or 'signed integer' in gram['harmonicGram']['grouping']
    assert gram['finalJets']==gram['n8ComparisonsCompleted']==slow['finalJets']==0 and gram['release']=='HOLD'
    assert lean['run']==44609380607 and lean['conclusion']=='success' and len(lean['theorems'])==3
    assert lean['fileSHA256']==ADDITIONAL[lean['file']]
    log = raw(GUARDS+'lean/GuardSeamPulse.log').decode()
    assert all('MathScope.M3.CD.'+name in log for name in lean['theorems'])
    assert 'sorryAx' not in log and 'error:' not in log
    sha_lines = raw(GUARDS+'lean/source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256']+'  MathScope/M3/CD/GuardSeamPulse.lean' in sha_lines
    return {'actualFirstForcedModes':20,'verifiedSlowFactors':4,'actualProjectedScalars':120,
            'actualSignedTemplates':10,'signedFastGuardFaces':40,
            'hostedLeanRun':lean['run'],'hostedLeanTheorems':3,'finalN8Comparisons':0,'finalJets':0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__),parent=PARENT,parents=PARENTS,
                   label='MathScope_Goal_Continuation82',date='20261120',verify=verify_evidence,
                   additional_pins=ADDITIONAL)
