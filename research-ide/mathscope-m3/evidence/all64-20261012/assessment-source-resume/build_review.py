#!/usr/bin/env python3
"""Bind the resumed assessment to unchanged originals and observed source gates.

This is an assessment/provenance check, not a new mathematical execution.
The explicit decision file is reviewed separately; arbitrary PASS metadata
cannot add a criterion to its allowlist. Historical execution receipts are
read and verified, never edited to agree with a later assessment.
"""
import argparse
import hashlib
import importlib.util
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = next(p for p in HERE.parents if (p / 'research-ide').is_dir())
M3 = REPO / 'research-ide/mathscope-m3'
HISTORY = HERE.parent / 'assessment-before-source-domain46'
PROGRESS = ['P7_PROGRESS.json', 'P8_PROGRESS.json', 'GAUGE_PROGRESS.json',
            'N6_PROGRESS.json', 'N7_PROGRESS.json', 'N8_PROGRESS.json']
GROUPS = ['P7', 'P8', 'Y5', 'Y6', 'Y7', 'N6', 'N7', 'N8']
CATALOG_SHA = 'bfe0e57b127849a5413414c8e8340ed5592049082fd211d9172a2fce6f219156'
IDENTITY = ['id', 'title', 'text', 'page', 'source', 'sourceSha256']


def read(path):
    return json.loads(Path(path).read_bytes())


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def pin(path, root=M3):
    path = Path(path)
    raw = path.read_bytes()
    return {'path': str(path.relative_to(root)), 'bytes': len(raw), 'sha256': sha(raw)}


def dumped(value):
    return json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n'


