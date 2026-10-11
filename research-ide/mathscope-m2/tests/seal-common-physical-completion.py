"""Record completed source 5 and the independently reviewed four-gate scope.

This checks existing execution bytes; it never generates a mathematical source
or promotes G-NUM. Earlier attempts and assessment records remain unchanged.
"""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess


ROOT = Path(__file__).resolve().parents[3]
RESEARCH = ROOT / 'research-ide/mathscope-m2/navier/research'
EVIDENCE = RESEARCH / 'evidence/common-physical-package-20261011'
BASE = '6a3e71a884e6faebe808fd67fd0274304a7f45e4'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path):
    return str(path.relative_to(ROOT))


def write_json(path, record, exclusive=False):
    with path.open('x' if exclusive else 'w') as stream:
        stream.write(json.dumps(record, ensure_ascii=False, indent=2) + '\n')


def main():
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == BASE
    source_path = EVIDENCE / 'actual-common-physical-package-source-attempt5.json'
    process_path = EVIDENCE / 'actual-common-physical-package-source-attempt5-process.json'
    source = json.loads(source_path.read_text())
    process = json.loads(process_path.read_text())
    assert sha(source_path) == '44137485e789ef29c6f5ee51dfdcc294102bda3d51f15d442601c859876d04eb'
    assert sha(process_path) == '7616a3134599d15fc6e0e98bc761f129199ce62c83eafc145058b86848c80b0e'
    assert source['complete'] and process['pass'] and process['exitCode'] == 0
    assert process['tests'] == {'passed': 8, 'failed': 0}
    assert not process['timeout'] and not process['interrupted'] and process['runnerError'] is None
    assert len(source['sourceConstructions']) == 8 and set(source['sourceConstructions'].values()) == {1}
    assert all(item['pass'] for item in source['assertions'].values())
    manifest = process['sourceManifest']['files']
    assert len(manifest) == 120
    for row in manifest:
        assert sha(ROOT / row['path']) == row['sha256'], row['path']
    for name, cert in source['certificates'].items():
        # These source certificates expose individual checked obligations;
        # their schema deliberately has no aggregate `pass` property.
        assert cert['sourceBinding'] and cert['graph'], name
        assert cert['checks'] and all(x['pass'] is True for x in cert['checks']), name
    reviews = {
        'COMMON_GATE_SCOPE_POSITIVE_STRESS_REVIEW_KO.md': '63bf26ec55551c12b6cb837c5faa2ba137bc9c57b8a533d30b8923d7e6870abd',
        'COMMON_GATE_COMPLETION_ADDENDUM_POSITIVE_STRESS_20261011.md': 'f60fc381f61bf7184c016a9710e1d7608308d44e543c302357025d038085e19e',
        'INDEPENDENT_SOURCE5_CROSS_PREMISES_NS_REVIEW_KO.md': '2d43c9994a1365d1962dd076ece752c080151198c7b26519920758b5fec1f5a2',
        'SOURCE5_CROSS_PREMISES_NS_AUDIT.json': '1f23e09286f600c00daee52a88d250a9008ee349f41f61ebfe2b46c8ea1ebc56',
    }
    for name, digest in reviews.items():
        assert sha(EVIDENCE / name) == digest, name
    gate_path = RESEARCH / 'M2_COMPLETION_GATE.json'
    gate = json.loads(gate_path.read_text())
    assert gate['assessmentSHA256'] == '0f3166470d68c171951467223694e0043a152fb60908bcbd179e486744198a27'
    paths = {source_path, process_path, *(EVIDENCE / name for name in reviews)}
    paths.update(p for p in EVIDENCE.glob('*attempt5*') if p.is_file())
    paths.update(p for p in (EVIDENCE / 'attempt5-diagnostic-positive-stress-snapshots').rglob('*') if p.is_file())
    paths.update(p for p in EVIDENCE.glob('COMMON_GATE_COMPLETION_ADDENDUM_POSITIVE_STRESS_20261011*.json') if p.is_file())
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    packet = {
        'schema': 'MathScope.CompletedCommonPhysicalPackagePacket/1',
        'sealedAt': now, 'sourceCommitAtExecution': BASE,
        'status': 'EXECUTED_AND_MATHEMATICALLY_REVIEWED_FOUR_NONNUMERICAL_GATES',
        'source': {'path': relative(source_path), 'sha256': sha(source_path), 'complete': True},
        'observedProcess': {'path': relative(process_path), 'sha256': sha(process_path),
                            'exitCode': 0, 'passed': 8, 'failed': 0,
                            'elapsedSeconds': process['elapsedSeconds'], 'peakRSSBytes': process['peakRSSBytes']},
        'graphs': {name: cert['graph'] for name, cert in source['certificates'].items()},
        'executedOrders': {key: value for key, value in source.items() if key.startswith('executed')},
        'constructors': source['sourceConstructions'],
        'sourceImports': {'fileCount': len(manifest), 'allCurrentHashesMatch': True, 'files': manifest},
        'reviewFiles': {relative(EVIDENCE / name): digest for name, digest in reviews.items()},
        'files': {relative(path): sha(path) for path in sorted(paths)},
        'gateConclusions': {name: True for name in ['G-POS', 'G-CURL', 'G-N4', 'G-N5']},
        'scope': {
            'sameOriginalCommonSequenceAndPositiveH': True,
            'allLabelsUseTheirOwnOriginalBandConstruction': True,
            'allFiniteOrdersBySourceConstructorAndInduction': True,
            'allInfiniteGraphsLiterallyExecuted': False,
            'openShellPositivityAndSmoothWeightedZeroExtension': True,
            'etaEndpointRegularityIsOriginalOneSided': True,
            'fullOriginalPhysicalCurlAndCovarianceConnected': True,
            'actualBackgroundEBHasAllFixedOrderFlatBounds': True,
            'fullTemporalCutoffForceHasAllFixedOrderFlatBounds': True,
            'totalUncorrectedNSResidualDeclaredFlat': False,
            'fullResidualAndNonlinearRemaindersRetainedForN6': True,
            'GNUMComplete': False, 'wholeM2Complete': False, 'M3Started': False,
            'newAnalyticLeanKernelExecution': False,
        },
        'promotionBasis': 'The original source identities, common recursive sequence, quantitative positive bounds, all-fixed-order arguments and independent cross-premise reviews support the four conclusions. Passing test counts or hashes alone do not prove them.',
        'priorAttemptsPreserved': [1, 2, 3, 4],
    }
    packet_path = EVIDENCE / 'common-physical-package-completed-packet.json'
    write_json(packet_path, packet, exclusive=True)
    previous = {'assessmentSHA256': gate['assessmentSHA256'], 'assessmentRevision': gate['assessmentRevision'],
                'gate': gate['gate'], 'additionalClaims': [x for x in gate['additionalClaims'] if x['id'] in packet['gateConclusions']]}
    gate['priorFourPhysicalGateCheckpoint'] = previous
    gate['generatedAt'] = now
    gate['assessmentRevision'] = 'COMMON_PHYSICAL_PACKAGE_8_OF_8_FOUR_ANALYTIC_GATES_VERIFIED'
    gate['previousCheckpointCommit'] = BASE
    for claim in gate['additionalClaims']:
        if claim['id'] in packet['gateConclusions']:
            claim.update(status='COMPLETE_SOURCE_BOUND_AND_INDEPENDENTLY_REVIEWED', blockingForUserRequestedM2=False,
                         remaining=None, wholeGateComplete=True,
                         completionEvidence={'packet': relative(packet_path), 'sha256': sha(packet_path),
                                             'sourceExecutionCommit': BASE, 'mathematicalScope': packet['scope']})
    current = dict(gate['gate'])
    current.update(status='BLOCKED_ON_G_NUM', blockingClaimIds=['G-NUM'], fullSameProfileN4=True, fullSameProfileN5=True,
                   fullPhysicalResidualAndFlatErrorPackage=True, actualGlobalPressureConvolutionComplete=True,
                   actualWholePhysicalVelocitySecondJetsComplete=True,
                   rigorousNumericalDerivativeEnclosures=False, userRequestedM2Complete=False,
                   m3MayStart=False, m3StartedByThisAssessment=False)
    gate['gate'] = current
    gate['fourPhysicalGateCompletion'] = {'packet': relative(packet_path), 'sha256': sha(packet_path),
                                         'sourceExecutionCommit': BASE, 'completedGates': list(packet['gateConclusions']),
                                         'mathematicalScope': packet['scope'], 'publicRuntimeChanged': False}
    gate.pop('assessmentSHA256')
    gate['assessmentSHA256'] = hashlib.sha256(json.dumps(gate, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    write_json(gate_path, gate)
    print(json.dumps({'packet': relative(packet_path), 'packetSHA256': sha(packet_path),
                      'assessmentSHA256': gate['assessmentSHA256'], 'completedGates': list(packet['gateConclusions']),
                      'blockingClaimIds': current['blockingClaimIds'], 'M3Started': False}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
