"""Assemble the C97 middle-source and N1 B.26 evidence from immutable Git bytes."""

from fractions import Fraction
import json
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation96 import PARENTS as EARLIER, manifest_files
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = 'd43271d50c267029f04abed887804fe194c2a0cd'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation96_Delta_20261120.zip':
           'ed8f6d64c013fb73be699de374952db96a74beb9114e6579c61f5307b26eec31'}
REPORT = 'REPORT_CONTINUATION97_KO.md'
STATUS = 'STATUS_CONTINUATION97.json'
PUBLIC = 'preservation-continuation97.json'
LABEL, DATE = 'MathScope_Goal_Continuation97', '20261120'
BUDGET = ('primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/'
          'first-forced-budget/')
COVARIANCE = BUDGET+'middle-covariance/'
FRAME = COVARIANCE+'frame/'
PREMEAN = BUDGET+'middle-premean-whole-path/'
MEAN = BUDGET+'after-temporal-five-map/'
LEAN = MEAN+'lean-github/'
Y = 'y-higher-flow/picard-b26-restart/'
LEAN_SHORT = 'MathScope/M3/CD/FiveMapMeanGauge.lean'
LEAN_PATH = 'research-ide/mathscope-m3/p8/lean/'+LEAN_SHORT
LEAN_HEAD = '69d8d640474ac2024370c176ccf2fda8b8950586'
LEAN_SHA = '8657df557483064ad24d86de3d0442f30df005b28e5523aa1497360f2dd0d67c'
LEAN_RECEIPT_SHA = 'fa772d0405c27a9bc60a5178c6432e633b794219d13d5b3cba8821f2c8c82410'
LEAN_RUN = 44645128664
THEOREMS = {'five_map_axial_gap_lower', 'five_map_angular_gap_lower'}
LEAN_FILES = {'FiveMapMeanGauge.log', 'receipt.json', 'version.txt', 'source-sha256.txt'}
Y_MANIFEST_SHA = 'e2ac3d30784e15cbf84081f9ce3ee320238f0ef98aef562f287a309744b1efcf'
Y_RECEIPT_SHA = '63445c649efe09ae23d6012ebcfb4b6b9ff3384f9349ced316a2a2c80b562316'
Y_OPERANDS_SHA = 'd43384e8f8cb1fc2204595298b50e48c7247dc68677a2670e0e6f284f2223052'
COVARIANCE_SHA = '0ef034ffdca1157f668915a7d8643aa347d5d9ff7566510bdd7829e42b6ca8b8'
BODY_SHA = '4e08b2bbcf5ba20387a631e05e1eae15a857a3be56372c1106fde810d1797515'
LOG_SHA = '7b4283b548cf1139624f753657d30ab43cc97d2ce741ece4fd7e7616632c8986'
FRAME_MANIFEST_SHA = '56d36aafe7db43ddf45a460f72100b781d195c093848195ac84882479092aee5'
FRAME_SHA = 'b312748ae060076831485bc30cfeac644a7dfdde86d4ae9c306137df678cb3b8'
PREMEAN_SHA = '1eb1c9d1dbf1fcff611140309a663fc74d106ee05e27f3ac7d0d9e13e36893d5'
PREMEAN_MANIFEST_SHA = '12686ca6e6c30cfd3350dfc66ebdaed711a93b7771010d3fe060342951d1b5c7'
MEAN_MANIFEST_SHA = '4f8a3495198feb66dc4b2dbdf687eb7de709dd7c0f35ea0be573539cda33a8af'
MEAN_SHA = '3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102'


