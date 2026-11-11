"""Verify the actual isolated candidate and its exact reversible HTML patch."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess


def digest(data):
    return hashlib.sha256(data).hexdigest()


def git_blob(repo, commit, path):
    return subprocess.check_output(
        ['git', '-c', 'core.longpaths=true', '-C', str(repo), 'show', f'{commit}:{path}']
    )


def apply_exact(data, patches, expected_input, expected_output, reverse=False):
    if digest(data) != expected_input:
        raise ValueError('PATCH_BASE_SHA256_MISMATCH')
    for patch in reversed(patches) if reverse else patches:
        if patch['operation'] != 'replace':
            raise ValueError('UNSUPPORTED_PATCH_OPERATION')
        old, new = ('replace', 'find') if reverse else ('find', 'replace')
        find, replace = patch[old].encode('utf-8'), patch[new].encode('utf-8')
        if not find or data.count(find) != 1:
            raise ValueError('PATCH_ANCHOR_NOT_UNIQUE')
        data = data.replace(find, replace, 1)
    if digest(data) != expected_output:
        raise ValueError('PATCH_RESULT_SHA256_MISMATCH')
    return data


def rejected(action, expected):
    try:
        action()
    except ValueError as error:
        if str(error) == expected:
            return expected
        raise
    raise AssertionError(f'Expected rejection {expected}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--source-commit', required=True)
    parser.add_argument('--build', type=Path, required=True)
    parser.add_argument('--browser-receipt', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()

    assert re.fullmatch('[a-f0-9]{40}', args.source_commit)
    def blob(path):
        return git_blob(args.repo, args.source_commit, path)

    evidence_dir = 'docs/evidence/m4-evidence-panel-v103-20261013/'
    baseline = gzip.decompress(blob(evidence_dir + 'public-v103.html.gz'))
    build = json.loads((args.build / 'manifest.json').read_bytes())
    patches_bytes = (args.build / 'patches.json').read_bytes()
    patches = json.loads(patches_bytes)
    source_catalog = json.loads(blob('research-ide/mathscope-m4/release-lab/catalog.json'))
    matrix = blob('research-ide/mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json')
    criterion = re.search(rb'"id": "R1-08"\s*,\s*"title": [^\n]*\s*"source_page": 68\s*,\s*"original_acceptance": ([^\n]+),', matrix)
    assert criterion
    original = json.loads(criterion.group(1))
    assert digest(baseline) == build['baseSHA256'] == 'e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784'
    assert len(patches) == build['patchCount'] == 4
    assert build['newAssets'] == build['newPages'] == 0
    assert build['unrelatedBytesPreserved'] and build['reversible']
    assert not build['wholeM3Complete']

    candidate = apply_exact(baseline, patches, build['baseSHA256'], build['candidateSHA256'])
    candidate_file = args.build / 'candidate.html'
    if candidate_file.is_file():
        assert candidate_file.read_bytes() == candidate
    rolled_back = apply_exact(candidate, patches, build['candidateSHA256'], build['baseSHA256'], reverse=True)
    assert rolled_back == baseline
    model_match = re.search(rb'<script id="ms-r1-data" type="application/json">([^<]*)</script>', candidate)
    assert model_match
    model = json.loads(model_match.group(1))
    assert model['catalog'] == source_catalog
    assert model['researchBoundaries'] == json.loads(blob('research-ide/mathscope-m4/research-boundaries.json'))
    claims = model['formalClaims']['claims']
    assert len(claims) == 11 and len({claim['claimId'] for claim in claims}) == 11
    assert model['verification']['pass'] is True
    assert model['sourceRefinement'] is None
    assert all(claim['grantsOriginalCriterionAcceptance'] is False for claim in claims)

    fixtures = model['catalog']['fixtures'] + model['catalog']['provenanceFixtures']
    assert len({item['id'] for item in fixtures}) == len(fixtures)
    assert all(item['engine'] in ('M1', 'M2') and item['request']['kind'] and item['claimId'] for item in fixtures)
    assert {item['id'] for item in model['catalog']['provenanceFixtures']} == {'ns-coefficient'}
    bridges = []
    for bridge in build['additiveEngineBridges']:
        data = blob(bridge['sourcePath'])
        assert digest(data) == bridge['sourceSHA256']
        assert data.count(bridge['find'].encode()) == 1
        bridges.append({'sourcePath': bridge['sourcePath'], 'sha256': bridge['sourceSHA256']})

    browser_bytes = args.browser_receipt.read_bytes()
    browser = json.loads(browser_bytes)
    assert browser['candidateSHA256'] == build['candidateSHA256']
    assert browser['baselineSHA256'] == build['baseSHA256']
    for view in browser['views']:
        assert set(view['exactClaimIds']) == {claim['claimId'] for claim in claims}
        assert not view['errors'] and view['overflow'] == 0 and view['keyboardOpenedBothViews']
    assert len(browser['views']) == 2

    bad_patch = [dict(patch) for patch in patches]
    bad_patch[-1]['replace'] += ' '
    controls = {
        'wrong_base': rejected(
            lambda: apply_exact(baseline + b' ', patches, build['baseSHA256'], build['candidateSHA256']),
            'PATCH_BASE_SHA256_MISMATCH',
        ),
        'wrong_forward_patch': rejected(
            lambda: apply_exact(baseline, bad_patch, build['baseSHA256'], build['candidateSHA256']),
            'PATCH_RESULT_SHA256_MISMATCH',
        ),
        'wrong_rollback_candidate': rejected(
            lambda: apply_exact(candidate + b' ', patches, build['candidateSHA256'], build['baseSHA256'], reverse=True),
            'PATCH_BASE_SHA256_MISMATCH',
        ),
    }
    receipt = {
        'schema': 'MathScope.M4.R108.CandidateRollback/1',
        'criterion': 'R1-08',
        'originalBlueprintPage': 68,
        'originalCriterion': original,
        'matrixSHA256': digest(matrix),
        'sourceCommit': args.source_commit,
        'baselineSHA256': digest(baseline),
        'candidateSHA256': digest(candidate),
        'patchesSHA256': digest(patches_bytes),
        'restoredBaselineSHA256': digest(rolled_back),
        'patches': len(patches),
        'originalWorkerBridges': bridges,
        'localBrowserReceiptSHA256': digest(browser_bytes),
        'viewports': [view['viewport'] for view in browser['views']],
        'scopedFixtures': [{'id': row['id'], 'kind': row['request']['kind'],
                           'engine': row['engine'], 'claimId': row['claimId']} for row in fixtures],
        'formalClaims': [claim['claimId'] for claim in claims],
        'negativeControls': controls,
        'checks': {
            'DECLARED_CAPABILITIES_SCOPE': 'PASS_LOCAL_COMBINED_CANDIDATE',
            'PATCH_TEST_ROLLBACK': 'PASS_EXACT_BYTE_ROUND_TRIP_AND_LOCAL_BROWSER',
            'ACTUAL_POST_PUBLICATION_SCREEN_RECEIPT': 'OPEN_CURRENT_CANDIDATE_NOT_PUBLISHED',
        },
        'publicationConfirmed': False,
    }
    args.out.write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
