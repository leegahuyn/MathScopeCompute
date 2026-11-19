"""Package the actual localized angular pairing and Signed radial reduction."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation82 import PARENTS as EARLIER

PARENT = '74a1075d8e5b8002845c381ad5289e64f79b2b3f'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation82_Delta_20261120.zip':
           '9d5e54dba3215443e35e0df176ccf28fcc6cc2496a9cd4934025768fa7826cf2'}
LOC = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/active-n3-localized-gram/'
SHELL = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/signed-shell/'
ADDITIONAL = {
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/CutoffFourierGram.lean':'e71653f84ce4102a0877f58c9d4d53d492c74afc32e846c261d3afd668ed0b1c',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':'bde15b7d3c9304842599214c8ba8c4771a4ebd432c7d9fe4e09e62cd3f742e05',
}
PINS = {
    LOC+'actual/actual-mode-operands-final.json':'dfc5401fc6561138e3a17fc05d2e38626b2694d96a1848e0008c9e821b958b40',
    LOC+'localized-gram-final.json':'c3f9015b0950e4097974a78b9c47abfaa5c17d124e1c6203cfaa24870794785f',
    LOC+'modal-residual.json':'7dd70f9982255e60700b2e2fa7ae04b672537b010d214560a6469ef44f1aa47a',
    LOC+'lean/CutoffFourierGram.log':'bc8c07f4c02b380903026729d953f5def120481ff06d2f20940b764f8824d929',
    SHELL+'signed-shell.json':'5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308',
}


def verify_evidence(raw, source):
    for path,pin in PINS.items():
        assert entry(raw(path))['sha256']==pin, path
    actual = source(LOC+'actual/actual-mode-operands-final.json')
    localized = source(LOC+'localized-gram-final.json')
    residual = source(LOC+'modal-residual.json')
    shell = source(SHELL+'signed-shell.json')
    lean = source(LOC+'lean/receipt.json')
    assert localized['original']['slotCount']==24
    assert localized['original']['actualModeReceiptSHA256']==PINS[LOC+'actual/actual-mode-operands-final.json']
    assert localized['original']['actualOuterCutoff']=={'compactId':29023,'originalArchivedId':622958}
    assert localized['original']['actualWavePotentialCases']==30 and localized['original']['actualWavePotentialTerms']==150
    assert localized['exactPolynomialChecks']['verifiedCovariantGradientEntries']==9
    assert localized['exactPolynomialChecks']['verifiedSecondSpatialAndTimeComponentsForForce']==9
    assert actual['liveOperands']['sameOuterRowsPerComponent']==162
    assert residual['cutoffRootOriginalPacking']==622958
    assert residual['controls']['axisymmetricConnectionTestForce']==['1/2','3/4','0']
    assert [row['body'] for row in shell['actualSigmaRows']]==[21999641,22000464]
    assert shell['smallestOpenPureNormalInput']['normalizedHaarRoots']==[21999624,22000447]
    assert shell['smallestOpenPureNormalInput']['actualHaarERadialOrders']==[0,1,2]
    assert shell['wholeMomentDistinction']['outerTailIdentityUsesWholeMomentZero'] is False
    assert shell['scope']['actualWeightedPostForcedEBound']=='OPEN'
    for item in source(SHELL+'MANIFEST.json')['files']:
        assert entry(raw(SHELL+item['path']))=={'sha256':item['sha256'],'bytes':item['bytes']}
    assert lean['run']==44611824132 and lean['conclusion']=='success' and len(lean['theorems'])==3
    assert lean['fileSHA256']==ADDITIONAL[lean['file']]
    log = raw(LOC+'lean/CutoffFourierGram.log').decode()
    assert all('MathScope.M3.CD.'+name in log for name in lean['theorems'])
    assert 'sorryAx' not in log and 'error:' not in log
    sha_lines = raw(LOC+'lean/source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256']+'  MathScope/M3/CD/CutoffFourierGram.lean' in sha_lines
    assert all(row['finalN8Comparisons']==row['finalJets']==0 and row['release']=='HOLD'
               for row in (localized,residual))
    return {'actualPotentialCases':30,'actualPotentialTerms':150,'localizedSpatialSourceSlots':24,
            'signedSigmaRadialPrimitives':2,'hostedLeanRun':lean['run'],'hostedLeanTheorems':3,
            'finalN8Comparisons':0,'finalJets':0}


if __name__=='__main__':
    assemble_delta(read_arguments(__doc__),parent=PARENT,parents=PARENTS,
                   label='MathScope_Goal_Continuation83',date='20261120',verify=verify_evidence,
                   additional_pins=ADDITIONAL)
