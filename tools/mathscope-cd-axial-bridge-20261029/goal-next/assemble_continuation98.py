"""Assemble the C98 whole-path covariance, mean and N1 collar delta from Git."""

import json
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation97 import BUDGET, PARENTS as EARLIER, manifest_files
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '0b75246ffb600cbb04a3d8f737a514a588d92f19'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation97_Delta_20261120.zip':
           '3bfc9e0d1252b427c981797e1545e776b02ebc00b530444d00b3438bb776b748'}
REPORT = 'REPORT_CONTINUATION98_KO.md'
STATUS = 'STATUS_CONTINUATION98.json'
PUBLIC = 'preservation-continuation98.json'
LABEL, DATE = 'MathScope_Goal_Continuation98', '20261120'
COVARIANCE = BUDGET+'global-covariance-join/'
SELECTIVE = COVARIANCE+'selective-z8/'
MEAN = BUDGET+'native-mean-pressure/'
LEAN = MEAN+'lean-github/'
Y = 'y-higher-flow/picard-b26-registered-collar/'
LEAN_SHORT = 'MathScope/M3/CD/FiveMapMeanGauge.lean'
LEAN_PATH = 'research-ide/mathscope-m3/p8/lean/'+LEAN_SHORT
LEAN_HEAD = '9b824b59c2cc4ed85dfb2b4b3c2b9b474c25c284'
LEAN_SHA = 'ba3c754938ae5a367a272892e0ee10280da3f86330a49b46436aca30ed5f8807'
LEAN_RECEIPT_SHA = 'f5d8d79ed209b5c81fea940434559491fe45f0495570fc177229dc10f409ac75'
LEAN_RUN = 44648666522
THEOREMS = {'five_map_slow_chart_denominator','five_map_weighted_radial_density'}
LEAN_FILES = {'FiveMapMeanGauge.log','receipt.json','version.txt','source-sha256.txt'}
COVARIANCE_MANIFEST_SHA = '3933ec00135b3790af0ad436b5bc7ea529de9b0b1044c7aefc03476c4372c089'
COVARIANCE_SHA = '05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e'
SELECTIVE_MANIFEST_SHA = 'caa34f164ef9b95c434c723eb2ee539b1599ae9982835a849b2f12b5dba0f9ec'
SELECTIVE_SHA = 'c4c57f2e2531d04da6b8c795c73c8e8322cd8fc118550a3f2165f10bfa55a9df'
MEAN_MANIFEST_SHA = 'ec5bbd6582cc35bf9b3ba20dc6b5efb5cc75df286b27f54c8918b76468bb0903'
MEAN_SHA = '3212a321563d65e5d7972cb7ab0c97f03f1ee0917276542a7a45074912fe34ff'
Y_MANIFEST_SHA = 'c33a440d319238a7c7c50c2aef522197116e6f4229b17a554f5e3c2bfb9bd915'
Y_OPERANDS_SHA = '0c6a32b4641da682aba70d5ecdb1533528d1ea6c793a44ab4c767db98525551c'
Y_SHA = '4addbef308f52e5956e54cfc0e0f83d5155b5c571e2558d42056d540d1853d08'


