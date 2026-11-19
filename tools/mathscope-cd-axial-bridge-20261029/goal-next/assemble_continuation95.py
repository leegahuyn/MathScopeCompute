"""Assemble the C95 outer physical gauge and N1 chart evidence from Git."""

import json
from pathlib import PurePosixPath
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation94 import PARENTS as EARLIER
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '2d88c020f5221cd3418e93142e00855ccc44d868'
PARENTS = {**EARLIER,'MathScope_Goal_Continuation94_Delta_20261120.zip':
           '1de8d91b34c8996f1d2d256a59a1dfb0c45c08ef42920effe04e23e9cb0ac9be'}
REPORT, STATUS = 'REPORT_CONTINUATION95_KO.md','STATUS_CONTINUATION95.json'
PUBLIC = 'preservation-continuation95.json'
LABEL, DATE = 'MathScope_Goal_Continuation95','20261120'
ROOT = ('primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/'
        'first-forced-budget/outer-physical-gauge/')
SOURCE, LEAN = ROOT+'source/',ROOT+'lean-github/'
Y = 'y-higher-flow/picard-physical-box/'
ROOT_FILES = {'README.md','verify_physical_gauge_budget.py','outer-forced-energy-slice.json','replay.log'}
LEAN_FILES = {'CorrectionSpatialBudget.log','receipt.json','version.txt','source-sha256.txt'}
LEAN_HEAD = 'f173a8160228aac57bfe159cffe5efc300314be6'
LEAN_RUN = 44641150504
LEAN_SHORT = 'MathScope/M3/CD/CorrectionSpatialBudget.lean'
LEAN_PATH = 'research-ide/mathscope-m3/p8/lean/'+LEAN_SHORT
LEAN_SHA = 'c04cb165861284abb264978b58d59a09e5b872943cbdbe9877d98c313f796ca3'
THEOREMS = {'forced_physical_gauge_log_normalization','outer_forced_reserved_gauge_log_margin'}
AXIOMS = ['propext','Classical.choice','Quot.sound']
GAUGE_MANIFEST_SHA = '6813fa56f66ed66d64d65842b3637579948566512612d918800792abe0df4800'
GAUGE_SOURCE_SHA = 'b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59'
PHYSICAL_SHA = 'a3c39cd72a19f6ab1d9354c0ea2d1db5d34897065b42ab0db4751f9e575d1ffd'
Y_MANIFEST_SHA = '8de7d9d478cf9d9fbb9cbaef119d82c26a9de25230ce94582c9cacbe5dbcde1c'
Y_BOX_SHA = '6624630f4742c7f32957dfbb6a95ff62d9652ec2651b4cec459b3cc87b546759'
Y_OPERANDS_SHA = '8d7c194c513fb93f77dd9b166b9053dfadd4e9bfd86fb8bb9b52c92ff8184b8d'


def manifest_files(raw,source,folder,manifest_name,field,expected):
    manifest = source(folder+manifest_name)
    files = manifest[field]
    assert set(files) == expected
    for name,digest in files.items():
        assert entry(raw(folder+name))['sha256'] == digest, name
    return manifest,expected|{manifest_name}


