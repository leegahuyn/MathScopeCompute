"""Bind the continuation review to its actually executed files and receipts.

This is a provenance review, not an automatic proof of analytic statements.
Successful checks never promote the open M2 mathematical gates or start M3.
"""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[3]
M2 = ROOT/'research-ide/mathscope-m2'
NAVIER = M2/'navier'
OUT = NAVIER/'research/evidence/m2-continuation-20261011'
PHYSICAL = NAVIER/'research/evidence/physical-bridge-20261011'
BASE = '8a0046c547af4cccdbecae81fe647d414dd75d3f'
IMPLEMENTATION = sys.argv[1] if len(sys.argv) > 1 else None
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
read = lambda path: json.loads(path.read_text())
relative = lambda path: str(path.relative_to(ROOT))
verified = []


def verify_map(name, values, prefix=ROOT):
    for path, expected in values.items():
        if isinstance(expected, dict):
            expected = expected['sha256']
        actual = digest(prefix/path)
        assert actual == expected, (name, path, expected, actual)
    verified.append({'group': name, 'files': len(values), 'allMatch': True})


old = read(OUT/'at-resume-M2_COMPLETION_GATE.json')
mass = read(OUT/'actual-cutoff-mass-enclosure-source.json')
mass_summary = read(OUT/'actual-cutoff-mass-enclosure-validation.json')
obstruction = read(OUT/'actual-covariance-ell-one-obstruction-source-attempt1.json')
obstruction_summary = read(OUT/'actual-covariance-band-and-obstruction-validation.json')
norms = read(OUT/'actual-background-physical-seminorms-validation.json')
curl = read(PHYSICAL/'physical-curl-source-process.json')
curl_summary = read(PHYSICAL/'physical-curl-validation.json')
views = read(OUT/'final-runtime-and-views-validation.json')
build = read(M2/'build-manifest.json')
verify_map('actual-cutoff-mass-source-imports', mass['sourceManifest']['files'])
verify_map('actual-cutoff-mass-final-packet', mass_summary['files'])
verify_map('actual-band-and-obstruction-source-imports', obstruction['sourceManifest']['files'])
verify_map('actual-band-and-obstruction-final-packet',
           {v['path']: v['sha256'] for v in obstruction_summary['sourceRefs']})
assert norms['sourceFilesBefore'] == norms['sourceFilesAfter']
verify_map('actual-physical-seminorm-source-imports', norms['sourceFilesAfter'])
verify_map('actual-fixed-label-physical-curl-source', curl['sourceFilesSHA256'], NAVIER)
verify_map('actual-fixed-label-physical-curl-documents', curl_summary['codeAndDocumentationSHA256'], NAVIER)
verify_map('final-input-and-view-regression', views['sourceSHA256'])
verify_map('current-static-build', build['sourceFiles'], ROOT/'research-ide')
assert mass['pass'] and mass['exitCode'] == 0 and len(mass['checks']) == 10
assert obstruction['pass'] and obstruction['executedTestGroupCount'] == 12
assert all(c['pass'] for c in obstruction['executedChecks'])
assert obstruction_summary['sourceExecution']['processExitCode'] == 0
assert norms['pass'] and norms['counts']['pass'] == 8 and norms['exitCode'] == 0
assert curl['pass'] and curl['exitCode'] == 0 and not curl['timedOut']
assert views['pass'] and views['counts']['pass'] == 24 and views['exitCode'] == 0

