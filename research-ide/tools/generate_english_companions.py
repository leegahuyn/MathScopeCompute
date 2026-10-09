#!/usr/bin/env python3
"""Generate the English acceptance companion without changing any original member."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    original_path = ROOT / 'mathscope-m1/evidence/original-acceptance.json'
    normalized_path = ROOT / 'mathscope-m1/report/M0_M1_normalized-report-data.json'
    originals = json.loads(original_path.read_text())
    normalized = json.loads(normalized_path.read_text())
    statuses = {row['id']: row for row in normalized['items']}
    translations = json.loads((ROOT / 'localization/acceptance-text.en.json').read_text())
    stages = {
        'I0': 'Mathematical objects, assumptions, and observation contracts',
        'I1': 'Exact arithmetic, precision, and computation jobs',
        'I3': 'Lean formalization, evidence grades, and research gates',
        'P1': 'The infinite prime specification and prime-indexed arithmetic data',
        'P2': 'Prisms, precision, complexes, and derived operations',
        'P3': 'Explicit point and projective-line comparison models',
        'Y1': 'Concrete compact groups, representations, and Lie algebras',
        'Y2': 'Actual four-dimensional classical gauge fields',
        'N1': 'Source edition, theorem, and proof-evidence scope',
        'N2': 'Coordinates, viscosity, exterior, and reference solutions',
        'N3': 'The actual inner–annulus–exterior leading profile',
    }
    ids = [row['id'] for row in originals]
    assert len(ids) == 70 and len(set(ids)) == 70
    assert set(translations) == set(ids) == set(statuses)
    items = []
    for source in originals:
        translated = translations[source['id']]
        assert len(translated) == 3 and all(isinstance(s, str) and s for s in translated)
        status = statuses[source['id']]
        items.append({
            'id': source['id'],
            'stage': source['stage'],
            'stageTitle': stages[source['stage']],
            'title': translated[0],
            'detail': translated[1],
            'acceptanceCriterion': translated[2],
            'baselineStatus': status['status'],
            'sourceFile': source['sourceFile'],
            'originalRecordSha256': sha(json.dumps(source, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()),
            'originalArtifacts': status['artifacts'],
            'scopeDocument': 'docs/NS_GATES_EN.md' if source['stage'].startswith('N') else 'docs/MATHEMATICAL_SCOPE_EN.md',
        })
    counts = {state: sum(x['baselineStatus'] == state for x in items) for state in ('PASS','PARTIAL','BLOCKED')}
    assert counts == {'PASS': 61, 'PARTIAL': 7, 'BLOCKED': 2}, counts
    data = {
        'schema': 'MathScope.EnglishAcceptanceCompanion/1',
        'locale': 'en',
        'baseline': 'v54 / 16f4f911; 2026-10-10 Asia/Seoul',
        'historicalSnapshot': True,
        'translationScope': 'Full titles, implementation requirements, and acceptance criteria of all 70 original entries. Status is copied from the frozen v54 report; it is not a new mathematical assessment.',
        'originalAcceptancePath': 'mathscope-m1/evidence/original-acceptance.json',
        'originalAcceptanceSha256': sha(original_path.read_bytes()),
        'statusSourcePath': 'mathscope-m1/report/M0_M1_normalized-report-data.json',
        'statusSourceSha256': sha(normalized_path.read_bytes()),
        'originalRecordDigestPolicy': 'SHA-256 of UTF-8 Python json.dumps(original, ensure_ascii=False, sort_keys=True, separators=(comma,colon)).',
        'counts': counts,
        'items': items,
    }
    write_json(ROOT / 'localization/acceptance.en.json', data)
    lines = [
        '# Original acceptance criteria — complete English companion', '',
        'This document translates all **70 original titles, implementation requirements, and acceptance criteria**. The IDs and their order are unchanged. The status column is the **frozen v54 assessment**: 61 PASS, 7 PARTIAL, and 2 BLOCKED. Any subsequent work is recorded separately in [CURRENT_STATUS_EN.md](CURRENT_STATUS_EN.md); it does not overwrite this historical snapshot.', '',
        'A PASS has the scope stated by the criterion and the implemented adapter. It does not certify arbitrary prisms, every compact group, a quantum Yang–Mills construction, a global BSD/Riemann hypothesis claim, or a complete numerical NS witness. See [mathematical scope](MATHEMATICAL_SCOPE_EN.md) and [the nine NS gates](NS_GATES_EN.md).', '',
        'Sources: [unchanged original criteria](../mathscope-m1/evidence/original-acceptance.json), [unchanged v54 assessment](../mathscope-m1/report/M0_M1_normalized-report-data.json), and the [English machine-readable companion](../localization/acceptance.en.json). Full Korean implementation and validation narratives remain in those original records. The English domain and NS documents explain what the corresponding computations establish.', '',
        '| Group | Total | PASS | PARTIAL | BLOCKED |',
        '|---|---:|---:|---:|---:|',
    ]
    for group in ('M0','Arithmetic','Gauge','Navier','M1','Total'):
        row=normalized['counts'][group]
        lines.append(f"| {group} | {row['total']} | {row['PASS']} | {row['PARTIAL']} | {row['BLOCKED']} |")
    current_stage=None
    for item in items:
        if item['stage'] != current_stage:
            current_stage=item['stage']
            lines += ['', f"## {current_stage} — {item['stageTitle']}", '']
        lines += [f"### {item['id']} — {item['title']}", '', f"**v54 status: {item['baselineStatus']}.**", '', f"**Implementation requirement.** {item['detail']}", '', f"**Acceptance criterion.** {item['acceptanceCriterion']}", '']
        sources=[]
        for value in item['originalArtifacts']:
            if not isinstance(value,str):
                sources.append('`'+json.dumps(value,ensure_ascii=True)+'`'); continue
            candidate=value.split(':',1)[0]
            if candidate.startswith('mathscope-'):
                relative=candidate
            elif item['stage'].startswith('P'):
                relative='mathscope-m1/arithmetic/'+candidate
            elif item['stage'].startswith('Y'):
                relative='mathscope-m1/gauge/'+candidate
            elif item['stage'].startswith('N'):
                relative='mathscope-m1/navier/'+candidate
            else:
                relative=candidate
            if (ROOT/relative).is_file():
                sources.append(f'[{value}](../{relative})')
            else:
                sources.append(f'`{value}`')
        lines += ['**Evidence and implementation locators.** '+ '; '.join(sources), '']
    lines += ['## Translation and provenance', '',
        'The complete Korean source entries remain byte-for-byte intact. English wording is stored outside the mathematical source tree and cannot change a request, result, proof, source pin, or acceptance status. The machine-readable companion includes a digest for each original record and digests for the original criteria and assessment files.', '',
        'N1-05 preserves the blueprint’s historical statement that no rebuild had been performed when it was written. Later selected builds and the release-time full-build snapshot are described in [EVIDENCE_AND_PROVENANCE_EN.md](EVIDENCE_AND_PROVENANCE_EN.md). N1-04 likewise translates the original dated announcement requirement; it is not a claim about a later award or review decision.', '']
    (ROOT/'docs/ACCEPTANCE_CRITERIA_EN.md').write_text('\n'.join(lines),encoding='utf-8')
    print(json.dumps({'translatedEntries':len(items),'baselineCounts':counts,'criteriaSha256':data['originalAcceptanceSha256']}))


if __name__ == '__main__':
    main()