def verify_covariance(raw, source):
    assert entry(raw(COVARIANCE+'MANIFEST.json'))['sha256'] == COVARIANCE_SHA
    manifest,members = manifest_files(raw,source,COVARIANCE,'MANIFEST.json','producedFiles')
    assert manifest['schema'] == 'MathScope.C97.MiddleCovarianceAndOriginalTargetLog/1'
    assert members == {'MANIFEST.json','README.md','wrapped-middle.json',
                       'middle-coeff-log.json','verify_wrapped_middle.py',
                       'replay_middle_coeff_log.py','replay.log'}
    assert manifest['activeSourceNodes'] == 22155584
    assert (manifest['nativeRawTargetBodiesMatched'],manifest['sourceArithmeticRecords'],
            manifest['inverseOperandsWithNonzeroLower']) == (2,10588,29)
    assert (manifest['byteIdenticalBodyReplays'],manifest['byteIdenticalSourceLogReplays']) == (2,2)
    assert manifest['throughOrdinarySlowOrder'] == 8 and manifest['middleTargetLogRenvPower'] == 1276
    assert manifest['middleTargetLogCap'] == 'H/2^256'
    assert manifest['producedFiles']['wrapped-middle.json'] == BODY_SHA
    assert manifest['producedFiles']['middle-coeff-log.json'] == LOG_SHA
    wrapped = source(COVARIANCE+'wrapped-middle.json')
    rows = wrapped['bindings']['historicalMiddleComparisonToActiveT0']
    assert [(row['historicalBody'],row['activeBody'],row['activeCall']) for row in rows] == [
        (117771,17732694,17733782),(117772,17732695,17733789)]
    assert all(row['literalMatch'] and row['historicalLexicalSHA256']==row['rebuiltLexicalSHA256']
               for row in rows)
    closed = source(COVARIANCE+'middle-coeff-log.json')
    assert closed['inputPins']['middleSameBody'] == BODY_SHA
    assert closed['arithmeticNodes'] == 10588
    assert (closed['middleSlowLogRenvPower'],closed['middleTargetLogCap']) == (1276,'H/2^256')
    for record in (manifest,wrapped,closed):
        assert record['release'] == 'HOLD' and record['finalJets'] == 0
    return members, {'originalMiddleTargetBodies':2,'middleSourceArithmeticRecords':10588,
                     'middleInverseOperandsWithNonzeroLower':29,'middleTargetLogCap':'H/2^256'}


def verify_frame(raw, source, detail):
    assert entry(raw(FRAME+'MANIFEST.json'))['sha256'] == FRAME_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,FRAME,'MANIFEST.json','producedFiles')
    assert manifest['schema'] == 'MathScope.C97.MiddleFixedLabelForcedCoefficientBudget/1'
    assert members == {'MANIFEST.json','README.md','middle-frame-budget.json',
                       'verify_middle_frame_budget.py','replay.log'}
    assert manifest['originalNormalizedCovariance'] and manifest['ordinarySlowThrough'] == 8
    assert manifest['byteIdenticalCompleteReplays'] == 2
    assert manifest['orderedVariationDirectionsPerHarmonic'] == 23
    assert manifest['coefficientLogDegreeEnvelope'] == [29109,10121,437,1619]
    assert manifest['conditionalCoefficientLogBudget'] == 'H/2^109'
    assert manifest['meanPathFactorAllowed'] == 'M=exp(H/2^128)'
    assert manifest['conditionalMiddleEnergyRatio'] == '<2^-32'
    assert manifest['producedFiles']['middle-frame-budget.json'] == FRAME_SHA
    frame = source(FRAME+'middle-frame-budget.json')
    assert frame['status'] == 'VERIFIED_MIDDLE_FRAME_RECURRENCE_CONDITIONAL_ACTUAL_MEAN_AND_FORCED_ENERGY'
    assert frame['pins']['middleAttachment'] == BODY_SHA and frame['pins']['middleTargetLog'] == LOG_SHA
    result = frame['middleCrossGuardAndConditionalEnergy']
    assert result['weightedPhysicalEpsilonExponent'] == '69999/50000'
    assert result['conditionalMiddleEnergyRatioStrictUpper'] == '2^-32'
    assert result['conditionalThreePieceEnergyRatioStrictUpper'] == '2^-30'
    assert detail['sourceStatus'] == 'VERIFIED'
    assert detail['ordinaryStatus'] == 'CONDITIONAL_ACTUAL_WHOLE_MEAN_PATH_AND_RAW_SOURCE_GRADES'
    assert detail['orderedVariationDirectionsPerHarmonic'] == manifest['orderedVariationDirectionsPerHarmonic']
    assert detail['coefficientLogDegreeEnvelope'] == manifest['coefficientLogDegreeEnvelope']
    assert detail['coefficientLogCap'] == manifest['conditionalCoefficientLogBudget']
    for key in ('conditionalMiddleEnergyRatioStrictUpper','conditionalThreePieceEnergyRatioStrictUpper'):
        assert detail[key] == result[key]
    assert len(result['disjointIntegrationPartition']) == 3
    for record in (manifest,frame):
        assert record['release'] == 'HOLD' and record['finalJets'] == 0
    return members, {'middleCoefficientLogBudget':'H/2^109',
                     'conditionalMiddleEnergyRatio':'<2^-32',
                     'conditionalThreePieceEnergyRatio':'<2^-30'}


