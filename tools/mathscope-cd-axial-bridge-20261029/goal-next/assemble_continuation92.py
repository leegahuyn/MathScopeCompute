"""Assemble the C92 evidence delta directly from immutable Git blobs."""

import json
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation91 import PARENTS as EARLIER, PINS as PINS_C91, PRIMARY as PRIMARY_C91, Y as Y_C91
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = 'c41c04788d57405559e21d45d6b894feccf793ba'
PARENTS = {
    **EARLIER,
    'MathScope_Goal_Continuation91_Delta_20261120.zip':
        '4bfc869ed2ba98b79b43ad60c3eedbb89f598b1e01a0eae15b90c0c101dd457c',
}
LABEL = 'MathScope_Goal_Continuation92'
DATE = '20261120'
REPORT = 'REPORT_CONTINUATION92_KO.md'
STATUS = 'STATUS_CONTINUATION92.json'
ROOT = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget/'
GEOMETRY = ROOT + 'geometry/'
LEAN = ROOT + 'lean-github/'
Y = 'y-higher-flow/picard-core-components/'
LEAN_HEAD = '849b817c87d7764338c0cffcacaa996215970042'
LEAN_RUN = 44636633007
LEAN_FILE = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/FirstForcedLogBudget.lean'
WORKFLOW = '.github/workflows/mathscope-cd-axial-bridge-20261029.yml'
THEOREMS = ['first_forced_propagator_charge', 'first_forced_combined_log_charge']
AXIOMS = ['propext', 'Classical.choice', 'Quot.sound']
ADDITIONAL_PINS = {
    LEAN_FILE: 'fd4524d198e37efe21f13a6ad148cf4fcf4ada7b8662ec41706c963864d57526',
    WORKFLOW: 'b970e995c4d9cfb442d7123bb6be06246fa3c20d0406c91723ea16803a7677fc',
}
PINS = {
    ROOT + 'first-forced-log-budget.json': '904f3f665055f46ba49e96617e832216c39c9fe80a018382d29c38f6aec19d1c',
    ROOT + 'verify_first_forced_log_budget.py': '6e31e50922d6ad0cfae876a3d740fe748f4227779db9fdae310c833250fd77ba',
    ROOT + 'README.md': '952f3d4e4fd6b1509ec62c805f836cdb18b3e282a8c071f179b31b289096c85a',
    ROOT + 'replay.log': '0b443ff6b09da1fb7e0ad6f3f516e10835a9a2b0120f51f31ecd4cd7b518f9ad',
    GEOMETRY + 'MANIFEST.json': '258690dd6eccf25fad2c2b0ff4ed4f6ad050922c4c8731a740a66ee3ecee88ce',
    GEOMETRY + 'outer-forced-geometry.json': 'e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291',
    GEOMETRY + 'epsilon-grade.json': 'ced340026d5fb40921b9a326133404c9148241fba904ea353b29d331b70ea036',
    Y + 'angular-average-intervals.json': '1f99d9b02939b1659028b24cee5c71a0fde1f5ebf357a70f151e3e2ba65171fc',
    Y + 'angular-average-operands.json': 'ff210cc2c4c3c5ed8f66104d7eeedc9acabf4641a7f98ddcf33609e3532d4fd8',
    Y + 'manifest.json': '5fc4724960e1a791622d6e0d7639846394af3c663517064c20983af6c6ee3195',
    'preservation-continuation92.json': 'adb4bf229058737d2b362017c19a1a12d86527817a422b73de2c5cb064ac1b30',
}


