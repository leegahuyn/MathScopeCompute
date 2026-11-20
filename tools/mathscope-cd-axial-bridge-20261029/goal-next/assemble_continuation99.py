"""Assemble the C99 Signed centered flux and original N1 compensation Git delta."""

import json
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation98 import BUDGET, PARENTS as EARLIER, manifest_files
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '6b1c2c725a69eac67b57848c0bfe9d2aa5291e5f'
PARENTS = {**EARLIER,'MathScope_Goal_Continuation98_Delta_20261120.zip':
           'd6c62851b1de8313367e06e15238944d4a498eaf25a75bf2d136978354893a2a'}
REPORT, STATUS = 'REPORT_CONTINUATION99_KO.md','STATUS_CONTINUATION99.json'
PUBLIC = 'preservation-continuation99.json'
LABEL, DATE = 'MathScope_Goal_Continuation99','20261120'
ROOT = BUDGET+'signed-centered-flux/'
FRONTIER = BUDGET+'signed-k1-frontier/'
DONOR = BUDGET+'signed-donor/'
MODE_TWO = BUDGET+'signed-mode-two-z5/'
LEAN = ROOT+'lean-github/'
Y = 'y-higher-flow/picard-n1-global-compensation/'
LEAN_SHORT = 'MathScope/M3/CD/SignedStressEnergyGate.lean'
LEAN_PATH = 'research-ide/mathscope-m3/p8/lean/'+LEAN_SHORT
LEAN_RUN = 44651071568
LEAN_HEAD = '20dcf30e3304e00bb3691b1da07ebccdd5cfcba5'
LEAN_SHA = '0457ec15cc301b3bcdcab02c5f934263201192e9408eafd03ab47fadfe7eec61'
LEAN_RECEIPT_SHA = '9aa464a92502c8e4aaa8d92417d8e9ec99134c8d4bed459ecbbdbfbb2c2effd3'
THEOREMS = {'signed_centered_radial_flux','signed_centered_time_cutoff'}
LEAN_FILES = {'SignedStressEnergyGate.log','receipt.json','version.txt','source-sha256.txt'}
FRONTIER_MANIFEST = 'c2ef11682ea37c2076cf489babf6321ea72444fee84f6e112e75c63bc9f38faf'
FRONTIER_SHA = '4ddef46553be2e296df327c513257e75085753f8a16e822ddcd16e105ad726c3'
DONOR_MANIFEST = '3da17dc50d577ecd0f08577e11095b099b3264dbfe3051e9f221ba32c3d6ca6b'
DONOR_SHA = '59a4d94452cfb02be03851b567c09a1331e62ba3db679eeb9373cc755fc0bb5e'
MODE_TWO_MANIFEST = '9961e8932633a7a435e6fa3d62fe16ce0e529d8cb8d46ed18fd5735ff5b1aef0'
MODE_TWO_SHA = 'f45cfa6ef06091a25e3a75222187773fdca7efb2008d2bd078a3b0a9d9b6671a'
ROOT_MANIFEST = '97b570692df134b559d29c71303105f40775eeca840be576e5a8e20e5a3be070'
ROOT_SHA = '8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942'
Y_MANIFEST = 'b15f0d25a2a1114a75bdfb7c6b2e1f59ab3e37f3375889eca340264fe0ef0f17'
Y_OPERANDS_SHA = 'd52bfc8ddd4a9987cd25d3d4a2161cc10e19d8d2ee7975f87ae2e7b68f8e27be'
Y_SHA = '05f6adaa85ad7adf05a5c4943e4f01e98794243f3dab8c7c0a1f85c9f4f5b387'


