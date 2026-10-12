#!/usr/bin/env python3
"""Read-only binding review of the accepted original-criterion metadata update."""
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = next(p for p in HERE.parents if (p / 'research-ide').is_dir())
M3 = REPO / 'research-ide/mathscope-m3'
HISTORY = HERE.parent / 'assessment-before-public-acceptance45'
sha = lambda data: hashlib.sha256(data).hexdigest()
read = lambda path: json.loads(Path(path).read_bytes())


def main():
    decision = read(HERE / 'receipt.json')
    history = read(HISTORY / 'manifest.json')
    checks = []

    def check(key, value, detail):
        checks.append({'id': key, 'pass': bool(value), 'detail': detail})

    def pin(path):
        path = Path(path)
        data = path.read_bytes()
        return {'path': str(path.relative_to(REPO)), 'bytes': len(data), 'sha256': sha(data)}

    files = [x['path'] for x in decision['currentProgress']]
    current = {n: read(M3 / n) for n in files}
    previous = {n: read(HISTORY / n) for n in files}
    rows = {r['id']: r for p in current.values() for r in p['criteria']}
    old_rows = {r['id']: r for p in previous.values() for r in p['criteria']}
    catalog = {r['id']: r for r in read(M3 / 'ORIGINAL_M3_M4_CRITERIA.json')['criteria'] if r['id'].split('-')[0] in {'P7', 'P8', 'Y5', 'Y6', 'Y7', 'N6', 'N7', 'N8'}}
    approved = [*(f'P7-{n:02d}' for n in range(1, 9)), 'P8-06', 'Y5-05', 'Y5-06', 'Y5-08', 'N8-06', 'N8-07']
    original_fields = ['id', 'title', 'text', 'page', 'source', 'sourceSha256']
    fields_equal = all({k: r.get(k) for k in original_fields} == {k: old_rows[key].get(k) for k in original_fields} for key, r in rows.items())
    check('all64-original-fields-byte-value-unchanged', len(rows) == len(old_rows) == len(catalog) == 64 and set(rows) == set(catalog) and fields_equal, {'criterionCount': len(rows), 'fields': original_fields, 'exactExistingFieldValuesPreserved': fields_equal})
    changed_bools = sorted(k for k, r in rows.items() if r['originalCriterionComplete'] != old_rows[k]['originalCriterionComplete'])
    check('only14-whitelisted-original-bools-promoted', changed_bools == sorted(approved) and all(rows[k]['originalCriterionComplete'] is True for k in approved), {'actualChangedBooleanIDs': changed_bools})
    counts = {g: sum(r['originalCriterionComplete'] for k, r in rows.items() if k.startswith(g + '-')) for g in ['P7', 'P8', 'Y5', 'Y6', 'Y7', 'N6', 'N7', 'N8']}
    check('current-original-counts45-and19', counts == {'P7': 8, 'P8': 8, 'Y5': 8, 'Y6': 8, 'Y7': 8, 'N6': 0, 'N7': 0, 'N8': 5} and sum(counts.values()) == 45 and decision['after'] == {'complete': 45, 'finalVerificationPending': 0, 'substantiveRemaining': 19, 'originalCriteria': 64}, counts)
    untouched = [k for k in rows if k not in approved and k != 'N7-07']
    check('all-other-original-rows-unchanged', all(rows[k] == old_rows[k] for k in untouched), {'unchangedRows': len(untouched), 'nonPromotedEvidenceUpdate': 'N7-07'})
    check('n707-conditional-final-field-not-promoted', rows['N7-07']['status'] == 'PARTIAL' and rows['N7-07']['originalCriterionComplete'] is False and rows['N7-07']['currentSourceAndPublicEvidence']['completeFinalN6Constructed'] is False and rows['N7-07']['currentSourceAndPublicEvidence']['externalFinalFieldDependencies'] == ['Proposition9.9', 'Proposition10.1'], {'status': rows['N7-07']['status'], 'originalCriterionComplete': False, 'remaining': rows['N7-07']['remaining']})
    check('historical-before31-report-and-six-progress-byte-exact', all((HISTORY / x['path']).stat().st_size == x['bytes'] and sha((HISTORY / x['path']).read_bytes()) == x['sha256'] for x in history['files']), {'copiedFiles': len(history['files']), 'historicalCounts': history['counts']})
    check('old56-and-original-catalog-byte-exact', all((M3 / x['path']).stat().st_size == x['bytes'] and sha((M3 / x['path']).read_bytes()) == x['sha256'] for x in history['untouchedOriginals']), history['untouchedOriginals'])
    p7_preserved = ['previousAssessment', 'previousAssessments', 'publicRuntime', 'executedRelease', 'continuationEvidence', 'browserP7Visualization']
    check('historical-public-runtime-and-receipt-snapshots-retained', all(current['P7_PROGRESS.json'][k] == previous['P7_PROGRESS.json'][k] for k in p7_preserved) and current['P8_PROGRESS.json']['previousAssessments'] == previous['P8_PROGRESS.json']['previousAssessments'] and rows['P8-06']['currentRecordedArithmeticMutationEvidence'] == old_rows['P8-06']['currentRecordedArithmeticMutationEvidence'] and rows['N8-06']['liveVerification'] == old_rows['N8-06']['liveVerification'], {'P7PreservedFields': p7_preserved, 'P8PackagingTimeReceiptPreserved': True, 'N8v85ReceiptPreserved': True})
    limitations = ['researchLimitations', 'scopeLimits', 'continuumClaim', 'clayProblemSolved']
    check('all-existing-research-limitations-and-conjecture-flags-retained', all(r.get(k) == rows[id].get(k) for id, r in old_rows.items() for k in limitations if k in r) and all(current['P7_PROGRESS.json'][k] is False for k in ['M3AllCriteriaComplete', 'universalRHProved', 'universalBSDProved', 'newArithmeticLeanTheoremsProved']) and current['P8_PROGRESS.json']['wholeM3Complete'] is False and all(current[n]['wholeM3Complete'] is False for n in ['N6_PROGRESS.json', 'N7_PROGRESS.json', 'N8_PROGRESS.json']), {'limitationsFields': limitations, 'universalRHProved': False, 'universalBSDProved': False, 'wholeM3Complete': False})
    check('progress-sha-pins-match-decision', all((M3 / x['path']).stat().st_size == x['bytes'] and sha((M3 / x['path']).read_bytes()) == x['sha256'] for x in decision['currentProgress']) and sha((HISTORY / 'manifest.json').read_bytes()) == decision['history']['sha256'], {'progressFiles': len(decision['currentProgress']), 'historySHA256': decision['history']['sha256']})
    check('n6-progress-unchanged', (M3 / 'N6_PROGRESS.json').read_bytes() == (HISTORY / 'N6_PROGRESS.json').read_bytes(), pin(M3 / 'N6_PROGRESS.json'))

    report = (M3 / 'M3_ALL64_REVIEW_KO.md').read_text()
    old_report = (HISTORY / 'M3_ALL64_REVIEW_KO.md').read_text()
    blocks = list(re.finditer(r'^#### ([PNY]\d-\d{2}) — ([^\n]+)\n(.*?)(?=^#### |^### |^## |\Z)', report, re.M | re.S))
    check('report64-original-titles-and-fenced-text-exact', len(blocks) == 64 and all(m.group(2) == catalog[m.group(1)]['title'] and re.findall(r'```text\n(.*?)\n```', m.group(3), re.S) == [catalog[m.group(1)]['text']] for m in blocks) and re.findall(r'```text\n(.*?)\n```', report, re.S) == re.findall(r'```text\n(.*?)\n```', old_report, re.S), {'reportCriterionBlocks': len(blocks), 'originalFencedTexts': len(re.findall(r'```text\n', report))})
    check('report-status-bools-match-current-progress', all(f'`status={rows[m.group(1)]["status"]}`' in m.group(3) and f'`originalCriterionComplete={str(rows[m.group(1)]["originalCriterionComplete"]).lower()}`' in m.group(3) for m in blocks), {'trueRows': len(re.findall(r'^\*\*판정:\*\* .*`originalCriterionComplete=true`', report, re.M)), 'falseRows': len(re.findall(r'^\*\*판정:\*\* .*`originalCriterionComplete=false`', report, re.M))})
    old_ledger = re.findall(r'^\| E\d{3} \|.*$', old_report, re.M)
    check('historical-e001-through-e184-lines-unchanged', len(old_ledger) == 184 and re.findall(r'^\| E\d{3} \|.*$', report, re.M) == old_ledger, {'historicalEvidenceRows': len(old_ledger)})
    pins = re.findall(r'^\| (F\d{3}) \| \[([^\]]+)\]\([^\)]+\) \| (\d+) \| `([a-f0-9]{64})` \|$', report, re.M)
    check('new-report-evidence-pins-match-actual-bytes', len(pins) == 24 and all((M3 / path).is_file() and (M3 / path).stat().st_size == int(size) and sha((M3 / path).read_bytes()) == digest for _, path, size, digest in pins), {'newEvidenceRows': len(pins)})
    log = (M3 / 'evidence/all64-20261012/ci-c971/p7-job-114802713677.log').read_text()
    check('latest-ci-counts-not-borrowed-from-old-runs', all(x in log for x in ['161 passed', '233 passed', '# pass 138']) and '이전529의 JavaScript117' in report and '실제 c971 CI' in report, {'latestP7SeparateCommands': {'API': 161, 'M3Python': 233, 'P7JavaScript': 138}, 'olderRunsAdded': False})
    references = [x for c in decision['criterionChanges'] for x in c['evidence']]
    check('criterion-release-evidence-pins-exist-and-match', all((M3 / x['path']).is_file() and (M3 / x['path']).stat().st_size == x['bytes'] and sha((M3 / x['path']).read_bytes()) == x['sha256'] for x in references), {'criterionEvidenceReferences': len(references)})

    result = {'schema': 'MathScope.M3.Original64AcceptanceBindingVerification/1', 'recordedAt': datetime.now(timezone.utc).isoformat(), 'status': 'PASS' if all(x['pass'] for x in checks) else 'FAIL', 'pass': all(x['pass'] for x in checks), 'checkCount': len(checks), 'passedChecks': sum(x['pass'] for x in checks), 'checks': checks, 'scope': 'Read-only original-field, count, report, historical-byte and receipt/source-binding checks; no new mathematical or browser/CI execution.', 'verifiedFiles': [pin(M3 / 'M3_ALL64_REVIEW_KO.md'), pin(HERE / 'receipt.json'), pin(HISTORY / 'manifest.json'), pin(__file__), *[pin(M3 / n) for n in files]], 'currentCounts': decision['after']}
    out = HERE / 'binding-verification.json'
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'passed': result['passedChecks'], 'total': len(checks), 'failures': [x['id'] for x in checks if not x['pass']], 'receipt': pin(out)}, ensure_ascii=False))
    return 0 if result['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