def verify_native(raw, source):
    manifest = source(Y + 'manifest.json')
    assert manifest['schema'] == 'MathScope.C92.OriginalN1AngularAverageEvidence/1'
    files = manifest['filesSHA256']
    assert set(files) == {'README.md', 'angular-average-intervals.json', 'angular-average-operands.json',
                          'replay_n1_angular_average.mjs', 'replay.log', 'source-replay.log',
                          'verify_n1_angular_average.py'}
    for path, expected in files.items():
        assert entry(raw(Y + path))['sha256'] == expected, path

    receipt = source(Y + 'angular-average-intervals.json')
    operands = source(Y + 'angular-average-operands.json')
    assert receipt['schema'] == 'MathScope.C92.OriginalN1AngularAverageIntervals/1'
    assert operands['schema'] == 'MathScope.C92.OriginalN1AngularAverageOperands/1'
    assert receipt['sourceOperandStatus'] == 'VERIFIED'
    assert receipt['ordinaryIntervalStatus'] == 'CONDITIONAL_ORIGINAL_C47_COEFFICIENT_DOMAIN_AND_C54_CORE_REALIZATION'
    assert receipt['sourceOperandsSHA256'] == PINS[Y + 'angular-average-operands.json']
    assert receipt['priorC91IntervalsSHA256'] == PINS_C91[Y_C91 + 'derivative-intervals.json']
    assert receipt['originalRegistrySHA256'] == operands['registrySHA256']
    assert receipt['profileSHA256'] == operands['profileSHA256']
    assert (receipt['actualSystem'],receipt['auxiliarySystem']) == (0,1)
    assert (receipt['originalAngularEvenProfile'],receipt['originalAverageMinusUEvenProfile']) == (28834,117642)
    assert receipt['actualCalls'] == operands['rows'][0]['calls'] == {'F':117731, 'dXF':117737, 'K':117743}
    assert receipt['angularScale'] == operands['ids']['M']
    assert receipt['angularDomain']['XF'] == operands['ids']['XF']
    assert receipt['angularDomain']['condition'] == '0<X<=XF, eta=0'
    assert receipt['normalizedAngularValue']['interval'] == ['-32775/131072','-32761/131072']
    assert receipt['normalizedAngularXDerivative']['interval'] == ['-131181/524288','-130963/524288']
    average = receipt['averageMinusU']
    assert (average['X_star'],average['eta_width']) == (operands['ids']['X'],operands['ids']['e'])
    assert average['domain'] == '0<X<=X_star, abs(eta)<=eta_width'
    assert average['interval'] == ['-262253/1048576','-524071/2097152']
    assert receipt['angularPicardTermsUsed'] == 2 and not receipt['largeSourceIndexKEnumerated']
    assert receipt['additionalFinalJets'] == 0 and receipt['release'] == 'HOLD'
    return {'nativeN1AngularAverageComponents':2, 'nativeN1AngularAverageCalls':3,
            'nativeN1AngularAverageConditionalIntervals':3}


def verify_lean(raw, source):
    lean = source(LEAN + 'receipt.json')
    assert lean['schema'] == 'MathScope.C92.HostedLeanReceipt/1'
    assert lean['run'] == LEAN_RUN and lean['head'] == LEAN_HEAD and lean['conclusion'] == 'success'
    assert lean['file'] == LEAN_FILE and lean['fileSHA256'] == ADDITIONAL_PINS[LEAN_FILE]
    assert lean['theorems'] == THEOREMS and lean['axioms'] == AXIOMS
    log = raw(LEAN + 'FirstForcedLogBudget.log').decode()
    for theorem in THEOREMS:
        assert f"'MathScope.M3.CD.{theorem}' depends on axioms: [{', '.join(AXIOMS)}]" in log
    assert 'sorryAx' not in log and 'error:' not in log
    shas = raw(LEAN + 'source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256'] + '  MathScope/M3/CD/FirstForcedLogBudget.lean' in shas
    return {'hostedLeanRun':lean['run'], 'hostedLeanTheorems':len(lean['theorems'])}


