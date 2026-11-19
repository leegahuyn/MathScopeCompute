"""Assemble the immutable C94 principal-mode and native-pressure evidence delta."""

import json
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation93 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '8e3db668299061976e6568dacdbacce94cc8a1c9'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation93_Delta_20261120.zip':
           'fe327011b936d45b3c8a53af21642f00c9b6bc41613d073d8b8994ecd4f19ba0'}
REPORT = 'REPORT_CONTINUATION94_KO.md'
STATUS = 'STATUS_CONTINUATION94.json'
PUBLIC = 'preservation-continuation94.json'
LABEL, DATE = 'MathScope_Goal_Continuation94','20261120'
ROOT = ('primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/'
        'first-forced-budget/principal-mode-cancellation/')
MODE_ONE, MODE_TWO, LEAN = (ROOT+name+'/' for name in ('mode-one','mode-two','lean-github'))
Y = 'y-higher-flow/picard-pressure-average/'
LEAN_HEAD = '63a4ae79dde636f1f619cabef8300e1f691d954c'
LEAN_RUN = 44639948538
LEAN_PREFIX = 'research-ide/mathscope-m3/p8/lean/'
WAVE = 'MathScope/M3/CD/WaveReferenceCurl.lean'
HARMONIC = 'MathScope/M3/CD/HarmonicModeTwo.lean'
LEAN_PINS = {
    LEAN_PREFIX+WAVE:'8a4317a21deef726b47fb0f9d186186e7709ff4843ff687fbefef3f4acb1ed7e',
    LEAN_PREFIX+HARMONIC:'d821645d53e6f22048fd4857f0087ad77100749fc0079d55ed597bed75fa4d06',
}
THEOREMS = {
    WAVE:('phase_curl_real_divergence_defect','phase_curl_imaginary_divergence_zero'),
    HARMONIC:('mode_two_tangent_carrier_real','mode_two_tangent_carrier_imaginary'),
}
AXIOMS = ['propext','Quot.sound']
LEAN_FILES = {'receipt.json','WaveReferenceCurl.log','HarmonicModeTwo.log','source-sha256.txt','version.txt'}
MODE_ONE_MANIFEST_SHA = '73852de7d9ab1f0c57da1f0539c5ad498948690e98c94060c8ac16bdb709a86c'
MODE_ONE_RECEIPT_SHA = '02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364'
MODE_TWO_MANIFEST_SHA = 'd1c7c07afade5f70274b4efb06e6fef2ead7966fd37f290dab44cb8e3e26608a'
MODE_TWO_RECEIPT_SHA = 'f1ee11b6299572df500077ab3e565f112a210c008f0092d63950ac1bcc9d1f8a'
Y_MANIFEST_SHA = '4698cfcb072b74b88d29cae19bff968895d0c630480a8da97bc83a5941c821f3'
Y_RECEIPT_SHA = '18f245b4b9b463052aab21ebebf7583c66f60f46b02a668a80a86560fedc5c9c'
Y_OPERANDS_SHA = 'dfde1708b9c1323b85f7867228f319f3c64f80ab62d269a880bb19601d983e43'
C93_SCALAR_SHA = '0d1e6635208ef369741a7073067b69e467608114495c03bb22c3575715d01873'
C93_WEIGHTS_SHA = '836e8ed0b22ee3451f9ed3f09f176bf439fc05b5f9380fa58b08a3ba841efcc0'


def manifest_files(raw, manifest, folder, field):
    files = manifest[field]
    assert files
    for name,digest in files.items():
        assert name and name not in {'.','..'} and '/' not in name and '\\' not in name, name
        assert entry(raw(folder+name))['sha256'] == digest, name
    return set(files)


