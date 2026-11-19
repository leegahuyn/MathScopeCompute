"""Join independently replayed original N3 pieces on the admitted open branches."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    'wave-join-verified.json':'56aa2e6f1092435b63712fdf64ca2070e6bc4515f57e899dae9405424dfd3b4b',
    'forced/forced-wave.json':'40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b',
    'signed/signed-wave-reduction.json':'429918bd2cd4a167bcbc8e76e7d04b42b6ac11e4a2dbaa7ec06e14caffcd19ef',
    'mean':'23ef852f8a0b0138342190113fab7ce692fa79cc517c4743e64c82f8cb6ed6a5',
    'whole':'3e7be0b196440736e725849634700bbaf11620f1b6177fd3566c911cd493393c',
    'lean-source':'4138cf7c7b259547c3c1b25b08b63a27a222681d6857e1a7ebd732faf2783938',
}
STREAM = 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
CURL_ROOTS = [22154926,22154928,22154930]


def load(path,pin=None):
    data = path.read_bytes()
    assert pin is None or sha256(data).hexdigest()==pin, path
    return json.loads(data)


def verify(home,mean_path,whole_path,lean_log):
    wave,forced,signed = [load(home/path,PINS[path]) for path in (
        'wave-join-verified.json','forced/forced-wave.json','signed/signed-wave-reduction.json')]
    mean = load(mean_path,PINS['mean'])
    whole = load(whole_path,PINS['whole'])
    assert wave['run'] == signed['hostedRun'] == mean['hostedRun'] == whole['githubRun'] == 44582875351
    assert wave['stream']['sha256'] == forced['inputSHA256']['stream'] == signed['sourceStreamSHA256'] == STREAM
    assert wave['ingressSHA256'] == forced['inputSHA256']['ingress'] == signed['ingressSHA256']
    assert [row['gaugeDifference'] for row in wave['originalVelocityAssembly']] == CURL_ROOTS
    assert wave['sameGuardedCoverRows'] == forced['checkedIndexedRowsPerComponent'] == 162
    initial = wave['initialSubtraction']
    assert initial['initialCarrierCoefficientsProvedIdentical'] == 60
    assert initial['sameLocalGuardPredicates'] == 210
    assert wave['initialLiftPullback']['exactFormalActualLiftCoordinates'] == 1620
    assert wave['waveGradientBindings']['matchedAllWaveGradientComponents'] == 9
    lift = wave['fastLiftChain']
    assert lift['exactYDerivativeIdentities'] == 20 and lift['zeroOrdinarySlowAndAngularLiftPartials'] == 80
    assert len(wave['paletteRadialScale']['threeExactRowPaletteDifferences']) == 3
    assert signed['scope']['actualSignedLocalCurlReduced']
    assert signed['scope']['actualAppendedSignedSubseriesBound']
    assert signed['scope']['literalActualPhaseGradientVerified']
    assert signed['actualOperands']['commonReferenceRadialFast'] == wave['referenceRadial']['aReference']
    assert wave['referenceRadial']['aReference'] == 17745446
    own = signed['actualOperands']['localRadialFast']
    assert own == wave['paletteRadialScale']['aOwn'] == 17735155
    assert signed['actualOperands']['epsilon'] == 17732744
    cases = {c['key']:c for c in signed['cases']}
    assert len(cases) == len(lift['cases']) == 10
    lift_cases = {c['key']:c for c in lift['cases']}
    assert lift_cases.keys() == cases.keys()
    by_mode = {(c['key'],c['mode']):c for c in forced['cases']}
    assert by_mode.keys() == {(key,m) for key in cases for m in (1,2)}
    for (key,mode),record in by_mode.items():
        linked = record['curlDifferentialFactors']
        assert linked['aOwn'] == own and linked['epsilon'] == 17732744
        assert linked['levelDifference'] == lift_cases[key]['delta']
        assert cases[key]['phase'] == record['phase'] and record['pulse'] == lift_cases[key]['v']
        assert len(record['guards']) == 7 and record['verifiedFirstForcedCurlParts'] == 6
        assert record['nativeInitializedCarrierTermsSubtracted'] == (6 if mode==1 else 0)
    assert all(len(row['components'])==3 and all(c['sameSevenGuards'] for c in row['components'])
               for row in cases.values())
    assert mean['ordinaryMeanResidual']['components']==['0']*3
    assert whole['wholeIntegralOnAdmittedSupports']=='c0*M0 + c1*M1 = 0'

    run = load(lean_log/'github-run.json')
    assert (run['databaseId'],run['headSha'],run['status'],run['conclusion'])==(
        44604053598,'04b9b7b11b733a40d08ad73c394744001472105f','completed','success')
    log = (lean_log/'WaveReferenceCurl.log').read_bytes()
    assert b'error:' not in log and b'sorryAx' not in log
    assert (PINS['lean-source']+'  MathScope/M3/CD/WaveReferenceCurl.lean').encode() in (
        lean_log/'source-sha256.txt').read_bytes()
    assert all(f"'MathScope.M3.CD.wave_reference_{theorem}' depends on axioms:".encode() in log
               for theorem in ('axial_scale','potential_scale','cylindrical_curl'))

    return {
        'schema':'MathScope.N7.ActiveN3CompleteUncutGaugeOnOpenBranches/1',
        'status':'CONDITIONAL_COMPLETE_FIRST_CORRECTION_CURL_ON_ADMITTED_OPEN_BRANCHES',
        'run':44582875351,'sourceStreamSHA256':STREAM,'sourceReceipts':PINS,
        'leanRun':44604053598,'nativeGaugeDifferenceRoots':CURL_ROOTS,
        'uncutDifferencesOnOpenBranches':[0,0,0],'forcedModes':20,'signedTemplates':10,
        'originalGuardedRows':162,'initialCoefficientsCancelled':60,'liftCoordinates':1620,
        'matchedWaveGradientSlots':9,
        'proof':[
            'Subtract the exact initialized wave from full Forced using the same coefficients, arguments and guards.',
            'On each admitted fixed chart the Forced remainder and Signed increment are the curls of their exact appended Fourier subseries.',
            'For the Signed lift, L(xi)=Lambda^delta and L(v)=0 with fixed copy and label; shift and chart variables use the same actual arguments.',
            'Reference radial, axial and angular derivatives each transport an extra sqrt(rho). Multiplying the potential scale rho^h gives the velocity scale rho^(1/2+h).',
            'The finite original 162 guarded rows use matching actual point arguments. On an open stratum with fixed guards, sum their curls by linearity.',
            'Add the two actual mean potential curls and the actual direct azimuthal increments using the pinned fixed radial and torus calculus.'
        ],
        'premises':[
            'Positive radius and original admissible native chart image.',
            'Frozen labels, nearest copies, and palette differences at the derivative point.',
            'The admitted ordinary differentiable branches and fixed radial FTC and integration under the derivative of C78.',
            'Strict interior or strict inactive branch for each actual guard, with the original native lazy branch semantics.'
        ],
        'classicalDerivativesAcrossSeams':'OPEN',
        'globalStage1WeightedCaps':'OPEN','outerCutoffCommutatorsRetained':True,
        'remainingCorrections':'OPEN','release':'HOLD','N706':'OPEN','N805':'OPEN','finalJets':0,
    }


def main():
    p = ArgumentParser(description=__doc__)
    for file in ('mean','whole','lean-log','out'):
        p.add_argument('--'+file,type=Path,required=True)
    args = p.parse_args()
    proof = verify(Path(__file__).resolve().parent,args.mean,args.whole,args.lean_log)
    with args.out.open('x',encoding='utf-8',newline='\n') as handle:
        json.dump(proof,handle,indent=2)
        handle.write('\n')
    print(proof['status'],proof['uncutDifferencesOnOpenBranches'])


if __name__=='__main__':
    assert __debug__
    main()