def verify_covariance(raw, source, detail):
    assert entry(raw(COVARIANCE+'MANIFEST.json'))['sha256'] == COVARIANCE_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,COVARIANCE,'MANIFEST.json','producedFiles')
    assert manifest['schema'] == 'MathScope.C98.GlobalPrimaryCovarianceC7L8/1'
    assert members == {'MANIFEST.json','README.md','verify_global_primary_covariance.py',
                       'global-primary-covariance.json','live-transverse-replay.json','replay.log'}
    assert manifest['nativeSourceRecords'] == 22155584
    assert (manifest['signedCommonTorusRows'],manifest['nativeCovarianceComponents'],
            manifest['mixedDirectionsChecked'],manifest['supportingC97DerivativeRoles']) == (162,6,1080,626)
    assert manifest['byteIdenticalCompleteReplays'] == 2
    assert manifest['producedFiles']['global-primary-covariance.json'] == COVARIANCE_SHA
    receipt = source(COVARIANCE+'global-primary-covariance.json')
    assert receipt['status'] == 'VERIFIED_ALL_THREE_PIECE_COMMON_TORUS_PRIMARY_COVARIANCE_BUDGET_CONDITIONAL_ORIGINAL_PULSE_AND_CHART'
    cap = receipt['coefficientBudget']
    assert cap['commonGlobalCovarianceRanks'] == manifest['commonCovarianceLogDegreeRanks'] == [19239,6424,288,1030]
    assert cap['wholePathCovarianceLogCap'] == manifest['conditionalCovarianceLogCap'] == 'H/2^113'
    assert cap['fitsOneFactorM'] and cap['coversC97WholePathDerivativeRoles'] == 626
    assert detail['sourceStatus'] == 'VERIFIED' and detail['ordinaryStatus'].startswith('CONDITIONAL_')
    for key in ('nativeSourceRecords','signedCommonTorusRows','nativeCovarianceComponents',
                'mixedDirectionsChecked','supportingC97DerivativeRoles','conditionalCovarianceLogCap'):
        assert detail[key] == manifest[key]
    for record in (manifest,receipt):
        assert record['release'] == 'HOLD' and record['finalJets'] == 0
    return members,{'globalCovarianceSourceRecords':22155584,'signedGlobalTorusRows':162,
                    'globalCovarianceDerivativeDirections':1080,'globalCovarianceLogCap':'H/2^113'}


def verify_selective(raw, source, detail):
    assert entry(raw(SELECTIVE+'MANIFEST.json'))['sha256'] == SELECTIVE_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,SELECTIVE,'MANIFEST.json','producedFiles')
    assert manifest['schema'] == 'MathScope.C98.SelectiveAxialZ8PrimaryCovariance/1'
    assert members == {'MANIFEST.json','README.md','verify_selective_z8_covariance.py',
                       'selective-z8-covariance.json','replay.log'}
    assert manifest['ordinaryFrameDirectionsCheckedThroughNine'] == 220
    assert manifest['actualSelectedWrzDirectionsRZTL'] == [[0,8,0,0],[0,8,0,2]]
    assert manifest['extraCheckedWrzDirectionRZTL'] == [0,8,0,4]
    assert manifest['commonCovarianceLogDegreeRanks'] == [26378,7238,324,1156]
    assert manifest['byteIdenticalCompleteReplays'] == 2
    assert manifest['producedFiles']['selective-z8-covariance.json'] == SELECTIVE_SHA
    receipt = source(SELECTIVE+'selective-z8-covariance.json')
    assert receipt['status'] == 'VERIFIED_SELECTED_GLOBAL_W_RZ_Z8_L0_L2_L4_CONDITIONAL_ORIGINAL_C9_PULSE_AND_CHART'
    assert receipt['pins']['C7Cover'] == COVARIANCE_SHA
    bound = receipt['selectiveCovariance']
    assert bound['wholePathCovarianceLogCap'] == manifest['conditionalCoefficientLogCap'] == 'H/2^112'
    assert (manifest['epsilonPower'],manifest['bandPower']) == ('1','49/2')
    assert detail['requiredMeanDirectionsRZTL'] == manifest['actualSelectedWrzDirectionsRZTL']
    assert detail['verifiedDirectionsRZTL'] == [*detail['requiredMeanDirectionsRZTL'],[0,8,0,4]]
    assert detail['conditionalCoefficientLogCap'] == manifest['conditionalCoefficientLogCap']
    assert detail['component'] == 'W_rz' and detail['sourceStatus'] == 'VERIFIED'
    for record in (manifest,receipt):
        assert record['release'] == 'HOLD' and record['finalJets'] == 0
    return members,{'selectiveWrzMeanDirectionsRZTL':detail['requiredMeanDirectionsRZTL'],
                    'selectiveWrzCoefficientLogCap':'H/2^112'}


