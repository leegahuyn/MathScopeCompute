# M0 + M1 원문 70개 수용기준 PDF 생성기

`build_m0_m1_report.py`는 **원문 70개 항목을 바꾸지 않는** 한국어 상세 보고서 생성기다. `mathscope-m1/evidence/original-acceptance.json`에서 ID·제목·작업·수용기준을 읽고, 산술·게이지·NS 체크리스트의 실제 구현·검사·잔여 조건을 연결한다. 확정 입력 `mathscope-m1/evidence/release-report-data.json`의 공통 6개 판정과 명시적인 항목 override가 우선한다.

## 현재 v54 결과

현재 보고서는 **v54 / build 16f4f911**, 한국 날짜 **2026-10-10** 기준이다. 실제 배포된 M1 `1.2.0` / NS `1.3.0-m1`의 **59개 예제, 8개 후속 종류·11개 후속 예제, 고정된 4개 감사 묶음**을 반영했다. PDF는 **51쪽, 515,376 bytes**이며 원문 70개 ID·제목·작업·수용기준을 모두 보존한다. 판정은 **61 PASS / 7 PARTIAL / 2 BLOCKED**이고, M0 잔여 6개는 모두 PASS, M1 64개는 55 PASS / 7 PARTIAL / 2 BLOCKED다.

현재 PDF: `output/pdf/MathScope_M0_M1_Implementation_Checklist_KO.pdf`

SHA-256: `600ffcb14bca68af4b1b6fcad170a58feaf769c33530f88503b4c573a3902551`

최종 입력 SHA-256: `429ef1e8ee4df0722d8d36e6637d2263feab720abc9489f2dba90f57198bef38`

현재 배포 원장은 `mathscope-m1/evidence/deployment-v54-verified.json`이다. `deployment-v54-ui.json`은 UI 교정 직후의 역사적 영수증이며 최종 브라우저 검수 상태를 대신하지 않는다. Worker SHA-256은 `0526fb1030c328e940c39672e86dfb9d24f09f4622794269c1e0eadbb92cc0ca`, v54 app SHA-256은 `4dc2624ae5ef86ec23d329e7b8d9e4129daef956bd81bd3f3ddf029206d9dc14`다.

원문 보존·PDF 전체 텍스트·판정·최종 override·배포 메타데이터·app/Worker 해시의 문서 감사는 PASS다. 최종 Poppler 렌더 **51쪽 모두 실제 시각 검사 PASS**이며 `v54-final-visual-qa/`의 contact 26장에 연결되어 있다. 보고서 담당자는 1–40쪽, root는 1쪽과 37–51쪽, 독립 gluing 검증 담당자는 25–36쪽을 실제 열어 확인했다. 잘림·겹침·누락 글리프·안전경계 초과·갈라진 수용기준 카드가 없다. 검사자별 범위는 `M0_M1_visual-qa.json`에 기록한다. 텍스트 추출 검사를 시각 검사로 대체하지 않는다. 이 보고서 작업은 domain 계산이나 Lean 검사를 다시 실행한 작업이 아니다.

실행 버전과 증거 단위는 다음처럼 유지한다.

| 실제 기록 | 결과 | 범위 |
| --- | --- | --- |
| v54 브라우저 | 19/19 | 실제 배포 WebMCP·DOM, gluing/A.21 축 저장·재현, P¹/G2, 거부 조건과 두 UI 교정 |
| v53 공통 엔진 | 19/19 | 원래 실행 버전을 보존한 공통 회귀 |
| v53 M0 회귀 | 82/82 | 저장·공통 계약의 별도 회귀 |
| v53 후속 Worker 통합 | 19/19 | 실제 gluing을 포함한 Worker/local·저장·재현·위조 거부 |
| v53 CLI/공개 엔진 감사 | 48/48 | CLI 7회, 별도 공개 엔진 제어 7개 및 산출물 무결성; 48개 예제 계산이 아님 |
| 초기 로컬 Lean | 71개 | 산술 31·게이지 27·NS 성분 13, 초기 음성 대조 9개 별도 |
| 원래 rc2의 C/D 제출 정리 | 2개 | 정확 exported 타입·공리의 실제 커널 수용 |
| 후속 원문 참조 / 새 스칼라 | 16개 / 4개 | 원문 타입·공리 참조와 새 국소 스칼라 정리를 구별; 새 음성 대조 1개 별도 |