def verify_premean(raw, source, detail):
    assert entry(raw(PREMEAN+'MANIFEST.json'))['sha256'] == PREMEAN_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,PREMEAN,'MANIFEST.json','producedFiles')
    assert manifest['schema'] == 'MathScope.C97.MiddlePreFiveMapWholePath/1'
    assert members == {'MANIFEST.json','README.md','premean-whole-path.json',
                       'verify_premean_whole_path.py','replay.log'}
    assert manifest['producedFiles']['premean-whole-path.json'] == PREMEAN_SHA
    proof = source(PREMEAN+'premean-whole-path.json')
    assert proof['status'] == 'VERIFIED_WHOLE_PATH_TEMPORAL_MEAN_GRADE_CONDITIONAL_GLOBAL_PRIMARY_AND_GEOMETRY'
    assert proof['exactDerivativeRoles'] == {'covariance':626,'shiftedPrimitive':359,'inverseForcing':173}
    assert (proof['maxOriginalCovarianceSlowOrder'],proof['maxOriginalCovarianceLOrder']) == (7,8)
    assert [proof['components'][name]['maxBandIntercept'] for name in ('beta','v','gamma')] == ['21/2','9/2','15/2']
    assert proof['extraEpsilonDebitsRelativeToOuter'] == {'beta':'0','v':'0','gamma':'1/20000'}
    assert proof['worstGammaOrdinaryDirection'] == [[5,0,0]]
    assert proof['conditionalLoweredPhysicalGradeForAffineMeanDependence'] == '139993/100000'
    comparison = proof['conditionalPhysicalEnergyComparison']
    assert comparison['rawGradeAfterSingleAffineMeanDebit'] == '49997/50000'
    assert comparison['weightedPhysicalGradeAfterCoefficientAndBandDebit'] == '139993/100000'
    assert Fraction(comparison['strictAmplitudeLogMarginOverH']) > Fraction(1,2)
    assert comparison['conditionalMiddleEnergyRatioStrictUpper'] == '2^-32'
    assert detail['sourceStatus'] == 'VERIFIED' and detail['ordinaryStatus'].startswith('CONDITIONAL_')
    assert detail['exactDerivativeRoles'] == proof['exactDerivativeRoles']
    assert detail['extraGammaEpsilonDebit'] == proof['extraEpsilonDebitsRelativeToOuter']['gamma']
    assert detail['conditionalPhysicalGrade'] == comparison['weightedPhysicalGradeAfterCoefficientAndBandDebit']
    assert detail['conditionalMiddleEnergyRatioStrictUpper'] == comparison['conditionalMiddleEnergyRatioStrictUpper']
    for record in (manifest,proof):
        assert record['release'] == 'HOLD' and record['finalJets'] == 0
    return members, {'wholePathTemporalRoles':proof['exactDerivativeRoles'],
                     'wholePathExtraGammaEpsilonDebit':'1/20000',
                     'conditionalAffineMeanPhysicalGrade':'139993/100000'}