def verify_forced(raw, source):
    budget = source(ROOT + 'first-forced-log-budget.json')
    assert budget['status'] == 'CONDITIONAL'
    assert budget['variationRows'] == 23 and budget['normalizedFrameDerivativeOrder'] == 8
    assert budget['primarySlowAndTransverseOrders'] == [7,8]
    charges = budget['leanCharges']
    assert len(charges) == 5 and all(0 <= n <= 2**16 for n in charges)
    assert charges == [65536,3570,10145,437,1594]
    assert [sum(charges[:2]), *charges[2:]] == budget['maximumFieldProductLogDegrees']
    assert budget['logBudget'] == 'H/2^109 for the field product and variation coefficient under the original source hypotheses'
    assert budget['excludedFromThisBudget'] == [
        'raw forcing multipliers','epsilon and k','radial weights','explicit bandwidth powers',
    ]
    assert budget['release'] == 'HOLD' and budget['finalJets'] == '0/67'

    manifest = source(GEOMETRY + 'MANIFEST.json')
    assert manifest['schema'] == 'MathScope.OuterForcedGeometryC92Replay/1'
    assert (manifest['sourceNodes'],manifest['geometryNodes'],manifest['nativeSystems']) == (22155584,121,20)
    assert manifest['rawModeOneCarrierComparisons'] == 60
    assert manifest['finalJets'] == 0 and manifest['release'] == 'HOLD'
    assert set(manifest['producedFiles']) == {'README.md','outer-forced-geometry.json','verify_geometry.py',
                                            'epsilon-grade.json','verify_epsilon_grades.py','replay.log'}
    for path, expected in manifest['producedFiles'].items():
        assert entry(raw(GEOMETRY + path))['sha256'] == expected, path
    geometry = source(GEOMETRY + 'outer-forced-geometry.json')
    assert geometry['status'] == 'VERIFIED_ACTUAL_FORCED_COEFFICIENT_GEOMETRY'
    assert geometry['sourceStream']['nodes'] == 22155584
    assert geometry['sourceStream']['originalPrefixRecords'] == 22153782
    assert len(geometry['chartRows']) == 20 and geometry['distinctGeometryNodes'] == 121
    eikonal = geometry['eikonalAndMeanTransport']['exactSourceChecks']
    assert len(eikonal) == 10 and all(row['carrierMixedSourceComponents'] == 6 for row in eikonal)
    slab = geometry['conditionalCoefficientCaps']['originalSlabLogBudget']
    assert slab['rawGeometryProductsWithLeibniz']['logBound'] == 'H/2^124'
    assert not slab['strictSlabBudgetExtendsToEntireN3Window']
    assert geometry['release'] == 'HOLD' and geometry['finalJets'] == 0
    grades = source(GEOMETRY + 'epsilon-grade.json')
    assert grades['status'] == 'VERIFIED_POSITIVE_EPSILON_GRADES_FOR_CONDITIONAL_SOURCE_ENVELOPES'
    assert grades['inputPins']['geometry'] == PINS[GEOMETRY + 'outer-forced-geometry.json']
    assert grades['inputPins']['primary'] == PINS_C91[PRIMARY_C91 + 'primary-quotient-ledger.json']
    assert grades['inputPins']['factor'] == geometry['inputPins']['factor']
    assert grades['uniformFormalLowerGradeBothModes'] == '49999/100000'
    assert grades['modeOneGaussianRateTermsAfterC90'] == {'scalars':60,'minimumEpsilon':'1/2'}
    assert grades['regroupedMinimumEpsilons'] == {
        'canceledEikonalRemainder':'99999/100000','independentConservativeRemainder':'49999/100000',
    }
    categorized = sum(row['monomials'] for row in grades['unregroupedMonomials'])
    assert categorized == 3990 and grades['reassociatedModeOneMonomials'] == 360
    assert grades['release'] == 'HOLD' and grades['finalJets'] == 0
    return {'forcedVariationDirections':budget['variationRows'],'firstForcedLogCharges':charges,
            'forcedGeometryRows':len(geometry['chartRows']), 'forcedGeometryNodes':geometry['distinctGeometryNodes'],
            'forcedConditionalEpsilonMonomials': categorized+grades['reassociatedModeOneMonomials'],
            'forcedConditionalEpsilonLowerGrade':grades['uniformFormalLowerGradeBothModes']}


def verify_status(source):
    status = source(STATUS)
    assert status['schema'] == 'MathScope.C92.VerificationStatus/1' and status['branch'] == BRANCH
    assert status['release'] == 'HOLD' and status['operatingR108'] == 'OPEN'
    assert status['M3'] == '62/64' and status['finalJets'] == '0/67'
    gates = status['verification']
    assert gates['M3'] == {'accepted':62,'total':64,'open':['N7-06','N8-05']}
    assert gates['M4']['operatingR108'] == 'OPEN' and gates['Y']['generalNative'] == 'OPEN'
    assert gates['finalN8Refinements'] == '0/4' and gates['jets'] == '0/67' and gates['release'] == 'HOLD'
    local = status['continuation92']
    assert (local['normalizedForcedSystems'],local['geometryRoots'],local['verifiedEikonalScalars']) == (20,121,60)
    assert (local['coefficientVariationRows'],local['nativeYIntervals']) == (23,3)
    assert local['coefficientLogBound'] == 'CONDITIONAL'
    assert local['minimumFormalRawEpsilonExponent'] == '49999/100000'
    assert (local['leanRun'],local['leanCompiled']) == (LEAN_RUN,len(THEOREMS))
    baseline = source('STATUS.json')
    assert (baseline['M3']['accepted'],baseline['M3']['total']) == (62,64)
    assert (baseline['jets']['accepted'],baseline['jets']['total']) == (0,67)
    assert baseline['M4']['publicReadback']['currentR108'] == 'OPEN'
    assert baseline['release'] == 'HOLD' and not baseline['goal_complete']


