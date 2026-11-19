"""Assemble the additive C93 scalar and raw-weight evidence from Git blobs."""

from fractions import Fraction
import json
from pathlib import PurePosixPath
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PUBLIC_SHA, sha256_stream
from assemble_continuation39 import entry, read_arguments
from assemble_continuation92 import LEAN_HEAD, LEAN_RUN, PARENTS as EARLIER, verify_lean
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '376ba71eab534cc79d5502be2d982cc658a46649'
PARENTS = {
    **EARLIER,
    'MathScope_Goal_Continuation92_Delta_20261120.zip':
        '8d8dbae2bea168a1c79b5e111de81b962bfcc9de92abeaa852669c15087a171d',
}
LABEL = 'MathScope_Goal_Continuation93'
DATE = '20261120'
REPORT = 'REPORT_CONTINUATION93_KO.md'
STATUS = 'STATUS_CONTINUATION93.json'
PUBLIC = 'preservation-continuation93.json'
ROOT = ('primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/'
        'first-forced-budget/outer-weight-comparison/')
RAW = ROOT + 'raw-weights/'
ROOT_FILES = {'README.md','verify_outer_scalar_budget.py','outer-scalar-budget.json','replay.log'}


def safe_member(path):
    value = PurePosixPath(path)
    assert path and not value.is_absolute() and '..' not in value.parts and '\\' not in path, path
    assert path == value.as_posix(), path
    return path


def verify_scalar(raw, source):
    scalar = source(ROOT + 'outer-scalar-budget.json')
    assert scalar['status'] == 'VERIFIED_SCALAR_TRANSFER_WITH_CONDITIONAL_FIELD_INPUT'
    pins = scalar['inputPins']
    assert {'label','scale','band','logBudget','geometry','epsilon'} <= set(pins)
    for pin in pins.values():
        path = safe_member(pin['path'])
        assert entry(raw(path))['sha256'] == pin['sha256'], path
    assert source(pins['scale']['path'])['actualRoots']['qBig'] == 622791
    assert source(pins['epsilon']['path'])['uniformFormalLowerGradeBothModes'] == '49999/100000'
    assert 'Every active label C+14<=ell_prime<=C+16' in source(pins['label']['path'])['representativeMargin']
    threshold = scalar['threshold']
    assert threshold['H'] == 'h (ellMinimum+15) log(2)'
    assert threshold['closedLabelOffsets'] == [-2,2] and threshold['activeAtlasLabelOffsets'] == [-1,1]
    assert threshold['HOverMinusLogEpsilonUpper'] == 2
    assert threshold['logSOverHUpperAsNegativePowerOfTwo'] == 32636
    envelope = scalar['envelopeInputs']
    assert envelope['C92FieldAndVariationLogOverH'] == '2^-109'
    assert envelope['C92GeometryLogOverH'] == '2^-124'
    assert envelope['prepaidLogChargesIncludingOptionalGaussianLoss'] == [256,32,8]
    assert envelope['prepaidRemainderFactorExcludingGaussianLoss'] == '2^128 Bnorm^32 M^8'
    assert envelope['maximumBandDegree'] == 30
    assert envelope['maximumOuterRadialPoleForOptionalAbsorption'] == 24
    assert Fraction(envelope['oppositeGaussianConversionPerModeFactor']) == Fraction(100352,100351)
    assert sum(envelope['finiteSideCoefficientsPowersOfTwo'].values()) < 128
    result = scalar['conditionalScalarConclusion']
    assert result['oldEpsilonGrade'] == '49999/100000'
    assert result['epsilonLossUpper'] == '1/100000' and result['newEpsilonGrade'] == '24999/50000'
    assert Fraction(result['oldEpsilonGrade']) - Fraction(result['epsilonLossUpper']) == Fraction(result['newEpsilonGrade'])
    assert Fraction(result['newEpsilonGrade']) < Fraction(1,2)
    assert result['originalPulseFactorOutsideQuotient'] == 'P(v) for both modes'
    assert scalar['additionalFinalJets'] == 0 and scalar['release'] == 'HOLD'
    return scalar


def verify_weights(raw, source):
    manifest = source(RAW + 'MANIFEST.json')
    files = manifest['producedFiles']
    assert files and all('/' not in safe_member(path) for path in files)
    receipts = [path for path in files if path.endswith('.json')]
    assert len(receipts) == 1
    for path, digest in files.items():
        assert entry(raw(RAW + path))['sha256'] == digest, path
    weights = source(RAW + receipts[0])
    assert weights['status'] == 'VERIFIED_RAW_SOURCE_DEGREE_ENUMERATION_CONDITIONAL_ON_SAME_CHART_FIELD_NORMS'
    assert weights['distinctDirections'] == len(weights['directions']) == 23
    assert len({tuple(x) for x in weights['directions']}) == 23
    assert weights['explicitCommonEpsilonGrade'] == '49999/100000'
    assert weights['primaryGaussianWeight'].startswith('g(d)=exp(-2/d^2)*d^(-3/2)')
    assert weights['meanZetaPoleAbsorption']['maxPriorPole'] == 27
    assert weights['profileScope']['sameFixedOriginalChartAndRepresentative']
    assert weights['profileScope']['constantMultiplicitiesNotRebudgeted']
    assert not weights['profileScope']['nativeFieldNumericalEnclosures']
    assert weights['finalJets'] == manifest['finalJets'] == 0
    assert weights['release'] == manifest['release'] == 'HOLD'
    joined = weights['conditionalOrderedVariation']
    assert set(joined) == {'1','2'}
    assert [joined[m]['rawUniformBandInterceptAtSlope3'] for m in ('1','2')] == ['67/4','19/2']
    assert all(joined[m]['rawUniformPoleInterceptAtSlope3'] == 9 for m in joined)
    band, pole = {}, {}
    directions = {tuple(x) for x in weights['directions']}
    for mode, result in joined.items():
        rows = result['physicalOverP']
        assert len(rows) == 23 and {tuple(x['RZL']) for x in rows} == directions
        band[mode] = max(Fraction(x['velocityOverPBandPower']) for x in rows)
        pole[mode] = max(x['additionalLogPoleAfterGToMode'] for x in rows)
    assert band == {'1':Fraction(119,4),'2':Fraction(22)}
    assert pole == {'1':21,'2':21}
    return files, receipts[0], weights, {m:str(v) for m,v in band.items()}, pole