def verify_modes(raw, source):
    assert entry(raw(MODE_ONE+'MANIFEST.json'))['sha256'] == MODE_ONE_MANIFEST_SHA
    one_manifest = source(MODE_ONE+'MANIFEST.json')
    assert one_manifest['schema'] == 'MathScope.OriginalModeOneLinearCancellationC94Replay/1'
    assert (one_manifest['sourceNodes'],one_manifest['rawSupportedScalars']) == (22155584,60)
    assert (one_manifest['sameBodyFrames'],one_manifest['mixedDirections']) == (2,23)
    assert one_manifest['finalJets'] == 0 and one_manifest['release'] == 'HOLD'
    members_one = manifest_files(raw,one_manifest,MODE_ONE,'producedFiles')
    assert members_one == {'README.md','mode1-linear-cancellation.json','replay.log','verify_mode1_linear_cancellation.py'}
    assert one_manifest['producedFiles']['mode1-linear-cancellation.json'] == MODE_ONE_RECEIPT_SHA
    one = source(MODE_ONE+'mode1-linear-cancellation.json')
    assert one['status'] == 'VERIFIED_ORIGINAL_FULL_MODE_ONE_LINEAR_AND_CONSERVATIVE_GROUPS'
    assert one['inputPins']['rawWeights'] == C93_WEIGHTS_SHA
    assert one['sourceStream']['nodes'] == 22155584
    assert len(one['chartRows']) == 10 and one['finalJets'] == 0 and one['release'] == 'HOLD'
    assert all(len(column['rows']) == 6 for column in one['chartRows'])
    rows_one = [r for chart in one['chartRows'] for r in chart['rows']]
    assert all(r['fullConservativeAndLinearEquationExact'] for r in rows_one)
    grades_one = one['postCancellationConditionalGrades']
    assert grades_one['commonPostCancellationConditionalEpsilonDegree'] == '99999/100000'
    assert grades_one['realPartConditionalEpsilonDegree'] == '74999/50000'
    weights_one = one['postCancellationUniformWeights']
    assert weights_one['directionCount'] == len(weights_one['rows']) == 23
    assert weights_one['maxNativeVelocityOverPBandPower'] == '119/4'

    assert entry(raw(MODE_TWO+'MANIFEST.json'))['sha256'] == MODE_TWO_MANIFEST_SHA
    two_manifest = source(MODE_TWO+'MANIFEST.json')
    assert two_manifest['schema'] == 'MathScope.ModeTwoPrincipalC94Replay/1'
    assert two_manifest['finalJets'] == 0 and two_manifest['release'] == 'HOLD'
    members_two = manifest_files(raw,two_manifest,MODE_TWO,'producedFiles')
    assert members_two == {'README.md','verify_mode_two_tangency.py','mode-two-tangency.json','replay.log'}
    assert two_manifest['producedFiles']['mode-two-tangency.json'] == MODE_TWO_RECEIPT_SHA
    two = source(MODE_TWO+'mode-two-tangency.json')
    assert two['status'] == 'VERIFIED_ORIGINAL_MODE_TWO_CARRIER_AND_CONDITIONAL_WEIGHTED_GAIN'
    assert two['sourceNodes'] == one['sourceStream']['nodes']
    assert two['inputPins']['weights'] == C93_WEIGHTS_SHA and two['inputPins']['scalar'] == C93_SCALAR_SHA
    assert two['finalJets'] == 0 and two['release'] == 'HOLD'
    assert two['chartCount'] == len(two['chartRows']) == 10
    assert two['scalarCount'] == two['wrongCarrierSignRejectedScalars'] == 60
    assert two['counts'] == {'originalCarrierMonomials':330,'retainedCarrierMonomials':180,
                             'originalNoncarrierMonomials':940}
    assert two['epsilonGradeBeforeBands'] == '99999/100000'
    comparison = two['conditionalWeightedComparison']
    assert (comparison['directionCount'],comparison['mode']) == (23,2)
    assert comparison['maximumBandPower'] == '22' and comparison['maxAdditionalPoleAfterG2'] == 21
    assert comparison['explicitEpsilonAfterC93Charge'] == '49999/50000'
    return members_one|{'MANIFEST.json'},members_two|{'MANIFEST.json'},{
        'modeOneExactRawScalars':len(rows_one),'modeTwoExactCarrierScalars':two['scalarCount'],
        'modeTwoInitialCarrierMonomials':two['counts']['originalCarrierMonomials'],
        'modeTwoRetainedCarrierMonomials':two['counts']['retainedCarrierMonomials'],
        'modeTwoConditionalEpsilonGrade':comparison['explicitEpsilonAfterC93Charge'],
    }