def verify_mean(raw, source, detail):
    assert entry(raw(MEAN+'MANIFEST.json'))['sha256'] == MEAN_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,MEAN,'MANIFEST.json','producedFiles')
    assert members == {'MANIFEST.json','README.md','verify_mean_pressure_enclosure.py',
                       'mean-pressure-enclosure.json','replay.log'}
    assert manifest['schema'] == 'MathScope.C98.NativeMeanPressureEnclosureEvidence/1'
    assert (manifest['byteIdenticalReplays'],manifest['nativeRoots'],manifest['selectiveCovarianceInputs']) == (2,120,2)
    assert manifest['producedFiles']['mean-pressure-enclosure.json'] == MEAN_SHA
    result = source(MEAN+'mean-pressure-enclosure.json')
    assert result['schema'] == 'MathScope.C98.NativeMeanPressureEnclosure/1'
    assert result['status'] == 'VERIFIED_NATIVE_NONZERO_PRESSURE_EXCLUSION_AND_CHART_CUTOFF_CONDITIONAL_EXTENDED_MEAN'
    assert result['pins']['globalCovariance'] == COVARIANCE_SHA
    assert result['pins']['selectiveCovariance'] == SELECTIVE_SHA
    assert result['native']['chartRoot'] == 17732766
    assert (result['native']['chi'],result['native']['rhoMass'],result['native']['halfRhoMoment']) == (17743734,17743725,17743733)
    modes = [result['native']['rawNonzeroModes'][mode] for mode in ('1','2')]
    assert [m['nativeRoots'] for m in modes] == [60,60]
    assert [m['exactTerms'] for m in modes] == detail['exactTermsByMode'] == [131884,11492]
    assert [m['directMeanPressureTerms'] for m in modes] == detail['directMeanPressureTerms'] == [0,0]
    assert [m['linearMeanTerms'] for m in modes] == [10640,0]
    assert [m['maximumNativeMeanVelocityDegree'] for m in modes] == [1,0]
    geometry = result['ordinaryGeometry']
    assert geometry['order'] == detail['ordinaryCutoffOrder'] == 7 and geometry['rhoMassLower'] == '2^-16'
    extension = result['extendedMean']
    assert extension['fiveMapDefectZOrders'] == detail['requiredDefectZOrders'] == {'P':4,'Jtheta':5,'Jz':4}
    assert extension['targetQuadraticGradesChecked'] == 136
    energy = result['conditionalEnergyAttachment']
    assert energy['attachedHighOrders'] == extension['extraBeyondC7'] == [['W_rz',[0,8,0]],['W_rz',[0,8,2]]]
    assert energy['c7LogCap'] == 'H/2^113' and energy['c8SelectiveLogCap'] == 'H/2^112'
    assert energy['middlePhysicalGrade'] == detail['conditionalPhysicalEpsilonGrade'] == '139993/100000'
    assert energy['middleTwoModeEnergyRatioStrictUpper'] == '2^-32'
    assert energy['threeDisjointTwoModeEnergyRatioStrictUpper'] == '2^-30'
    assert len(energy['originalDisjointPartition']) == 3
    assert result['release'] == manifest['release'] == 'HOLD'
    assert result['finalJets'] == manifest['finalJets'] == 0
    assert detail['sourceStatus']=='VERIFIED' and detail['ordinaryStatus'].startswith('CONDITIONAL_')
    assert detail['linearModeOneMeanVelocityTerms'] == 10640
    assert detail['nonzeroRawNativeRoots'] == manifest['nativeRoots']
    assert detail['attachedHigherCovarianceOrdersRZL'] == [row[1] for row in energy['attachedHighOrders']]
    assert detail['conditionalMiddleTwoModeEnergyRatio'] == '<'+energy['middleTwoModeEnergyRatioStrictUpper']
    assert detail['conditionalThreeSliceTwoModeEnergyRatio'] == '<'+energy['threeDisjointTwoModeEnergyRatioStrictUpper']
    return members,{'nativeMeanPressureReceiptSHA256':MEAN_SHA,'nativeMeanNonzeroModeRoots':120,
                    'conditionalMiddleTwoModeEnergyRatio':'<2^-32','conditionalThreeSliceTwoModeEnergyRatio':'<2^-30'}