def verify_y(raw, source, detail):
    assert entry(raw(Y+'manifest.json'))['sha256'] == Y_MANIFEST
    manifest,members = manifest_files(raw,source,Y,'manifest.json','filesSHA256')
    assert manifest['schema'] == 'MathScope.C99.ActualN1GlobalCompensationEvidence/1'
    assert manifest['byteIdenticalNodeReplays'] == manifest['byteIdenticalPythonReplays'] == 2
    assert members == {'manifest.json','README.md','n1-ipos-transfer-operands.json','n1-ipos-transfer.json',
                       'replay_n1_ipos_transfer.mjs','check_n1_ipos_transfer.py','source-replay.log','replay.log'}
    assert manifest['filesSHA256']['n1-ipos-transfer.json'] == Y_SHA
    assert manifest['filesSHA256']['n1-ipos-transfer-operands.json'] == Y_OPERANDS_SHA
    proof = source(Y+'n1-ipos-transfer.json')
    assert proof['schema'] == 'MathScope.C99.ActualN1GlobalCompensationError/1'
    assert proof['sourceStatus'] == 'VERIFIED_ORIGINAL_FIVE_MOMENTS_FIXED_OMEGA_INVERSES_AND_GLOBAL_APPROXIMANT'
    assert proof['ordinaryStatus'] == detail['ordinaryStatus']
    assert proof['operandsSHA256'] == Y_OPERANDS_SHA
    assert proof['originalLocalMoments'] == [28864,28878,28905,28943,28983]
    assert proof['fixedLeadingOmegaRoots'] == [24733,24744]
    assert (proof['nativeRequestsReplaced'],proof['verifiedOriginalRawDomainContexts']) == (18,193)
    assert (proof['outputsTransferred'],proof['momentResidualNumeratorsZero']) == (9,5)
    assert proof['rawNativeMaxX'] == 28823 and proof['registeredRightBoundary'] == 24805
    assert proof['positiveOrderFieldCutoff'] == 28824 and proof['orderOneStressBoundary'] == 28826
    assert proof['normFrame']['E'] == '2^74 Q^-77'
    assert proof['normalizedInverseInfinityUpper'] == {'U':1024,'E':16777216}
    assert proof['globalErrorOverEOnDeltaOver8'] == dict.fromkeys(('F1','U1','E1','M1','M1overX','Pi1'),1)
    assert proof['globalErrorOverEOnDeltaOver16'] == {'V1':1,'v1':'2^8/delta','pressureDerivative':'2^5 Q'}
    assert max(proof['allOutputAbsoluteEtaErrorBinaryExponentsThrough8']) == -15202
    assert detail['sourceStatus'] == 'VERIFIED' and detail['pureEtaOrder'] == 8
    assert (detail['originalRawNativeCalls'],detail['originalRawDomainContexts']) == (18,193)
    assert (detail['originalGlobalOutputCount'],detail['exactFiniteMomentResidualsZero']) == (9,5)
    assert detail['globalMainErrorBound'] == proof['normFrame']['E']
    assert detail['maxAbsoluteEtaErrorBinaryExponent'] == -15202
    assert proof['additionalFinalJets'] == 0 and proof['release'] == 'HOLD'
    return members,{'originalN1CompensatedOutputs':9,'originalN1RawNativeCalls':18,
                    'originalN1RawDomainContexts':193,'exactN1FiniteMomentResidualsZero':5,
                    'originalN1GlobalMainErrorBound':'2^74 Q^-77'}


def verify_frontier(raw, source):
    assert entry(raw(FRONTIER+'MANIFEST.json'))['sha256'] == FRONTIER_MANIFEST
    manifest,members = manifest_files(raw,source,FRONTIER,'MANIFEST.json','producedFiles')
    assert manifest['schema'] == 'MathScope.C99.SignedK1WeightedSourceFrontier/1'
    assert members == {'MANIFEST.json','README.md','verify_signed_k1_frontier.py','signed-k1-frontier.json','replay.log'}
    assert manifest['sameLiveSignedPotentialBodies'] == 6
    assert manifest['postForcedHaarRoots'] == [21999624,22000447]
    assert manifest['signedSigmaRoots'] == [22001223,22001224]
    assert manifest['sufficientSigmaEpsilonGrade'] == '30001/50000'
    assert manifest['conditionalPhysicalEpsilonGrade'] == '50001/100000'
    assert manifest['conditionalSignedEnergyRatio'] == '<2^-32'
    assert manifest['byteIdenticalCompleteReplays'] == 2
    assert manifest['producedFiles']['signed-k1-frontier.json'] == FRONTIER_SHA
    assert manifest['finalJets'] == 0 and manifest['release'] == 'HOLD'
    return members,{'signedSufficientSigmaGrade':'30001/50000','conditionalSignedPhysicalGrade':'50001/100000',
                    'conditionalSignedEnergyRatio':'<2^-32'}


