"""Assemble the C96 inner first Forced and strict N1 realization Git delta."""

from fractions import Fraction
import json
from pathlib import PurePosixPath
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation95 import PARENTS as EARLIER, PHYSICAL_SHA as OUTER_SHA
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '67c80498715cebc8595f05aa0ea23d5d6acbb7ef'
PARENTS = {**EARLIER,'MathScope_Goal_Continuation95_Delta_20261120.zip':
           'f20c385e2a9c3acdb5f14a9221f5f37a5c9657d01eb46671f47d7eb78119bb9c'}
REPORT, STATUS = 'REPORT_CONTINUATION96_KO.md','STATUS_CONTINUATION96.json'
PUBLIC = 'preservation-continuation96.json'
LABEL, DATE = 'MathScope_Goal_Continuation96','20261120'
ROOT = ('primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/'
        'first-forced-budget/inner-physical-gauge/')
SOURCE, LEAN = ROOT+'source/',ROOT+'lean-github/'
Y = 'y-higher-flow/picard-natural-core-realization/'
ROOT_FILES = {'README.md','inner-forced-energy-slice.json','verify_inner_forced_energy.py','replay.log'}
LEAN_FILES = {'ShellGaussianPrimitive.log','receipt.json','version.txt','source-sha256.txt'}
LEAN_HEAD = '37d072c7b0a4ec5015eecb782ddae6a94a51be82'
LEAN_RUN = 44642679434
LEAN_SHORT = 'MathScope/M3/CD/ShellGaussianPrimitive.lean'
LEAN_PATH = 'research-ide/mathscope-m3/p8/lean/'+LEAN_SHORT
LEAN_SHA = '35b3b974068b4ce7e40758cc3fba5a84b159154e9c349fa0f707fa20fd51239a'
THEOREMS = {'inner_forward_path_below_mean_cutoff','inner_half_gaussian_opposite_exponent'}
AXIOMS = ['propext','Classical.choice','Quot.sound']
INNER_MANIFEST_SHA = 'cad43e5d2d6f5de0ebe3f97bc47a5f04a3dfeb537c38fc888110e94bbd8baa17'
INNER_SHA = '8228b3442a46ee6e6843ed8212184d1f3fce56f331852096e78b156a6187ff61'
ENERGY_SHA = 'eb5a2d9dc3b72cb6c4a4b5f04aa7be147cc356c55cdb3e3226399a6dce6832b8'
Y_MANIFEST_SHA = 'b4fd546edc9b3546da6306f965ef391f1017e4fffe99df4c14f0a1eb0cbf057d'
Y_RECEIPT_SHA = '9c44b1ca18765f406ce28cbc495056b23fd1e7f50fdcb1403b8c7e800531b26e'
Y_OPERANDS_SHA = '4b1e1418d85f396a9710f75032b9fe329c2a1be3633e913d78524eb5e9106364'


def manifest_files(raw,source,folder,name,field):
    manifest = source(folder+name)
    files = manifest[field]
    assert files
    for member,digest in files.items():
        assert member not in {'','.','..'} and '/' not in member and '\\' not in member, member
        assert entry(raw(folder+member))['sha256'] == digest, member
    return manifest,set(files)|{name}


