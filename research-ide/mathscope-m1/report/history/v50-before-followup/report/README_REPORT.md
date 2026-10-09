# M0 + M1 원문 70개 수용기준 PDF 생성기

`build_m0_m1_report.py`는 **원문 70개 항목을 바꾸지 않는** 한국어 상세 보고서 생성기다. `mathscope-m1/evidence/original-acceptance.json`에서 ID·제목·작업·수용기준을 읽고, 산술·게이지·NS 체크리스트의 실제 구현·검사·잔여 조건을 연결한다. 확정 입력 `mathscope-m1/evidence/release-report-data.json`의 공통 6개 판정과 명시적인 항목 override가 우선한다.

## 검증된 최종 결과

2026-10-09의 **v50 / build fe509729** 입력으로 PDF 생성·렌더·실제 시각 검수를 완료했다. 결과는 **38쪽, 442,662 bytes, 원문 70개 모두 수록, 61 PASS / 7 PARTIAL / 2 BLOCKED**다. M0 잔여 6개는 모두 PASS이며 M1 64개는 55 PASS / 7 PARTIAL / 2 BLOCKED다.

완료 PDF: `output/pdf/MathScope_M0_M1_Implementation_Checklist_KO.pdf`

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
  mathscope-m1/report/M0_M1_qa