runtimes = []
for kind in ['actual-cutoff-masses', 'actual-band-admissibility']:
    pair = []
    for mode in ['source', 'worker']:
        path = OUT/(kind+'-'+mode+'-runtime.json')
        run = read(path)
        assert run['pass'] and run['exitCode'] == 0
        assert run['environment']['workerSha256'] == build['workerSha256']
        assert run['environment']['version'] == '0.3.9'
        verify_map(kind+'-'+mode+'-runtime', run['runtimeSHA256'], M2)
        replay = read(OUT/(kind+'-'+mode+'-replay.json'))
        assert replay['mathematicalHash'] == run['mathematicalHash']
        pair.append(run)
        runtimes.append({'path': relative(path), 'sha256': digest(path), 'kind': run['kind'],
                         'mode': mode, 'exitCode': run['exitCode'], 'elapsedMs': run['elapsedMs'],
                         'peakRSSBytes': run['peakRSSBytes'], 'mathematicalHash': run['mathematicalHash'],
                         'certificateSHA256': run['certificateSHA256'], 'panelCount': run['panelCount'],
                         'checkedSourcePathCells': run['checkedSourcePathCells'],
                         'unboundDisplayLabels': run['unboundDisplayLabels']})
    for key in ['mathematicalHash', 'certificateSHA256', 'runtimeSHA256']:
        assert pair[0][key] == pair[1][key], (kind, key)

stamp = datetime.now(timezone.utc).isoformat()
publication_path = OUT/'publication.json'
browser_path = OUT/'browser-qa.json'
publication = read(publication_path) if publication_path.exists() else {'status': 'NOT_YET_PUBLISHED_BY_THIS_CONTINUATION'}
browser = read(browser_path) if browser_path.exists() else {'status': 'NOT_YET_EXECUTED_BY_THIS_CONTINUATION'}
gate = {
    'status': 'BLOCKED', 'userRequestedM2Complete': False, 'm3MayStart': False,
    'm3StartedByThisAssessment': False, 'fullSameProfileN4': False, 'fullSameProfileN5': False,
    'fullPhysicalResidualAndFlatErrorPackage': False, 'rigorousNumericalDerivativeEnclosures': False,
    'actualCutoffFactorsNumericallyEnclosed': True, 'actualFixedLabelPhysicalCurlSourceBound': True,
    'actualFiniteBackgroundPhysicalSeminormsConstructed': True,
    'ell1NonnegativeCovarianceSolutionAbsentAtSpecifiedWitness': True,
    'originalLargeBandTheoremCounterexample': False,
    'newLeanAlgebraKernelProof': True, 'newLeanKernelProofExecutedThisContinuation': False,
    'actualAnalyticLeanInstance': False,
    'blockingClaimIds': ['G-POS', 'G-NUM', 'G-CURL', 'G-N4', 'G-N5']
}
release = {
    'schema': 'MathScope.M2.Continuation.ReleaseValidation/1', 'generatedAt': stamp,
    'baseCommit': BASE, 'implementationCommit': IMPLEMENTATION,
    'branch': 'mathscope-m2-completion-20261011', 'runtimeVersion': '0.3.9',
    'originalM2Acceptance': {'accepted': 64, 'total': 64, 'inheritedHistoricalScopeOnly': True,
                             'recountedAsWholeMathematicalProof': False},
    'gate': gate, 'provenanceChecks': verified, 'runtimeExecutions': runtimes,
    'actualSourceChecks': [
        {'component': 'actual-cutoff-masses', 'pass': 10, 'total': 10,
         'receipt': relative(OUT/'actual-cutoff-mass-enclosure-source.json')},
        {'component': 'band-seal-and-ell-one-obstruction', 'pass': 12, 'total': 12,
         'receipt': relative(OUT/'actual-covariance-ell-one-obstruction-source-attempt1.json'),
         'analyticConclusionRequiresWrittenProof': True, 'newLeanProof': False},
        {'component': 'physical-background-seminorms', 'pass': 8, 'total': 8,
         'receipt': relative(OUT/'actual-background-physical-seminorms-validation.json'),
         'actualCoefficientOrders': [1, 2], 'physicalDerivativeOrder': 2},
        {'component': 'fixed-label-physical-curl', 'pass': 5, 'total': 5,
         'receipt': relative(PHYSICAL/'physical-curl-source-process.json'),
         'allPhysicalLabelsAssembled': False}],
    'finalRegression': {'pass': 24, 'total': 24, 'receipt': relative(OUT/'final-runtime-and-views-validation.json')},
    'lean': {'status': 'INHERITED_PREVIOUS_PINNED_KERNEL_AUDIT', 'primaryTheoremCount': 14,
             'supportDeclarationCount': 2, 'newLeanRunThisContinuation': False,
             'actualAnalyticInstantiation': False,
             'receipt': 'research-ide/mathscope-m2/navier/lean/evidence/audit.json'},
    'build': {k: build[k] for k in ['workerSha256', 'workerBytes', 'bundleSha256', 'bundleBytes',
                                   'visualizationSha256', 'visualizationBytes']},
    'publication': publication, 'browserQA': browser,
    'allDisplayedValueCellsCompared': True, 'displayedSourceValueCellsPerTwoRequests': 60,
    'displayLabelCellsPerTwoRequests': 55, 'allCellsSourceBound': False,
    'scope': 'Executed finite/source-bound components, written ell1 obstruction and source/Worker/UI provenance; no whole M2 mathematical completion or M3 start.'
}
release_path = OUT/'release-validation.json'
release_path.write_text(json.dumps(release, ensure_ascii=False, indent=2)+'\n')