def build(check_only=False):
    decision = read(HERE / 'decisions.json')
    history = read(HISTORY / 'manifest.json')
    current = {name: read(M3 / name) for name in PROGRESS}
    previous = {name: read(HISTORY / name) for name in PROGRESS}
    rows = {r['id']: r for value in current.values() for r in value['criteria']}
    old_rows = {r['id']: r for value in previous.values() for r in value['criteria']}
    catalog = {r['id']: r for r in read(M3 / 'ORIGINAL_M3_M4_CRITERIA.json')['criteria']
               if r['id'].split('-')[0] in GROUPS}
    checks = []

    def require(identity, valid, detail):
        checks.append({'id': identity, 'pass': bool(valid), 'detail': detail})
        if not valid:
            raise ValueError(identity + ': ' + str(detail))

    require('preserved45-history-byte-exact',
            history['counts'] == {'complete': 45, 'incomplete': 19, 'total': 64}
            and all(pin(HISTORY / row['path'], HISTORY) == row for row in history['files']),
            {'files': len(history['files']), 'manifest': pin(HISTORY / 'manifest.json')})
    accepted45 = read(HERE.parent / 'assessment-public-acceptance45/receipt.json')
    accepted45_verification = read(HERE.parent / 'assessment-public-acceptance45/binding-verification.json')
    require('earlier45-receipt-matches-preserved-progress',
            accepted45['status'] == 'PASS' and accepted45_verification['pass']
            and all(pin(HISTORY / row['path'], HISTORY) == row
                    for row in accepted45['currentProgress']),
            {'historicalVerification': pin(HERE.parent / 'assessment-public-acceptance45/binding-verification.json'),
             'reexecutedHistoricalVerifierAgainstNewMetadata': False})
    require('exact-original-catalog-and-all64-identities',
            sha((M3 / 'ORIGINAL_M3_M4_CRITERIA.json').read_bytes()) == CATALOG_SHA
            and set(rows) == set(old_rows) == set(catalog) and len(rows) == 64
            and all({k: r.get(k) for k in IDENTITY} ==
                    {k: old_rows[key].get(k) for k in IDENTITY} for key, r in rows.items())
            and all(re.sub(r'\s+', '', r[k]) == re.sub(r'\s+', '', catalog[key][k])
                    for key, r in rows.items() for k in ['title', 'text'])
            and all(rows[key]['page'] == catalog[key]['page'] for key in rows),
            {'count': len(rows), 'preservedFields': IDENTITY, 'catalogSHA256': CATALOG_SHA})
    changed = sorted(key for key in rows if rows[key]['originalCriterionComplete'] != old_rows[key]['originalCriterionComplete'])
    approved = sorted(decision['approvedPromotions'])
    require('only-explicitly-reviewed-promotions', changed == approved
            and all(rows[key]['originalCriterionComplete'] is True and not old_rows[key]['originalCriterionComplete'] for key in approved)
            and set(decision['criterionDecisions']) == set(approved),
            {'approved': approved, 'actualChangedBooleans': changed})
    require('p7-p8-and-gauge-current-acceptance-unchanged',
            all((M3 / name).read_bytes() == (HISTORY / name).read_bytes() for name in PROGRESS[:3]),
            {'files': PROGRESS[:3]})
    counts = {group: sum(r['originalCriterionComplete'] for key, r in rows.items() if key.startswith(group + '-')) for group in GROUPS}
    require('completion-status-and-package-counts-consistent',
            all(type(r['originalCriterionComplete']) is bool
                and r['originalCriterionComplete'] == (r['status'] in {'PASS', 'COMPLETE_WITHIN_STATED_SCOPE'}) for r in rows.values())
            and all(len([key for key in rows if key.startswith(group + '-')]) == 8 for group in GROUPS)
            and all(current[name].get('completedOriginalCriteria', sum(r['originalCriterionComplete'] for r in current[name]['criteria']))
                    == sum(r['originalCriterionComplete'] for r in current[name]['criteria']) for name in PROGRESS),
            counts)
    require('original-complete-rows-have-concrete-evidence',
            all(r.get('evidence') and all(isinstance(e, str) and e for e in r['evidence'])
                for r in rows.values() if r['originalCriterionComplete']), {'complete': sum(counts.values())})
    require('whole-m3-and-unproved-global-claims-remain-false',
            all(current[name]['wholeM3Complete'] is False for name in PROGRESS[3:])
            and current['P7_PROGRESS.json']['universalRHProved'] is False
            and current['P7_PROGRESS.json']['universalBSDProved'] is False
            and current['P7_PROGRESS.json']['newArithmeticLeanTheoremsProved'] is False
            and current['P8_PROGRESS.json']['wholeM3Complete'] is False,
            {'wholeM3Complete': False, 'universalRHProved': False, 'universalBSDProved': False})

    gates = []
    for gate in decision['observedGates']:
        receipt_path = M3 / gate['receipt']['path']
        require(gate['id'] + '-fixed-observed-receipt', pin(receipt_path) == gate['receipt'], gate['receipt'])
        receipt = read(receipt_path)
        for key, value in gate['requiredReceiptFields'].items():
            require(gate['id'] + '-receipt-' + key, receipt.get(key) == value, {'expected': value, 'observed': receipt.get(key)})
        if gate.get('archiveBuilder'):
            module_path = M3 / gate['archiveBuilder']
            spec = importlib.util.spec_from_file_location('resume_' + gate['id'].replace('-', '_'), module_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            # This verifies all captured source and artifact bytes, including
            # original raw bytes restored from the lossless signed archive.
            module.build(root=REPO, check=True)
            require(gate['id'] + '-archive-and-captured-current-source-bytes', True,
                    {'builder': pin(module_path), 'heavyConstructorRerun': False})
        gates.append({**gate, 'observedNodeTests': receipt.get('nodeTests'),
                      'sourceFileCount': receipt.get('sourceFileCount'),
                      'independentCheckCount': receipt.get('independentCheckCount', receipt.get('independentChecks')),
                      'elapsedSeconds': receipt.get('elapsedSeconds')})
    gate_ids = {gate['id'] for gate in gates}
    require('every-new-promotion-bound-to-reviewed-source-gates',
            all(value['gates'] and set(value['gates']) <= gate_ids and value['reason']
                and rows[key].get('acceptanceScope') and not rows[key].get('remaining')
                for key, value in decision['criterionDecisions'].items()),
            {key: value['gates'] for key, value in decision['criterionDecisions'].items()})

    total = sum(counts.values())
    lines = [
        '# MathScope M3 전체 64개 원문 기준 누적 검토', '',
        f'**현재 원문 기준 완료는 {total}/64개이며, 실질 잔여는 {64-total}개다.** 원문의 제목·본문·쪽수·출처는 보존했다. 개별 연산자 또는 관측 요구의 완료와 전체 Navier 장의 재구성은 별도 판정한다.', '',
        '검토 기준 시각: `' + decision['reviewedAt'] + '`. 이 보고서는 연결 복구 뒤 실제 추가한 소스 연산·검증·표시 연결을 반영한다. 공개 사이트와 GitHub의 최종 배포 검증은 별도 릴리스 기록에서 확인한다.', '',
        '## 1. 원문별 현재 집계', '',
        '| 묶음 | 원문 수 | 완료 | 실질 잔여 | 진행표 |',
        '|---|---:|---:|---:|---|',
    ]
    for group in GROUPS:
        name = 'GAUGE_PROGRESS.json' if group.startswith('Y') else group + '_PROGRESS.json'
        lines.append(f'| {group} | 8 | {counts[group]} | {8-counts[group]} | [{name}]({name}) |')
    lines += [f'| **전체** | **64** | **{total}** | **{64-total}** | |', '',
              '완료 수는 `originalCriterionComplete === true`만 센다. 실행 성공, 그래프 해시 일치, 조건부 명제, 유한 모형 결과를 다른 원문 요구의 완료로 바꾸지 않는다. M2의 보존된 64개와 M4의 별도 16개는 이번 집계에 합산하지 않는다.', '',
              '## 2. 이전 판정과 이번 추가 승인', '',
              '이전 45/64 진행표와 전체 보고서의 정확한 바이트는 [보존 manifest](evidence/all64-20261012/assessment-before-source-domain46/manifest.json)에 있다. 당시 31→45 승인 및 실제 CI/API/UI 기록은 [이전 승인 receipt](evidence/all64-20261012/assessment-public-acceptance45/receipt.json)에 유지했다. 과거 실행 receipt의 판정 플래그는 새 검토에 맞춰 덮어쓰지 않았다.', '',
              '| 새 완료 항목 | 원문 요구에 대한 추가 검토 | 실제 관문 |',
              '|---|---|---|']
    for key in approved:
        value = decision['criterionDecisions'][key]
        lines.append('| ' + key + ' | ' + value['reason'].replace('|', '\\|') + ' | ' + ', '.join(value['gates']) + ' |')
    lines += ['', '### 실제 새 소스 관문', '',
              '| 관문 | Node 검사 | 독립 검사 | 실행 중 불변 소스 | 실행 시간(초) | 원본 receipt |',
              '|---|---:|---:|---:|---:|---|']
    for gate in gates:
        node = gate.get('observedNodeTests') or {}
        elapsed = gate.get('elapsedSeconds')
        lines.append('| ' + gate['id'] + ' | ' + str(node.get('passed', '—')) + ' | '
                     + str(gate.get('independentCheckCount') if gate.get('independentCheckCount') is not None else '—')
                     + ' | ' + str(gate.get('sourceFileCount') if gate.get('sourceFileCount') is not None else '—')
                     + ' | ' + (f'{elapsed:.3f}' if isinstance(elapsed, (int, float)) else '—')
                     + ' | [receipt](' + gate['receipt']['path'] + ') |')
    lines += ['', '관문별 실행 횟수는 서로 합산해 새 전체 테스트 수로 표시하지 않는다. 원본 생성자 실행과 작은 기록 검증·새 재생·표시 검증은 서로 다른 동작이다. signed 대형 원본은 [무손실 압축 manifest](navier/evidence/packed-evidence.json)의 원본 SHA와 정확히 일치하도록 복원 가능하다.', '',
              '### 전체 재구성과 개별 요구의 경계', '', *decision['scopeNotes'], '',
              '## 3. 원문 64개와 현재 판정', '',
              '다음 원문 블록은 [원문 카탈로그](ORIGINAL_M3_M4_CRITERIA.json)의 제목·본문을 그대로 사용한다. PDF 추출에 따른 원래 줄바꿈과 띄어쓰기를 유지한다. 진행표의 기존 원문 필드 역시 이전 45개 승인 시점의 값에서 바뀌지 않았다.', '']
    for group in GROUPS:
        lines += ['### ' + group, '']
        for key in [f'{group}-{i:02d}' for i in range(1, 9)]:
            r, original = rows[key], catalog[key]
            lines += [f'#### {key} — {original["title"]}', '',
                      f'원문: {original["page"]}쪽. 출처 PDF SHA-256: `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.', '',
                      '```text', original['text'], '```', '',
                      f'**판정:** `status={r["status"]}` · `originalCriterionComplete={str(r["originalCriterionComplete"]).lower()}`.', '']
            if r.get('acceptanceScope'):
                lines += ['**검증 범위:** ' + r['acceptanceScope'], '']
            if r.get('remaining'):
                lines += ['**남은 의무:**', ''] + ['- ' + value for value in r['remaining']] + ['']
            references = list(dict.fromkeys(r.get('evidence', [])))
            lines += ['**증거와 구현:**', '']
            lines += ['- [' + value + '](' + value + ')' for value in references]
            lines += ['']
    lines += ['## 4. 현재 진행표 바이트와 검토 재현', '',
              '| 진행표 | 바이트 | SHA-256 |', '|---|---:|---|']
    progress_pins = [pin(M3 / name) for name in PROGRESS]
    for row in progress_pins:
        lines.append(f'| [{row["path"]}]({row["path"]}) | {row["bytes"]} | `{row["sha256"]}` |')
    lines += ['', '```bash',
              'python -B research-ide/mathscope-m3/evidence/all64-20261012/assessment-source-resume/build_review.py --check',
              '```', '',
              '이 명령은 원문 64개, 이전 기록, 승인 목록, 현재 진행표, 고정 receipt와 소스/아카이브의 바이트를 검증한다. 새 수학 생성자나 새 Lean 실행을 수행하지 않는다. 실제 생성자·CI 명령과 메모리 분리는 [CI 실행 가이드](CI_EXECUTION_WORKSPACES.md)에 있다.', '']
    report = '\n'.join(lines)
    blocks = list(re.finditer(r'^#### ([PNY]\d-\d{2}) — ([^\n]+)\n(.*?)(?=^#### |^### |^## |\Z)', report, re.M | re.S))
    require('report64-exact-original-blocks-and-current-status', len(blocks) == 64
            and all(m.group(2) == catalog[m.group(1)]['title']
                    and re.findall(r'```text\n(.*?)\n```', m.group(3), re.S) == [catalog[m.group(1)]['text']]
                    and f'`originalCriterionComplete={str(rows[m.group(1)]["originalCriterionComplete"]).lower()}`' in m.group(3)
                    for m in blocks), {'originalBlocks': len(blocks), 'complete': total, 'incomplete': 64-total})
    outputs = {M3 / 'M3_ALL64_REVIEW_KO.md': report}
    receipt = {'schema': 'MathScope.M3.ResumedOriginal64Assessment/1', 'reviewedAt': decision['reviewedAt'],
               'status': 'PASS', 'pass': True, 'checkCount': len(checks), 'checks': checks,
               'before': history['counts'], 'after': {'complete': total, 'incomplete': 64-total, 'total': 64},
               'counts': counts, 'approvedPromotions': approved,
               'decision': pin(HERE / 'decisions.json'), 'reviewBuilder': pin(Path(__file__)),
               'currentProgress': progress_pins, 'history': pin(HISTORY / 'manifest.json'),
               'report': {'path': 'M3_ALL64_REVIEW_KO.md', 'bytes': len(report.encode()), 'sha256': sha(report.encode())},
               'observedGates': gates, 'heavyConstructorRerunByAssessment': False,
               'newLeanExecuted': False, 'wholeM3Complete': False}
    outputs[HERE / 'receipt.json'] = dumped(receipt)
    for path, content in outputs.items():
        if check_only:
            if not path.is_file() or path.read_bytes() != content.encode():
                raise ValueError('Stale reviewed output: ' + str(path))
        else:
            path.write_text(content, encoding='utf-8', newline='\n')
    return {'status': 'PASS', 'checks': len(checks), 'counts': receipt['after'],
            'approvedPromotions': approved, 'checkOnly': check_only, 'receipt': pin(HERE / 'receipt.json')}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(args.check), ensure_ascii=False))