def verify_evidence(raw, source):
    scalar = verify_scalar(raw,source)
    weight_files, weight_receipt, weights, band, pole = verify_weights(raw,source)
    assert scalar['actualWeightLedgerSHA256'] == weight_files[weight_receipt]
    assert scalar['actualDerivedDegreeRows'] == {
        mode:{'maxBandPower':band[mode], 'maxAdditionalPole':pole[mode]} for mode in band
    }
    public = source(PUBLIC)
    assert public['schema'] == 'MathScope.C93.ReadOnlyProductionReceipt/1'
    assert public['method'] == 'GET' and (public['status'],public['bytes']) == (200,30707818)
    assert public['sha256'] == PUBLIC_SHA and public['samePublicBodyAsC92']
    assert public['operatingR108'] == 'OPEN' and public['release'] == 'HOLD'
    baseline_public = source('preservation-continuation92.json')
    assert public['observation'] == 'Reused the authenticated C92 same-turn readback'
    for key in ('url','observedUtc','status','bytes','sha256'):
        assert public[key] == baseline_public[key], key

    for name in (STATUS,'STATUS.json'):
        status = source(name)
        assert (status['M3']['accepted'],status['M3']['total']) == (62,64)
        assert (status['jets']['accepted'],status['jets']['total']) == (0,67)
        assert status['release'] == 'HOLD'
    status = source(STATUS)
    assert status['schema'] == 'MathScope.C93.VerificationStatus/1' and status['branch'] == BRANCH
    assert status['operatingR108'] == 'OPEN'
    gates = status['verification']
    assert gates['M3'] == status['M3']
    assert gates['M4']['operatingR108'] == 'OPEN' and gates['Y']['generalNative'] == 'OPEN'
    assert gates['finalN8Refinements'] == '0/4' and gates['jets'] == '0/67' and gates['release'] == 'HOLD'
    detail = status['continuation93']
    assert [detail[f'mode{mode}MaxBandPower'] for mode in ('One','Two')] == [band['1'],band['2']]
    assert detail['maxAdditionalPole'] == max(pole.values()) and detail['directions'] == 23
    assert detail['newConditionalEpsilonGrade'] == scalar['conditionalScalarConclusion']['newEpsilonGrade']
    assert detail['inheritedLeanRun'] == LEAN_RUN
    for key in ('originalShiftedPathAdmission','comparisonToPrimaryHalfEpsilon','fullEnergyComparison'):
        assert detail[key] == 'OPEN'
    inherited = verify_lean(raw,source)
    assert inherited == {'hostedLeanRun':LEAN_RUN,'hostedLeanTheorems':2}
    return weight_files, {
        'rawWeightDirections':weights['distinctDirections'],
        'maximumOrderedBandDegrees':band,
        'maximumOrderedRadialPoles':pole,
        'conditionalEpsilonGrade':scalar['conditionalScalarConclusion']['newEpsilonGrade'],
        'inheritedHostedLeanRun':LEAN_RUN,'inheritedHostedLeanTheorems':2,
        'newHostedLeanTheorems':0,
        'operatingByteReadback':public['bytes'],
        'finalN8Comparisons':0,'finalJets':0,
    }


def assemble(args):
    outputs = args.workspace / 'outputs'

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

    previous = {}
    for name,pin in PARENTS.items():
        package = outputs/name
        assert file_sha(package) == pin, name
        with ZipFile(package) as bundle:
            previous.update(json.loads(bundle.read('SHA256.json')))
    weight_files,evidence = verify_evidence(raw,source)

    delta = outputs/f'{LABEL}_Delta_{DATE}.zip'
    pending = delta.with_suffix('.zip.tmp')
    files = {}
    with ZipFile(pending,'w',compression=ZIP_DEFLATED,compresslevel=5) as bundle:
        def add(path,data):
            assert path not in files, path
            bundle.writestr(path,data)
            files[path] = entry(data)

        expected = {REPORT,STATUS,PUBLIC,'assemble_continuation93.py',
                    *(ROOT+name for name in ROOT_FILES),
                    RAW+'MANIFEST.json',*(RAW+name for name in weight_files)}
        for line in git('diff','--name-status','--no-renames',PARENT,head).decode().splitlines():
            change,path = line.split('\t')
            relative = path.removeprefix(CURRENT+'/')
            assert change == 'A' and path.startswith(CURRENT+'/') and relative in expected, path
            add(path,git('show',f'{head}:{path}'))
        assert set(files) == {CURRENT+'/'+path for path in expected}
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
    receipt = {
        'file':delta.name,'bytes':delta.stat().st_size,'files':len(files)+1,
        'sha256':file_sha(delta),'branchHead':head,**evidence,'verifiedDeltaManifest':True,
    }
    (outputs/f'{LABEL}_Report_{DATE}_KO.md').write_bytes(raw(REPORT))
    (outputs/f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == '__main__':
    assemble(read_arguments(__doc__))