v53과 v54의 Worker 바이트는 동일하고 50개 소스 중 `workspace.mjs`만 UI 교정으로 달라졌다. 이 연속성은 `evidence/v53-v54-worker-continuity.json`에 기록되어 있으며, v53 실행을 v54 재실행으로 이름만 바꾸지 않는다. CLI에는 replay 서브명령이 없으므로 공개 Node 엔진의 재현 검사를 별도 항목으로 적는다. 최종 브라우저 JSON은 실제 관찰의 `OBSERVATION_SUMMARY`다. 브라우저 원본 JSON 파일 동기화가 시간 초과되었으므로 byte-copy라고 하지 않으며, 실제 스크린샷 파일의 동기화 성공은 별도로 기록한다.

PDF의 원문 전체 Lean build 관측은 `navier/original-build-release-snapshots/20261009T181519Z/snapshot.json`에 고정되어 있다. **18:15:19 UTC 당시 RUNNING_AT_CAPTURE / exit null**이며 전체 성공 영수증이 아니다. NS 794/817, Euler 158/1840, ComparatorChallenges 2/2는 당시 파일 재고다. 로그는 실행 중에 복사한 관측 prefix이며 원자적인 전체 checkpoint나 완료 비율을 뜻하지 않는다. 앞선 C/D 선택 build의 9,371 jobs·exit 0, 별도 타입·공리 entry exit 0, 원래 guard를 유지한 독립 Comparator의 환경 BLOCKED는 각각 다른 상태다. 17:45 이후 연결 끊김의 원인·종료 코드는 알 수 없으며, 17:50:28 같은 원문 프로필을 캐시에서 한 차례 재개한 기록을 보존한다.

후속 계산의 실제 전사 오류와 실패 기록도 포함한다. B.26/C.12의 `−WU`를 잘못 `X`로 나누었던 항을 교정했고, 이전 243개 표본 전부 FAIL과 교정 후 243/243 PASS를 나란히 기록한다. C.12 원문 Fraction 1,135/1,135, 80자리 보정 지도 74/74, B.34/B.8 독립 90자리 691/691은 서로 다른 범위다. 마지막 `hasOwn` 입력 거부 교정은 최종 전체 입력·결과가 독립 검증본과 canonical bytes로 같음을 확인한 결속 검사이며, 691개 적분의 재실행이라고 하지 않는다. 초기 Gauss32의 130/616 FAIL, 큰 j₀의 Newton/cone 실패와 log P*=14의 유한 축 실패도 숨기지 않는다.

실제 B.34/B.8 수치 접합이 추가되었어도 원문 N3-05의 균일 interval-Newton 기준과 N3-06의 전 프로파일 strict cone 기준은 여전히 BLOCKED다. 기본 접합 log P*=0은 원문의 큰 P* 계층을 충족하지 않으며, 다른 예제의 A.21 압력·축 인증과 하나의 전역 witness로 묶어 표시하지 않는다. 전체 NS 해·양자 질량 간극·RH/BSD의 새 증명으로 승격하는 설명은 없다.

## 보존된 v50 결과

2026-10-09의 **v50 / build fe509729** 입력으로 PDF 생성·렌더·실제 시각 검수를 완료했다. 결과는 **38쪽, 442,662 bytes, 원문 70개 모두 수록, 61 PASS / 7 PARTIAL / 2 BLOCKED**다. M0 잔여 6개는 모두 PASS이며 M1 64개는 55 PASS / 7 PARTIAL / 2 BLOCKED다.

당시 PDF는 이전 v50 배포 패키지의 역사적 산출물이다. 현재 위 경로의 PDF는 v54 파일이다. 당시 생성기·입력·감사 기록과 contact 10장은 `history/v50-before-followup/`에 별도로 보존했다.

SHA-256: `620484d455717e8bcc4870e7c6bf87de849e449f81d028abbb9876b38ec2137e`

최종 입력 SHA-256: `9c1c787b5484570ac69466d6f1102e6d303ece8b8bf41beaaedccb2a7d8d1c31`