python -B mathscope-m1/report/test_report_data.py
```

생성기는 기존 Blueprint/M0 PDF와 domain 소스를 쓰지 않는다. normalized report data와 preflight/pdf audit는 이 report 폴더에 저장한다. 재생성은 시각 QA 상태를 `PENDING_RENDER_AND_ACTUAL_INSPECTION`으로 초기화하므로 결과를 다시 렌더하고 실제 확인해야 한다. PDF 생성 시각 metadata 때문에 동일한 본문·배치도 binary SHA가 달라질 수 있다. 현재의 확정 SHA와 검수 상태는 manifest를 따른다.

## 최종 데이터 계약과 판정

최종 데이터는 `release`, `coreItems`, `overrides`, `tests`, `notes`를 담는다. `accept` 또는 `originalAcceptance`를 다시 제공한다면 원문과 정확히 같아야 한다. 생략하면 원문을 그대로 사용하며, 변경된 원문 수용기준은 거부한다. 최종 build에 `PENDING_DATA`가 있으면 생성기를 중지한다.

공통 6개는 I0-04, I1-03, I1-07, I3-02, I3-03, I3-04다. 개별 domain의 cross-cutting PASS는 해당 부분의 근거로 수집하지만 공통 항목 전체 PASS로 자동 승격하지 않는다.

N1-05/06의 명시적인 최종 override는 native checklist와 과거 command-receipt fallback보다 우선한다. 적용 필드는 status, implementation, validation, artifacts, remaining, leanTargets, mathGateStatus, scopeBoundary다. NS 요약표는 최종 항목의 `remaining`에서 생성하므로 이미 확보된 build·타입·공리 검사를 미완료로 되돌리지 않는다. 판정이 PASS가 된 항목은 미완료 요약에서 제외한다.

최종 입력의 `tests.officialNS`, `tests.browserFinal`, `tests.cliFinal`은 각각 별도 행으로 표시한다. 해당 최종 기록이 없으면 행을 만들지 않는다. 기록의 파일 경로는 ‘별도 검증 기록’으로 표시하며 `notes`의 원본 NS·브라우저·CLI 실행 범위 설명을 동적으로 수록한다.

## 조판·검수·감사 파일

- A4, 약 172mm 본문 폭. ReportLab, NanumGothic 본문·굵은꼴, DejaVu/STIX 수학·기호 fallback을 사용한다.
- 본문 약 9.6pt, 항목 9.05pt, 보조 근거 8.15pt다. 원문·구현·잔여 조건을 임의로 잘라내지 않는다.
- 수식은 Matplotlib mathtext의 glyph/rectangle을 ReportLab에 벡터로 그린다.
- 항목은 페이지 사이에서 갈라지지 않는다. 한 항목이 한 페이지보다 크면 무리하게 축소하지 않고 오류로 중지한다.
- 완료표는 최종 70개 status에서 자동 집계한다. 70개 ID·글리프·안전경계의 구조 검사는 실제 시각 검수와 별도다.
- 데이터 검사 8개가 통과했다. 원문 보존, 공통 PASS 자동 승격 거부, 구조화된 근거 보존, 동적 N1 잔여 조건, PASS 제외, N3 잔여 조건 유지, 검증 단위 분리, 없는 최종 기록 제외를 확인한다.

현재 감사 기록은 `M0_M1_pdf-audit.json`, `M0_M1_visual-qa.json`, `M0_M1_final-checks.json`이다. `M0_M1_v50-render-comparison.json`은 독립 검토된 v50 렌더와 최종 렌더의 contact 10장 및 확대 13쪽 RGB 일치를 기록한다. `M0_M1_report-manifest.json`은 최종 PDF·생성기·입력·감사 문서의 byte 수와 SHA-256을 고정한다. 이전 v49 비교 파일은 과거 교정 기록이며 현재 최종 QA의 기준은 이 v50 파일들이다.

폰트는 기존 `tmp/pdfs/fonts/NanumGothic-Regular.ttf`와 `NanumGothic-Bold.ttf`를 읽는다. 별도 환경에서는 이 report 폴더의 `fonts/`에 같은 두 파일을 제공할 수 있다. DejaVu는 시스템 폰트, STIX는 Matplotlib 번들 폰트를 사용한다. Python 의존성은 reportlab/fontTools/matplotlib/pypdf/pdfplumber이며 PNG 렌더에는 Poppler의 `pdftoppm`이 필요하다. 폰트·의존성은 별도로 준비한다.

## 보존하는 수학적 구별과 N1 최종 범위

P3의 실제 geometric comparison과 전체 Lean formalization, 게이지의 네 Δ 모드, 고전장과 양자 질량 간극, NS forced C/D·전체 원문 build·component kernel 검사·수치 후보를 분리한다. 원문 N1-05/06와 N3의 미충족 기준은 PARTIAL/BLOCKED로 남긴다. N4–N8 등의 후속 범위를 원문 70개에 섞지 않는다.

N1-05는 PARTIAL이다. 원래 Lean 4.34.0-rc2 소스·manifest·커널을 고정했고, 별도 명시 경로 entry에서 원래 cache body의 8,747/8,747 다운로드와 `lake build NavierStokes.ComparatorSolution`의 9,371 jobs·exit 0을 확인했다. 제출 정리의 source closure는 609/609 `.olean`이다. 표준 CLI의 애플리케이션 경로 자동 탐지는 이 환경에서 실패했다. 원래 default build는 C/D 우선 검증을 위해 exit -15로 중단되어 전체 NS/Euler/defaultTargets 성공을 확보한 것은 아니다.

N1-06도 PARTIAL이다. 원래 rc2의 C/D 두 exported declaration에 대해 실제 `#check`와 `#print axioms` 명령이 exit 0으로 끝났다. 각 공리 목록은 `[propext, Classical.choice, Quot.sound]`이며 추가 공리나 `sorryAx`는 없다. 원래 guard를 유지한 Comparator는 `systemd` user bus 부재로 exit 1이고 Comparator/Nanoda 검사에 도달하지 못했다. 환경 BLOCKED를 수학적 반증이나 검사 통과로 해석하지 않는다. 정확한 명령·소스·타입·공리·종료 코드·해시는 `mathscope-m1/navier/official-validation/official-audit-summary.json`과 연결 로그에 보존한다.

브라우저 근거는 `mathscope-m1/evidence/browser-validation.json`과 `browser-validation-v50.json`의 직접 관찰 요약 기록이다. 원본 캡처나 원시 WebMCP export가 첨부되었다고 주장하지 않는다. CLI는 `mathscope-m1/evidence/cli-validation.json` 및 `cli-v50-validation.json`의 별도 실행 결과다.
