"""Verify the three new source packets and record their limited M2 claims.

No source calculation is rerun, no earlier runtime is relabelled, and no open
analytic gate is promoted by this provenance check. A later product release
must record its own source/Worker/browser observations.
"""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[3]
M2 = ROOT/'research-ide/mathscope-m2'
NAV = M2/'navier'
EVIDENCE = NAV/'research/evidence'
OUT = EVIDENCE/'m2-math-progress-20261011'
BASE = '5acd0dc8e06d0009409bbafdd7eb30dcde5e1124'
read = lambda path: json.loads(path.read_text())
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
rel = lambda path: str(path.relative_to(ROOT))
groups = []


def verify(name, mapping, prefix=ROOT):
    for path, value in mapping.items():
        expected = value['sha256'] if isinstance(value, dict) else value
        assert sha(prefix/path) == expected, (name, path)
    groups.append({'group': name, 'files': len(mapping), 'allCurrentBytesMatch': True})


heat_dir = EVIDENCE/'actual-heat-20261011'
heat_path = heat_dir/'actual-heat-packet.json'
heat = read(heat_path)
heat_run = read(ROOT/heat['sourceRun']['path'])
assert heat_run['pass'] and heat_run['exitCode'] == 0
assert len(heat_run['checks']) == 12 and all(c['pass'] for c in heat_run['checks'])
assert heat_run['sourceManifestUnchangedAfterRun']
verify('actual-heat-imports', heat_run['sourceManifest']['files'])
verify('actual-heat-final-packet', heat['files'])
assert heat['genericKernel']['tests'] == 9 and heat['genericKernel']['exitCode'] == 0
assert heat['preciseSpecialFunctionsReference']['checks'] == 5
assert heat['preciseSpecialFunctionsReference']['pass']
assert not heat['preciseSpecialFunctionsReference']['actualSourceParameters']

n1_dir = EVIDENCE/'background-residual-20261011'
n1_path = n1_dir/'validation.json'
n1 = read(n1_path)
assert n1['pass'] and all(n1['checks'].values())
assert n1['process']['exitCode'] == 0 and not n1['process']['timedOut']
assert n1['testedCounts']['genuineSource'] == {'constructions': 1, 'pass': 6, 'fail': 0}
verify('actual-n1-imports', n1['frozenDependencySHA256'])
verify('actual-n1-code-and-documentation', n1['newFilesSHA256'])
verify('actual-n1-execution-evidence', n1['evidenceSHA256'], n1_dir)

cov_dir = EVIDENCE/'admissible-covariance-20261011'
cov_path = cov_dir/'actual-admissible-terminal-covariance-validation.json'
cov = read(cov_path)
assert cov['sourceRun']['testGroups'] == cov['sourceRun']['passed'] == 13
assert cov['sourceRun']['sourceCheckCount'] == 28
assert cov['processObservation']['observedExitCode'] == 0
assert not cov['processObservation']['receiptContainsExitCode']
assert cov['processObservation']['receiptPreservedWithoutAddedExitField']
verify('actual-terminal-covariance-final-packet', {r['path']: r['sha256'] for r in cov['sourceRefs']})
cov_run = read(ROOT/cov['sourceRun']['receipt'])
assert cov_run['pass'] and cov_run['sourceManifestUnchangedAfterRun']
assert len(cov_run['executedChecks']) == 13 and all(c['pass'] for c in cov_run['executedChecks'])
verify('actual-terminal-covariance-imports', cov_run['sourceManifest']['files'])

for scope in [heat['numericalScope'], n1['scope'], cov['decision']]:
    assert scope['m3MayStart'] is False and scope['newLeanKernelProof'] is False
assert not heat['numericalScope']['wholeGNUMComplete']
assert not n1['scope']['wholeGN4Complete']
assert not cov['decision']['wholeGPOSComplete']

reviews = [OUT/'INDEPENDENT_COMPONENT_REVIEW_KO.md',
           heat_dir/'INDEPENDENT_HEAT_SCALED_REVIEW_KO.md',
           cov_dir/'INDEPENDENT_TERMINAL_COVARIANCE_REVIEW_KO.md']
for path in reviews:
    assert path.is_file()
    assert all(ord(c) >= 32 or c in '\n\t\r' for c in path.read_text())
stamp = datetime.now(timezone.utc).isoformat()
report = {
    'schema': 'MathScope.M2.ThreeComponentProgressReview/1', 'generatedAt': stamp,
    'reviewKind': 'INDEPENDENT_WRITTEN_REVIEW_AND_PROVENANCE_NOT_ANALYTIC_KERNEL_PROOF',
    'parentCommit': BASE, 'pass': True, 'provenanceChecks': groups,
    'sourceCalculationsRerunForThisReview': False,
    'actualSourceRuns': [
        {'component': 'actual-heat-scaled-enclosure', 'sourceTestsPassed': 12,
         'observedExitCode': 0, 'graphSHA256': heat['sourceRun']['graphSHA256'],
         'scope': heat['numericalScope']},
        {'component': 'actual-order-one-weighted-stress', 'sourceTestsPassed': 6,
         'observedExitCode': 0, 'graphSHA256': n1['compilerGraph']['sha256'],
         'scope': n1['scope']},
        {'component': 'actual-admissible-terminal-covariance', 'sourceTestsPassed': 13,
         'observedExitCode': 0, 'exitRecordedInOriginalReceipt': False,
         'exitAuthority': 'Separate observed process completion; original JSON unchanged.',
         'graphSHA256': cov['sourceRun']['graphSHA256'], 'scope': cov['decision']}],
    'packetAndReviewRefs': {rel(path): sha(path) for path in [heat_path, n1_path, cov_path, *reviews]},
    'lastPublishedRuntimeAtThisCheckpoint': {'version': '0.3.9', 'pageVersion': 76,
                                           'newThreeComponentsExecutedInThatBrowser': False},
    'allUserRequestedM2Complete': False, 'm3MayStart': False,
    'original64CriteriaRecountedAsTheseNewProofs': False,
    'generator': {'path': rel(Path(__file__).resolve()), 'sha256': sha(Path(__file__).resolve())}
}
OUT.mkdir(parents=True, exist_ok=True)
report_path = OUT/'review-validation.json'
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')