원문 ID·제목·작업·수용기준의 보존, 원문 전체의 PDF 텍스트 수록, 70개 판정과 release metadata·app/worker 해시 일치 검사를 통과했다. 전체 38쪽의 contact sheet 10장을 실제로 열어 배치를 확인했고, 변경 핵심 1·3·4·7·24·25·35·36·38쪽은 150dpi 개별 확대를 확인했다. 잘림·겹침·누락 글리프·안전경계 초과가 없다. 26쪽은 완결된 N1-08 카드 하나를 보존한 페이지이며 문단이나 카드가 중간에서 갈라진 페이지가 아니다. 최종 PDF의 렌더는 독립 검토된 v50 본문·배치와 동일하다.

로컬 Lean target **71개**와 원래 rc2의 C/D 제출 정리 **2/2**는 별도 검증 단위다. 브라우저 이전 **25/25**는 v45–v49 통합 과정의 누적 관찰이고 이전 CLI **18/18**도 그대로 보존한다. 최종 v50의 브라우저 추가 **9/9**, CLI 추가 **12/12**, 공통 엔진 **19/19** 재실행을 별도 행과 4쪽 검증 범위에 기록했다. 이 수치들을 합산하거나 이전 검사를 모두 v50에서 다시 실행했다고 표시하지 않는다.

PDF 스킬 operation marker는 **첫 실제 생성 직전에 1회 실행 완료**했다. 같은 산출물의 재생성 때는 marker를 다시 실행하지 않는다. 생성기는 marker를 자동 호출하지 않는다.

## 재현 명령

프로젝트 루트에서 실행한다.

```bash
python mathscope-m1/report/build_m0_m1_report.py --preflight
python mathscope-m1/report/build_m0_m1_report.py \
  --data mathscope-m1/evidence/release-report-data.json --preflight
python mathscope-m1/report/build_m0_m1_report.py \
  --data mathscope-m1/evidence/release-report-data.json --build
pdftoppm -r 100 -png \
  output/pdf/MathScope_M0_M1_Implementation_Checklist_KO.pdf \
  mathscope-m1/report/M0_M1_v54_final_qa
python -B mathscope-m1/report/test_report_data.py
python -B mathscope-m1/report/verify_final_report.py
```

생성기는 기존 Blueprint/M0 PDF와 domain 소스를 쓰지 않는다. normalized report data와 preflight/pdf audit는 이 report 폴더에 저장한다. 재생성은 시각 QA 상태를 `PENDING_RENDER_AND_ACTUAL_INSPECTION`으로 초기화하므로 결과를 다시 렌더하고 실제 확인해야 한다. PDF 생성 시각 metadata 때문에 동일한 본문·배치도 binary SHA가 달라질 수 있다. 현재의 확정 SHA와 검수 상태는 manifest를 따른다.

## 최종 데이터 계약과 판정

최종 데이터는 `release`, `coreItems`, `overrides`, `tests`, `notes`를 담는다. `accept` 또는 `originalAcceptance`를 다시 제공한다면 원문과 정확히 같아야 한다. 생략하면 원문을 그대로 사용하며, 변경된 원문 수용기준은 거부한다. 최종 build에 `PENDING_DATA`가 있으면 생성기를 중지한다.

공통 6개는 I0-04, I1-03, I1-07, I3-02, I3-03, I3-04다. 개별 domain의 cross-cutting PASS는 해당 부분의 근거로 수집하지만 공통 항목 전체 PASS로 자동 승격하지 않는다.

N1-05/06의 명시적인 최종 override는 native checklist와 과거 command-receipt fallback보다 우선한다. 적용 필드는 status, implementation, validation, artifacts, remaining, leanTargets, mathGateStatus, scopeBoundary다. NS 요약표는 최종 항목의 `remaining`에서 생성하므로 이미 확보된 build·타입·공리 검사를 미완료로 되돌리지 않는다. 판정이 PASS가 된 항목은 미완료 요약에서 제외한다.

긴 공통 항목의 카드 요약은 기본적으로 `CORE_DISPLAY`의 현재 기본 요약을 사용한다. 새 release에서 감사 묶음이나 정밀도 범위가 늘어나면 해당 항목 override에 `reportDisplay`를 명시한다. 예: `"reportDisplay": {"implementation": "최종 구현 요약", "validation": "초기 검사와 후속 감사를 분리한 최종 요약"}`. 이 두 요약만 카드에 우선 표시하며 상세 `implementation`·`validation`은 정규화된 자료에 그대로 보존한다. 원문 ID·제목·작업·수용기준·상태·잔여 조건은 이 표시 필드로 바꿀 수 없다. 빈 요약이나 다른 키는 오류로 거부한다. I3-02/I3-04의 초기 로컬 71개·3개 감사 묶음과 후속 rc2 원문 참조·새 스칼라 감사를 하나의 증명 수로 합치지 않는다.