def verify_donor(raw, source):
    assert entry(raw(DONOR+'MANIFEST.json'))['sha256'] == DONOR_MANIFEST
    manifest,members = manifest_files(raw,source,DONOR,'MANIFEST.json','producedFiles')
    assert manifest['schema'] == 'MathScope.C99.CenteredSignedPressureAndDonorDegrees/1'
    assert members == {'MANIFEST.json','README.md','verify_signed_pressure_donor.py','signed-pressure-donor.json','replay.log'}
    assert (manifest['rationalFubiniChecks'],manifest['endpointRetainingIbPChecks']) == (54,9)
    assert manifest['genericPureZ5Coefficient'] == '3/67603900'
    assert manifest['conditionalLowestForcedCovarianceEpsilonGrade'] == '74997/50000'
    assert manifest['highestRemainingOrdinaryPotentialDonor'] == 'C_theta,Z^5'
    assert manifest['byteIdenticalCompleteReplays'] == 2
    assert manifest['producedFiles']['signed-pressure-donor.json'] == DONOR_SHA
    assert manifest['finalJets'] == 0 and manifest['release'] == 'HOLD'
    return members,{'signedFubiniIdentities':54,'signedEndpointIbPChecks':9,
                    'genericSignedPureZ5Coefficient':'3/67603900'}


def verify_mode_two(raw, source, detail):
    assert entry(raw(MODE_TWO+'MANIFEST.json'))['sha256'] == MODE_TWO_MANIFEST
    manifest,members = manifest_files(raw,source,MODE_TWO,'MANIFEST.json','producedFiles')
    assert manifest['schema'] == 'MathScope.C99.SelectiveModeTwoAxialZ5/1'
    assert members == {'MANIFEST.json','README.md','verify_mode_two_z5.py','mode-two-z5.json','replay.log'}
    assert (manifest['originalMonomials'],manifest['originalRealImaginaryScalars']) == (1270,60)
    assert manifest['additionalOrdersRZL'] == [[0,4,0],[0,5,0]] and manifest['orderedWordsAtZ5'] == 32
    assert manifest['normalizedZ5BandPower'] == '25' and manifest['additionalZ5PoleAfterG2'] == 24
    assert manifest['conditionalCoefficientLogCap'] == 'H/2^112'
    assert manifest['conditionalAfterAbsorptionEpsilonGrade'] == '49999/50000'
    assert manifest['byteIdenticalCompleteReplays'] == 2
    assert manifest['producedFiles']['mode-two-z5.json'] == MODE_TWO_SHA
    result = source(MODE_TWO+'mode-two-z5.json')
    assert result['conditionalAfterBandAndLogAbsorptionEpsilonGrade'] == '49999/50000'
    for record in (manifest,result):
        assert record['finalJets'] == 0 and record['release'] == 'HOLD'
    assert detail['ordinaryStatus'].startswith('CONDITIONAL_') and detail['sourceStatus'] == 'VERIFIED'
    assert detail['additionalOrdersRZL'] == manifest['additionalOrdersRZL']
    assert detail['conditionalAfterAbsorptionEpsilonGrade'] == manifest['conditionalAfterAbsorptionEpsilonGrade']
    assert detail['phaseFreeModeOneZ5'] == 'OPEN'
    return members,{'modeTwoZ5OriginalMonomials':1270,'modeTwoZ5ExtraOrders':[[0,4,0],[0,5,0]],
                    'conditionalModeTwoZ5AbsorptionGrade':'49999/50000'}