def verify_mean(raw, source, detail):
    assert entry(raw(MEAN+'MANIFEST.json'))['sha256'] == MEAN_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,MEAN,'MANIFEST.json','producedFiles')
    assert members == {'MANIFEST.json','README.md','after-temporal-five-map.json',
                       'verify_after_temporal_five_map.py','replay.log'}
    assert manifest['schema'] == 'MathScope.C97.ActualPostTemporalFiveMapEvidence/1'
    assert (manifest['sourceNodes'],manifest['exactMatrixRows'],manifest['byteIdenticalReplays']) == (22155584,5,2)
    assert manifest['producedFiles']['after-temporal-five-map.json'] == MEAN_SHA
    proof = source(MEAN+'after-temporal-five-map.json')
    assert proof['schema'] == 'MathScope.C97.ActualPostTemporalFiveMap/1'
    assert proof['status'] == 'VERIFIED_NATIVE_POST_TEMPORAL_TARGETS_AND_FIVE_MATRIX_ROWS'
    assert proof['scaledTargetApplications'] == [21374490,21374532,21374576]
    assert proof['scaleRoots'] == [17744708,17744712,17744716]
    assert [row['total'] for row in proof['haarGroups']] == [132,24,69]
    assert proof['sourceStream']['nodes'] == 22155584
    assert proof['sourceStream']['originalPrefixRecords'] == 22153782
    rows = proof['fiveMapCoefficients']
    assert rows['angular'] == [21374880,21374883,21374886]
    assert rows['axial'] == [21374903,21374905]
    assert rows['fiveZeroNumerators'] and rows['rejectedWrongRightSides'] == [0,21375211]
    assert proof['beta'] == {'integral':21374941,'nativeGammaZ':21374939,'wholeGammaMomentZero':True}
    bounds = proof['conditionalBounds']
    assert bounds['fiveNormalizedMomentLower'] == '2^-16'
    assert bounds['angularNodeGapStrictLower'] == '1/8' and bounds['axialNodeGapLower'] == 'lambda/5'
    assert bounds['unscaledDefectUpper'] == '2^9 * B_R^4 * epsilon * (C_T^2+C_W)'
    assert bounds['defectZOrders'] == {'P':3,'Jtheta':4,'Jz':3}
    assert bounds['differentiatedInverseSystem']['throughZ'] == 4
    assert bounds['liveChart'] == {'s':17732766,'eta':17732775,'physicalSNegA':17732888,'sDependsOnZ':True}
    assert bounds['mixedRZDerivativeOrder'] == 3 and bounds['profileDerivativeOrderNeededForBeta'] == 4
    assert detail['sourceStatus'] == 'VERIFIED' and detail['ordinaryStatus'].startswith('CONDITIONAL_')
    assert detail['exactMonomialCounts'] == [row['total'] for row in proof['haarGroups']]
    assert detail['rejectedWrongRightSides'] == rows['rejectedWrongRightSides']
    assert detail['differentiatedLiveChart'] == bounds['liveChart']['s']
    assert detail['requiredZOrders'] == bounds['defectZOrders']
    for record in (manifest,proof,detail):
        if 'release' in record:
            assert record['release'] == 'HOLD'
        if 'finalJets' in record:
            assert record['finalJets'] in (0,'0/67')
    return members, {'afterTemporalFiveMap':detail,
                     'afterTemporalFiveMapReceiptSHA256':manifest['producedFiles']['after-temporal-five-map.json']}


def verify_y(raw, source, detail):
    assert entry(raw(Y+'manifest.json'))['sha256'] == Y_MANIFEST_SHA
    manifest,members = manifest_files(raw,source,Y,'manifest.json','filesSHA256')
    assert manifest['schema'] == 'MathScope.C97.OriginalN1B26RestartEvidence/1'
    assert members == {'manifest.json','README.md','b26-restart-operands.json','b26-restart.json',
                       'replay_n1_b26_restart.mjs','replay.log','source-replay.log','verify_n1_b26_restart.py'}
    assert manifest['filesSHA256']['b26-restart.json'] == Y_RECEIPT_SHA
    assert manifest['filesSHA256']['b26-restart-operands.json'] == Y_OPERANDS_SHA
    receipt = source(Y+'b26-restart.json')
    assert receipt['schema'] == 'MathScope.C97.OriginalN1B26RestartAndNonextension/1'
    assert receipt['sourceStatus'] == 'VERIFIED_ORIGINAL_B26_SWITCH_AND_SIX_ACTUAL_RIGHT_NATIVE_REQUESTS'
    assert receipt['ordinaryStatus'] == detail['ordinaryStatus']
    assert receipt['sourceOperandsSHA256'] == Y_OPERANDS_SHA
    assert (receipt['actualSystem'],receipt['naturalAuxiliarySystem']) == (0,1)
    assert receipt['sameAllFixedLeftRightLeadingJets']
    assert receipt['registeredPressureMatrixEntry'] == detail['trackedMatrixEntry'] == 25602
    assert receipt['rightWitness']['X'] == detail['rightWitness'] == 28814
    assert receipt['rightWitness']['normalizedLogRadius'] == 'y/t1=1/128'
    assert receipt['relativeRightMatrixEntryLogGap']['bothPositive']
    assert receipt['actualRadialKernelExtendsAnalyticallyAcrossSeam'] is False
    restart = receipt['rightRestart']
    assert restart['restartEndX'] == detail['restartEndX'] == 117692
    assert restart['sourceC1'] == 24818 and restart['termsDisplayed'] == 2
    assert len(restart['actualCalls']) == detail['actualRightCalls'] == 6
    assert len(restart['evenCalls']) == 4
    assert Fraction(restart['geometricRatioStrictUpper']) == Fraction(3,2**20)
    assert Fraction(restart['twoTermErrorOverOnePlusOriginalLeftNormUpper']) == Fraction(18,2**40)
    assert restart['etaDerivativeTailFactor'] == 'm!*(2/s0)^m'
    assert receipt['additionalFinalJets'] == detail['additionalFinalJets'] == 0
    assert receipt['release'] == 'HOLD'
    return members, {'nativeN1B26RightCalls':6,'nativeN1B26Seam':'Y=4',
                     'nativeN1B26RestartTailRatioUpper':'3/1048576'}