def verify_inner(raw,source):
    assert entry(raw(SOURCE+'MANIFEST.json'))['sha256'] == INNER_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,SOURCE,'MANIFEST.json','producedFiles')
    assert manifest['schema'] == 'MathScope.ActualInnerCovarianceC96Replay/1'
    assert manifest['sourceNodes'] == 22155584 and manifest['historicalRecords'] == 153455
    assert (manifest['exactInnerFactorProducerMatches'],manifest['regularInnerStressOrders'],
            manifest['fixedLabelDerivativeOrders'],manifest['byteIdenticalCompleteReplays']) == (3,9,9,2)
    assert members == {'MANIFEST.json','README.md','inner-covariance.json','verify_inner_covariance.py','replay.log'}
    assert manifest['release'] == 'HOLD' and manifest['finalJets'] == 0
    gauge_file = 'inner-covariance.json'
    assert manifest['producedFiles'][gauge_file] == INNER_SHA
    gauge = source(SOURCE+gauge_file)
    assert gauge['status'] == 'VERIFIED_ORIGINAL_INNER_COVARIANCE_TARGET_BINDING_CONDITIONAL_NATIVE_PULSE_AND_ANALYTIC_CAPS'
    inner = gauge['regions']['inner']
    assert inner['coordinate'] == 'u=log(X/Xa)/t1' and inner['openRange'] == ['0','1/4']
    assert inner['projectionLowerPowerOfRenv'] == 55 and inner['projectionUpperPowerOfRenv'] == 8
    assert inner['regularActivation']['includedInHistoricalRegularBody']
    assert len(inner['regularStressSlowRows']) == 9
    assert [row['order'] for row in inner['regularStressSlowRows']] == list(range(9))
    assert all(row['physicalSlowCap']=='2^4096*Bnorm' for row in inner['regularStressSlowRows'])
    assert gauge['mass']['sameLiveMasses'] == [17733414,17733746]
    assert gauge['mass']['massPowerS'] == '-1/2' and gauge['mass']['detLowerPowerS'] == '-1'
    assert 'CONDITIONAL' in gauge['regions']['middle']['status']
    assert gauge['release'] == 'HOLD' and gauge['finalJets'] == 0

    assert entry(raw(ROOT+'inner-forced-energy-slice.json'))['sha256'] == ENERGY_SHA
    physical = source(ROOT+'inner-forced-energy-slice.json')
    assert physical['status'] == 'VERIFIED_INNER_FORWARD_PRIMITIVE_AND_CONDITIONAL_ORIGINAL_INNER_ENERGY'
    assert physical['sourceInnerTargetSHA256'] == manifest['producedFiles'][gauge_file]
    for pin in physical['inputPins'].values():
        path = PurePosixPath(pin['path'])
        assert not path.is_absolute() and '..' not in path.parts and path.as_posix()==pin['path']
        assert entry(raw(pin['path']))['sha256'] == pin['sha256'], pin['path']
    assert physical['inputPins']['physical']['sha256'] == OUTER_SHA
    assert physical['innerPressureRoots'] == {'pressureZ':17754234,'forward':[17753667,17754191]}
    primitive = physical['primitiveReplay']
    assert primitive['primitiveCountPerTerm'] == 2 and primitive['exponentialMomentDegree'] == 14
    assert primitive['primitiveInputPoles'] == [12,15,18,21,24,27,30]
    assert (primitive['covariances'],primitive['shiftedPrimitives'],primitive['FourierTailRoles']) == (604,153,171)
    assert len(physical['pureGaussianDerivativeBoundsThrough8']) == 9
    charges = physical['innerLeanLogCharges']
    assert len(charges) == 5 and all(0<=charge<=2**16 for charge in charges)
    assert charges == [65536,61979,10169,437,1594]
    assert physical['maximumInnerFieldProductLogDegrees'] == [sum(charges[:2]),*charges[2:]]
    energy = physical['conditionalPhysicalEnergyComparison']
    assert energy['weightedPhysicalEpsilonExponent'] == '69999/50000'
    assert energy['conditionalInnerPotentialSliceUpper'] == 'exp(-H/2)'
    assert energy['conditionalInnerEnergyRatioStrictUpper'] == '2^-32'
    assert energy['conditionalInnerOuterDisjointEnergyRatioStrictUpper'] == '2^-31'
    assert (energy['logModes']['1']['maxPoleAfterZeta'],energy['logModes']['2']['maxPoleAfterZeta']) == ('33/2','18')
    assert 'full N7-06, N8-05 and final jets' in physical['open']
    assert physical['finalJets'] == 0 and physical['release'] == 'HOLD'
    return members,{
        'innerPrimitiveFactorsPerTerm':primitive['primitiveCountPerTerm'],
        'pureL3MeanCovarianceRequests':primitive['covariances'],
        'innerShiftedPrimitiveRoles':primitive['shiftedPrimitives'],
        'innerFourierTailRoles':primitive['FourierTailRoles'],
        'innerCoefficientLogCharges':charges,
        'weightedPhysicalEpsilonExponent':energy['weightedPhysicalEpsilonExponent'],
        'conditionalInnerEnergyRatioStrictUpper':'2^-32',
        'conditionalInnerOuterDisjointEnergyRatioStrictUpper':'2^-31',
    }