def verify_physical(raw,source):
    members = {'README.md','forced-gauge-spatial.json','verify_forced_gauge_spatial.py','replay.log'}
    assert entry(raw(SOURCE+'MANIFEST.json'))['sha256'] == GAUGE_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,SOURCE,'MANIFEST.json','producedFiles',members)
    assert manifest['schema'] == 'MathScope.ActualForcedGaugeSpatialC95Replay/1'
    assert (manifest['sourceNodes'],manifest['originalGaugeBodies'],manifest['referenceRows']) == (22155584,120,162)
    assert (manifest['spatialGaugeRoots'],manifest['exactHighestAuxiliarySlots']) == (30,45)
    assert manifest['producedFiles']['forced-gauge-spatial.json'] == GAUGE_SOURCE_SHA
    gauge = source(SOURCE+'forced-gauge-spatial.json')
    assert gauge['status'] == 'VERIFIED_ACTUAL_FORCED_GAUGE_SLOTS_AND_CONDITIONAL_L2_CLOSURE'
    assert gauge['sourceStream']['nodes'] == manifest['sourceNodes']
    assert gauge['liveCartesianGaugeSlotDemand']['spatialRootCount'] == 30
    assert gauge['liveForcedGauge']['referenceCoverRows'] == 162
    assert gauge['pureL2NativeForcedExtension']['newDirection'] == [0,0,2]
    assert gauge['pureL2MeanClosure']['countsBeforeAfter'] == {
        'covariance':[600,604],'shiftedPrimitive':[153,153],'Fourier':[169,171],
    }

    assert entry(raw(ROOT+'outer-forced-energy-slice.json'))['sha256'] == PHYSICAL_SHA
    physical = source(ROOT+'outer-forced-energy-slice.json')
    assert physical['status'] == 'VERIFIED_CARTESIAN_TRANSFER_CONDITIONAL_OUTER_FORCED_AMPLITUDE'
    assert physical['actualGaugeSourceSHA256'] == GAUGE_SOURCE_SHA
    for pin in physical['inputPins'].values():
        target = PurePosixPath(pin['path'])
        assert not target.is_absolute() and '..' not in target.parts
        assert target.as_posix() == pin['path']
        assert entry(raw(pin['path']))['sha256'] == pin['sha256'], pin['path']
    assert physical['allowedSourceCoverageCount'] == 162
    assert physical['componentsAndPhysicalDerivativesPerMode'] == 30
    expected_directions = {(r,z,l) for r in range(3) for z in range(3-r) for l in range(3-r-z)}
    assert {tuple(direction) for direction in physical['exactDirections']} == expected_directions
    assert physical['newDirection'] == [0,0,2]
    assert [mode['mode'] for mode in physical['polynomialMaps']] == [1,2]
    for mode in physical['polynomialMaps']:
        rows = mode['rows']
        assert len(rows) == len({(row['component'],row['physicalDerivative']) for row in rows}) == 30
        assert all(row['expandedMonomials'] > 0 for row in rows)
    maxima = physical['modeMaxima']
    assert [maxima[str(m)]['maxBandPower'] for m in (1,2)] == ['95/4','16']
    assert [maxima[str(m)]['maxPoleAfterZetaToModeOverTwo'] for m in (1,2)] == ['33/2','18']
    budget = physical['firstStagePotentialSlice']
    assert budget['weightedPhysicalEpsilonExponent'] == '69999/50000'
    assert budget['combinedCountedOuterSliceUpper'] == 'exp(-H/2)'
    assert budget['conditionalOriginalLocalForceEnergyRatio'].endswith('/ S_R < 2^-32')
    assert 'N8-05 and final jets' in physical['open']
    assert all(r['finalJets'] == 0 and r['release'] == 'HOLD' for r in (manifest,gauge,physical))
    return members,{
        'originalGaugeBodies':manifest['originalGaugeBodies'],
        'physicalCartesianSlotsPerMode':physical['componentsAndPhysicalDerivativesPerMode'],
        'physicalGaugeNativeDirections':len(expected_directions),
        'weightedPhysicalEpsilonExponent':budget['weightedPhysicalEpsilonExponent'],
        'conditionalOuterEnergyRatioUpper':'2^-32',
    }


def verify_y(raw,source):
    members = {'README.md','physical-core-box.json','physical-core-operands.json','replay_n1_physical_box.mjs',
               'replay.log','source-replay.log','verify_n1_physical_box.py'}
    assert entry(raw(Y+'manifest.json'))['sha256'] == Y_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,Y,'manifest.json','filesSHA256',members)
    assert manifest['schema'] == 'MathScope.C95.OriginalN1PhysicalCoreEvidence/1'
    assert manifest['filesSHA256']['physical-core-box.json'] == Y_BOX_SHA
    assert manifest['filesSHA256']['physical-core-operands.json'] == Y_OPERANDS_SHA
    box = source(Y+'physical-core-box.json')
    operands = source(Y+'physical-core-operands.json')
    assert box['sourceStatus'] == 'VERIFIED_ORIGINAL_ATTAINED_N1_BOX_AND_NATIVE_ARGUMENTS'
    assert box['ordinaryIntervalStatus'] == 'CONDITIONAL_ORIGINAL_C47_COEFFICIENT_DOMAIN_AND_C54_CORE_REALIZATION'
    assert box['sourceOperandSHA256'] == Y_OPERANDS_SHA and box['sourceNodesChecked'] == 4420257
    assert (box['physicalInverse'],box['XArgument'],box['etaArgument'],box['qArgument']) == (622820,622824,622829,622830)
    assert box['label'] == 'ellMinimum+12' and box['band'] == 'Q=qBig/4'
    assert box['selectedPrefix'] == 1
    assert box['physicalBox']['s'] == ['15/16','63/64']
    assert box['physicalBox']['qOverQBig'] == ['15/64','63/256']
    assert box['nativeEvenComponentCalls'] == operands['calls']
    assert [call['component'] for call in operands['calls']] == [0,1,2,3]
    assert set(box['componentIntervals']) == {'F','U','K','Pi'}
    assert all(len(group['valueOverScaleX'])==len(group['normalizedRadialDerivative'])==2
               for group in box['componentIntervals'].values())
    assert not box['originalOuterAngularGuardActiveOnThisBox']
    assert box['additionalFinalJets'] == 0 and box['release'] == 'HOLD'
    return members,{'nativeN1PhysicalCoreComponents':4,'nativeN1PhysicalCoreConditionalIntervals':8,
                    'nativeN1PhysicalSourceNodes':box['sourceNodesChecked']}


