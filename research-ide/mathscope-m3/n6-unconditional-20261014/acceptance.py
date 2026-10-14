"""An independent fail-closed ledger of the original acceptance obligations.

Receipt verification establishes provenance only. Each universal obligation
keeps its original quantifier and source roots. New local lemmas never remove
the required whole-source norm, class, cover, moment, or PDE obligations.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
from run_job import verify_receipt, write

PARENT = '7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
CLASS_IDS = {
    '9.8-wave-B0', '9.8-mean-C0', '9.8-defects-C0', '9.9-total-wave',
    '9.9-curl-remainder', '9.9-tangential-and-pressure', '9.9-radial',
    '9.10-angular-moment', '9.10-axial-moment', '9.4-common-domain-support-divergence'
}
SEQUENCE = ['primary-current-pressure', 'temporal-8.20', 'post-temporal-8.12',
            'five-moments-8.25-on-new-P-J', 'post-moment-8.12']

def read(path):
    return json.loads(Path(path).read_text(encoding='utf8'))

def original_class_obligations(data):
    if data['source']['fullParentNodesSHA256'] != PARENT or data['orderedOriginalUpdates'] != SEQUENCE:
        raise ValueError('Different original source or stale pressure update order')
    rows = data['requirements']
    if len(rows) != len(CLASS_IDS) or {row['id'] for row in rows} != CLASS_IDS:
        raise ValueError('Missing, duplicated, or substituted original class obligation')
    result = []
    for row in rows:
        if row['proved'] is not False:
            raise ValueError('A historical assertion cannot replace an independent original class proof')
        result.append({'id': row['id'], 'criterion': 'N6-01', 'sourceRoots': row['sourceRoots'],
                       'statement': row['required'], 'minimalUnprovedLemma': row['minimalLemma'],
                       'status': 'OPEN', 'scope': 'original complete j=0 state on one common domain',
                       'quantifier': 'For every fixed derivative multiindex, uniformly across all original bands, labels, copies and points',
                       'wholeSourceCertificateIndependentlyVerified': False})
    return result

def original_acceptance(rows, reported_flags=None):
    """No currently implemented verifier proves the universal original targets.

    This function rejects invented proof receipts rather than treating their
    labels as axioms. Extending it requires adding a new actual source-bound
    verifier; passing more tests or altering a JSON flag has no authority.
    """
    identities = [row['id'] for row in rows]
    if len(identities) != len(set(identities)):
        raise ValueError('Duplicate mathematical obligation')
    if not CLASS_IDS.issubset(identities):
        raise ValueError('Original j=0 class obligations omitted')
    for row in rows:
        if row.get('wholeSourceCertificateIndependentlyVerified') is not False or row['status'] != 'OPEN':
            raise ValueError('Unsupported universal proof promotion')
    return {'N6-01': {'status': 'OPEN', 'originalCriterionComplete': False},
            'N6-02': {'status': 'PARTIAL', 'originalCriterionComplete': False},
            'completionFlagsFromTestsOrSerializedDataUsedAsProof': False,
            'fullUniversalAcceptanceVerifierAvailable': False}

def unique_folder(root, kind):
    folders = [path for path in Path(root).iterdir()
               if path.is_dir() and (path.name == kind or path.name.startswith(f'n6-independent-{kind}-'))]
    if len(folders) != 1:
        raise ValueError('Missing or ambiguous same-run research kind: ' + kind)
    return folders[0]

def run(artifacts, research_output, output, commit):
    verified = {}
    folders = {}
    run_id = os.environ.get('GITHUB_RUN_ID')
    for kind in ['controls', 'rayleigh', 'analytic', 'cartesian']:
        folder = unique_folder(research_output, kind)
        verified[kind] = verify_receipt(folder, commit)
        execution = read(folder / 'execution.json')
        if execution['kind'] != kind or execution['originalProtectedSourcesUnchanged'] is not True:
            raise ValueError('Research kind or protected source mismatch')
        if execution['codeIsExactCleanCommit'] is not True:
            raise ValueError('Research outputs must be bound to an exact clean source commit')
        if execution['workflowRunId'] != run_id or execution['implementationUnchangedDuringRun'] is not True or execution['commitUnchangedDuringRun'] is not True:
            raise ValueError('Research outputs must use this workflow run and unchanged source code')
        if execution['originalN601Complete'] is not False or execution['originalN602Complete'] is not False:
            raise ValueError('Execution status improperly promotes mathematical completion')
        folders[kind] = folder
    data = read(Path(artifacts) / 'mean-proof-inputs-38500114302/initial_residual/initial-state-audit.json')
    cartesian = read(Path(artifacts) / 'mean-proof-residual-38500114302/residual-independent-cartesian-jets.json')
    requests = cartesian['diagnostics']['unresolvedActualJetRequests']
    guards = cartesian['diagnostics']['conditionalDomainHypotheses']
    if len(requests) != 393 or len(guards) != 94 or cartesian['sourceVelocity'] != [3825006, 3825007, 3825008] or cartesian['sourcePressure'] != 3825009:
        raise ValueError('Original full Cartesian program or frontier was substituted')
    rows = original_class_obligations(data)
    rows += [
        {'id': 'A-global-rayleigh-source-premises', 'criterion': 'N6-01+N6-02', 'sourceRoots': [622971, 622992, 622991, 623005, 623008],
         'statement': '-2 F0*gR*(gR^2+gZ^2+2 F0*gR)>0 at every actual original representative',
         'minimalUnprovedLemma': 'Independently verify actual representative membership and S9-S13/C12/O8-O9/H19/H22/H25/natural-B26-heat envelopes; conditional rational margins alone are insufficient.',
         'quantifier': 'Every original representative, all active bands/labels/copies', 'status': 'OPEN', 'wholeSourceCertificateIndependentlyVerified': False},
        {'id': 'B-common-holomorphic-eta-strip', 'criterion': 'N6-01+N6-02', 'sourceRoots': [4483, 5029],
         'statement': 'The actual singular integrated Picard operator includes A1*partial_eta W and has certified actual norms, a common holomorphic eta strip, uniform tails and derivative/limit interchange.',
         'minimalUnprovedLemma': 'Actual source A0/A1/forcing/background/natural/quadratic holomorphic norm enclosures on the original common input domain; sparse-word or ordinary ODE theorems do not supply those inputs.',
         'quantifier': 'All original source calls on the same original domain', 'status': 'OPEN', 'wholeSourceCertificateIndependentlyVerified': False},
        {'id': 'C-actual-registered-cartesian-jets', 'criterion': 'N6-02', 'sourceRoots': [3825006, 3825007, 3825008, 3825009],
         'statement': 'Close every required Cartesian source jet by valid actual function differentiation, preserving all guards and bindings.',
         'minimalUnprovedLemma': 'Actual registered body/cover/Fourier/implicit/limit differentiation and all domain guards; uncomputed jets cannot be substituted by zero.',
         'quantifier': 'Every retained request in the full independent source-derived Cartesian program', 'status': 'OPEN', 'wholeSourceCertificateIndependentlyVerified': False},
        {'id': 'E-all-three-full-original-PDE-components', 'criterion': 'N6-02', 'sourceRoots': [3825257, 3825259, 3825261, 3825348, 3825349, 3825350],
         'statement': 'Independent full original Cartesian direct and decomposed residuals agree with latest pressure, flat tails, all linear/curl/nonlinear terms and a rigorous domain/roundoff/truncation enclosure.',
         'minimalUnprovedLemma': 'All actual remaining rational terms and domain obligations, complete original field jet evaluation, independent equation evaluation and explicit error enclosure.',
         'quantifier': 'Three components on the complete actual original parameter domain', 'status': 'OPEN', 'wholeSourceCertificateIndependentlyVerified': False}
    ]
    verdict = original_acceptance(rows)
    result_files = {}
    for kind, folder in folders.items():
        if kind == 'controls':
            continue
        files = [path for path in folder.glob('*result.json') if path.is_file()]
        if not files:
            raise ValueError('Missing actual research result: ' + kind)
        result_files[kind] = [{'path': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                               'data': read(path)} for path in sorted(files)]
    out = Path(output)
    out.mkdir(parents=True, exist_ok=True)
    matrix = {'schema': 'MathScope.N6Unconditional.ObligationMatrix/1', 'sourceCommit': commit,
              'baselineCommit': 'a08d9de1777cf460e6fa980674c5c70939201457', 'parentNodesSHA256': PARENT,
              'B0': '7/10', 'C0star': '6/5', 'orderedOriginalUpdates': SEQUENCE,
              'actualOriginalSourceBindings': data['actualVelocityAndLatestPressureRoots'],
              'originalIndependentCartesianRequests': requests,
              'originalIndependentCartesianDomainGuards': guards,
              'numericWholeOriginalDomainEnclosure': None,
              'numericEnclosureMissingPremises': ['actual registered function domains and derivatives', 'common holomorphic and all-order class norm bounds', 'cover/limit tails and pressure identity', 'roundoff/truncation source parameter enclosure'],
              'requirements': rows, 'verdict': verdict, 'newSourceBoundCalculations': result_files,
              'sameSourceCompleteReceipts': verified, 'original56Of64Changed': False,
              'workflowRunId': run_id,
              'samplingOrSourcePaperClaimUsedAsUniversalProof': False,
              'leanKernelCertificationAdded': False}
    write(out / 'obligation-matrix.json', matrix)
    summary = {'schema': 'MathScope.N6Unconditional.VerificationSummary/1', 'sourceCommit': commit,
               'verifiedSameSourceResearchKinds': list(verified), 'originalRequiredClassRows': len(CLASS_IDS),
               'openUniversalRequirements': len(rows), 'N601': verdict['N6-01'], 'N602': verdict['N6-02'],
               'original56Of64Changed': False, 'publicDeploymentPerformed': False,
               'universalCertificationAchieved': False}
    write(out / 'verification-summary.json', summary)
    print(json.dumps(summary))
    return matrix

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for name in ['artifacts', 'research-output', 'output', 'source-commit']:
        parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    run(args.artifacts, args.research_output, args.output, args.source_commit)