최종 입력의 `tests.officialNS`, `tests.m0Regression`, `tests.browserFinal`, `tests.cliFinal`은 각각 별도 행으로 표시한다. 해당 최종 기록이 없으면 행을 만들지 않는다. `executionVersion`이 있으면 최종 UI 버전보다 검사 실행 버전을 우선한다. 기록의 파일 경로는 ‘별도 검증 기록’으로 표시하며 `notes`의 원본 NS·브라우저·CLI·후속 실행 범위 설명을 동적으로 수록한다.

## 선택적 NS 후속 구성 데이터

생성기는 `followupConstruction`과 `tests.followup`이 있을 때만 별도 후속 장을 만든다. 축의 정확 국소 인증, outer 자료, controlled continuation, C.1, A.21 압력·축, C.12, B.34/B.8 성분은 **최종 release가 제공한 모듈만** 표시한다. 없는 성분이나 아직 없는 검사 결과를 자동으로 완성하지 않는다. 이 생성기 확장 및 최종 카드 요약 우선순위에 대한 데이터 검사 **17/17**을 통과했고, 현재 v54의 8개 모듈·18개 개별 검사 행을 실제 51쪽 PDF에 수록했다. v50 기록은 역사적 자료로 따로 보존한다.

```json
{
  "followupConstruction": {
    "title": "NS 후속 구성: 계산 실행과 국소 인증",
    "summary": ["이번에 실제로 확보한 성분과 적용 범위"],
    "modules": [
      {
        "id": "axis",
        "title": "실제 Bρ 국소 상계",
        "kind": "ns.axis-certificate",
        "status": "VERIFIED_LOCAL_BOUND_CERTIFICATE",
        "implementation": ["구현한 정확 연산과 입력 datum"],
        "validation": ["실제 검사 방법과 결과"],
        "scope": ["원문 전체 pressure/witness와의 구별"],
        "remaining": ["정확히 남은 동일성 또는 전제 연결"],
        "artifacts": ["mathscope-m1/navier/followup-construction/axis-default-certificate.json"],
        "formulas": ["B/(2\\Lambda)\\leq 1"],
        "usage": ["선택할 예제와 확인할 출력"],
        "commands": ["node --test mathscope-m1/navier/followup-construction/axis-certificates.test.mjs"]
      }
    ],
    "leanAudit": {
      "originalImportedTargets": 16,
      "newScalarTargets": 4,
      "negativeControlsPassed": 1,
      "artifact": "mathscope-m1/navier/followup-construction/axis-pinned-audit.json",
      "scope": "완료된 명령·타입·공리·로그만 반영; 생성 해석 전제 전체의 Lean 증명이 아님"
    },
    "notes": ["후속 검사와 기존 릴리즈 검사의 범위 차이"],
    "commands": []
  },
  "tests": {
    "followup": {
      "axis": {
        "label": "축 JS 검사",
        "pass": 27,
        "total": 27,
        "artifact": "mathscope-m1/navier/followup-construction/axis-tests.tap",
        "scope": "명시적 rational pressure datum과 자원·취소·입력 거부"
      }
    }
  }
}
```

위 JSON은 데이터 **형식 예**다. Lean의 완료 개수·상태는 실제 종료 코드와 최종 감사 파일이 확인된 뒤에만 release에 넣는다. module `status`는 해당 추가 성분의 상태일 뿐 원문 70개 status를 변경하지 않는다. 원문 항목의 실제 구현·검증·남은 조건을 갱신하려면 기존 `overrides` 계약을 사용한다. `accept`를 바꾸는 override는 계속 거부한다.

