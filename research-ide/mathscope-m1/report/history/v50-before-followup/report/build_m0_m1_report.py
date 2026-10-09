#!/usr/bin/env python3
"""Create the Korean report for the 70 ORIGINAL M0/M1 acceptance criteria.

Preparation is separate from PDF authoring:
  python mathscope-m1/report/build_m0_m1_report.py --preflight
  python mathscope-m1/report/build_m0_m1_report.py --data FINAL.json --build

The operator must run the PDF artifact marker once immediately before the first
--build command. This script intentionally does not call the marker itself.
It never edits domain sources, original criteria, release data, or old PDFs.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import hashlib
import html
import json
import math
import re
import subprocess
import sys
from pathlib import Path

from fontTools.ttLib import TTFont as FontToolsFont
from matplotlib import get_data_path as mpl_data_path
from matplotlib.font_manager import FontProperties
from matplotlib.mathtext import MathTextParser
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase import ttfonts as rl_ttfonts
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Flowable, Frame, PageTemplate, Paragraph, Spacer,
    PageBreak, KeepTogether, Table, TableStyle, HRFlowable,
)
from reportlab.platypus.tableofcontents import TableOfContents

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
M1 = ROOT / 'mathscope-m1'
ORIGINAL = M1 / 'evidence/original-acceptance.json'
DEFAULT_OUTPUT = ROOT / 'output/pdf/MathScope_M0_M1_Implementation_Checklist_KO.pdf'
NAVY = colors.HexColor('#173746')
TEAL = colors.HexColor('#137F81')
SLATE = colors.HexColor('#506673')
LIGHT = colors.HexColor('#EFF5F6')
INK = colors.HexColor('#253B48')
STATUS = {
    'PASS': (colors.HexColor('#08795F'), colors.HexColor('#E8F5EE'), '충족'),
    'PARTIAL': (colors.HexColor('#986008'), colors.HexColor('#FFF3D8'), '일부 완료'),
    'BLOCKED': (colors.HexColor('#A2353E'), colors.HexColor('#FAECEC'), '관문 미통과'),
    'PENDING_DATA': (SLATE, LIGHT, '최종 자료 대기'),
}
PAGE_W, PAGE_H = A4
MARGIN = 19 * mm
WIDTH = PAGE_W - 2 * MARGIN
FRAME_H = PAGE_H - 39 * mm
STAGE_ORDER = ['M0', 'P1', 'P2', 'P3', 'Y1', 'Y2', 'N1', 'N2', 'N3']
STAGE_TITLES = {
    'M0': 'M0 / 남은 6개 공통 기반 수용기준',
    'P1': 'P1 / 전체 소수와 소수별 산술 객체',
    'P2': 'P2 / 계수환·정밀도·derived complex',
    'P3': 'P3 / 점과 P¹의 실제 prismatic 비교 모델',
    'Y1': 'Y1 / 실제 게이지 군·대수·표현',
    'Y2': 'Y2 / 4차원 고전장과 불변 관측',
    'N1': 'N1 / NS 원문·정리·형식 검증 범위',
    'N2': 'N2 / 좌표·점성·외곽·기준 해',
    'N3': 'N3 / 선도 프로파일의 구현과 남은 관문',
}
SCOPE_NOTES = {
    'M0': '이번 표의 6개는 기존 M0 전체가 아니라 이전 보고서에 남아 있던 항목이다. M1 도메인 구현과 공통 계약·세션·검증 기능이 함께 충족해야 하며, 각 도메인의 제한은 계속 보존한다.',
    'P1': 'PrimeSet은 무한 논리 영역이고 계산 완료 범위는 유한 구간이다. 소수별 계수환·국소 인자와 불완전 전역 묶음의 범위를 분리한다.',
    'P2': '정수·유한 p-power ring의 정확 계산, p-adic 자릿수, cutoff, derived tensor를 다른 필드로 관리한다. 일반 prism의 임의 입력이나 Nygaard descent를 승인하지 않는다.',
    'P3': '실제 smooth proper lift와 모든 Laurent weight의 contraction을 가진 비교 모델이다. S01/S02 기하 정리의 인용은 실제 Lean 전체 형식화와 구별한다.',
    'Y1': '구체적인 지원 군에서 실제 행렬·root data·표현·전 기저 bracket 검사를 수행한다. metadata-only 군과 concrete 군, Lie 대수와 전역 군의 충실성을 분리한다.',
    'Y2': '4D 입력과 연결·곡률·관측·정규화를 재현한다. embedded BPST는 특정 고전적 해족이며 off-shell 시험장, 유한 holonomy, 유한 스펙트럼 모델의 등급을 각각 표시한다.',
    'N1': '첨부 166쪽과 공식 repository의 고정 판본을 기준으로 한다. forced C/D의 원문 주장, 원문 전체 build, 실제 component kernel 검사, 로컬 수치 구현은 별도의 증거다.',
    'N2': '외곽 heat 성분과 Taylor-Green 기준 해에 대해 실제 식·도함수·오차·독립 계산을 검사한다. 외곽 단독 결과를 원문의 전체 유한 에너지 blowup 해로 합치지 않는다.',
    'N3': '원문 leading-profile 구성의 일부 연산과 후보가 구현되어 있다. 수치 fixture의 성공과 전 구간 수학 관문을 분리하며 PARTIAL/BLOCKED를 표에서 그대로 드러낸다.',
}

# Editorial summaries only for the six verbose common review records.
# Their authoritative detail/acceptance and the complete evidence remain in
# normalized-report-data.json and evidence/m0-six-checklist.json unchanged.
CORE_DISPLAY = {
    'I0-04': {
        'implementation': '실제 Lie 대수·전역 군·충실한 저장표현·불변형·매장을 담는 14개 compact matrix adapter를 연결했다. field/coupling/center/scale/coefficients/domain/boundary/seed/units/상태족/관측을 요구하며 group-only·Δ-only 요청은 거부한다. Δ 네 모드와 27개 기본 예제, 실제 4D holonomy 경로를 제공한다. 계산된 군·상태족·가정을 M0 immutable graph에 저장하고 revision을 재결속하며, 바뀐 가정의 구 결과 재저장은 거부한다.',
        'validation': '27개 예제의 M0 validator·정확 replay·필수입력/단위/hash 대조. 공통 normalizeRequest/validateDomainRequest, constructedComponents/prepareM1SessionJob/saveM1SessionJob, 수정된 가정의 재저장 거부 및 기존 일반 G·관측 회귀 검사를 통과했다.',
    },
    'I1-03': {
        'implementation': 'δ의 N자리 출력에는 N+1자리 입력이 필요하며, 기존 잔여류와 일치하는 정확 정수 원본만 guard digit 자동증액을 허용한다. p^v 나눗셈의 v자리 손실, 정수 계수 미분·Frobenius·determinant·단위 Smith 변환의 0자리 손실을 구분한다. NS는 binary64 구간·jet·exp/log tail·Simpson 오차·적분 tail·비율 오차를 전파하며 목표 radius를 확인한다. 지원 bit·오차바닥·overflow·입력정밀도 실패는 PRECISION_REQUIRED로 보존한다.',
        'validation': 'deltaPadic/divideByInteger/finiteRingModule/determinantPadic, P1 Frobenius와 coefficient reduction, NS certifiedSimpson/heatIntegralCertificate/heatTaylorFinite를 검사했다. bits=100 등 domain precision 실패가 공통 engine에서 COMPLETED로 바뀌지 않음을 확인했다.',
    },
    'I1-07': {
        'implementation': 'P1의 projective orbit 점계수를 실제 chain Frobenius trace와, E의 pair enumeration을 Legendre sum과 대조한다. JS 행렬은 SymPy exact product/Smith 및 symbolic k 항등식으로 교차 검사한다. NS의 direct mode convolution과 mixed-radix 3D FFT+3/2 padding, 물리 FD와 analytic jet, 원래 v 적분과 log변수 적분을 구분한다. Gauge의 Fraction/BigInt·행렬 commutator·구조상수·FD·밀도 quadrature·closed marginal은 서로 다른 경로다.',
        'validation': '산술 독립 55개, NS의 aliasing/pressure 음성 대조 및 330bit 적분 기준, Gauge의 full-color/BPST·밀도·holonomy 수렴 비교를 통과했다. 같은 함수 재실행은 replay로만 세며 오차 기준과 fixture hash를 보존한다.',
    },
    'I3-02': {
        'implementation': '산술 31·Gauge 27·NS 13의 합계 71개 exported Lean target에 source/type/axioms/명령/exit/log/hash를 저장했다. delta 정밀도, d², 전체 weight contraction, prime interval/Lucas, 실제 SU3/G2 bracket·매장·유한 Jacobi/transport/관측 관련 정리를 구분한다. 4+3+2개의 잘못된 정리 9개를 실제 커널이 거부했다. 브라우저는 고정 소스를 대조하며 수정 소스는 STALE, formalPass=false, kernelRerun=false다.',
        'validation': '세 도메인의 positive build exit=0, 음성 대조 nonzero exit, 소스·원자료·로그 hash를 확인했다. 공통 checkPinnedAudit/checkTheoremAdapter가 변경 소스·정리명/type 불일치·잘못된 승격을 거부한다.',
    },
    'I3-03': {
        'implementation': '공통 5개 분석 계약에 operation/domain/spaces/norm/quantifiers/conclusion/fallback을 기록한다. NS의 Bρ norm·공통 복소영역·수축, derivative-limit 교환, heat 지배함수, Taylor remainder, semigroup와 stability 가정을 구체화했다. Gauge는 Hilbert/H/self-adjoint domain/vacuum projection/positive spectral measure/observable domain/극한·채널·OS 조건을 나눈다. 관련 계약은 결과와 세션에 requiredForInfiniteInferences로 연결한다.',
        'validation': '빈 norm 등 shape 오류를 거부한다. 실제 Lean uniform_derivative_exchange, scalar diffusion_semigroup_bound, 조건부 stable_residual_budget의 가정과 type를 기록했다. 계약 validator는 truthVerified=false, formalPass=false를 유지한다.',
    },
    'I3-04': {
        'implementation': 'S01/S02 prismatic 비교, S07 trace, Gauge 및 NS 주요 정리는 THEOREM_REFERENCE로 등록했다. BSD known-case adapter는 E/Q의 정확한 전역 해석적 rank 0/1 가정 아래 대수 rank 일치와 Sha 유한성을 기록하며, finite Euler 표본·수치 threshold를 가정 증명으로 인정하지 않는다. 실제 mathlib Lucas 및 수정되지 않은 NS Flatness/ProblemStatement import만 정확한 exported type·source·커널 기록에 연결한다.',
        'validation': '20개 외부 참조와 47개 adapter/analytic-shape guard, 3개 pinned audit/71 target의 정확 source match를 확인했다. BSD는 Kolyvagin(1990) §1 Theorem 1, printed p.4 및 Wiles p.4의 modularity 설명에 연결한다. 해당 record의 leanImport/kernelReceipt는 null이며 formalPass=false다.',
    },
}


def read_json(path: Path, default=None):
    return json.loads(path.read_text()) if path.exists() else default


def sha(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def listify(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x) if not isinstance(x, dict) else json.dumps(x, ensure_ascii=False) for x in value]
    return [str(value)]


def text_of(value):
    return ' '.join(listify(value)).strip()


def normalize_status(value):
    value = str(value or 'PENDING_DATA').upper().strip().replace(' ', '_')
    if value in {'PASS', 'COMPLETE', 'COMPLETED', 'IMPLEMENTED'} or value.startswith('PASS_'):
        return 'PASS'
    if value.startswith('PARTIAL'):
        return 'PARTIAL'
    if value.startswith('BLOCKED') or value in {'FAIL', 'FAILED', 'NOT_IMPLEMENTED'}:
        return 'BLOCKED'
    return 'PENDING_DATA'


def item_array(data):
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict) and x.get('id')]
    if not isinstance(data, dict):
        return []
    for key in ['items', 'tasks', 'checklist', 'acceptance', 'acceptanceItems']:
        if isinstance(data.get(key), list):
            return item_array(data[key])
    return []


def component_paths(stage):
    if stage.startswith('P'):
        return 'mathscope-m1/arithmetic'
    if stage.startswith('Y'):
        return 'mathscope-m1/gauge'
    if stage.startswith('N'):
        return 'mathscope-m1/navier'
    return 'mathscope-m1/core'


def native_item(item, domain):
    """Normalize evidence fields, while never using native acceptance text."""
    implementation = item.get('implementation') or item.get('implemented') or item.get('evidence') or item.get('description')
    if isinstance(implementation, dict):
        implementation = implementation.get('detail') or implementation.get('summary') or implementation
    if item.get('implementationStatus'):
        implementation = listify(implementation) + ['구현 상태: ' + str(item['implementationStatus'])]
    validation = item.get('validation') or item.get('tests') or item.get('validationEvidence') or []
    if not validation and item.get('implementation') and isinstance(item.get('evidence'), list):
        validation = [
            (str(x.get('file','')) + ' / ' + str(x.get('record','')) + ': ' + str(x.get('status',''))).strip(' /:')
            if isinstance(x, dict) else str(x) for x in item['evidence']
        ]
    if isinstance(validation, dict):
        validation = [f'{k}: {v}' for k, v in validation.items()]
    artifacts = item.get('files') or item.get('artifacts') or item.get('evidenceFiles') or []
    remaining = item.get('blockedConditions') or item.get('remaining') or item.get('remainingConditions') or item.get('remainingAcceptanceWork') or []
    if not remaining and normalize_status(item.get('status')) in {'PARTIAL', 'BLOCKED'}:
        remaining = item.get('limitations') or item.get('scopeBoundary') or ['최종 release 데이터의 상세 남은 조건을 확인한다.']
    boundary = item.get('scopeBoundary') or item.get('scope') or item.get('limitation') or item.get('limits') or item.get('rootIntegration') or ''
    return {
        'status': normalize_status(item.get('status')),
        'nativeStatus': item.get('status', 'PENDING_DATA'),
        'implementation': listify(implementation),
        'validation': listify(validation),
        'artifacts': listify(artifacts),
        'remaining': listify(remaining),
        'boundary': text_of(boundary),
        'leanTargets': listify(item.get('leanTargets') or item.get('lean') or []),
        'mathGateStatus': item.get('mathGateStatus'),
        'sourceDomain': domain,
    }


def apply_override(record, override):
    if isinstance(override, str):
        record['status'] = normalize_status(override)
        record['nativeStatus'] = override
        return record
    if not isinstance(override, dict):
        return record
    for source_key in ['accept', 'originalAcceptance']:
        if override.get(source_key) is not None and override[source_key] != record['accept']:
            raise ValueError(f"{record['id']}: release override may not rewrite the original acceptance criterion")
    fields = native_item(override, record['sourceDomain'])
    aliases = {
        'status': ['status'], 'nativeStatus': ['status'],
        'implementation': ['implementation', 'implemented', 'evidence', 'description'],
        'validation': ['validation', 'tests', 'validationEvidence', 'evidence'],
        'artifacts': ['files', 'artifacts', 'evidenceFiles'],
        'remaining': ['blockedConditions', 'remaining', 'remainingConditions', 'remainingAcceptanceWork'],
        'boundary': ['scopeBoundary', 'scope', 'limitation', 'limits', 'rootIntegration'],
        'leanTargets': ['leanTargets', 'lean'], 'mathGateStatus': ['mathGateStatus'],
    }
    for key, options in aliases.items():
        if any(x in override for x in options):
            record[key] = fields[key]
    if override.get('reportNote'):
        record['boundary'] += (' ' if record['boundary'] else '') + override['reportNote']
    return record


def release_overrides(release):
    result = {}
    for block in [release, release.get('coreItems'), release.get('m0Items'), release.get('items'), release.get('acceptance'), release.get('m0', {})]:
        for row in item_array(block):
            result[row['id']] = row
    for key in ['overrides', 'itemOverrides', 'statusOverrides']:
        value = release.get(key, {})
        if isinstance(value, dict):
            for id_, change in value.items():
                if id_ in result and isinstance(change, dict):
                    result[id_] = {**result[id_], **change}
                else:
                    result[id_] = change
        elif isinstance(value, list):
            result.update({x['id']: x for x in item_array(value)})
    return result


def assemble(release_path=None):
    original = read_json(ORIGINAL)
    if not isinstance(original, list) or len(original) != 70 or len({x['id'] for x in original}) != 70:
        raise ValueError('The authoritative acceptance file must contain exactly 70 unique IDs')
    release = read_json(Path(release_path), {}) if release_path else {}
    paths = {
        'arithmetic': M1 / 'arithmetic/checklist.json',
        'gauge': M1 / 'gauge/checklist.json',
        'navier': M1 / 'navier/checklist-status.json',
    }
    docs = {key: read_json(path, {}) for key, path in paths.items()}
    native = {}
    components = collections.defaultdict(list)
    for domain, doc in docs.items():
        for row in item_array(doc):
            if row['id'].startswith(('P', 'Y', 'N')):
                native[row['id']] = native_item(row, domain)
            else:
                components[row['id']].append(native_item(row, domain))
        for row in (doc.get('crossCutting', []) + doc.get('m0Contributions', [])) if isinstance(doc, dict) else []:
            if row.get('id'):
                components[row['id']].append(native_item(row, domain))
    overrides = release_overrides(release)
    # These are immutable command receipts, not mathematical completion claims.
    # A later authoritative release override takes precedence over this snapshot.
    official_paths = {
        'commands': M1 / 'navier/official-validation/official-command-results.json',
        'comparator': M1 / 'navier/official-validation/comparator-pinned-guarded.json',
    }
    official = {key: read_json(path) for key, path in official_paths.items() if path.exists()}
    unknown = set(overrides) - {x['id'] for x in original}
    if unknown:
        raise ValueError('Unknown acceptance override IDs: ' + ', '.join(sorted(unknown)))
    records = []
    for source in original:
        record = {**source, 'reportStage': 'M0' if source['id'].startswith('I') else source['stage']}
        base = native.get(source['id'])
        if base is None:
            base = native_item({}, 'core')
            parts = components[source['id']]
            base['implementation'] = [f"{p['sourceDomain']}: {text_of(p['implementation'])}" for p in parts]
            base['validation'] = [f"{p['sourceDomain']}: {text_of(p['validation'])}" for p in parts if p['validation']]
            base['artifacts'] = [f"{p['sourceDomain']}/{x}" for p in parts for x in p['artifacts']]
            base['boundary'] = '각 도메인 담당 부분의 PASS만으로 공통 원문 기준 전체를 자동 PASS 처리하지 않는다. 공통 통합 검증과 최종 판정을 기다린다.'
        record.update(base)
        if source['id'] in overrides:
            apply_override(record, overrides[source['id']])
        elif source['id'] == 'N1-05' and official.get('commands'):
            record['implementation'] = [
                '공식 repository commit/toolchain/manifest를 고정했다. 원본 4.34.0-rc2의 cache/build 명령 시도와 환경·종료 코드·로그 해시가 보존돼 있다. 별도로 수정되지 않은 component source를 로컬 4.34.1에서 실제 컴파일했다.'
            ]
            record['validation'] = [
                'official-command-results.json에 공식 명령 시도의 exit code와 로그 해시가 있다. 이 보고서에 연결된 snapshot에는 원본 전체 cache/build 성공을 입증하는 완료 receipt가 없다.'
            ]
            record['artifacts'].append('official-validation/official-command-results.json')
            record['remaining'] = [
                '선택 rc2 commit의 전체 cache/build 성공 및 최종 환경·완료 로그를 검증해야 한다. 로컬 4.34.1 component 성공은 이 별도 원본 전체 관문을 충족하지 않는다.'
            ]
        elif source['id'] == 'N1-06' and official.get('comparator', {}).get('status') == 'BLOCKED':
            record['validation'] = [
                '2026-10-09 guarded Comparator 명령은 exit=1: Failed to connect to bus: No medium found. systemd user guard가 시작되지 않아 Comparator 자체에는 도달하지 않았다. guard를 생략하거나 대체하지 않았다.'
            ]
            record['artifacts'].append('official-validation/comparator-pinned-guarded.json')
            record['remaining'] = [
                'C/D main theorem의 실제 #print axioms와 정상 guard 아래의 Comparator 검사 결과가 필요하다. 현재 환경의 guarded command 실패를 Comparator의 수학적 반증이나 검증 성공으로 해석하지 않는다.'
            ]
            record['boundary'] = '전체 항목 상태는 PARTIAL이다. 그 안의 Comparator 실행 관문은 systemd user bus 미지원 및 문서화된 비특권 실행 조건 미충족으로 BLOCKED이며, 로컬 13 target의 성공과 별개다.'
        if not record['implementation']:
            record['implementation'] = ['최종 구현 근거가 아직 연결되지 않았다.']
        if not record['validation'] and record['artifacts']:
            record['validation'] = ['아래 로컬 증거 파일의 실제 검사 및 적용 범위를 따른다.']
        if record['status'] == 'PASS' and not record['remaining']:
            record['remaining'] = ['해당 기준의 잔여 조건 없음. 아래의 지원·형식화 범위는 유지한다.']
        records.append(record)
    meta = release.get('release', release.get('metadata', {}))
    if not isinstance(meta, dict):
        meta = {}
    meta = {
        'title': 'MathScope M0 + M1 구현·검증 상세 체크리스트',
        'date': dt.date.today().isoformat(),
        'siteUrl': 'https://project29770.websitepublisher.ai/v0.3.1.html',
        'version': release.get('version', '최종 릴리즈 데이터 확인'),
        'buildId': release.get('buildId', ''),
        **meta,
    }
    if release.get('siteUrl'):
        meta['siteUrl'] = release['siteUrl']
    tests = {
        'core': {'pass': 19, 'total': 19, 'path': 'mathscope-m1/evidence/core-tests.tap'},
        'm0Regression': {'pass': 82, 'total': 82, 'path': 'mathscope-m1/evidence/m0-regression-tests.tap'},
        'arithmetic': {'pass': 38, 'total': 38, 'independent': 55, 'lean': 31},
        'gauge': {'pass': 18, 'total': 18, 'lean': 27},
        'navier': {'pass': 90, 'total': 90, 'lean': 13},
    }
    for key, value in release.get('tests', release.get('testSummary', {})).items():
        if isinstance(value, dict):
            tests[key] = {**tests.get(key, {}), **value}
        else:
            tests[key] = value
    snapshots = [{'path': str(ORIGINAL.relative_to(ROOT)), 'sha256': sha(ORIGINAL)}]
    snapshots += [{'path': str(path.relative_to(ROOT)), 'sha256': sha(path)} for path in paths.values() if path.exists()]
    snapshots += [{'path': str(path.relative_to(ROOT)), 'sha256': sha(path)} for path in official_paths.values() if path.exists()]
    if release_path:
        rp = Path(release_path).resolve()
        snapshots.append({'path': str(rp), 'sha256': sha(rp)})
    model = {'schema': 'MathScope.M0M1.ReportData/1', 'metadata': meta, 'items': records, 'tests': tests, 'releaseData': release, 'officialCommandReceipts': official, 'sourceSnapshots': snapshots}
    model['counts'] = counts(records)
    return model


def counts(records):
    def count(items):
        c = collections.Counter(x['status'] for x in items)
        return {'total': len(items), **{k: c[k] for k in STATUS}}
    groups = {
        'M0': [x for x in records if x['reportStage'] == 'M0'],
        'Arithmetic': [x for x in records if x['id'].startswith('P')],
        'Gauge': [x for x in records if x['id'].startswith('Y')],
        'Navier': [x for x in records if x['id'].startswith('N')],
        'M1': [x for x in records if not x['id'].startswith('I')],
        'Total': records,
    }
    return {name: count(items) for name, items in groups.items()}


FONT_INFO = {}
MISSING_GLYPHS = set()
NORMALIZE = str.maketrans({'\u2011': '-', '–': '-', '—': '-', '\u00a0': ' ', '\u200b': '', '\u2010': '-'})


def register_fonts():
    if FONT_INFO:
        return
    # ReportLab's installed CMap helper formats non-BMP codepoints as five hex
    # digits. PDF ToUnicode requires UTF-16BE, including surrogate pairs.
    # This process-local serialization fix does not edit the installed package.
    original_cmap = rl_ttfonts.makeToUnicodeCMap
    def utf16_cmap(fontname, subset):
        result = original_cmap(fontname, subset)
        return re.sub(r'(<[0-9A-Fa-f]{2}> <)([0-9A-Fa-f]{5,})(>)',
                      lambda m: m[1]+chr(int(m[2],16)).encode('utf-16-be').hex().upper()+m[3], result)
    rl_ttfonts.makeToUnicodeCMap = utf16_cmap
    candidates = [ROOT / 'tmp/pdfs/fonts', HERE / 'fonts']
    nanum = next((p for p in candidates if (p/'NanumGothic-Regular.ttf').exists()), None)
    if nanum is None:
        raise FileNotFoundError('NanumGothic-Regular.ttf and NanumGothic-Bold.ttf are required; see README_REPORT.md')
    paths = {
        'Nanum': nanum / 'NanumGothic-Regular.ttf',
        'Nanum-Bold': nanum / 'NanumGothic-Bold.ttf',
        'DejaVu': Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),
        'DejaVu-Bold': Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
        'Mono': Path('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'),
        'STIX': Path(mpl_data_path()) / 'fonts/ttf/STIXGeneral.ttf',
    }
    for name, path in paths.items():
        pdfmetrics.registerFont(TTFont(name, str(path)))
        FONT_INFO[name] = {'path': str(path), 'cmap': set(FontToolsFont(str(path)).getBestCmap())}
    pdfmetrics.registerFontFamily('Nanum', normal='Nanum', bold='Nanum-Bold', italic='Nanum', boldItalic='Nanum-Bold')
    pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold', italic='DejaVu', boldItalic='DejaVu-Bold')


def rich(text, bold=False):
    text = str(text).translate(NORMALIZE)
    primary = 'Nanum-Bold' if bold else 'Nanum'
    fallback = 'DejaVu-Bold' if bold else 'DejaVu'
    runs = []
    run = ''
    current = None
    for char in text:
        if char == '\n':
            if run:
                runs.append((current, run))
            runs.append((None, '<br/>'))
            run, current = '', None
            continue
        font = next((name for name in [primary, fallback, 'STIX'] if ord(char) in FONT_INFO[name]['cmap']), primary)
        if ord(char) not in FONT_INFO[font]['cmap'] and not char.isspace():
            MISSING_GLYPHS.add(char)
        if font != current and run:
            runs.append((current, run))
            run = ''
        current = font
        run += char
    if run:
        runs.append((current, run))
    return ''.join(value if font is None else f'<font name="{font}">{html.escape(value)}</font>' for font, value in runs)


def make_styles():
    base = dict(fontName='Nanum', textColor=INK, wordWrap='CJK', splitLongWords=1, allowWidows=0, allowOrphans=0)
    return {
        'body': ParagraphStyle('Body', fontSize=9.6, leading=14.6, spaceAfter=7, **base),
        'small': ParagraphStyle('Small', fontSize=8.3, leading=12.0, spaceAfter=4, **base),
        'tiny': ParagraphStyle('Tiny', fontSize=7.6, leading=10.6, spaceAfter=3, **base),
        'item': ParagraphStyle('Item', fontSize=9.05, leading=13.35, spaceAfter=4.6, **base),
        'itemSmall': ParagraphStyle('ItemSmall', fontSize=8.15, leading=11.5, spaceAfter=4, **base),
        'itemTitle': ParagraphStyle('ItemTitle', fontSize=10.6, leading=15.0, spaceAfter=0, **{**base,'fontName':'Nanum-Bold','textColor':NAVY}),
        'h1': ParagraphStyle('H1', fontSize=20.5, leading=28, spaceAfter=12, keepWithNext=True, **{**base,'fontName':'Nanum-Bold','textColor':NAVY}),
        'h2': ParagraphStyle('H2', fontSize=12.1, leading=18, spaceBefore=9, spaceAfter=6, keepWithNext=True, **{**base,'fontName':'Nanum-Bold','textColor':TEAL}),
        'cover': ParagraphStyle('Cover', fontSize=29, leading=39, spaceAfter=18, **{**base,'fontName':'Nanum-Bold','textColor':NAVY}),
        'kicker': ParagraphStyle('Kicker', fontSize=9, leading=13, spaceAfter=8, **{**base,'fontName':'Nanum-Bold','textColor':TEAL}),
        'table': ParagraphStyle('TableText', fontSize=8.65, leading=12.7, spaceAfter=0, **base),
        'tableHead': ParagraphStyle('TableHead', fontSize=8.65, leading=12.7, spaceAfter=0, **{**base,'fontName':'Nanum-Bold','textColor':colors.white}),
        'code': ParagraphStyle('Code', fontSize=8, leading=11.6, spaceAfter=4, **{**base,'fontName':'Mono'}),
    }


class MathEquation(Flowable):
    """Render mathtext glyphs as embedded vector text, not bitmap screenshots."""
    _parser = MathTextParser('path')

    def __init__(self, formula, size=12.5, color=NAVY):
        super().__init__()
        self.formula, self.size, self.color = formula, size, color
        self.parsed = self._parser.parse('$' + formula + '$', dpi=72, prop=FontProperties(size=size, math_fontfamily='stix'))
        self.glyphs = []
        for font, font_size, code, x, y in self.parsed.glyphs:
            name = 'Math-' + hashlib.sha256(font.fname.encode()).hexdigest()[:12]
            if name not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont(name, font.fname))
            self.glyphs.append((name, float(font_size), int(code), float(x), float(y)))
        self.spaceBefore = 3
        self.spaceAfter = 8

    def wrap(self, availWidth, availHeight):
        self.scale = min(1, availWidth / max(float(self.parsed.width), 1))
        if self.scale < .77:
            raise ValueError('Equation would be too small; split it: ' + self.formula)
        self.width = min(availWidth, float(self.parsed.width))
        self.height = float(self.parsed.height) * self.scale + 8
        self.offset = max(0, (availWidth - float(self.parsed.width) * self.scale) / 2)
        return availWidth, self.height

    def draw(self):
        c = self.canv
        c.saveState()
        c.translate(self.offset, float(self.parsed.depth) * self.scale + 4)
        c.scale(self.scale, self.scale)
        c.setFillColor(self.color)
        for name, size, code, x, y in self.glyphs:
            c.setFont(name, size)
            c.drawString(x, y, chr(code))
        for x, y, w, h in self.parsed.rects:
            c.rect(float(x), float(y), float(w), float(h), fill=1, stroke=0)
        c.restoreState()


class NoteBox(Flowable):
    def __init__(self, title, body, styles, tone='PASS'):
        super().__init__()
        self.tone = tone
        self.title = Paragraph(rich(title, True), styles['itemTitle'])
        self.body = Paragraph(rich(body), styles['body'])
        self.spaceBefore, self.spaceAfter = 4, 10

    def wrap(self, width, height):
        self.width = width
        self.th = self.title.wrap(width-24, height)[1]
        self.bh = self.body.wrap(width-24, height)[1]
        self.height = 23+self.th+self.bh
        return width, self.height

    def draw(self):
        c = self.canv
        col, pale, _ = STATUS[self.tone]
        c.setFillColor(pale)
        c.roundRect(0, 0, self.width, self.height, 5, fill=1, stroke=0)
        c.setFillColor(col)
        c.rect(0, 0, 3, self.height, fill=1, stroke=0)
        self.title.drawOn(c, 12, self.height-10-self.th)
        self.body.drawOn(c, 12, 9)


class AcceptanceCard(Flowable):
    def __init__(self, item, styles):
        super().__init__()
        self.item, self.styles = item, styles
        self.spaceAfter = 12
        self.flowables = []

    def para(self, label, value, small=False):
        if not value:
            return
        markup = rich(label + '  ', True) + rich(value)
        self.flowables.append(Paragraph(markup, self.styles['itemSmall' if small else 'item']))

    def wrap(self, width, height):
        self.width = width
        self.flowables = []
        item = self.item
        display = CORE_DISPLAY.get(item['id'], {})
        self.title = Paragraph(rich(item['id'] + '  ' + item['title'], True), self.styles['itemTitle'])
        self.titleH = self.title.wrap(width-100, height)[1]
        self.para('원문 작업', item['detail'])
        self.para('원문 수용기준', item['accept'])
        self.para('실제 구현', display.get('implementation',text_of(item['implementation'])))
        self.para('검증 근거', display.get('validation',text_of(item['validation'])), True)
        if item['artifacts']:
            self.para('로컬 근거', ' · '.join(item['artifacts']), True)
        if item['leanTargets']:
            short = [x.replace('MathScope.M1.Arithmetic.', 'Arithmetic.').replace('MathScope.M1.Gauge.', 'Gauge.') for x in item['leanTargets']]
            self.para('Lean 범위', ', '.join(short), True)
        self.para('남은 조건', text_of(item['remaining']), small=item['status']=='PASS')
        if item['boundary']:
            self.para('적용 범위', item['boundary'], True)
        self.measured = []
        for flow in self.flowables:
            h = flow.wrap(width-18, height)[1]
            self.measured.append((flow, h))
        self.height = self.titleH + 16 + sum(h+f.getSpaceAfter() for f,h in self.measured) + 7
        if self.height > FRAME_H-35:
            raise ValueError(f"{item['id']} exceeds one readable page ({self.height:.1f} pt); split editorially without deleting criteria")
        return width, self.height

    def draw(self):
        c = self.canv
        col, pale, ko = STATUS[self.item['status']]
        c.setFillColor(LIGHT)
        c.roundRect(0, self.height-self.titleH-12, self.width, self.titleH+12, 3, fill=1, stroke=0)
        self.title.drawOn(c, 8, self.height-self.titleH-6)
        badge_w = 83
        c.setFillColor(pale)
        c.roundRect(self.width-badge_w-5, self.height-self.titleH-9, badge_w, self.titleH+6, 3, fill=1, stroke=0)
        c.setFont('DejaVu-Bold', 8.1)
        c.setFillColor(col)
        c.drawCentredString(self.width-badge_w/2-5, self.height-self.titleH/2-3.5, self.item['status'])
        y = self.height-self.titleH-19
        for flow, h in self.measured:
            y -= h
            flow.drawOn(c, 9, y)
            y -= flow.getSpaceAfter()
        c.setStrokeColor(colors.HexColor('#D6E2E5'))
        c.setLineWidth(.45)
        c.line(0, 0, self.width, 0)


class ReportDoc(BaseDocTemplate):
    def __init__(self, filename, metadata, **kwargs):
        self.metadata = metadata
        self.sectionPages = {}
        self.itemPages = {}
        super().__init__(filename, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                         topMargin=19*mm, bottomMargin=20*mm, title=metadata['title'],
                         author='MathScope', subject='70 original acceptance criteria with implementation and evidence scope', **kwargs)
        frame = Frame(MARGIN, 20*mm, WIDTH, FRAME_H, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate('Report', [frame], onPage=self.page_chrome))

    def page_chrome(self, canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor('#D1DFE3'))
        canvas.setLineWidth(.5)
        canvas.line(MARGIN, PAGE_H-13.7*mm, PAGE_W-MARGIN, PAGE_H-13.7*mm)
        canvas.setFont('DejaVu-Bold', 7)
        canvas.setFillColor(SLATE)
        canvas.drawString(MARGIN, PAGE_H-11.8*mm, 'MATHSCOPE / M0 + M1 IMPLEMENTATION AUDIT')
        canvas.setFont('Nanum', 7.4)
        version = str(self.metadata.get('version', ''))
        canvas.drawRightString(PAGE_W-MARGIN, PAGE_H-11.8*mm, version)
        canvas.setFont('Nanum', 7.2)
        canvas.drawString(MARGIN, 12.4*mm, str(self.metadata.get('date', ''))+' / 원문 수용기준과 실제 증거 범위')
        canvas.setFont('DejaVu', 8)
        canvas.drawRightString(PAGE_W-MARGIN, 12.4*mm, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if getattr(flowable, '_reportHeading', None):
            key, title = flowable._reportHeading
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, 0, False)
            self.notify('TOCEntry', (0, rich(title), self.page, key))
            self.sectionPages[key] = self.page
        if isinstance(flowable, AcceptanceCard):
            self.itemPages[flowable.item['id']] = self.page


class Composer:
    def __init__(self, model):
        self.model = model
        self.styles = make_styles()
        self.story = []
        self.headingCount = 0

    def p(self, text, style='body'):
        self.story.append(Paragraph(rich(text), self.styles[style]))

    def h(self, text):
        self.story.append(Paragraph(rich(text, True), self.styles['h2']))

    def page(self, title, key=None, kicker='IMPLEMENTATION / EVIDENCE'):
        if self.story:
            self.story.append(PageBreak())
        self.p(kicker, 'kicker')
        heading = Paragraph(rich(title, True), self.styles['h1'])
        self.headingCount += 1
        heading._reportHeading = (key or f'section-{self.headingCount}', title)
        self.story.append(heading)

    def box(self, title, body, tone='PASS'):
        self.story.append(NoteBox(title, body, self.styles, tone))

    def eq(self, formula, size=12.5):
        self.story.append(MathEquation(formula, size))

    def table(self, headers, rows, widths=None, padding=7):
        widths = widths or [WIDTH/len(headers)]*len(headers)
        cells = [[Paragraph(rich(x, True), self.styles['tableHead']) for x in headers]]
        for row in rows:
            cells.append([Paragraph(rich(x), self.styles['table']) for x in row])
        table = Table(cells, colWidths=widths, repeatRows=1, hAlign='LEFT')
        commands = [('BACKGROUND',(0,0),(-1,0),NAVY),('VALIGN',(0,0),(-1,-1),'TOP'),
                    ('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),
                    ('TOPPADDING',(0,0),(-1,-1),padding),('BOTTOMPADDING',(0,0),(-1,-1),padding),
                    ('LINEBELOW',(0,0),(-1,0),.4,NAVY),('LINEBELOW',(0,1),(-1,-1),.35,colors.HexColor('#D9E4E7'))]
        for i in range(1,len(cells)):
            if i%2==0:
                commands.append(('BACKGROUND',(0,i),(-1,i),LIGHT))
        table.setStyle(TableStyle(commands))
        self.story += [table, Spacer(1,8)]

    def code(self, text):
        for line in text.strip().splitlines():
            self.story.append(Paragraph('<font name="Mono">'+html.escape(line)+'</font>',self.styles['code']))
        self.story.append(Spacer(1,5))


def test_label(data, default='확인 자료 참조'):
    if not isinstance(data, dict):
        return str(data)
    return f"{data.get('pass', data.get('passed','?'))} / {data.get('total','?')}" if any(x in data for x in ['pass','passed']) else default


def release_test_rows(model):
    """Keep local, original-toolchain, historical and final-run evidence distinct."""
    t=model['tests']
    lean=sum(int(t.get(k,{}).get('lean',0)) for k in ['arithmetic','gauge','navier'])
    rows=[
        ['공통 엔진 / 기존 M0 회귀',test_label(t.get('core',{}))+' · '+test_label(t.get('m0Regression',{}))],
        ['산술 / 게이지 / NS 계산 검사',test_label(t.get('arithmetic',{}))+' · '+test_label(t.get('gauge',{}))+' · '+test_label(t.get('navier',{}))],
        ['실제 로컬 Lean target',str(lean)+'개: 산술 '+str(t.get('arithmetic',{}).get('lean','?'))+', 게이지 '+str(t.get('gauge',{}).get('lean','?'))+', NS '+str(t.get('navier',{}).get('lean','?'))],
    ]
    if 'officialNS' in t:
        official=t['officialNS']
        rows.append(['원래 rc2 C/D 제출 정리',test_label(official)+' / Lean '+str(official.get('toolchain','원문 고정 버전'))])
    if 'browserLiveChecks' in t and 'cli' in t:
        rows.append(['이전 브라우저 관찰 / 이전 CLI 검사',test_label(t['browserLiveChecks'])+' · '+test_label(t['cli'])])
    version=str(model.get('metadata',{}).get('version','최종 릴리즈'))
    if 'browserFinal' in t:
        rows.append([version+' 브라우저 추가 확인',test_label(t['browserFinal'])])
    if 'cliFinal' in t:
        rows.append([version+' CLI 추가 확인',test_label(t['cliFinal'])])
    return rows


def cover(c):
    m, totals = c.model['metadata'], c.model['counts']
    c.p('MATHSCOPE / RELEASE ACCEPTANCE REPORT', 'kicker')
    c.story.append(Spacer(1,10))
    c.p('M0 + M1\n구현·검증 상세 체크리스트', 'cover')
    c.p('원본 수용기준 70개 · 실제 구현 · 독립 검증 · 남은 조건')
    c.p(f"기준 릴리즈: {m.get('version','')}  /  build {m.get('buildId','미기재')}  /  {m.get('date','')}", 'small')
    c.p(m.get('siteUrl',''), 'small')
    scope=c.model['releaseData'].get('scope',{})
    if scope:
        c.p(f"실행 예제 {scope.get('runnableExamples','?')}개 · 구체 군 {scope.get('concreteGroups','?')}개 · 외부 문헌 {scope.get('externalReferences','?')}개 · Lean 음성 대조 {scope.get('negativeLeanControlsRejected','?')}개 거부", 'small')
    rows=[]
    for key,label in [('M0','M0 남은 공통 6개'),('Arithmetic','M1 산술 P1-P3'),('Gauge','M1 게이지 Y1-Y2'),('Navier','M1 NS N1-N3'),('Total','이번 요청 전체')]:
        x=totals[key]
        rows.append([label,str(x['total']),str(x['PASS']),str(x['PARTIAL']),str(x['BLOCKED'])])
    c.table(['판정 단위','원문 항목','PASS','PARTIAL','BLOCKED'],rows,[WIDTH*.40,WIDTH*.15,WIDTH*.15,WIDTH*.15,WIDTH*.15])
    c.p('M0의 6개는 기존 전체 기능을 다시 6개로 정의한 것이 아니라 이전 작업의 잔여 항목이다. M1은 산술 24개, 게이지 16개, NS 24개의 새 수용기준이다. 이 문서는 원문을 축소하지 않고 각각 판정한다.', 'small')
    t=c.model['tests']
    c.table(['검증 종류','기록된 결과'],release_test_rows(c.model),[WIDTH*.47,WIDTH*.53],padding=5.5)
    versions=t.get('browserLiveChecks',{}).get('executionVersions',[])
    if versions:
        c.p('브라우저 관찰은 '+', '.join('v'+str(v).removeprefix('v') for v in versions)+' 통합 과정의 누적 기록이다. 최종 릴리즈에서 모든 검사를 다시 실행한 결과가 아니며, 개별 재검증 범위는 사용법 쪽에 명시했다.','small')
    pending=totals['Total']['PARTIAL']+totals['Total']['BLOCKED']
    c.box('완료 수치의 해석',f"PASS는 해당 원문 기준과 명시된 지원 범위를 충족했다는 뜻이다. {pending}개 PARTIAL/BLOCKED 항목은 조건이 남아 있다. 테스트 개수와 정리 개수를 합쳐 하나의 증명 완료 수치로 읽지 않는다.",'PARTIAL' if pending else 'PASS')


def reading_guide(c):
    c.page('문서 안내와 증거 레벨', 'guide', 'READ FIRST')
    toc=TableOfContents()
    toc.levelStyles=[ParagraphStyle('TOC',fontName='Nanum',fontSize=9.4,leading=13.5,leftIndent=0,firstLineIndent=0,spaceBefore=0,textColor=INK,wordWrap='CJK')]
    toc.tableStyle=TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),2)])
    c.story.append(toc)
    c.h('PASS / PARTIAL / BLOCKED')
    c.p('PASS는 원문 수용기준을 통과한 범위, PARTIAL은 기능이나 검사가 있으나 기준 일부가 남은 범위, BLOCKED는 특정 수학·환경 관문을 아직 통과하지 못한 범위다. 숫자 출력이 있다는 이유로 증거 등급을 올리지 않는다.','small')
    c.table(['증거 레벨','무엇을 뜻하는가'],[
        ['정확 유한 계산','정수·유한환·명시 행렬·유한 열거의 정확 결과와 certificate 검증.'],
        ['수치 / 구간 인증','정해진 영역·norm·정밀도에서의 잔차 또는 엄밀한 enclosure. 미확정 tail은 별도 표기.'],
        ['THEOREM_REFERENCE','원전의 정리와 적용 가정을 연결한 기록. URL만으로 로컬 Lean 검사가 되지 않는다.'],
        ['KERNEL_CHECKED_COMPONENT','정확한 소스·type·axioms·명령·exit code를 가진 실제 검사 대상 정리.'],
        ['HYPOTHESIS / DEFINITION','가정한 spectral bound 또는 명시적 유효 모델 정의. 그 가정이 실제 YM에서 성립한다는 증명과 구별.'],
    ],[WIDTH*.37,WIDTH*.63])


def usage(c):
    c.page('실제 사이트에서 사용하는 순서', 'usage', 'HOW TO USE')
    c.table(['순서','작업','확인할 결과'],[
        ['1','M1 연구 영역에서 산술 / 게이지 / NS 탭과 실행 예제를 선택한다.','입력 JSON의 kind, 대상, precision, budget과 지원 범위'],
        ['2','필요한 값을 수정하고 실행한다.','선택 작업의 상태·검사·입력 SHA-256·결과 원자료'],
        ['3','3D 관측과 전체 JSON을 함께 읽는다.','좌표 의미, omitted information, finite scope, 오차·가정·blocker'],
        ['4','계산이 완료되면 세션에 저장하거나 전체 JSON을 내보낸다.','원본 모델 → job → result 연결과 당시 revision'],
        ['5','재현 검사를 실행한다.','같은 소스·입력의 새 job과 MATCH 여부; 입력 수정 시 이전 결과와 구별'],
        ['6','Lean 감사 묶음을 선택하고 소스와 감사 결과를 대조한다.','검사된 원본과 수정 소스의 차이; 수정하면 STALE 및 새 커널 검사 필요'],
    ],[WIDTH*.08,WIDTH*.43,WIDTH*.49])
    c.h('일상적인 탐색 예')
    c.p('산술: [2,1000]의 소수·ψ를 계산한 뒤 P¹의 p=3,N=4,D=1을 실행한다. 같은 화면에서 행렬과 Frobenius, 전체 weight certificate 및 비교정리 등급을 확인한다.')
    c.p('게이지: 완전한 group/field/state-family 예제를 선택한 후 Δ 모드를 먼저 정한다. Δ 적용은 선택한 모드의 정의에 따라 필드를 유지하거나 실제 재계산한다. x₄ 단면과 선형 투영은 다른 관측이다.')
    c.p('NS: 정확한 기준 해·heat 외곽과 leading-profile 후보를 구별한다. residual 또는 interval의 수치만 읽지 말고 Theorem 4.6 항목별 미충족 사유를 함께 확인한다.')
    c.box('작업 취소와 기록', '취소는 계산 job에 적용된다. 소수 계산은 마지막 완결 세그먼트까지의 checkpoint를 보존하며, 재개 시 prefix를 다시 검증한다. 다른 세션이나 다른 입력의 결과를 현재 입력 결과처럼 저장하지 않는다.')
    c.p('UI 근거: mathscope-m1/workspace.mjs, core/engine.mjs, core/session-binding.mjs. 공통 원본·가정·revision 계약은 mathscope-m0/contracts.mjs에 연결한다.','small')
    c.p('실행 간 색상은 그 실행의 표시 표본 범위에 맞춘 선형 정규화다. 다른 실행을 비교할 때는 원래 수치·단위·장 해시를 사용한다. 관측 표는 100개까지 표시하며 전체 JSON은 원본 표본 전체를 보존한다.','small')
    verification_scope(c)


def verification_scope(c):
    c.page('검증 범위와 배포별 기록','verification-scope','VALIDATION SCOPE / PINNED RECEIPTS')
    browser=c.model['tests']
    version=str(c.model['metadata'].get('version','최종'))
    c.p('로컬 Lean 71개 target, 원래 rc2의 C/D 제출 정리, 이전 실행 기록과 최종 배포의 추가 확인은 검증 단위가 서로 다르다. 아래 표는 각 기록의 원래 집계를 보존하며 합산한 완료 수치를 만들지 않는다.')
    rows=[]
    for key,label in [('core','공통 엔진 '+version),('officialNS','원래 rc2 C/D 정리'),('browserLiveChecks','v45-v49 브라우저 관찰'),('cli','이전 CLI 검사'),('browserFinal',version+' 브라우저 추가 확인'),('cliFinal',version+' CLI 추가 확인')]:
        if key in browser:
            record=browser[key]
            artifact=record.get('artifact') or record.get('path')
            rows.append([label,test_label(record),str(artifact) if artifact else '해당 항목 카드의 검증 근거'])
    c.table(['검증 단위','결과','별도 검증 기록'],rows,[WIDTH*.27,WIDTH*.13,WIDTH*.60],padding=5.5)
    if 'browserM0' in browser or 'browserAdapters' in browser:
        c.p('기존 브라우저 내 M0 자체 검사 '+test_label(browser.get('browserM0',{}))+'와 adapter/analytic-shape guard '+test_label(browser.get('browserAdapters',{}))+'도 개별 범위를 가진다. 배포 기록은 mathscope-m1/evidence/deployment.json을 따른다.','small')
    c.h('실제 실행 범위')
    for note in c.model['releaseData'].get('notes',[]):
        if isinstance(note,str) and note.startswith(('NS 원본 ','브라우저 ','CLI ')):
            c.p(note,'body')
    c.p('브라우저 확인의 근거는 직접 관찰을 정리한 JSON 기록이다. 로컬 커널 검사는 정확한 소스·타입·공리·명령·종료 코드로 판단하며, 브라우저의 소스 대조 자체는 새 커널 실행이 아니다.','small')


def acceptance_pages(c):
    for stage in STAGE_ORDER:
        records=[r for r in c.model['items'] if r['reportStage']==stage]
        n=collections.Counter(r['status'] for r in records)
        c.page(STAGE_TITLES[stage],stage,'ORIGINAL CRITERIA / '+f"{n['PASS']} PASS · {n['PARTIAL']} PARTIAL · {n['BLOCKED']} BLOCKED")
        c.p(SCOPE_NOTES[stage],'small')
        source=records[0]['sourceFile'] if records else ''
        c.p('원문: blueprint-work/'+source+' / 항목별 판정과 연결 파일은 최종 자료 스냅샷에 고정한다.','tiny')
        for row in records:
            c.story.append(AcceptanceCard(row,c.styles))


def ns_pending_rows(items):
    """Read N1 blockers from the final records, without repeating completed work."""
    pending={x['id']:x for x in items if x['id'].startswith('N') and x['status']!='PASS'}
    rows=[]
    n1=[id_ for id_ in ['N1-05','N1-06'] if id_ in pending]
    if n1:
        details=[]
        for id_ in n1:
            remaining=text_of(pending[id_].get('remaining'))
            if not remaining:
                remaining='구체적인 잔여 조건이 기록되지 않아 해당 항목의 최종 판정을 확인해야 한다.'
            details.append(id_+': '+remaining)
        rows.append(['; '.join(id_+' '+pending[id_]['status'] for id_ in n1),' '.join(details)])
    # These N3 mathematical gates remain unchanged in this release.
    groups=[
        (['N3-01','N3-02'],'상수 선택의 충분성 정량화, radial/outer moments·압력 calibration·heat compensation을 실제 원문 조건에서 완료해야 한다.'),
        (['N3-03','N3-04'],'Bρ invariant ball·수축상수·공통 복소영역·비선형 tail, 무한 exact profile의 leading residual과 regularity를 인증해야 한다. 유한 후보의 잔차는 보존한다.'),
        (['N3-05','N3-06','N3-07'],'controlled continuation, 다섯 모멘트의 interval Newton 접합, 전 구간 cone margin·admissible loop·moment restoration, 실제 stress support와 edge limit를 인증해야 한다.'),
    ]
    for ids,summary in groups:
        active=[id_+' '+pending[id_]['status'] for id_ in ids if id_ in pending]
        if active:
            rows.append(['; '.join(active),summary+' 상세 증거·실패 조건은 각 항목 카드에 보존했다.'])
    return rows


def math_pages(c):
    c.page('산술 모델의 핵심 수학과 완료 경계','arithmetic-math','MATHEMATICAL MODEL')
    c.h('소수 전체의 명세와 유한 범위 계산')
    c.eq(r'\mathrm{PrimeSet}=\{n\in\mathbb{N}:\mathrm{Prime}(n)\},\qquad\pi(x)=\#\{p\leq x:p\ \mathrm{prime}\}')
    c.eq(r'\psi(x)=\sum_{p^k\leq x}\log p,\qquad\psi(10.5)=\log(2520)')
    c.p('소수 집합의 무한 명세와 완료된 [a,b] 구간은 다른 타입이다. ψ의 log 계수 및 구간은 정확도 근거를 가지며 Li₂의 float64 근사는 별도 approximate 등급이다. 서로 다른 p는 family의 지표이며 한 δ-ring의 원소로 합치지 않는다. [S10; P1]')
    c.h('P¹의 모든 weight와 Frobenius')
    c.eq(r'\dim C^0=2D+2,\qquad\dim C^1=4D+1,\qquad\dim C^2=2D+1')
    c.eq(r'ri=\mathrm{id},\qquad\mathrm{id}-ir=dh+hd,\qquad K^0=K^2=A,\quad K^1=0')
    c.eq(r'F(t^j)=t^{pj},\qquad F(t^jdt)=p\,t^{p(j+1)-1}dt,\qquad C(D)\longrightarrow C(pD)')
    c.p('각 nonzero Laurent weight에는 k를 나누지 않는 integral contraction이 있다. h/i/r의 계수 0,±1은 모든 p^N-divisibility를 보존하므로 restricted coefficient family의 p-adic completion으로 연속 확장된다. 생존하는 [1],[dt/t]의 Frobenius는 1,p이다. [arithmetic/MATHEMATICS_KO.md §§2-5]')
    c.box('비교 모델의 증거 구조','명시적 finite-perfect replacement → completed Čech-de Rham → crystalline → prismatic. 앞의 대수 항등식에는 실제 Lean 검사와 독립 symbolic 검사가 있고, S02 Corollary 3.8 및 S01 Theorem 1.8(1)/5.2의 기하 비교는 THEOREM_REFERENCE다. 이 모델의 실제 수학적 범위와 Lean 전체 형식화 완료 여부를 분리한다.')
    c.h('정밀도와 derived reduction')
    c.eq(r'\delta(a)=\frac{a-a^p}{p}:\quad N+1\ \mathrm{input\ digits}\ \Rightarrow\ N\ \mathrm{output\ digits}')
    c.p('[Z_p --p→ Z_p]를 derived mod p로 내리면 H⁰,H¹ 모두 F_p다. cohomology를 먼저 tensor하면 H⁰의 Tor 기여를 잃는다. finite p-power ring에서는 p가 비단위이므로 field rank나 pivot inverse로 처리하지 않는다. [P2-02/03/06]')

    c.page('Δ의 네 가지 모드와 4D 관측','delta-modes','GAUGE FAMILIES / OBSERVATIONS')
    c.table(['모드','실제 필드와 의미','필수 해석'],[
        ['ASSUMED_BOUND','실제 필드 유지. 별도의 spectral lower-bound 가정만 갱신.','HYPOTHESIS; physical field hash와 밀도는 유지된다.'],
        ['UNITS','실제 필드 유지. 표시 길이 단위를 Δ/Δref로 변경.','q₄와 q₃의 표시 단위를 각각 길이의 4제곱·3제곱으로 운반한다.'],
        ['CLASSICAL_SCALE','실제 고전장을 재계산. 위치·크기·torus 주기까지 dilation.','양자 질량 간극으로 추론한 스케일이 아니라 명시적 고전적 변환이다.'],
        ['EFFECTIVE_MODEL','ell=hbar*c/Δ, rho=kappa*ell라는 선택한 모델 관계로 재계산.','DEFINITION; 모델 관계의 가정 ID와 계수 prefactor를 보존한다.'],
    ],[WIDTH*.25,WIDTH*.39,WIDTH*.36])
    c.eq(r'\lambda=\frac{\Delta}{\Delta_{\mathrm{ref}}},\qquad A_\lambda(x)=\lambda A(c+\lambda(x-c))')
    c.eq(r'\ell=\frac{\hbar c}{\Delta},\qquad\rho=\kappa\ell,\qquad q_{4,\mathrm{display}}=L_{\mathrm{unit}}^4q_4')
    c.h('단면·적분·투영은 서로 다른 관측이다')
    c.table(['관측','보존하는 정보와 잃는 정보'],[
        ['SLICE','x₄=c의 실제 단면. 그 단면 밖의 4D 정보는 담지 않는다.'],
        ['FINITE_MARGINAL','지정 x₄ 구간에서 gauge-invariant scalar를 적분. 일반장의 생략 tail은 인증하지 않는다.'],
        ['BPST_INFINITE_MARGINAL','pure embedded BPST에서만 검증된 무한 marginal 식을 사용.'],
        ['LINEAR_PROJECTION','실제 rank-3인 3×4 행렬 P로 Px를 계산. 원본 x와 ker(P)를 함께 보존.'],
    ],[WIDTH*.34,WIDTH*.66])
    c.box('가정으로부터의 조건부 정리','Δ>0와 spectral 조건을 명시하면 그 가정 아래의 유한 모델 또는 조건부 결론을 검사할 수 있다. 4D 장의 그림이나 3D 투영을 다시 읽어서 실제 무한차원 양자 YM의 존재·질량 간극을 증명한 것으로 승격하지 않는다. [YM-R01 §4; gauge/analytic-assumptions.json]','PARTIAL')

    c.page('NS 구성의 증거 범위와 남은 조건','ns-boundary','FORCED C/D / COMPONENTS')
    c.eq(r'\partial_tu+(u\cdot\nabla)u=\nu\Delta u-\nabla p+f,\qquad\nabla\cdot u=0')
    c.p('고정 원문의 Theorem 1.1은 ν>0, u₀=0, smooth compactly supported force f, t∈[0,1), 고정 공간 지지와 bounded L², unbounded L∞ 조건을 포함한다. 이는 forced C/D 범위이며 f=0, t=1에서의 smooth velocity 또는 unforced A/B 결론을 추가하지 않는다. [NS 첨부 p.1, pp.123-126]')
    c.eq(r'\tau=q(1-\eta^2),\qquad z=q^{1/2-h}\eta,\qquad X=\frac{r^2}{2q},\qquad L=1-2h\eta^2>0')
    c.eq(r'H(Z)=\frac{1}{\Gamma(1+h)}\int_0^\infty e^{-v}v^h(1+Zv)^{-h}\,dv')
    c.p('실제 좌표 반전·도함수·점성 재척도화, heat factor의 구간 적분·도함수·tail·잔차 및 Taylor-Green 기준 해는 N2의 구현이다. r=0을 제외하는 외곽 성분과 전체 R³의 유한 에너지 해는 동일한 객체가 아니다. [NS §4, Appendix A; N2]')
    rows=ns_pending_rows(c.model['items'])
    c.table(['미완료 항목','최종 기준에서 남아 있는 조건'],rows or [['현재 항목 판정','모든 N1-N3 기준이 PASS로 보고되었으나 후속 N4-N8 범위는 별도다.']],[WIDTH*.25,WIDTH*.75])
    c.box('전체 원문 재구성과의 구별','N1-N3의 수치·유한 구성·component 형식화는 원문의 모든 차수 보정, 진동 pulse, 전 구간 cone/support, 무한 합, force localization과 전체 해의 재구성을 완료한 것이 아니다. N4-N8은 이번 M1 64개 항목 밖의 후속 범위다.','PARTIAL')


def reproducibility(c):
    c.page('재현 명령과 정적 Lean 감사','reproduction','REPRODUCIBILITY')
    c.p('아래 명령은 프로젝트 루트에서 실행한다. 코드 저장소와 dependency cache는 결과 PDF와 다른 산출물이며, ZIP에는 소스·고정 버전·검사 로그·hash를 유지한다. 원본 Lean runtime·kernel·guard를 수정해 검사를 통과시키지 않는다.')
    c.h('공통 엔진과 기존 M0 회귀')
    c.code('node --test mathscope-m1/tests/core.test.mjs\nnode --test mathscope-m0/tests/*.test.mjs')
    c.h('산술')
    c.code('node --test mathscope-m1/arithmetic/tests/arithmetic.test.mjs\npython -m pip install --target mathscope-m1/arithmetic/vendor \\\n  -r mathscope-m1/arithmetic/requirements-test.txt\npython mathscope-m1/arithmetic/tests/independent.py\npython mathscope-m1/arithmetic/lean/reproduce.py')
    c.h('게이지')
    c.code('python mathscope-m1/gauge/generate_groups.py\nnode mathscope-m1/gauge/tests.mjs\npython mathscope-m1/gauge/lean/generate_fixtures.py\npython mathscope-m1/gauge/lean/reproduce.py')
    c.h('Navier-Stokes')
    c.code('node mathscope-m1/navier/verify.mjs\npython mathscope-m1/navier/lean/reproduce.py')
    c.p('NS 원문 전체 rc2 build 및 Comparator의 실제 명령·상태는 N1-05/06의 최종 데이터와 official-validation의 기록을 따른다. 로컬 4.34.1 component build 명령으로 이 별도 관문을 대신하지 않는다.','small')
    c.h('어떤 파일이 커널 검사 근거인가')
    c.table(['대상','실제 감사 파일'],[
        ['산술','mathscope-m1/arithmetic/evidence/lean-audit.json'],
        ['게이지','mathscope-m1/gauge/lean/lean-audit.json'],
        ['NS component','mathscope-m1/navier/evidence/lean-validation.json'],
        ['공통 포장','mathscope-m1/evidence/packaged-audits.json'],
    ],[WIDTH*.28,WIDTH*.72])
    c.p('정확한 sourceFiles의 원문·SHA-256, targets의 type·axioms, 명령·exit code·log를 함께 읽는다. 브라우저의 소스 대조는 이미 검사한 소스의 일치 여부를 확인하는 기능이다. 수정한 Lean 소스를 브라우저에서 새로 커널 검사했다고 표시하지 않는다.','small')
    c.p('공식 dependency pins: 로컬 Lean 4.34.1 / mathlib d13f23b723b8a846827a245b89c10fc7d3f11612. NS 원문 pin은 별도 Lean 4.34.0-rc2 / repository f9e8bc5b38b6e212696e8a30e3e91517af887bbd. 산술 독립 검사: SymPy 1.14.0, mpmath 1.3.0.','small')


def references(c):
    c.page('원전·쪽수와 로컬 증거 안내','references','PRIMARY SOURCES / LOCAL EVIDENCE')
    entries=[
        ('S01','Bhatt-Scholze, Prisms and Prismatic Cohomology','Definition 1.1; Example 1.3(1); Definition 1.4; Theorem 1.8(1), printed pp.2-4; Theorem 5.2','https://people.mpim-bonn.mpg.de/scholze/prisms.pdf'),
        ('S02','Bhatt-de Jong, Crystalline cohomology and de Rham cohomology','Theorem 3.6; Corollary 3.8','https://arxiv.org/html/1110.5001v1'),
        ('S07','Deligne, La conjecture de Weil I','(1.5.1)-(1.5.4), printed pp.275-276','https://www.numdam.org/item/PMIHES_1974__43__273_0.pdf'),
        ('S08','Wiles, The Birch and Swinnerton-Dyer Conjecture','pp.1-2; good local factor and conjectural global scope','https://www.claymath.org/wp-content/uploads/2022/05/birchswin.pdf'),
        ('BSD-KOLYVAGIN-1990','Kolyvagin, On the Mordell-Weil group and the Shafarevich-Tate group of modular elliptic curves','MPI/90-69, §1 Theorem 1: printed p.4 / PDF p.6; modularity hypothesis printed p.3. E/Q의 analytic rank 0/1에서 rank 일치와 Sha 유한성. 정확한 전역 가정과 참조 등급은 core/bsd-known-case-reference.json.','https://archive.mpim-bonn.mpg.de/325/1/preprint_1990_69.pdf'),
        ('BSD-WILES-CLAY','Wiles, The Birch and Swinnerton-Dyer Conjecture','printed p.4 §2의 정리·modularity 설명; p.2 Remark 1의 refined leading-coefficient formula와 구별. 전역 L(E,1),L′(E,1) 가정을 finite Euler 표본에서 얻었다고 표시하지 않는다.','https://www.claymath.org/wp-content/uploads/2022/05/birchswin.pdf'),
        ('S10','NIST DLMF','§25.16(i), prime counting and Chebyshev functions','https://dlmf.nist.gov/25.16'),
        ('S14','SageMath, Isomorphisms between Weierstrass models','WeierstrassIsomorphism: explicit (u,r,s,t) coordinate transformations','https://doc.sagemath.org/html/en/reference/arithmetic_curves/sage/schemes/elliptic_curves/weierstrass_morphism.html'),
        ('YM-R01','Jaffe-Witten, Quantum Yang-Mills Theory','printed p.6 §4 and p.7 §5: existence, gap and uniform volume requirements','https://www.claymath.org/wp-content/uploads/2022/06/yangmills.pdf'),
        ('YM-R02','Conrad-Landesman, Math 210C Compact Lie Groups','§§17-18 pp.75-83; §26 p.114ff.; Appendices K,V,Y','https://math.stanford.edu/~conrad/210CPage/handouts/lie_groups_notes.pdf'),
        ('YM-R05','Esole-Kang, Matter representations from geometry: under the spell of Dynkin','§2.5 pp.15-16: Dynkin embedding index','https://arxiv.org/pdf/2012.13401'),
        ('YM-R06','Vandoren-van Nieuwenhuizen, Lectures on instantons','§2 pp.7-13; equations (2.12)-(2.15), (2.20)','https://arxiv.org/pdf/0802.1862'),
        ('YM-R07','Tong, Gauge Theory - Chapter 4: Lattice Gauge Theory','§4.1, printed p.202ff.; equation (4.8), link gauge transformation','https://davidtong.org/pdfs/teaching/gauge-theory/gauge4.pdf'),
        ('YM-R14','Baez, The Octonions','§4.1, Theorem 4: compact G2 and octonions','https://math.ucr.edu/home/baez/octonions/node14.html'),
        ('YM-R15','Conrad, Root systems for split classical groups','§§2-5 (8-page PDF), classical root/coroot data; compact form is separately checked','https://virtualmath1.stanford.edu/~conrad/249BW16Page/handouts/classicalgps.pdf'),
        ('NS-PAPER','OpenAI, Finite Time Blowup for Navier-Stokes','고정 첨부 166쪽; Theorem 1.1 p.1; §4 pp.24-45; §10 pp.116-126; Appendix A pp.126-144, B pp.144-157, C pp.157-165. 첨부 SHA-256: 0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f','https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf'),
        ('NS-REPO','OpenAI / NavierStokesAndEuler','commit f9e8bc5b38b6e212696e8a30e3e91517af887bbd; 원문 source와 toolchain pin','https://github.com/openai/NavierStokesAndEuler'),
        ('N01','OpenAI 공식 발표','2026-09-08 발표 / 2026-09-10 갱신 / 2026-10-09 조회; attributed forced C/D announcement','https://openai.com/index/navier-stokes-solution/'),
        ('N02','Clay 공식 공지','2026-09-11 / 2026-10-09 조회; apparently settled 및 심사 절차 안내','https://www.claymath.org/news/navier-stokes-announcement/'),
    ]
    for id_,title,loc,url in entries:
        c.story.append(KeepTogether([
            Paragraph(rich(id_+'  '+title,True),c.styles['small']),
            Paragraph(rich(loc),c.styles['small']),
            Paragraph(rich(url),c.styles['tiny']),Spacer(1,7),
        ]))
    c.h('로컬 근거의 읽는 위치')
    c.p('항목 카드에서 경로가 짧게 쓰이면 해당 도메인 루트에 상대적이다: P=mathscope-m1/arithmetic, Y=mathscope-m1/gauge, N=mathscope-m1/navier. 공통 I 항목은 core/ 및 해당 domain의 cross-cutting 근거를 함께 읽는다. 참고문헌 레코드와 실제 kernel receipt의 파일은 별도다.','small')
    for x in c.model['sourceSnapshots']:
        c.p(x['path']+'\nSHA-256 '+x['sha256'],'tiny')
    for field,label in [('bundleSha256','배포 app bundle'),('workerSha256','배포 계산 worker')]:
        if c.model['metadata'].get(field):
            c.p(label+' / SHA-256 '+c.model['metadata'][field],'tiny')


def build_story(model):
    register_fonts()
    c=Composer(model)
    cover(c)
    reading_guide(c)
    usage(c)
    acceptance_pages(c)
    math_pages(c)
    reproducibility(c)
    references(c)
    return c


def preflight(model):
    register_fonts()
    c=build_story(model)
    measured=[]
    for item in model['items']:
        card=AcceptanceCard(item,c.styles)
        h=card.wrap(WIDTH,FRAME_H)[1]
        measured.append({'id':item['id'],'heightPt':round(h,2),'status':item['status']})
    for flow in c.story:
        if isinstance(flow,MathEquation):
            flow.wrap(WIDTH,FRAME_H)
    result={'schema':'MathScope.M0M1.ReportPreflight/1','items':len(model['items']),'counts':model['counts'],
            'missingStatusIds':[x['id'] for x in model['items'] if x['status']=='PENDING_DATA'],
            'missingGlyphs':sorted(MISSING_GLYPHS),'cardHeights':measured,
            'maximumCardHeightPt':max(x['heightPt'] for x in measured),
            'bodyWidthMm':round(WIDTH/mm,3),'font':'NanumGothic with DejaVu/STIX fallback',
            'pdfGenerated':False,'artifactMarkerRunByGenerator':False,'sourceSnapshots':model['sourceSnapshots']}
    return result


def verify_pdf(pdf_path, model, doc):
    from pypdf import PdfReader
    import pdfplumber
    reader=PdfReader(str(pdf_path))
    text='\n'.join(p.extract_text() or '' for p in reader.pages)
    missing=[x['id'] for x in model['items'] if x['id'] not in text]
    item_pages=doc.itemPages
    absent_bookkeeping=[x['id'] for x in model['items'] if x['id'] not in item_pages]
    outside=[]
    with pdfplumber.open(str(pdf_path)) as pdf:
        for pi,page in enumerate(pdf.pages,1):
            for char in page.chars:
                if char.get('text','').strip() and (char['x0'] < 8*mm or char['x1'] > PAGE_W-8*mm or char['top'] < 5*mm or char['bottom'] > PAGE_H-5*mm):
                    outside.append({'page':pi,'text':char['text'],'box':[char['x0'],char['top'],char['x1'],char['bottom']]})
    audit={'schema':'MathScope.M0M1.PdfAudit/1','pdf':str(pdf_path),'sha256':sha(pdf_path),'pages':len(reader.pages),
           'originalCriteriaCount':70,'itemPages':item_pages,'sectionPages':doc.sectionPages,
           'missingIds':missing,'missingItemLayoutRecords':absent_bookkeeping,'missingGlyphs':sorted(MISSING_GLYPHS),
           'outsideSafePageBounds':outside,'textExtractionOnlyIsNotVisualQA':True,
           'visualQA':{'status':'PENDING_RENDER_AND_ACTUAL_INSPECTION'},'sourceSnapshots':model['sourceSnapshots']}
    if missing or absent_bookkeeping or MISSING_GLYPHS or outside:
        raise ValueError('PDF structural audit failed: '+json.dumps(audit,ensure_ascii=False)[:1500])
    return audit


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--data',type=Path,help='Final root release-report-data.json; overrides status/evidence, never original criteria')
    ap.add_argument('--preflight',action='store_true',help='Prepare JSON/layout measurements only; do not create PDF')
    ap.add_argument('--build',action='store_true',help='Create PDF, only after the single authoring marker was run')
    ap.add_argument('--output',type=Path,default=DEFAULT_OUTPUT)
    args=ap.parse_args()
    if not args.preflight and not args.build:
        ap.error('Choose --preflight or --build')
    if args.build and args.data is None:
        ap.error('--build requires the final --data file')
    model=assemble(args.data)
    result=preflight(model)
    (HERE/'M0_M1_preflight.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    (HERE/'M0_M1_normalized-report-data.json').write_text(json.dumps(model,ensure_ascii=False,indent=2)+'\n')
    if args.preflight and not args.build:
        print(json.dumps({k:v for k,v in result.items() if k not in {'cardHeights','sourceSnapshots'}},ensure_ascii=False,indent=2))
        return
    if result['missingStatusIds']:
        raise ValueError('Final PDF cannot contain unresolved report data: '+','.join(result['missingStatusIds']))
    if result['missingGlyphs']:
        raise ValueError('Missing glyphs: '+repr(result['missingGlyphs']))
    out=args.output.resolve()
    if out.parent != (ROOT/'output/pdf').resolve() or 'M0_M1' not in out.name:
        raise ValueError('Only a new M0_M1 PDF under output/pdf may be written')
    out.parent.mkdir(parents=True,exist_ok=True)
    composer=build_story(model)
    doc=ReportDoc(str(out),model['metadata'])
    doc.multiBuild(composer.story,maxPasses=4)
    audit=verify_pdf(out,model,doc)
    (HERE/'M0_M1_pdf-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'pdf':str(out),'pages':audit['pages'],'sha256':audit['sha256'],'missingIds':audit['missingIds'],'visualQA':'PENDING'},ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()