def verify_y(raw,source):
    assert entry(raw(Y+'manifest.json'))['sha256'] == Y_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,Y,'manifest.json','filesSHA256')
    assert manifest['schema'] == 'MathScope.C96.OriginalN1LocalMajorantEvidence/1'
    assert members == {'manifest.json','README.md','local-majorant-operands.json','local-majorant.json',
                       'replay_n1_local_majorant.mjs','replay.log','source-replay.log','verify_n1_local_majorant.py'}
    assert manifest['filesSHA256']['local-majorant.json'] == Y_RECEIPT_SHA
    assert manifest['filesSHA256']['local-majorant-operands.json'] == Y_OPERANDS_SHA
    receipt = source(Y+'local-majorant.json')
    operands = source(Y+'local-majorant-operands.json')
    assert receipt['sourceStatus'] == 'VERIFIED_EXACT_ORIGINAL_N1_STRICT_CORE_KERNEL_AND_MAJORANT_ARITHMETIC'
    assert receipt['ordinaryStatus'] == 'CONDITIONAL_ONLY_ON_PINNED_ORIGINAL_NATURAL_B_RHO_AND_A21_REALIZATION_FOR_THIS_CORE_RESULT'
    assert receipt['sourceOperandSHA256'] == Y_OPERANDS_SHA
    assert receipt['sourceRegistrySHA256'] == operands['registrySHA']
    assert (receipt['actualSystem'],receipt['auxiliarySystem']) == (0,1)
    assert receipt['originalCoefficientBound'] == operands['norm']['C'] == 117190
    assert receipt['solutionStrip'] == operands['norm']['s'] == 117103
    assert receipt['radiusSquared'] == operands['norm']['aSquared'] == 117107
    assert receipt['standaloneKernelEntries'] == receipt['naturalBranchKernelEntries'] == receipt['exactParityChecks'] == 78
    assert len(receipt['nativeMajorantChecks']) == 21
    assert all(Fraction(row['largestCoefficientFractionUsed'])<=1 for row in receipt['nativeMajorantChecks'])
    assert receipt['sourceNaturalExactParameterKeys'] == 12
    assert '0<=Y<4' in receipt['core']
    assert not receipt['globalB26OrC54JoinRequiredForThisLocalComparison']
    assert receipt['additionalFinalJets'] == 0 and receipt['release'] == 'HOLD'
    return members,{'nativeN1LocalKernelEntries':78,'nativeN1StrictCoreKernelEntries':78,
                    'nativeN1ExactMajorantChecks':21,'nativeN1NaturalProfileKeys':12}


def verify_lean(raw,source):
    receipt = source(LEAN+'receipt.json')
    assert receipt['schema'] == 'MathScope.C96.HostedLeanReceipt/1'
    assert (receipt['run'],receipt['head'],receipt['conclusion']) == (LEAN_RUN,LEAN_HEAD,'success')
    assert set(receipt['theorems']) == THEOREMS
    assert receipt['files'] == {LEAN_PATH:LEAN_SHA}
    log = raw(LEAN+'ShellGaussianPrimitive.log').decode()
    assert receipt['axioms'] == AXIOMS
    for theorem in THEOREMS:
        line = f"'MathScope.M3.CD.{theorem}' depends on axioms: [{', '.join(AXIOMS)}]"
        assert line in log
    assert 'sorryAx' not in log and 'error:' not in log
    assert f'{LEAN_SHA}  {LEAN_SHORT}' in raw(LEAN+'source-sha256.txt').decode().splitlines()
    assert 'Lean (version' in raw(LEAN+'version.txt').decode()
    return {'hostedLeanRun':LEAN_RUN,'hostedLeanTheorems':len(THEOREMS)}