긴 모듈은 보고서 표시용 `reportPageBreakBefore: "remaining"`와 `reportContinuationHeading`을 사용할 수 있다. v54의 B.34/B.8 모듈은 구현·검증·범위를 47쪽에, 남은 조건·사용법·수식·근거·재현 명령을 48쪽에 온전히 배치했다. 이 필드는 수학 내용이나 원문 판정을 바꾸지 않는다. 실제 `controlled-continuation`, `radial-modulation`, `source-inner-gluing` 모듈과 교정 notes가 함께 제공될 때만 전사 교정 전후·실패 보존·독립 검사 범위의 전용 장을 만든다. 해당 입력이 없는 일반 보고서에는 이 특정 교정 이력을 자동으로 넣지 않는다.

NS 요약표는 N1과 N3 모두 최종 항목의 `remaining`을 읽는다. 새 국소 Bρ 상계를 확보했는데 과거의 포괄적 ‘Bρ 미인증’ 문구가 요약에서 다시 등장하지 않도록, release override에 완성된 pressure·기존 η-jet 동일성 등 **실제로 남은 연결**을 적는다. 입력이 없는 C.12를 자동으로 새 페이지에 넣거나 테스트 수를 추정하지 않는다.

검사 집계는 기존 로컬 71개, 원래 C/D 제출 정리 2개, 후속 원문 타입·공리 참조 16개, 새 스칼라 정리 4개, 새 음성 대조를 별도 행으로 유지한다. `tests.followup`의 각 suite도 개별 표시하며 기존 검사 또는 Lean 증명 수에 합산하지 않는다. 후속 PDF를 만들 때는 root가 최종 배포·상태·검사 기록을 동결한 `--data` 파일을 지정하고 렌더·실제 시각 QA를 다시 수행한다. 이미 실행한 PDF operation marker는 반복하지 않는다.

## 조판·검수·감사 파일

- A4, 약 172mm 본문 폭. ReportLab, NanumGothic 본문·굵은꼴, DejaVu/STIX 수학·기호 fallback을 사용한다.
- 본문 약 9.6pt, 항목 9.05pt, 보조 근거 8.15pt다. 원문·구현·잔여 조건을 임의로 잘라내지 않는다.
- 수식은 Matplotlib mathtext의 glyph/rectangle을 ReportLab에 벡터로 그린다.
- 항목은 페이지 사이에서 갈라지지 않는다. 한 항목이 한 페이지보다 크면 무리하게 축소하지 않고 오류로 중지한다.
- 완료표는 최종 70개 status에서 자동 집계한다. 70개 ID·글리프·안전경계의 구조 검사는 실제 시각 검수와 별도다.
- 데이터 검사 17개가 통과했다. 원문 보존, 공통 PASS 자동 승격 거부, 구조화된 근거 보존, 동적 N1/N3 잔여 조건, PASS 제외, 검증 단위 분리, 없는 최종 기록 제외, 후속 module의 PASS가 원문 70개 상태를 바꾸지 않음, 빈 후속 입력 생략·중복 ID 거부, 실제 제공한 후속 모듈만 출력하는 경계, 카드 요약 override의 허용 필드, 실제 검사 실행 버전의 우선 표시를 확인한다.

현재 `M0_M1_pdf-audit.json`, `M0_M1_visual-qa.json`, `M0_M1_final-checks.json`은 v54/51쪽의 구조·실제 시각 검사·원문 및 메타데이터 감사 기록이다. `M0_M1_report-manifest.json`은 현재 PDF·생성기·입력·감사 문서와 최종 렌더 contact의 byte 수와 SHA-256을 고정한다. `v54-final-visual-qa/render-map.json`은 정확한 PDF SHA와 페이지별 contact를 연결한다. 검사자별 실제 확인 범위는 visual QA 파일을 따른다.

`verify_final_report.py`는 원본 70개 필드의 정확한 동일성을 먼저 검사한다. PDF 전체 텍스트의 비교에는 생성기가 이미 사용하던 인쇄용 대시·공백 변환, Unicode 호환 정규화, 줄바꿈 공백만 적용한다. 첫 추가 텍스트 감사가 이 대시 변환을 적용하지 않아 7개 항목을 잘못 불일치로 분류했던 기록은 `history/v54-first-text-audit.json`에 보존한다. 검사기의 표시 정규화만 고쳤으며 원문이나 수용기준을 바꾸지 않았다. `history/v54-first-layout/`에는 처음 53쪽의 실제 전체 검수에서 발견한 짧은 꼬리 페이지와 이후 재배치 근거를 보존한다. 현재 51쪽의 실제 시각 검사는 별도 최종 렌더에 대해 수행한다.