def verify_lean(raw,source):
    receipt = source(LEAN+'receipt.json')
    assert receipt['schema'] == 'MathScope.C95.HostedLeanReceipt/1'
    assert (receipt['run'],receipt['head'],receipt['conclusion']) == (LEAN_RUN,LEAN_HEAD,'success')
    assert set(receipt['theorems']) == THEOREMS
    assert receipt['files'] == {LEAN_PATH:LEAN_SHA}
    log = raw(LEAN+'CorrectionSpatialBudget.log').decode()
    assert receipt['axioms'] == AXIOMS
    axiom_text = ', '.join(AXIOMS)
    for theorem in THEOREMS:
        assert f"'MathScope.M3.CD.{theorem}' depends on axioms: [{axiom_text}]" in log
    assert 'sorryAx' not in log and 'error:' not in log
    assert f'{LEAN_SHA}  {LEAN_SHORT}' in raw(LEAN+'source-sha256.txt').decode().splitlines()
    assert 'Lean (version' in raw(LEAN+'version.txt').decode()
    return {'hostedLeanRun':LEAN_RUN,'hostedLeanTheorems':len(THEOREMS)}


def verify_evidence(raw,source):
    public = source(PUBLIC)
    assert public['schema'] == 'MathScope.C95.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'],public['bytes']) == (200,30707818)
    assert public['sha256'] == PUBLIC_SHA and public['samePublicBodyAsC94']
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'
    status = source(STATUS)
    assert status['schema'] == 'MathScope.C95.VerificationStatus/1' and status['branch'] == BRANCH
    for item in (status,source('STATUS.json')):
        assert (item['M3']['accepted'],item['M3']['total']) == (62,64)
        assert (item['jets']['accepted'],item['jets']['total']) == (0,67)
        assert item['release'] == 'HOLD'
    assert status['operatingR108'] == 'OPEN'
    gates = status['verification']
    assert gates['M3'] == status['M3']
    assert gates['M4']['operatingR108'] == 'OPEN' and gates['Y']['generalNative'] == 'OPEN'
    assert gates['finalN8Refinements'] == '0/4' and gates['jets'] == '0/67' and gates['release'] == 'HOLD'
    details = status['continuation95']
    assert (details['exactCartesianPotentialRoots'],details['nativePotentialDirections']) == (30,10)
    assert (details['sourceGaugeBodies'],details['sourceReferenceRows'],details['pureYSecondDerivativeSlots']) == (120,162,45)
    assert details['newDirection'] == [0,0,2] and details['meanCovarianceRequests'] == 604
    assert details['weightedPhysicalEpsilonExponent'] == '69999/50000'
    assert details['outerForcedEnergyRatioStrictUpper'] == '2^-32'
    assert details['outerForcedEnergyStatus'] == 'CONDITIONAL'
    assert all(details[key]=='OPEN' for key in ('wholeK1','wholeN706','wholeN805'))
    assert (details['nativeYConditionalIntervals'],details['leanRun'],details['leanCompiled']) == (8,LEAN_RUN,2)
    source_members,physical_evidence = verify_physical(raw,source)
    y_members,y_evidence = verify_y(raw,source)
    return {SOURCE:source_members,Y:y_members,LEAN:LEAN_FILES},{
        **physical_evidence,**y_evidence,**verify_lean(raw,source),'operatingByteReadback':public['bytes'],
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
    for rev in (LEAN_HEAD,head):
        assert entry(git('show',f'{rev}:{LEAN_PATH}'))['sha256'] == LEAN_SHA
    previous = {}
    for name,pin in PARENTS.items():
        package = outputs/name
        assert file_sha(package) == pin, name
        with ZipFile(package) as bundle:
            previous.update(json.loads(bundle.read('SHA256.json')))
    groups,evidence = verify_evidence(raw,source)

    expected_relative = {REPORT,STATUS,PUBLIC,'assemble_continuation95.py',
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