def verify_evidence(raw,source):
    public = source(PUBLIC)
    assert public['schema'] == 'MathScope.C96.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'],public['bytes']) == (200,30707818)
    assert public['sha256'] == PUBLIC_SHA and public['samePublicBodyAsC95']
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'
    status = source(STATUS)
    assert status['schema'] == 'MathScope.C96.VerificationStatus/1' and status['branch'] == BRANCH
    for row in (status,source('STATUS.json')):
        assert (row['M3']['accepted'],row['M3']['total']) == (62,64)
        assert (row['jets']['accepted'],row['jets']['total']) == (0,67)
        assert row['release'] == 'HOLD'
    assert status['operatingR108'] == 'OPEN'
    gates = status['verification']
    assert gates['M3'] == status['M3']
    assert gates['M4']['operatingR108'] == 'OPEN' and gates['Y']['generalNative'] == 'OPEN'
    assert gates['finalN8Refinements'] == '0/4' and gates['jets'] == '0/67' and gates['release'] == 'HOLD'
    detail = status['continuation96']
    assert detail['innerForcedEnergyStatus'] == 'CONDITIONAL'
    assert detail['innerForcedEnergyRatioStrictUpper'] == '2^-32'
    assert detail['innerOuterDisjointEnergyRatioStrictUpper'] == '2^-31'
    assert detail['weightedPhysicalEpsilonExponent'] == '69999/50000'
    assert (detail['maxPrimitiveInputPole'],detail['meanCovarianceRequests']) == (30,604)
    assert all(detail[key]=='OPEN' for key in ('wholeK1','wholeN706','wholeN805','middleSourceJoin'))
    assert (detail['nativeYKernelEntries'],detail['nativeYMajorantChecks']) == (78,21)
    assert detail['strictCoreY'] == 'CONDITIONAL_ORIGINAL_B_RHO_AND_A21'
    assert (detail['leanRun'],detail['leanCompiled']) == (LEAN_RUN,2)
    inner_members,inner_evidence = verify_inner(raw,source)
    y_members,y_evidence = verify_y(raw,source)
    return {SOURCE:inner_members,Y:y_members,LEAN:LEAN_FILES},{
        **inner_evidence,**y_evidence,**verify_lean(raw,source),'operatingByteReadback':public['bytes'],
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
    for ref in (LEAN_HEAD,head):
        assert entry(git('show',f'{ref}:{LEAN_PATH}'))['sha256'] == LEAN_SHA
    previous = {}
    for name,pin in PARENTS.items():
        package = outputs/name
        assert file_sha(package) == pin, name
        with ZipFile(package) as bundle:
            previous.update(json.loads(bundle.read('SHA256.json')))
    groups,evidence = verify_evidence(raw,source)

    expected_relative = {REPORT,STATUS,PUBLIC,'assemble_continuation96.py',
                         *(ROOT+name for name in ROOT_FILES),
                         *(folder+name for folder,paths in groups.items() for name in paths)}
    expected = {CURRENT+'/'+name:'A' for name in expected_relative}
    expected[LEAN_PATH] = 'M'
    changed = dict((path,operation) for operation,path in
                   (row.split('\t') for row in git('diff','--name-status','--no-renames',PARENT,head).decode().splitlines()))
    assert changed == expected, (set(changed)-set(expected),set(expected)-set(changed))

    delta = outputs/f'{LABEL}_Delta_{DATE}.zip'
    pending = delta.with_suffix('.zip.tmp')
    files = {}
    with ZipFile(pending,'w',compression=ZIP_DEFLATED,compresslevel=5) as bundle:
        def add(path,data):
            assert path not in files, path
            bundle.writestr(path,data)
            files[path] = entry(data)

        for path,operation in changed.items():
            if operation == 'M' and path in previous:
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
        for path,record in files.items():
            with bundle.open(path) as stream:
                assert sha256_stream(stream) == record['sha256'], path
            assert bundle.getinfo(path).file_size == record['bytes'], path
    pending.replace(delta)
    receipt = {'file':delta.name,'bytes':delta.stat().st_size,'files':len(files)+1,
               'sha256':file_sha(delta),'branchHead':head,**evidence,'verifiedDeltaManifest':True}
    (outputs/f'{LABEL}_Report_{DATE}_KO.md').write_bytes(raw(REPORT))
    (outputs/f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == '__main__':
    assemble(read_arguments(__doc__))