def verify_native(raw, source):
    assert entry(raw(Y+'manifest.json'))['sha256'] == Y_MANIFEST_SHA
    manifest = source(Y+'manifest.json')
    assert manifest['schema'] == 'MathScope.C94.OriginalN1PressureAverageDerivativeEvidence/1'
    members = manifest_files(raw,manifest,Y,'filesSHA256')
    assert members == {'README.md','pressure-average-intervals.json','pressure-average-operands.json',
                       'replay_n1_pressure_average.mjs','replay.log','source-replay.log',
                       'verify_n1_pressure_average.py'}
    assert manifest['filesSHA256']['pressure-average-intervals.json'] == Y_RECEIPT_SHA
    assert manifest['filesSHA256']['pressure-average-operands.json'] == Y_OPERANDS_SHA
    receipt = source(Y+'pressure-average-intervals.json')
    operands = source(Y+'pressure-average-operands.json')
    assert receipt['sourceOperandStatus'] == 'VERIFIED'
    assert receipt['ordinaryIntervalStatus'] == 'CONDITIONAL_ORIGINAL_C47_COEFFICIENT_DOMAIN_AND_C54_CORE_REALIZATION'
    assert receipt['sourceOperandsSHA256'] == Y_OPERANDS_SHA
    assert receipt['sourceRegistrySHA256'] == operands['registrySHA256']
    assert (receipt['actualPressureProfile'],receipt['actualAverageMinusUProfile']) == (50557,117642)
    assert receipt['actualCalls'] == operands['rows'][0]['calls']
    assert receipt['actualCalls'] == {'Pi':125747,'dXPi':125753,'dXK':125760,'dEtaK':125767}
    assert receipt['pressureScale'] == operands['ids']['N']
    assert len(operands['pressure']['stages']) == 12
    assert all(row['identity']['pass'] and row['pressureTerm1']==0 for row in operands['rows'])
    assert receipt['normalizedPressureValue']['interval'] == ['-1048581/1048576','-1048571/1048576']
    assert receipt['normalizedPressureXDerivative']['interval'] == ['-1048595/1048576','-1048557/1048576']
    assert receipt['normalizedAverageMinusUXDerivative']['interval'] == ['-524941/2097152','-130909/524288']
    assert receipt['normalizedAverageMinusUEtaDerivative']['interval'] == ['-12583239/2097152','-12582585/2097152']
    assert receipt['pressureTermsUsed'] == 2 and not receipt['largeSourceIndexKEnumerated']
    assert receipt['additionalFinalJets'] == 0 and receipt['release'] == 'HOLD'
    return members|{'manifest.json'},{'nativeN1PressureAverageConditionalIntervals':4,'nativeN1PressureAverageCalls':4}


def verify_lean(raw, source):
    lean = source(LEAN+'receipt.json')
    assert lean['schema'] == 'MathScope.C94.HostedLeanReceipt/1'
    assert lean['run'] == LEAN_RUN and lean['head'] == LEAN_HEAD and lean['conclusion'] == 'success'
    assert set(lean['theorems']) == {name for names in THEOREMS.values() for name in names}
    assert lean['files'] == LEAN_PINS
    assert lean['axioms'] == AXIOMS
    shas = raw(LEAN+'source-sha256.txt').decode().splitlines()
    for file,names in THEOREMS.items():
        assert LEAN_PINS[LEAN_PREFIX+file]+'  '+file in shas
        log = raw(LEAN+file.rsplit('/',1)[-1].removesuffix('.lean')+'.log').decode()
        for name in names:
            assert f"'MathScope.M3.CD.{name}' depends on axioms: [{', '.join(AXIOMS)}]" in log
        assert 'sorryAx' not in log and 'error:' not in log
    assert 'Lean (version' in raw(LEAN+'version.txt').decode()
    return {'hostedLeanRun':LEAN_RUN,'hostedLeanTheorems':len(lean['theorems'])}


def verify_evidence(raw, source):
    public = source(PUBLIC)
    assert public['schema'] == 'MathScope.C94.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'],public['bytes']) == (200,30707818)
    assert public['sha256'] == PUBLIC_SHA and public['samePublicBodyAsC93']
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'
    status = source(STATUS)
    assert status['schema'] == 'MathScope.C94.VerificationStatus/1' and status['branch'] == BRANCH
    for item in (status,source('STATUS.json')):
        assert (item['M3']['accepted'],item['M3']['total']) == (62,64)
        assert (item['jets']['accepted'],item['jets']['total']) == (0,67)
        assert item['release'] == 'HOLD'
    assert status['operatingR108'] == 'OPEN'
    gates = status['verification']
    assert gates['M3'] == status['M3']
    assert gates['M4']['operatingR108'] == 'OPEN' and gates['Y']['generalNative'] == 'OPEN'
    assert gates['finalN8Refinements'] == '0/4' and gates['jets'] == '0/67' and gates['release'] == 'HOLD'
    details = status['continuation94']
    assert (details['modeOneRawScalars'],details['modeTwoRawScalars'],details['directions']) == (60,60,23)
    assert details['rawCommonEpsilonGrade'] == '99999/100000'
    assert details['weightedCommonEpsilonGrade'] == '49999/50000'
    assert (details['modeOneMaxBandPower'],details['modeTwoMaxBandPower'],details['maxAdditionalPole']) == ('119/4','22',21)
    assert details['shiftedPathAdmission'] == details['fullCorrectionEnergy'] == 'OPEN'
    assert (details['nativeYConditionalIntervals'],details['leanRun'],details['leanCompiled']) == (4,LEAN_RUN,4)
    members_one,members_two,mode_evidence = verify_modes(raw,source)
    y_members,y_evidence = verify_native(raw,source)
    return {MODE_ONE:members_one,MODE_TWO:members_two,Y:y_members,LEAN:LEAN_FILES},{
        **mode_evidence,**y_evidence,**verify_lean(raw,source),'operatingByteReadback':public['bytes'],
        'finalN8Comparisons':0,'finalJets':0,
    }