def verify_root(raw, source, detail):
    assert entry(raw(ROOT+'MANIFEST.json'))['sha256'] == ROOT_MANIFEST
    manifest,members = manifest_files(raw,source,ROOT,'MANIFEST.json','producedFiles')
    assert members == {'MANIFEST.json','README.md','signed-pressure-flux.json','verify_signed_pressure.py','replay.log'}
    assert manifest['schema'] == 'MathScope.C99.SignedCenteredFluxEvidence/1'
    assert (manifest['sourceNodes'],manifest['byteIdenticalReplays']) == (22155584,2)
    assert manifest['exactRawMonomialCounts'] == [176,187,739]
    assert manifest['producedFiles']['signed-pressure-flux.json'] == ROOT_SHA
    result = source(ROOT+'signed-pressure-flux.json')
    assert result['schema'] == 'MathScope.C99.SignedCenteredFluxAndHaarPressure/1'
    assert result['status'] == 'VERIFIED_NATIVE_SIGNED_FLUX_PRESSURE_AND_COMPACT_TARGETS_CONDITIONAL_WEIGHTED_DONORS'
    original = result['n1OriginalStressEvidence']
    assert original['originalWholeIntegrandsInOrder'] == [117048,117047]
    assert (original['angularTotal'],original['axialTotal']) == (117072,117075)
    assert original['conditionalOuterRegularCoefficientAttached'] == 17717057
    angular = result['actualAngularN1TerminalBound']
    assert (angular['actualB'],angular['literalOriginalIntegrand'],angular['originalWholeMoment']) == (17717057,117048,117072)
    assert angular['uniformMixedBDerivativeCapThrough2'] == '2^-65000'
    assert angular['weightedStressRemainderPoleByDeltaOrder'] == [3,6,9]
    assert [group['terms'] for group in result['fullHaarGroups']] == detail['exactRawMonomialCounts'] == [176,187,739]
    assert result['sourceStream']['nodes'] == detail['nativeSourceRecords'] == 22155584
    compact = result['compactInitializedFiveMapAttachment']
    assert compact['axialTargetZ6AndZ4T1Attached']
    assert compact['sameSelectiveC8'] == [['W_rz',[0,8,0]],['W_rz',[0,8,2]]]
    assert (compact['covarianceRoles'],compact['shiftedPrimitiveRoles'],compact['inverseForcingRoles']) == (148,43,28)
    assert compact['quadraticGradeTests'] == 152
    assert result['native']['centeredSigmaApplications'] == [22001223,22001224]
    assert result['native']['rawSignedResidualRoots'] == [21999622,22000445]
    assert result['finiteGaussianTransfer']['maximumInputPole'] == detail['maximumGaussianInputPole'] == 512
    assert result['finiteGaussianTransfer']['pressureAndSigmaMaximumNumberOfNestedPrimitives'] == 2
    assert detail['sourceStatus'] == 'VERIFIED' and detail['ordinaryStatus'].startswith('CONDITIONAL_')
    assert detail['nativeSigmaApplications'] == result['native']['centeredSigmaApplications']
    assert detail['compactBeforeFiveMapJthetaJets'] == [[0,6,0],[0,4,1]]
    assert detail['compactMixedTimeCovarianceSlowOrder'] == compact['maxMixedTimeCovarianceSlowOrder'] == 7
    assert detail['additionalSelectiveCovarianceInputs'] == compact['sameSelectiveC8']
    assert detail['terminalAngularN1RegularCoefficient'] == angular['actualB']
    assert detail['terminalAngularN1MixedC2Cap'] == angular['uniformMixedBDerivativeCapThrough2']
    assert detail['wholeSignedK1'] == 'OPEN'
    for record in (manifest,result):
        assert record['release'] == 'HOLD' and record['finalJets'] == 0
    return members,{'signedPressureFluxReceiptSHA256':ROOT_SHA,'signedRawMonomialCounts':[176,187,739],
                    'signedFiniteGaussianMaximumInputPole':512,'actualAngularN1TerminalRoot':17717057}