def verify_evidence(raw, source):
    for path, expected in PINS.items():
        assert entry(raw(path))['sha256'] == expected, path
    public = source('preservation-continuation92.json')
    assert public['schema'] == 'MathScope.C92.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'], public['bytes']) == (200,30707818)
    assert public['sha256'] == PUBLIC_SHA and public['samePublicBodyAsC91']
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'
    verify_status(source)
    return {
        **verify_forced(raw, source),
        **verify_native(raw, source),
        **verify_lean(raw, source),
        'operatingByteReadback':public['bytes'],
        'finalN8Comparisons':0,
        'finalJets':0,
    }


def assemble(args):
    outputs = args.workspace / 'outputs'

    def git(*params):
        return subprocess.check_output(['git','-c','core.longpaths=true',*params], cwd=args.repo)

    head = git('rev-parse','HEAD').decode().strip()
    assert git('branch','--show-current').decode().strip() == BRANCH
    git('merge-base','--is-ancestor',PARENT,head)
    git('merge-base','--is-ancestor',LEAN_HEAD,head)

    def raw(path):
        return git('show',f'{head}:{CURRENT}/{path}')

    def source(path):
        return json.loads(raw(path))

    preservation = source('preservation-continuation31.json')
    refs = {f'refs/heads/{name}':sha for name,sha in preservation['remoteBaselineRefs'].items()}
    refs[preservation['onlyPushRef']] = head
    observed = {ref:sha for sha,ref in
                (line.split() for line in git('ls-remote','origin',*refs).decode().splitlines())}
    assert observed == refs and file_sha(args.public_copy) == PUBLIC_SHA
    for path, expected in ADDITIONAL_PINS.items():
        assert entry(git('show', f'{LEAN_HEAD}:{path}'))['sha256'] == expected, path
        assert entry(git('show', f'{head}:{path}'))['sha256'] == expected, path

    previous = {}
    for name, pin in PARENTS.items():
        package = outputs / name
        assert file_sha(package) == pin, name
        with ZipFile(package) as bundle:
            previous.update(json.loads(bundle.read('SHA256.json')))
    evidence = verify_evidence(raw, source)

    delta = outputs / f'{LABEL}_Delta_{DATE}.zip'
    pending = delta.with_suffix('.zip.tmp')
    files = {}
    with ZipFile(pending,'w',compression=ZIP_DEFLATED,compresslevel=5) as bundle:
        def add(path, data):
            assert path not in files, path
            bundle.writestr(path,data)
            files[path] = entry(data)

        changes = git('diff','--name-status','--no-renames',PARENT,head).decode().splitlines()
        for line in changes:
            change,path = line.split('\t')
            assert change in {'A','M'} and (path.startswith(CURRENT+'/') or path in ADDITIONAL_PINS), path
            if change == 'M' and path in previous:
                assert entry(git('show',f'{PARENT}:{path}')) == previous[path], path
            add(path,git('show',f'{head}:{path}'))
        for required in (REPORT,STATUS,*PINS):
            assert CURRENT+'/'+required in files, required
        for folder, manifest, listing in (
            (GEOMETRY,'MANIFEST.json','producedFiles'), (Y,'manifest.json','filesSHA256')
        ):
            prefix = CURRENT+'/'+folder
            packaged = {path.removeprefix(prefix) for path in files if path.startswith(prefix)}
            assert packaged == {manifest,*source(folder+manifest)[listing]}, folder
        add('REPORT_KO.md', raw(REPORT))
        add('STATUS.json', raw(STATUS))
        add('CHECKPOINT.json', encode({
            'schema':'MathScope.GoalEvidenceDelta/1', 'parentsInOrder':PARENTS,
            'parentCommit':PARENT, 'deltaCommit':head, 'verifiedRemoteRefs':refs,
            'priorReadOnlyPublicSnapshotSHA256':PUBLIC_SHA,
            'filesThatSupersedeParents':sorted(set(files)&set(previous)), 'release':'HOLD',
        }))
        bundle.writestr('SHA256.json',encode(files))
    with ZipFile(pending) as bundle:
        assert bundle.testzip() is None and len(bundle.namelist()) == len(files)+1
        assert json.loads(bundle.read('SHA256.json')) == files
        for path,expected in files.items():
            with bundle.open(path) as stream:
                assert sha256_stream(stream) == expected['sha256'], path
            assert bundle.getinfo(path).file_size == expected['bytes'], path
    pending.replace(delta)
    receipt = {
        'file':delta.name, 'bytes':delta.stat().st_size, 'files':len(files)+1,
        'sha256':file_sha(delta), 'branchHead':head, **evidence, 'verifiedDeltaManifest':True,
    }
    (outputs/f'{LABEL}_Report_{DATE}_KO.md').write_bytes(raw(REPORT))
    (outputs/f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == '__main__':
    assemble(read_arguments(__doc__))