def assemble(args):
    outputs = args.workspace/'outputs'

    def git(*params):
        return subprocess.check_output(['git','-c','core.longpaths=true',*params],cwd=args.repo)

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
    observed = {ref:sha for sha,ref in (line.split() for line in git('ls-remote','origin',*refs).decode().splitlines())}
    assert observed == refs and file_sha(args.public_copy) == PUBLIC_SHA
    for path,pin in LEAN_PINS.items():
        assert entry(git('show',f'{LEAN_HEAD}:{path}'))['sha256'] == pin, path
        assert entry(git('show',f'{head}:{path}'))['sha256'] == pin, path

    previous = {}
    for name,pin in PARENTS.items():
        package = outputs/name
        assert file_sha(package) == pin, name
        with ZipFile(package) as bundle:
            previous.update(json.loads(bundle.read('SHA256.json')))
    groups,evidence = verify_evidence(raw,source)

    expected_rel = {REPORT,STATUS,PUBLIC,'assemble_continuation94.py',ROOT+'README.md',
                    *(folder+name for folder,paths in groups.items() for name in paths)}
    expected = {CURRENT+'/'+name:'A' for name in expected_rel}
    expected.update({file:'M' for file in LEAN_PINS})
    observed_changes = dict((path,change) for change,path in
                            (row.split('\t') for row in git('diff','--name-status','--no-renames',PARENT,head).decode().splitlines()))
    assert observed_changes == expected, (set(observed_changes)-set(expected),set(expected)-set(observed_changes))

    delta = outputs/f'{LABEL}_Delta_{DATE}.zip'
    pending = delta.with_suffix('.zip.tmp')
    files = {}
    with ZipFile(pending,'w',compression=ZIP_DEFLATED,compresslevel=5) as bundle:
        def add(path,data):
            assert path not in files, path
            bundle.writestr(path,data)
            files[path] = entry(data)

        for path,change in observed_changes.items():
            if change == 'M' and path in previous:
                assert entry(git('show',f'{PARENT}:{path}')) == previous[path], path
            add(path,git('show',f'{head}:{path}'))
        add('REPORT_KO.md',raw(REPORT))
        add('STATUS.json',raw(STATUS))
        add('CHECKPOINT.json',encode({
            'schema':'MathScope.GoalEvidenceDelta/1','parentsInOrder':PARENTS,
            'parentCommit':PARENT,'deltaCommit':head,'verifiedRemoteRefs':refs,
            'priorReadOnlyPublicSnapshotSHA256':PUBLIC_SHA,
            'filesThatSupersedeParents':sorted(set(files)&set(previous)),'release':'HOLD',
        }))
        bundle.writestr('SHA256.json',encode(files))
    with ZipFile(pending) as bundle:
        assert bundle.testzip() is None and len(bundle.namelist()) == len(files)+1
        assert json.loads(bundle.read('SHA256.json')) == files
        for path,expected_file in files.items():
            with bundle.open(path) as stream:
                assert sha256_stream(stream) == expected_file['sha256'], path
            assert bundle.getinfo(path).file_size == expected_file['bytes'], path
    pending.replace(delta)
    receipt = {'file':delta.name,'bytes':delta.stat().st_size,'files':len(files)+1,
               'sha256':file_sha(delta),'branchHead':head,**evidence,'verifiedDeltaManifest':True}
    (outputs/f'{LABEL}_Report_{DATE}_KO.md').write_bytes(raw(REPORT))
    (outputs/f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == '__main__':
    assemble(read_arguments(__doc__))
