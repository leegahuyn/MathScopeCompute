#!/usr/bin/env python3
"""Read-only verification of the frozen outer-reselection handoff.

This verifies file bindings, stored execution receipts and claim boundaries.
It does not rerun quadrature or Lean, or replace the written analytic reviews.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path, PurePosixPath

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(relative: str):
    return json.loads((HERE / relative).read_text())


def require(condition, message):
    if not condition:
        raise ValueError(message)


def local_file(root: Path, relative: str) -> Path:
    name = PurePosixPath(relative)
    require(not name.is_absolute() and '..' not in name.parts,
            f'Nonportable file name: {relative}')
    path = root.joinpath(*name.parts)
    require(path.is_file() and not path.is_symlink(),
            f'Missing or linked file: {relative}')
    require(path.resolve().is_relative_to(root.resolve()),
            f'File escaped the source directory: {relative}')
    return path


def count_receipt(path: str, expected: int, key='checks'):
    value = read(path)
    checks = value[key]
    require(len(checks) == expected and all(v is True for v in checks.values()),
            f'Nonpassing stored checks in {path}')
    require(value['passed'] == value['total'] == expected,
            f'Incorrect stored check count in {path}')
    return value


def main():
    manifest = read('snapshot-manifest.json')
    require(manifest['schema'] == 'MathScope.OuterReselectionSnapshot/1',
            'Wrong manifest schema')
    listed = set()
    for entry in manifest['files']:
        name = entry['path']
        require(name not in listed, f'Duplicate manifest member: {name}')
        listed.add(name)
        path = local_file(HERE, name)
        require(path.stat().st_size == entry['bytes'] and sha(path) == entry['sha256'],
                f'Snapshot byte mismatch: {name}')
    actual = {
        p.relative_to(HERE).as_posix() for p in HERE.rglob('*')
        if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc'
        and p.name != 'snapshot-manifest.json'
    }
    require(actual == listed, 'Snapshot member set changed')

    current = read('final-review-bindings.json')
    require(current['schema'] == 'MathScope.OuterReselectionFinalReviewBindings/1',
            'Wrong combined review schema')
    for entry in current['files']:
        path = local_file(HERE, entry['path'])
        require(sha(path) == entry['sha256'],
                f'Final review binding changed: {entry["path"]}')
    for entry in current['unchangedExternalDependencies']:
        path = local_file(NAVIER, entry['pathFromNavier'])
        require(sha(path) == entry['sha256'],
                f'Frozen external source changed: {entry["pathFromNavier"]}')

    outer = count_receipt('outer-envelope-certificate.json', 106)
    axial = count_receipt('independent-axial/independent-axial-certificate.json', 47)
    axial_review = count_receipt('independent-review-axial/checks.json', 16, 'reviewChecks')
    pulse_review = count_receipt('independent-review-pulse/checks.json', 45, 'reviewChecks')
    post_review = count_receipt('independent-postpulse/checks.json', 21)
    integral = count_receipt('actual-main-pulse-integral.json', 11)
    diagnostic = count_receipt('main-pulse-integral-independent.json', 15)

    canonical = json.dumps(outer['parametersExactExpressions'],
                           sort_keys=True, separators=(',', ':')).encode()
    parameter_sha = hashlib.sha256(canonical).hexdigest()
    require(parameter_sha == current['parameterExpressionSHA256']
            == outer['parameterExpressionSHA256']
            == axial['sourceBinding']['parameterExpressionSHA256'],
            'Exact parameter expression binding mismatch')
    require(outer['parametersExactExpressions'] == axial['parametersExactExpressions'],
            'Axial and later outer stages use different expressions')

    for name, expected in pulse_review['reviewedSHA256'].items():
        require(sha(local_file(HERE, name)) == expected,
                f'Pulse review target changed: {name}')
    for name, expected in axial_review['sourceSHA256'].items():
        require(sha(local_file(HERE / 'independent-axial', name)) == expected,
                f'Axial review target changed: {name}')
    require(post_review['reviewedDerivationSHA256'] == sha(HERE / 'OUTER_DERIVATION.md'),
            'Postpulse review target changed')
    require(post_review['reviewSHA256'] == sha(HERE / 'independent-postpulse/REVIEW_EN.md')
            and post_review['checkerSHA256'] == sha(HERE / 'independent-postpulse/check_bounds.py'),
            'Postpulse review receipt does not bind current prose and checker')
    require(integral['bindings']['outerDerivationSHA256'] == sha(HERE / 'OUTER_DERIVATION.md')
            and integral['bindings']['outerEnvelopeCertificateSHA256'] == sha(HERE / 'outer-envelope-certificate.json'),
            'Integral attached to another analytic derivation')
    require(diagnostic['certificateSHA256'] == sha(HERE / 'actual-main-pulse-integral.json')
            and diagnostic['verifierSHA256'] == sha(HERE / 'verify_pulse_integral_independent.py'),
            'Independent diagnostic source binding mismatch')

    scope = current['currentScope']
    require(scope['finiteA4ContinuousArgumentIndependentlyReviewed'] is True
            and scope['noBlockingDefectFoundInStatedReviews'] is True,
            'Combined analytic review outcome missing')
    for flag in ['continuousAnalyticProofCheckedByLean', 'analyticPremisesInstantiatedInLean',
                 'newB2AxisOrB8JoiningRegenerated', 'globalC12FrequencyAndIncomingMomentsCertified',
                 'A7HeatEndpointCollarIncluded', 'fullOriginalProfileCompleted', 'originalN3GatePromoted']:
        require(scope[flag] is False, f'Unjustified combined claim: {flag}')
    require(outer['interpretation']['independentAuditOfWholeAnalyticBridgeComplete'] is False,
            'Historical incomplete-audit receipt was rewritten')
    require(not outer['interpretation']['originalN3GatePromoted']
            and not outer['interpretation']['fullOriginalProfileCompleted']
            and not pulse_review['analyticAssessment']['originalGatePromoted']
            and not pulse_review['analyticAssessment']['newLeanAnalyticTheorem']
            and not post_review['originalGateClosed']
            and not integral['scope']['originalAcceptanceGatePromoted']
            and integral['scope']['amplitudeBracketConditionalOnWrittenAnalyticTotalSBridge']
            and not diagnostic['scope']['originalN3GatePromoted'],
            'An earlier receipt lost its mathematical scope boundary')

    lean = read('formal-cone/attempts/0001/result.json')
    latest = read('formal-cone/latest-result.json')
    require(lean['status'] == 'PASSED' and lean['exitCode'] == 0
            and len(lean['theorems']) == 7, 'Actual seven-theorem Lean result absent')
    require(sha(HERE / 'formal-cone/attempts/0001/result.json') == latest['resultSHA256']
            and sha(HERE / 'formal-cone/attempts/0001/lean.log') == lean['logSHA256']
            and sha(HERE / 'formal-cone/attempts/0001/ConeThreshold.lean') == lean['sourceSHA256']
            and sha(HERE / 'formal-cone/ConeThreshold.lean') == lean['sourceSHA256'],
            'Lean execution, log or checked source binding mismatch')
    require(set(lean['axioms']) == set(lean['theorems']), 'Missing theorem axiom audit')
    allowed = {'propext', 'Classical.choice', 'Quot.sound'}
    require(all(set(a) <= allowed for a in lean['axioms'].values()),
            'Unexpected axiom in the conditional cone results')
    require(all(lean[k] is True for k in ['originalTrackedSourceBytesUnchanged',
                'originalKernelBytesUnchanged', 'checkedSourceBytesUnchanged',
                'allExpectedAxiomAuditsPresentAndAllowed']), 'Original Lean preservation check absent')
    require(not lean['analyticPremisesInstantiatedForAnExactProfile']
            and not lean['globalProfileCertified'] and not lean['originalGateClosed'],
            'Conditional Lean result promoted to a completed analytic profile')

    print(json.dumps({
        'status': 'FROZEN_SNAPSHOT_BINDINGS_VERIFIED',
        'files': len(listed),
        'unchangedExternalDependencies': len(current['unchangedExternalDependencies']),
        'parameterExpressionSHA256': parameter_sha,
        'storedReceiptCounts': [106, 47, 16, 45, 21, 11, 15],
        'conditionalLeanTheorems': 7,
        'reexecutedNumericalCalculationsOrLean': False,
        'originalN3GatePromoted': False
    }, indent=2))


if __name__ == '__main__':
    main()