이전 v50 감사 사본은 `history/v50-before-followup/report/`에 있다. `M0_M1_v50-render-comparison.json`은 당시 contact 10장·확대 13쪽 RGB 비교이고, v49 비교 파일도 과거 교정 기록이다. 어느 파일도 현재 51쪽 PDF의 시각 검사를 대신하지 않는다. 생성기의 operation marker 자동 호출은 없으며 첫 실제 생성 전 이미 완료한 한 번의 marker를 반복하지 않았다.

폰트는 기존 `tmp/pdfs/fonts/NanumGothic-Regular.ttf`와 `NanumGothic-Bold.ttf`를 읽는다. 별도 환경에서는 이 report 폴더의 `fonts/`에 같은 두 파일을 제공할 수 있다. DejaVu는 시스템 폰트, STIX는 Matplotlib 번들 폰트를 사용한다. Python 의존성은 reportlab/fontTools/matplotlib/pypdf/pdfplumber이며 PNG 렌더에는 Poppler의 `pdftoppm`이 필요하다. 폰트·의존성은 별도로 준비한다.

## 보존하는 수학적 구별과 N1 최종 범위

P3의 실제 geometric comparison과 전체 Lean formalization, 게이지의 네 Δ 모드, 고전장과 양자 질량 간극, NS forced C/D·전체 원문 build·component kernel 검사·수치 후보를 분리한다. 원문 N1-05/06와 N3의 미충족 기준은 PARTIAL/BLOCKED로 남긴다. N4–N8 등의 후속 범위를 원문 70개에 섞지 않는다.

### v50 시점의 NS 상태와 실행 근거

아래는 v50에 저장된 과거 상태다. 후속 release의 현재 상태는 그 release의 최종 override와 새 종료 기록으로 판단하며, 이 문단으로 새 build 성공이나 새 국소 인증을 되돌리지 않는다.

N1-05는 PARTIAL이다. 원래 Lean 4.34.0-rc2 소스·manifest·커널을 고정했고, 별도 명시 경로 entry에서 원래 cache body의 8,747/8,747 다운로드와 `lake build NavierStokes.ComparatorSolution`의 9,371 jobs·exit 0을 확인했다. 제출 정리의 source closure는 609/609 `.olean`이다. 표준 CLI의 애플리케이션 경로 자동 탐지는 이 환경에서 실패했다. 원래 default build는 C/D 우선 검증을 위해 exit -15로 중단되어 전체 NS/Euler/defaultTargets 성공을 확보한 것은 아니다.

N1-06도 PARTIAL이다. 원래 rc2의 C/D 두 exported declaration에 대해 실제 `#check`와 `#print axioms` 명령이 exit 0으로 끝났다. 각 공리 목록은 `[propext, Classical.choice, Quot.sound]`이며 추가 공리나 `sorryAx`는 없다. 원래 guard를 유지한 Comparator는 `systemd` user bus 부재로 exit 1이고 Comparator/Nanoda 검사에 도달하지 못했다. 환경 BLOCKED를 수학적 반증이나 검사 통과로 해석하지 않는다. 정확한 명령·소스·타입·공리·종료 코드·해시는 `mathscope-m1/navier/official-validation/official-audit-summary.json`과 연결 로그에 보존한다.

브라우저 근거는 `mathscope-m1/evidence/browser-validation.json`과 `browser-validation-v50.json`의 직접 관찰 요약 기록이다. 원본 캡처나 원시 WebMCP export가 첨부되었다고 주장하지 않는다. CLI는 `mathscope-m1/evidence/cli-validation.json` 및 `cli-v50-validation.json`의 별도 실행 결과다.

최종 UI 릴리즈와 계산 검사의 실행 버전이 다를 수 있다. `tests.core`, `tests.browserFinal`, `tests.cliFinal`의 `executionVersion`이 있으면 표 제목에 우선한다. 같은 Worker라는 별도 근거가 있어도 v53 CLI 기록을 v54에서 다시 실행했다고 바꾸지 않는다. `prepare_followup_release.py`는 pre-v53 검토 초안의 재구성용이며 현재 최종 릴리즈를 갱신하는 명령이 아니다. 명시적인 역사 초안 재구성 옵션 없이 실행하면 종료한다.