def verify_lean(raw, source):
    assert entry(raw(LEAN+'receipt.json'))['sha256'] == LEAN_RECEIPT_SHA
    receipt = source(LEAN+'receipt.json')
    assert receipt['schema'] == 'MathScope.C97.HostedLeanReceipt/1'
    assert (receipt['run'],receipt['head'],receipt['conclusion']) == (LEAN_RUN,LEAN_HEAD,'success')
    assert set(receipt['theorems']) == THEOREMS and receipt['files'] == {LEAN_PATH:LEAN_SHA}
    axiom_names = receipt['axioms']
    assert axiom_names == ['propext','Classical.choice','Quot.sound']
    log = raw(LEAN+'FiveMapMeanGauge.log').decode()
    for theorem in THEOREMS:
        line = f"'MathScope.M3.CD.{theorem}' depends on axioms: [{', '.join(axiom_names)}]"
        assert line in log, theorem
    assert 'sorryAx' not in log and 'error:' not in log
    assert f'{LEAN_SHA}  {LEAN_SHORT}' in raw(LEAN+'source-sha256.txt').decode().splitlines()
    assert 'Lean (version' in raw(LEAN+'version.txt').decode()
    return {'hostedLeanRun':LEAN_RUN,'hostedLeanTheorems':len(THEOREMS)}


def verify_evidence(raw, source):
    public = source(PUBLIC)
    assert public['schema'] == 'MathScope.C97.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'],public['bytes']) == (200,30707818)
    assert public['sha256'] == PUBLIC_SHA and public['samePublicBodyAsC96']
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'
    status = source(STATUS)
    assert status['schema'] == 'MathScope.C97.VerificationStatus/1' and status['branch'] == BRANCH
    for row in (status,source('STATUS.json')):
        assert (row['M3']['accepted'],row['M3']['total']) == (62,64)
        assert (row['jets']['accepted'],row['jets']['total']) == (0,67)
        assert row['release'] == 'HOLD'
    detail = status['continuation97']
    assert status['operatingR108'] == 'OPEN'
    gates = status['verification']
    assert gates['M3'] == status['M3']
    assert gates['M4']['operatingR108'] == 'OPEN' and gates['Y']['generalNative'] == 'OPEN'
    assert gates['finalN8Refinements'] == '0/4' and gates['jets'] == '0/67' and gates['release'] == 'HOLD'
    assert all(detail[key]=='OPEN' for key in ('wholeK1','wholeN706','wholeN805'))
    assert (detail['leanRun'],detail['leanCompiled']) == (LEAN_RUN,len(THEOREMS))
    covariance = detail['middleCovariance']
    assert covariance == {
        'sourceStatus':'VERIFIED','analyticStatus':'CONDITIONAL','actualTargetBodies':2,
        'sourceArithmeticRecords':10588,'inverseOperandsWithNonzeroLower':29,
        'ordinarySlowOrder':8,'targetLogCap':'H/2^256',
    }
    covariance_members,covariance_evidence = verify_covariance(raw,source)
    frame_members,frame_evidence = verify_frame(raw,source,detail['middleFrame'])
    premean_members,premean_evidence = verify_premean(raw,source,detail['middlePremeanWholePath'])
    mean_members,mean_evidence = verify_mean(raw,source,detail['afterTemporalFiveMap'])
    y_members,y_evidence = verify_y(raw,source,detail['nativeYB26'])
    assert b'<!--' not in raw(REPORT)
    return {COVARIANCE:covariance_members,FRAME:frame_members,PREMEAN:premean_members,
            MEAN:mean_members,Y:y_members,LEAN:LEAN_FILES},{
        **covariance_evidence,**frame_evidence,**premean_evidence,**mean_evidence,**y_evidence,
        **verify_lean(raw,source),
        'operatingByteReadback':public['bytes'],'finalN8Comparisons':0,'finalJets':0,
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

    expected_relative = {REPORT,STATUS,PUBLIC,'assemble_continuation97.py',
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