refs = {
    'previousAssessment': OUT/'at-resume-M2_COMPLETION_GATE.json',
    'originalCriteria': M2/'evidence/original-m2-criteria.json',
    'currentReleaseValidation': release_path,
    'scopeDocumentation': NAVIER/'research/M2_COMPLETION_GATE_KO.md',
    'cutoffMassModule': NAVIER/'actual-cutoff-mass-enclosure.mjs',
    'cutoffMassDocumentation': NAVIER/'research/ACTUAL_CUTOFF_MASS_ENCLOSURE_KO.md',
    'cutoffMassValidation': OUT/'actual-cutoff-mass-enclosure-validation.json',
    'bandModule': NAVIER/'actual-covariance-band-admissibility.mjs',
    'bandDocumentation': NAVIER/'research/ACTUAL_COVARIANCE_BAND_ADMISSIBILITY_KO.md',
    'obstructionModule': NAVIER/'actual-covariance-ell-one-obstruction.mjs',
    'obstructionDocumentation': NAVIER/'research/ACTUAL_COVARIANCE_ELL_ONE_OBSTRUCTION_KO.md',
    'obstructionValidation': OUT/'actual-covariance-band-and-obstruction-validation.json',
    'obstructionIndependentReview': OUT/'ELL1_COVARIANCE_OBSTRUCTION_FINAL_INDEPENDENT_REVIEW_KO.md',
    'terminalScalarBounds': OUT/'ELL1_TERMINAL_SCALAR_BOUNDS_KO.md',
    'physicalSeminormModule': NAVIER/'actual-background-physical-seminorms.mjs',
    'physicalSeminormDocumentation': NAVIER/'research/ACTUAL_BACKGROUND_PHYSICAL_SEMINORMS_KO.md',
    'physicalSeminormValidation': OUT/'actual-background-physical-seminorms-validation.json',
    'physicalCurlModule': NAVIER/'actual-physical-full-curl.mjs',
    'physicalCurlDocumentation': NAVIER/'research/ACTUAL_PHYSICAL_FULL_CURL_KO.md',
    'physicalCurlValidation': PHYSICAL/'physical-curl-validation.json',
    'finalViewTests': OUT/'final-runtime-and-views-validation.json',
    'runtimeRunner': M2/'tests/continuation-runtime-case.mjs',
    'runtimeRunSummary': OUT/'runtime-runner-validation.json',
    'newPanelRenderer': M2/'visualization/actual-continuation-panels.mjs',
    'navierRuntime': NAVIER/'index.mjs', 'applicationWorker': M2/'m2.worker.js',
    'applicationBundle': M2/'workspace.bundle.js', 'workspace': M2/'workspace.html',
    'buildManifest': M2/'build-manifest.json', 'pagePatchAudit': OUT/'page-patch-audit.json',
    'previousLeanSource': NAVIER/'lean/MathScope/M2/Navier/DifferentialAlgebra.lean',
    'previousLeanAudit': NAVIER/'lean/evidence/audit.json',
    'assessmentGenerator': Path(__file__).resolve()
}
if publication_path.exists(): refs['publication'] = publication_path
if browser_path.exists(): refs['browserQA'] = browser_path
for run in runtimes:
    refs[run['kind']+'-'+run['mode']] = ROOT/run['path']