def verify_y(raw, source, detail):
    assert entry(raw(Y+'manifest.json'))['sha256'] == Y_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,Y,'manifest.json','filesSHA256')
    assert manifest['schema'] == 'MathScope.C98.ActualN1FullCommonCollarEvidence/1'
    assert members == {'manifest.json','README.md','replay_full_n1_collar.mjs','check_full_n1_collar.py',
                       'full-n1-collar-operands.json','full-n1-collar.json','replay.log','source-replay.log'}
    assert manifest['byteIdenticalNodeReplays'] == manifest['byteIdenticalPythonReplays'] == 2
    assert manifest['filesSHA256']['full-n1-collar-operands.json'] == Y_OPERANDS_SHA
    assert manifest['filesSHA256']['full-n1-collar.json'] == Y_SHA
    result = source(Y+'full-n1-collar.json')
    assert result['operandsSHA256'] == Y_OPERANDS_SHA
    assert result['schema'] == 'MathScope.C98.ActualN1FullCommonCollar/1'
    assert result['sourceStatus'] == 'VERIFIED_78_ORIGINAL_OPERANDS_AND_FULL_RIGHT_ENDPOINT_WITH_TWO_PLUS_TWO_TERMS'
    assert result['ordinaryStatus'] == 'CONDITIONAL_ON_ORIGINAL_B_RHO_A21_AND_C55_LEADING_REALIZATION'
    assert (result['registeredDomain'],result['endpointX']) == ([0,24806],24805)
    assert result['sourceCutoffAndCompensation'] == {'Xkeep':28819,'Xcut':28823,'Xminus':28814,'Xplus':28824}
    assert result['counts'] == {'matrixEntries':72,'forcingEntries':6,
                                'exactRightEndpointCalls':6,'finiteSeamTerms':2,'finiteRightTerms':2}
    assert result['finiteEndpointClosure'] == {'nodes':7323,'zeroFreeCoordinates':True,'noPicardOrEvenOracle':True}
    assert result['wholeRightKT0NormUpper'] == '2^46 Q^-51 t1'
    assert result['twoPlusTwoFiniteErrorUpper'] == '2^74 Q^-77'
    assert max(result['etaErrorBinaryExponentsOrders0Through8']) == -15738
    assert detail['sourceStatus'] == 'VERIFIED' and detail['ordinaryStatus'] == result['ordinaryStatus']
    assert detail['operatorOperands'] == 78 and detail['exactEndpointCalls'] == result['counts']['exactRightEndpointCalls']
    assert detail['registeredEndpointX'] == result['endpointX']
    assert detail['finiteEndpointClosureNodes'] == result['finiteEndpointClosure']['nodes']
    for key in ('wholeRightKT0NormUpper','twoPlusTwoFiniteErrorUpper'):
        assert detail[key] == result[key]
    assert detail['etaDerivativeOrder'] == 8
    assert detail['maxAbsoluteEtaErrorBinaryExponent'] == max(result['etaErrorBinaryExponentsOrders0Through8'])
    assert result['coversXkeepAndXcut'] and result['additionalFinalJets'] == 0 and result['release'] == 'HOLD'
    return members,{'nativeN1FullRegisteredCollarEndpointX':24805,'nativeN1OperatorOperands':78,
                    'finiteEndpointClosureNodes':7323,'nativeN1AbsoluteErrorBound':'2^74 Q^-77'}