def verify_lean(raw, source):
    assert entry(raw(LEAN+'receipt.json'))['sha256'] == LEAN_RECEIPT_SHA
    receipt = source(LEAN+'receipt.json')
    assert receipt['schema'] == 'MathScope.C99.HostedLeanReceipt/1'
    assert (receipt['run'],receipt['head'],receipt['conclusion']) == (LEAN_RUN,LEAN_HEAD,'success')
    assert set(receipt['theorems']) == THEOREMS and receipt['files'] == {LEAN_PATH:LEAN_SHA}
    log = raw(LEAN+'SignedStressEnergyGate.log').decode()
    assert 'sorryAx' not in log and 'error:' not in log
    for theorem in THEOREMS:
        assert f"'MathScope.M3.CD.{theorem}' depends on axioms: [{', '.join(receipt['axioms'])}]" in log, theorem
    assert receipt['axioms'] == ['propext','Classical.choice','Quot.sound']
    assert f'{LEAN_SHA}  {LEAN_SHORT}' in raw(LEAN+'source-sha256.txt').decode().splitlines()
    assert 'Lean (version' in raw(LEAN+'version.txt').decode()
    return {'hostedLeanRun':LEAN_RUN,'hostedLeanTheorems':len(THEOREMS)}


def verify_evidence(raw, source):
    public = source(PUBLIC)
    assert public['schema'] == 'MathScope.C99.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'],public['bytes']) == (200,30707818)
    assert public['sha256'] == PUBLIC_SHA and public['samePublicBodyAsC98']
    assert public['isolatedLeanProofHead'] == LEAN_HEAD
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'
    status = source(STATUS)
    assert status['schema'] == 'MathScope.C99.VerificationStatus/1' and status['branch'] == BRANCH
    for row in (status,source('STATUS.json')):
        assert (row['M3']['accepted'],row['M3']['total']) == (62,64)
        assert (row['jets']['accepted'],row['jets']['total']) == (0,67)
        assert row['release'] == 'HOLD'
    assert status['operatingR108'] == 'OPEN'
    gates = status['verification']
    assert gates['M3'] == status['M3']
    assert gates['M4']['operatingR108'] == 'OPEN' and gates['Y']['generalNative'] == 'OPEN'
    assert gates['finalN8Refinements'] == '0/4' and gates['jets'] == '0/67' and gates['release'] == 'HOLD'
    detail = status['continuation99']
    assert all(detail[key]=='OPEN' for key in ('wholeK1','wholeN706','wholeN805'))
    assert (detail['leanRun'],detail['leanCompiled']) == (LEAN_RUN,len(THEOREMS))
    root_members,root = verify_root(raw,source,detail['signedCenteredFlux'])
    frontier_members,frontier = verify_frontier(raw,source)
    donor_members,donor = verify_donor(raw,source)
    mode_two_members,mode_two = verify_mode_two(raw,source,detail['signedModeTwoZ5'])
    y_members,y = verify_y(raw,source,detail['nativeYGlobalCompensation'])
    assert b'<!--' not in raw(REPORT)
    return {ROOT:root_members,FRONTIER:frontier_members,DONOR:donor_members,
            MODE_TWO:mode_two_members,Y:y_members,LEAN:LEAN_FILES},{
        **root,**frontier,**donor,**mode_two,**y,**verify_lean(raw,source),'operatingByteReadback':public['bytes'],
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

    expected_relative = {REPORT,STATUS,PUBLIC,'assemble_continuation99.py',
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