claims = [
    {'id': 'M2X-PRIOR-DIFFERENTIALS', 'status': 'INHERITED_EXECUTED_SCOPED',
     'sourceRefs': ['previousAssessment'],
     'statement': 'Actual covariance R/Z/T first derivatives, second/mixed pulse jets and conditional local curl remain available; their original run context stays in the previous assessment.'},
    {'id': 'M2X-CUTOFF-MASSES', 'status': 'SOURCE_AND_CURRENT_WORKER_VERIFIED_SCOPED',
     'sourceRefs': ['cutoffMassValidation', 'runtimeRunSummary'],
     'statement': 'Actual transverse and longitudinal cutoff factors and original ell1 Ls have directed rational enclosures; whole H and pulse derivatives do not.'},
    {'id': 'M2X-BAND-DOMAIN', 'status': 'SOURCE_BOUND_WRITTEN_PROOF_AND_EXACT_CHECKS',
     'sourceRefs': ['bandDocumentation', 'obstructionValidation'],
     'statement': 'Displayed bands 1..128 lie outside the explicit ellMinimum/qStar sufficient-condition region selected by the actual bounds producer; no 128-graph execution or determinant sign claim.'},
    {'id': 'M2X-ELL1-OBSTRUCTION', 'status': 'SOURCE_BOUND_WRITTEN_ANALYTIC_OBSTRUCTION_VERIFIED',
     'sourceRefs': ['obstructionDocumentation', 'obstructionValidation', 'obstructionIndependentReview'],
     'statement': 'At the specified ell1 terminal witness both covariance theta columns are negative and the actual target theta is positive; no nonnegative Hy=T solution exists there.',
     'determinantSign': 'UNKNOWN', 'individualInverseWeightSigns': ['UNKNOWN', 'UNKNOWN'],
     'originalGammaCounterexample': False, 'wholeM2GoalDisproved': False, 'newLeanProof': False},
    {'id': 'M2X-PHYSICAL-CURL', 'status': 'ACTUAL_FIXED_LABEL_CONDITIONAL_SOURCE_VERIFIED',
     'sourceRefs': ['physicalCurlDocumentation', 'physicalCurlValidation'],
     'statement': 'Original slow cutoff, physical map, conjugates, pressure and curl commutator are bound for one authentic fixed label; all-family assembly remains open.'},
    {'id': 'M2X-PHYSICAL-SEMINORMS', 'status': 'ACTUAL_FINITE_COEFFICIENT_SOURCE_VERIFIED',
     'sourceRefs': ['physicalSeminormDocumentation', 'physicalSeminormValidation'],
     'statement': 'Actual n=1,2 physical derivative norms through m=2, n=2 weighted stress and a separate strengthened selector were constructed; the selector was not applied to the existing background.'},
    {'id': 'M2X-LEAN-ALGEBRA', 'status': 'INHERITED_KERNEL_VERIFIED_SCOPED',
     'sourceRefs': ['previousLeanSource', 'previousLeanAudit'],
     'primaryTheoremCount': 14, 'supportDeclarationCount': 2,
     'newLeanRunThisContinuation': False, 'actualAnalyticInstantiation': False}
]
remaining = {
    'G-POS': ('BLOCKED_FOR_ELL1_WITNESS_ORIGINAL_ADMISSIBLE_DOMAIN_OPEN',
              'Actual admissible-band positive weights, determinant lower bound, inverse stability and smooth square-root boundary extension.'),
    'G-NUM': ('PARTIAL_CUTOFF_FACTORS_ONLY',
              'Directed enclosures for actual Volterra amplitudes and derivatives, H, inverse/sqrt weights and full curl with summed error budgets.'),
    'G-CURL': ('PARTIAL_FIXED_PHYSICAL_LABEL_ONLY',
               'Original admissible bands, all active labels, support/zero extensions and global divergence.'),
    'G-N4': ('PARTIAL_FINITE_PHYSICAL_NORMS_AND_SELECTOR',
             'First-order terminal weighted bounds, applied strengthened selector, all-order sums, physical residual cancellation and asymptotic/flat tails.'),
    'G-N5': ('OPEN',
             'Sufficient higher potential/phase derivatives, uniform Gaussian bounds, summable all-label tails, nonlinear/cutoff/eikonal residuals and actual N6 interface.')
}
for identifier, (status, statement) in remaining.items():
    claims.append({'id': identifier, 'status': status, 'blockingForUserRequestedM2': True,
                   'remaining': statement, 'wholeGateComplete': False})
