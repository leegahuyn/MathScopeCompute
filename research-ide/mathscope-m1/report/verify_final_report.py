#!/usr/bin/env python3
"""Audit the generated report against its frozen source data; not visual QA.

This command never runs domain calculations, changes acceptance criteria, calls
a PDF operation marker, or treats an active Lean build as a completed receipt.
Run it after the final --build and before the separate all-page visual review.
"""
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import sys
import unicodedata

from pypdf import PdfReader

from build_m0_m1_report import NORMALIZE

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PDF = ROOT / 'output/pdf/MathScope_M0_M1_Implementation_Checklist_KO.pdf'
RELEASE = ROOT / 'mathscope-m1/evidence/release-report-data.json'


def read(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compact(text):
    # The authoring renderer explicitly replaces typographic dash variants and
    # nonbreaking whitespace. Compare the same displayed characters, while the
    # separate original-field equality check above remains byte-for-byte strict.
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', text.translate(NORMALIZE))).replace('\u00ad', '')


def main():
    release = read(RELEASE)
    model = read(HERE / 'M0_M1_normalized-report-data.json')
    original = read(ROOT / 'mathscope-m1/evidence/original-acceptance.json')
    audit = read(HERE / 'M0_M1_pdf-audit.json')
    build = read(ROOT / 'mathscope-m1/build-manifest.json')
    final_version = str(release['release']['version']).removeprefix('v')
    deployment_path = ROOT / f'mathscope-m1/evidence/deployment-v{final_version}-verified.json'
    deployment = read(deployment_path)
    reader = PdfReader(str(PDF))
    text = '\n'.join(page.extract_text() or '' for page in reader.pages)
    normalized_text = compact(text)
    by_id = {item['id']: item for item in model['items']}
    failures = []

    def check(value, label):
        if not value:
            failures.append(label)
        return bool(value)

    check(len(original) == len(by_id) == 70, 'exactly 70 unique original criteria')
    exact_fields = True
    all_printed = True
    for item in original:
        target = by_id.get(item['id'], {})
        for key in ('id', 'title', 'detail', 'accept', 'stage', 'stageTitle', 'sourceFile'):
            same = check(target.get(key) == item[key], f'{item["id"]}: original {key} unchanged')
            exact_fields &= same
        for key in ('id', 'title', 'detail', 'accept'):
            present = check(compact(item[key]) in normalized_text, f'{item["id"]}: entire {key} printed')
            all_printed &= present

    metadata = {key: check(model['metadata'].get(key) == release['release'].get(key), 'metadata ' + key)
                for key in ('version', 'buildId', 'date', 'siteUrl', 'workerSha256', 'bundleSha256')}
    check(str(deployment['version']) == final_version, 'deployment version')
    check(deployment['versionHash'] == release['release']['buildId'], 'deployment version hash')
    source_hashes = {}
    for key in ('workerSha256', 'bundleSha256'):
        source_hashes[key] = check(build[key] == deployment[key] == release['release'][key], 'build/deployment/release ' + key)
        check(release['release'][key] in normalized_text, key + ' printed')
    check(model['releaseData'] == release, 'entire frozen release embedded in normalized model')
    check(not release.get('finalValidationPending'), 'no unrecorded final validation')
    check(model['counts']['Total'] == {'total': 70, 'PASS': 61, 'PARTIAL': 7, 'BLOCKED': 2, 'PENDING_DATA': 0}, 'original 61/7/2 counts')
    check(by_id['N3-05']['status'] == 'BLOCKED', 'N3-05 original interval-Newton acceptance remains BLOCKED')
    check(by_id['N3-06']['status'] == 'BLOCKED', 'N3-06 original whole-profile cone acceptance remains BLOCKED')

    overrides = {}
    aliases = {'scopeBoundary': 'boundary'}
    for item_id, override in release.get('overrides', {}).items():
        if not isinstance(override, dict):
            continue
        overrides[item_id] = {}
        for key in ('status', 'implementation', 'validation', 'artifacts', 'remaining', 'leanTargets', 'mathGateStatus', 'scopeBoundary', 'reportDisplay'):
            if key in override:
                overrides[item_id][key] = check(by_id[item_id].get(aliases.get(key, key)) == override[key], item_id + ': final override ' + key)

    records = {}
    suites = list(release['tests'].items())
    suites += [('followup.' + key, value) for key, value in release['tests'].get('followup', {}).items()]
    for key, record in suites:
        if not isinstance(record, dict):
            continue
        path_text = record.get('artifact') or record.get('path')
        if not isinstance(path_text, str):
            continue
        path = ROOT / path_text
        records[key] = {'path': path_text, 'exists': path.is_file(),
                        'sha256': sha(path) if path.is_file() else None,
                        'executionVersion': record.get('executionVersion'),
                        'pass': record.get('pass'), 'total': record.get('total'),
                        'printed': compact(path_text) in normalized_text}
        check(path.is_file(), key + ': evidence file exists')
        # Each followup suite and the separately displayed final cohorts print
        # their own provenance. Initial domain tables cite their item cards.
        if key.startswith('followup.') or key in ('core', 'm0Regression', 'officialNS', 'browserLiveChecks', 'cli', 'browserFinal', 'cliFinal'):
            check(records[key]['printed'], key + ': evidence path printed')

    check(sha(PDF) == audit['sha256'], 'PDF SHA matches structural audit')
    check(len(reader.pages) == audit['pages'], 'page count matches structural audit')
    check(not any(audit.get(k) for k in ('missingIds', 'missingItemLayoutRecords', 'missingGlyphs', 'outsideSafePageBounds')), 'structural layout audit clear')
    result = {
        'schema': 'MathScope.M0M1.FinalReportChecks/2',
        'checkedUTC': dt.datetime.now(dt.timezone.utc).isoformat(),
        'status': 'PASS' if not failures else 'FAIL',
        'criteria': len(original), 'exactOriginalFieldsPreserved': bool(exact_fields),
        'fullOriginalTextsPresentInPDF': bool(all_printed), 'failures': failures,
        'textMatchingPolicy': 'All source fields compare exactly. PDF full-text matching applies only the renderer\'s existing typographic dash/whitespace substitutions, Unicode compatibility normalization, and line-wrap whitespace removal; no words or clauses are omitted.',
        'metadataMatchesFinalRelease': metadata, 'buildAndDeploymentHashesMatch': source_hashes,
        'verifiedDeploymentReceipt': str(deployment_path.relative_to(ROOT)),
        'finalOverridesAppliedExactly': overrides, 'counts': model['counts'],
        'releaseValidationRecords': records,
        'executionCohorts': {key: release['tests'][key] for key in ('browserLiveChecks', 'cli', 'browserFinal', 'cliFinal') if key in release['tests']},
        'scope': release['scope'], 'originalBuildSnapshot': release.get('originalBuildSnapshot'),
        'originalCriteriaSHA256': sha(ROOT / 'mathscope-m1/evidence/original-acceptance.json'),
        'pdfSHA256': sha(PDF), 'releaseDataSHA256': sha(RELEASE),
        'pdfPages': len(reader.pages),
        'visualQA': 'SEPARATE_ACTUAL_ALL_PAGE_INSPECTION_REQUIRED',
        'domainCalculationsRerun': False, 'leanKernelRerun': False,
    }
    (HERE / 'M0_M1_final-checks.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'pages': len(reader.pages), 'criteria': len(original), 'failures': failures}, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == '__main__':
    sys.exit(main())