# Preserve the earlier execution context and distinguish the newly checked
# references from references only authenticated at the immutable parent.
gate_path = NAV/'research/M2_COMPLETION_GATE.json'
gate = json.loads(subprocess.check_output(['git', 'show', BASE+':'+rel(gate_path)], cwd=ROOT))
gate.pop('assessmentSHA256', None)
gate['generatedAt'] = stamp
gate['assessmentRevision'] = 'ACTUAL_HEAT_N1_WEIGHTED_STRESS_AND_ADMISSIBLE_TERMINAL_COVARIANCE'
gate['previousCheckpointCommit'] = BASE
for row in gate['sourceRefs'].values():
    row['state'] = 'VERIFIED_IN_IMMUTABLE_PARENT_CHECKPOINT'
    row['verifiedAtCommit'] = BASE
for key, path in {'threeComponentReview': report_path, 'independentComponentReview': reviews[0],
                  'heatPacket': heat_path, 'n1WeightedStressValidation': n1_path,
                  'admissibleTerminalCovarianceValidation': cov_path}.items():
    gate['sourceRefs'][key] = {'path': rel(path), 'sha256': sha(path),
                             'state': 'PRESENT_AND_HASH_CHECKED_AT_THIS_ASSESSMENT'}
gate['sourceRefs']['scopeDocumentation'] = {'path': rel(NAV/'research/M2_COMPLETION_GATE_KO.md'),
    'sha256': sha(NAV/'research/M2_COMPLETION_GATE_KO.md'), 'state': 'PRESENT_AND_HASH_CHECKED_AT_THIS_ASSESSMENT'}
gate['additionalClaims'].extend([
    {'id': 'M2X-ACTUAL-HEAT-ENCLOSURE', 'status': 'DIRECT_NODE_SOURCE_VERIFIED_SCOPED',
     'sourceRefs': ['heatPacket', 'independentComponentReview'],
     'statement': 'Actual original heat factor and nine first/second slow jets have directed rational enclosures at the specified original terminal point; positive original factors are retained and whole pulse/covariance numerics are unclosed.'},
    {'id': 'M2X-ACTUAL-N1-WEIGHTED-STRESS', 'status': 'DIRECT_NODE_SOURCE_BOUND_WRITTEN_ESTIMATE',
     'sourceRefs': ['n1WeightedStressValidation', 'independentComponentReview'],
     'statement': 'The original n=1 terminal weighted estimate through total derivative order 2 and unchanged c1 cutoff block are constructed. Whole strengthened all-order physical background is not completed.'},
    {'id': 'M2X-ACTUAL-ADMISSIBLE-TERMINAL-COVARIANCE', 'status': 'ACTUAL_NEW_SMALL_Q_OPERATOR_AND_SOURCE_BOUND_ANALYTIC_POSITIVITY',
     'sourceRefs': ['admissibleTerminalCovarianceValidation', 'independentComponentReview'],
     'statement': 'At ell=ellMinimum+8 and on the declared open outer fixed-label domain, original completed-source equality, det H<0 and two positive inverse weights are bound. Inner active fields, all boxes, flat endpoints and unknown original Gamma remain open.'}])
remaining = {
    'G-POS': ('PARTIAL_ACTUAL_ADMISSIBLE_OUTER_DOMAIN', 'Actual inner completed background, all source boxes/labels, final Gamma choices and flat square-root boundary extension.'),
    'G-NUM': ('PARTIAL_CUTOFF_AND_HEAT_JET_ENCLOSURES', 'Whole leading F and actual Volterra pulse jets, covariance H, inverse/sqrt weights and physical curl with complete numerical error budgets.'),
    'G-N4': ('PARTIAL_N1_WEIGHTED_BOUNDARY_AND_FINITE_PHYSICAL_NORMS', 'Apply strengthened selector to actual all-order background, retain all physical/pressure/stress identities and prove asymptotic/flat residual tails.')
}
for row in gate['additionalClaims']:
    if row['id'] in remaining:
        row['status'], row['remaining'] = remaining[row['id']]
        row['wholeGateComplete'] = False
gate['gate'].update({'actualHeatFactorAndNineSlowJetEnclosures': True,
                    'actualN1WeightedBoundaryThroughOrder2': True,
                    'actualAdmissibleOuterDomainPositiveWeights': True,
                    'userRequestedM2Complete': False, 'm3MayStart': False})
gate['threeComponentSourceReview'] = {'path': rel(report_path), 'sha256': sha(report_path),
                                    'nodeSourceOnly': True, 'workerBrowserEvidenceInheritedOnly': True}
gate['finalProvenanceReview'] = {'checkedGroups': groups,
    'currentComponentFilesMatchObservedRuns': True,
    'earlierRuntimeReferencesPreservedAtCommit': BASE,
    'mathematicalGatePromotedByHashing': False}
gate['assessmentSHA256'] = hashlib.sha256(json.dumps(gate, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
gate_path.write_text(json.dumps(gate, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'pass': True, 'checkedGroups': len(groups), 'sourceTests': [12, 6, 13],
                  'assessmentSHA256': gate['assessmentSHA256'], 'm3MayStart': False}))