def verify_lean(raw, source):
    assert entry(raw(LEAN+'receipt.json'))['sha256'] == LEAN_RECEIPT_SHA
    receipt = source(LEAN+'receipt.json')
    assert receipt['schema'] == 'MathScope.C98.HostedLeanReceipt/1'
    assert (receipt['run'],receipt['head'],receipt['conclusion']) == (LEAN_RUN,LEAN_HEAD,'success')
    assert set(receipt['theorems']) == THEOREMS and receipt['files'] == {LEAN_PATH:LEAN_SHA}
    log = raw(LEAN+'FiveMapMeanGauge.log').decode()
    assert 'sorryAx' not in log and 'error:' not in log
    for theorem in THEOREMS:
        assert f"'MathScope.M3.CD.{theorem}' depends on axioms: [{', '.join(receipt['axioms'])}]" in log, theorem
    assert receipt['axioms'] == ['propext','Classical.choice','Quot.sound']
    assert f'{LEAN_SHA}  {LEAN_SHORT}' in raw(LEAN+'source-sha256.txt').decode().splitlines()
    assert 'Lean (version' in raw(LEAN+'version.txt').decode()
    return {'hostedLeanRun':LEAN_RUN,'hostedLeanTheorems':len(THEOREMS)}


def verify_evidence(raw, source):
    public = source(PUBLIC)
    assert public['schema'] == 'MathScope.C98.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'],public['bytes']) == (200,30707818)
    assert public['sha256'] == PUBLIC_SHA and public['samePublicBodyAsC97']
    assert public['isolatedLeanProofHead'] == LEAN_HEAD
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'
    provider = public['providerReadback']
    assert (provider['projectId'],provider['authenticatedProjectStatus'],
            provider['authenticatedPageIndexVersion']) == (29770,'published',137)
    assert provider['storedVersion137MetadataBytes'] == 29580450
    assert provider['storedVersion137WithinTier'] is False
    assert provider['editableSourceContentRequests'] == {
        'getPage':'Transport closed','listPagesWithContent':'Transport closed'}
    status = source(STATUS)
    assert status['schema'] == 'MathScope.C98.VerificationStatus/1' and status['branch'] == BRANCH
    for row in (status,source('STATUS.json')):
        assert (row['M3']['accepted'],row['M3']['total']) == (62,64)
        assert (row['jets']['accepted'],row['jets']['total']) == (0,67)
        assert row['release'] == 'HOLD'
    assert status['operatingR108'] == 'OPEN'
    gates = status['verification']
    assert gates['M3'] == status['M3']
    assert gates['M4']['operatingR108'] == 'OPEN' and gates['Y']['generalNative'] == 'OPEN'
    assert gates['finalN8Refinements'] == '0/4' and gates['jets'] == '0/67' and gates['release'] == 'HOLD'
    detail = status['continuation98']
    assert all(detail[key]=='OPEN' for key in ('wholeK1','wholeN706','wholeN805'))
    assert (detail['leanRun'],detail['leanCompiled']) == (LEAN_RUN,len(THEOREMS))
    cov_members,cov = verify_covariance(raw,source,detail['globalCovariance'])
    selective_members,selective = verify_selective(raw,source,detail['selectiveZ8Covariance'])
    mean_members,mean = verify_mean(raw,source,detail['nativeMeanPressure'])
    y_members,y = verify_y(raw,source,detail['nativeYFullRegisteredCollar'])
    assert b'<!--' not in raw(REPORT)
    return {COVARIANCE:cov_members,SELECTIVE:selective_members,MEAN:mean_members,
            Y:y_members,LEAN:LEAN_FILES},{
        **cov,**selective,**mean,**y,**verify_lean(raw,source),'operatingByteReadback':public['bytes'],
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

    expected_relative = {REPORT,STATUS,PUBLIC,'assemble_continuation98.py',
                         *(folder+name for folder,paths in groups.items() for name in paths)}
    expected = {CURRENT+'/'+name:'A' for name in expected_relative}
    expected[LEAN_PATH] = 'M'
    changed = {path:operation for operation,path in
               (row.split('\t') for row in git('diff','--name-status','--no-renames',PARENT,head).decode().splitlines())}
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