claims.append({'id': 'G-LEAN', 'status': 'OPEN_ACTUAL_ANALYTIC_INSTANTIATION',
               'blockingForUserRequestedM2': False, 'blocksFullActualAnalyticLeanClaim': True,
               'remaining': 'Discharge the actual source function-space, regularity, positivity, integral and limit assumptions in Lean; the previous generic algebra is not that instance.'})
assessment = {
    'schema': 'MathScope.M2.Navier.ExtendedCompletionAssessment/2', 'generatedAt': stamp,
    'assessmentKind': 'SOURCE_BOUND_REVIEW_MANIFEST_NOT_PROOF_CERTIFICATE',
    'assessmentRevision': 'CONTINUATION_WITH_ACTUAL_CUTOFF_NUMERICS_PHYSICAL_COMPONENTS_AND_ELL1_OBSTRUCTION',
    'resumedCommit': BASE, 'implementationCommit': IMPLEMENTATION,
    'implementationBranch': 'mathscope-m2-completion-20261011',
    'baselineCommit': old['baselineCommit'], 'implementationBaselineCommit': old['implementationBaselineCommit'],
    'pdfSources': old['pdfSources'], 'historicalCriteria': old['historicalCriteria'],
    'previousAssessmentScope': 'Immutable at-resume snapshot preserves original executions, original hashes and their limitations. Those old runtime bytes are not relabeled as current 0.3.9 executions.',
    'sourceRefs': {key: {'path': relative(path), 'sha256': digest(path), 'state': 'PRESENT_AND_HASH_CHECKED_AT_THIS_ASSESSMENT'} for key, path in refs.items()},
    'additionalClaims': claims, 'gate': gate, 'm3Plan': old['m3Plan'],
    'currentRuntimeVerification': {'version': '0.3.9', 'workerSha256': build['workerSha256'],
                                 'executions': runtimes, 'sourceWorkerPairsAgree': True,
                                 'sourcePathValueCellsChecked': 60, 'unboundDisplayLabels': 55,
                                 'allCellsSourceBound': False},
    'publication': publication, 'browserQA': browser,
    'finalProvenanceReview': {'checkedGroups': verified, 'allReferencedFilesHashed': True,
                             'mathematicalGatePromotedByHashing': False,
                             'scope': 'Current source/evidence file integrity and observed runs; analytic statements additionally depend on the linked written proofs and their stated domains.'},
    'promotionPolicy': {'allTestsPassImpliesMathematicalCompletion': False,
                        'callerSuppliedCompletionFlagsAccepted': False,
                        'copiedGraphOrReceiptAuthenticatesSource': False,
                        'historicalRunRelabeledAsCurrent': False,
                        'm3RequiresAllUserRequestedM2MathematicalObligations': True,
                        'trustLimit': 'Editing or rehashing this review never proves an analytic claim or authorizes M3.'},
    'assessmentHashAlgorithm': 'SHA-256 over UTF-8 json.dumps(record_without_assessmentSHA256, ensure_ascii=False, sort_keys=True, separators=(comma,colon)); no trailing newline.'
}
canonical = json.dumps(assessment, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
assessment['assessmentSHA256'] = hashlib.sha256(canonical).hexdigest()
(NAVIER/'research/M2_COMPLETION_GATE.json').write_text(json.dumps(assessment, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'sourceGroupsVerified': len(verified), 'references': len(refs),
                  'sourceWorkerPairsAgree': True, 'assessmentSHA256': assessment['assessmentSHA256'],
                  'userRequestedM2Complete': False, 'm3MayStart': False,
                  'publicationStatus': publication.get('status'), 'browserStatus': browser.get('status')}))
