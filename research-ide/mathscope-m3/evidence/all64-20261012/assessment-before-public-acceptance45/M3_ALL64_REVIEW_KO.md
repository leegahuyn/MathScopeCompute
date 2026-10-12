# MathScope M3 전체 64개 원문 기준 누적 검토

**현재 판정은 원문 기준 완료 31개, 구현 후 최종 검증 대기 14개, 실질 잔여 19개다.** P7을 포함한 전체 64개가 대상이며, 이 보고서 작성으로 진행표의 상태를 변경하거나 연구 난제를 해결했다고 판정하지 않았다.

검토 snapshot: `a12d95b9b466aab187d6afcca089b0ac7685dc27` · 보고서 생성: `2026-10-12T10:21:06+00:00`. 첫 source/실제 실행 기록 immutable commit을 기준으로 읽었다. 이 파일은 후속 검토 문서이며 그 commit에 이미 포함된 문서라고 표시하지 않는다.

**원격 snapshot 대응:** 위 로컬 검토 commit과 아래 GitHub 원격 commit은 실제 Git tree가 정확히 같다. 동기화 과정에서 로컬 HEAD를 원격 commit에 정렬했으며, 원문 검증 baseline과 §2.1/§7의 source·증거 SHA는 동일한 파일 bytes를 가리킨다.

| 식별 대상 | Git 식별자 |
|---|---|
| 로컬 검토 baseline commit | `a12d95b9b466aab187d6afcca089b0ac7685dc27` |
| 같은 tree의 GitHub 원격 commit | `759d1a0b35a6e1952663ee6486e8de534d7fcb66` |
| 두 commit의 공통 tree | `e7a264058128f1ac3ad294220de230dc6478786d` |

이 매핑 보완은 source 위치를 연결한 변경이다. 새 CI/API/UI 관문을 수용하거나 기존 **31 완료 / 14 최종 검증 대기 / 19 실질 잔여** 판정을 바꾸지 않는다.

## 1. 판정 규칙과 집계

완료 수는 각 진행표의 `originalCriterionComplete === true`만 센다. `PASS`, `COMPLETE_WITHIN_STATED_SCOPE`, `PARTIAL`, `IMPLEMENTED_PENDING_LIVE_UI`라는 문자열을 임의로 같은 뜻으로 바꾸지 않는다. “최종 검증 대기”는 아래 14개 false 행의 보고서상 분류이며 새로운 완료 상태가 아니다. “실질 잔여”는 배포 검증 외에 실제 구성·계산·검증 또는 전역 증명 의무가 남은 19개 false 행이다.

| 묶음 | 원문 수 | 완료 | 최종 검증 대기 | 실질 잔여 | 진행표 |
|---|---:|---:|---:|---:|---|
| P7 | 8 | 0 | 8 | 0 | [P7_PROGRESS.json](P7_PROGRESS.json) |
| P8 | 8 | 7 | 1 | 0 | [P8_PROGRESS.json](P8_PROGRESS.json) |
| Y5 | 8 | 5 | 3 | 0 | [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json) |
| Y6 | 8 | 8 | 0 | 0 | [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json) |
| Y7 | 8 | 8 | 0 | 0 | [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json) |
| N6 | 8 | 0 | 0 | 8 | [N6_PROGRESS.json](N6_PROGRESS.json) |
| N7 | 8 | 0 | 0 | 8 | [N7_PROGRESS.json](N7_PROGRESS.json) |
| N8 | 8 | 3 | 2 | 3 | [N8_PROGRESS.json](N8_PROGRESS.json) |
| **전체** | **64** | **31** | **14** | **19** | 8개 묶음 |

P7의 모든 구현이 준비되었다는 local release 기록도 현재 원문 완료 수에는 0개로 반영한다. 새 API/CI/public UI 관문이 아직 최종 증거로 수용되지 않았기 때문이다. 14개가 모두 나중에 통과하면 산술적으로 45/64가 되지만, 이는 현재 성과나 통과 예측이 아니다.

완료된 Y7-06/07처럼 원문이 “열린 의무를 분리하고 성급한 완료를 거부하라”고 요구하는 기준은 그 도구 동작의 완료다. 반면 N6/N7의 원문은 실제 특정 장·보정·잔차·합성·경로를 구성하고 검증하라고 요구한다. 원문에 이미 정의된 구성 대신 일반 유한 예제나 범위 표기만 제출하여 같은 완료로 처리하지 않았다.

## 2. 원문과 보존된 역사 기록

원문 카탈로그는 [ORIGINAL_M3_M4_CRITERIA.json](ORIGINAL_M3_M4_CRITERIA.json)이다. 99쪽 PDF의 M3/M4 총 80개 중 P7/P8/Y5/Y6/Y7/N6/N7/N8 각 8개, 정확히 64개를 선택했다. M4 16개는 이번 집계에 포함하지 않는다. 카탈로그 SHA-256: `bfe0e57b127849a5413414c8e8340ed5592049082fd211d9172a2fce6f219156`.

모든 원문 행이 참조하는 PDF SHA-256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`다. 카탈로그의 `005314` 파일명, Gauge/Navier의 `061419` 파일명 및 P7 메타데이터의 이전 `070612` 파일명은 같은 SHA를 가리키는 이력상 별칭이다. 이번 검토에서 실제 첨부 `061419.pdf`와 `005314(3).pdf` 두 파일의 bytes를 다시 해시하여 같은 값을 확인했다. `070612` 별칭은 기존 메타데이터의 주장으로 보존하며 그 별도 파일을 새로 재취득했다고 하지 않는다.

| 원문 묶음 | checklist 쪽 | 카탈로그의 원문 filename |
|---|---:|---|
| P7 | 34 | `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` |
| P8 | 36 | `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` |
| Y5 | 46 | `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` |
| Y6 | 48 | `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` |
| Y7 | 50 | `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` |
| N6 | 62 | `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` |
| N7 | 64 | `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` |
| N8 | 66 | `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` |

아래 64개 항목의 제목·본문은 카탈로그에서 그대로 옮겼다. PDF 추출의 줄바꿈·띄어쓰기·줄끝 하이픈도 원문 블록에서 보존한다. 각 진행표와 원문 ID/title/text를 대조했으며, 공백을 무시한 기준 문구 불일치나 ID 누락·중복은 없었다. 수학 기호의 표현 개선을 이유로 원문 합격조건을 고치지 않았다.

기존 [M3_REVIEW_KO.md](M3_REVIEW_KO.md)는 P7 제외 56개 기준의 역사적 v91 보고서다. 현재 파일 SHA-256은 `c9b6644499bccb9162616c06a00174b167d884e0a11740251b98e23251fce79b`이며 이전 checkpoint `d5a7b4daaeb2bef26f638817956f13c582e69ab8`의 bytes와 동일하다. 이 보고서는 기존 파일을 편집하지 않고 새 64개 검토를 추가한다.

### 2.1 진행표 snapshot SHA

| 파일 | 이 snapshot의 SHA-256 | true / 전체 |
|---|---|---:|
| [P7_PROGRESS.json](P7_PROGRESS.json) | `e594d61b982342436200fe2ced619f7cf8130e12c8d60eecd5b5fc4f38542f9d` | 0 / 8 |
| [P8_PROGRESS.json](P8_PROGRESS.json) | `0274350087b9b35aa6b37c20ca70077f26ed8505e62aa7473d1f1c7cff8d1041` | 7 / 8 |
| [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json) | `234d06b5349202006334d3ab4e338b93799353c90e86d26a68999d99ac1cedcf` | 21 / 24 |
| [N6_PROGRESS.json](N6_PROGRESS.json) | `b2b8e2ec5d1f6d209a3e491e232630d52198883c32a5d52d268fee76424315b3` | 0 / 8 |
| [N7_PROGRESS.json](N7_PROGRESS.json) | `993c0056ab2b5be7d87c5d8dfbc2cb06e431d5ab776d060aef5fec7c4fd11f98` | 0 / 8 |
| [N8_PROGRESS.json](N8_PROGRESS.json) | `51773a7dbeb342ba99986e8d85785facbacc77d0b12db95f42c699484c688507` | 3 / 8 |

SHA는 파일의 동일성을 확인한다. 증거가 무엇을 계산·검증했는지는 해당 receipt의 input, source pin, command/log, 가정, model/cutoff와 결과 범위로 판단한다. 소스 파일의 존재나 JSON hash 일치만으로 그 소스를 새로 실행하거나 kernel에서 증명했다고 판정하지 않는다. §7의 증거 원장은 이 immutable snapshot의 실제 Git blob bytes에서 계산했다.

## 3. 이번 확장으로 실제 얻은 결과와 한계

### 3.1 P7: 현재 source의 실제 실행과 독립 경로

새 P7 frozen release는 13개 operation kind, 25개 실제 실행과 25개 별도 fresh replay MATCH를 기록한다. `sourceUnchanged=true`, source epoch `72564078d6fd9d19dc076eb3c4a6842108fad523898f786d0ec98c18b895b041`다. 이 증거는 local 실행이며 최종 GitHub CI나 현재 공개 API/UI 검증과 구분한다. [E114](p7/evidence/final-all64-20261012/attempt1/manifest.json)

지원 operation kind는 `p7.elliptic_analytic`, `p7.elliptic_arithmetic`, `p7.elliptic_complex`, `p7.elliptic_local`, `p7.euler_product`, `p7.explicit_formula`, `p7.modular_symbols`, `p7.operator_audit`, `p7.result_claim`, `p7.special_function`, `p7.taylor_remainder`, `p7.zeta_em`, `p7.zeta_zeros`다. 각 입력 domain과 예산을 지키는 실제 경로이며 임의 곡선·임의 높이·무한 operator의 완전한 해결을 뜻하지 않는다.

새 exact modular-symbol 채널은 pinned PARI 2.19.0으로 11a1/37a1을 실제 계산했다. whole Manin path/관계, lifted plus-new eigensymbol, joint Hecke kernel nullity 1 및 Sturm bound를 넘는 12개 q계수를 독립 Fraction 산술로 검사했다. 11a1의 정규화된 중심 경로 값 1과 37a1의 값 0은 정확한 비영/영의 증거다. 이 임의 유리수 정규화 값을 L/Ω나 Néron period 비율로 부르지 않는다. 10개 test·27개 음성 대조 및 두 모델의 fresh replay를 보존한다. [E130](p7/evidence/modular-symbols-20261012/receipt.json)

37a1에서 정확한 vanishing만으로는 analytic rank≥1이다. rank=1은 별도 rigorous first derivative ball이 0을 배제할 때만 얻는다. 산술 rank는 별도 유리점/height lower와 descent upper를 결합한다. Sha order와 universal BSD는 UNKNOWN/OPEN이며, opaque 연구 proposition binder를 Lean에서 묶은 결과는 새 modularity·RH·BSD 정리가 아니다.

P8-06의 새 mutation audit /2는 실제 유효한 descent upper certificate를 삭제하고 zero box를 변조했다. 6개 child 실행과 9개 test가 통과한 local 증거가 있다. CI artifact를 아직 수용하지 않았으므로 이 행은 false다. 여러 test 파일의 수는 중복 실행을 포함할 수 있어 단순 합계로 새 전체 test 수를 만들지 않는다. [E164](p8/evidence/p7-mutation-arithmetic-20261012-attempt1/report.json), [E163](p8/evidence/p7-mutation-arithmetic-20261012-attempt1/process.json)

### 3.2 Gauge: 독립 scale, 실제 chain, 같은 물리량에서의 비교

독립 Wilson-flow 기준은 SU(2)의 t₀²E(t₀)=0.1이며 target channel에서 scale을 역산하지 않는다. β=2.16/2.3/2.4의 별도 cold/hot scale chain 384개 configuration과, 7개 표시 channel 행 12,288개 configuration을 보존한다. 원래 8개 production attempt에는 미해결 coarse 첫 실행과 같은 prefix를 연장한 후속 실행이 포함된다. 이 둘을 독립 표본으로 이중 집계하지 않는다. 저장된 실제 archive는 `newExecution:false`이고 짧은 새 실험은 별도다. [E008](gauge/SCALE_STUDY_KO.md), [E025](gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz), [E021](gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json)

물리 비교 단위는 target와 독립인 √t₀다. 외부 fm/MeV anchor를 측정하거나 가져오지 않았다. 원래 target 1.25의 미달을 보존하고, pilot 후 고른 .9/1을 별도 새 chain으로 평가했다. target가 신뢰구간 안에 있다는 판단과 정확한 target 달성을 구분한다. β/a/L/T와 target/추정 질량/오차를 함께 공개하는 것이 원문 기준이며 모든 실험에서 좋은 통계나 성공 plateau를 강제로 만들지 않는다.

진공 제거는 명시한 full-Haar pure SU(2) 유한 Wilson 모형의 positivity-improving kernel 논증과 bounded 관측 벡터 w=(I−T̄)Oψ₀의 P₀w=0을 사용한다. 차분 상관은 C_D(t)=〈w,T̄^(t−1)w〉로 연결한다. finite-T 표본평균 자체를 정확한 진공 평균이라고 부르지 않고 열적 excited-to-excited 성분을 남긴다. 이 논증은 새 Lean receipt가 아니며 Float64로 표시한 로그/간극 수를 outward-certified bound로 승격하지 않는다. 양의 vacuum spectrum 가정에서만 gapglobal≤Echannel≤meff를 표시한다.

세 β의 a/√t₀ 감소 행을 L/√t₀=8,T/√t₀=16에 맞춘 실제 최대 편차는 2.002%(지정 허용치 8%)다. 같은 β와 reference에서 Ns6→8, Nt12→24를 별도 비교한다. a² fit은 `CONDITIONAL_FINITE_DATA_A2_FIT`일 때만 원래 data/window/assumption과 함께 표시한다. a/√t₀≈1.00–1.63인 유한 세 점에서 asymptotic scaling 영역이나 continuum limit를 증명하지 않는다.

다음 실제 한계를 공개 gate에서도 그대로 보여야 한다. β2.3 cold scale의 ESS 15.7138은 기준 16 미만이다. clover−plaquette t₀ 차이 0.21458/0.34583/0.40067은 크며 작은 flow step 차이로 상쇄되지 않는다. L/T paired difference bootstrap의 유효 98/102는 기준 103 미달이라 차이 구간은 null이다. 늦은 시간의 negative C, 불가능 acosh, 일부 GEVP/fit 실패를 삭제·abs·clip하지 않는다. continuum positive lower bound도 null/OPEN_CONTINUUM이다.

큰 통합 review를 gzip으로 무손실 보관한 포장은 새 수치 실행이 아니다. 압축 bytes SHA는 `f0faafb05fff3db0e3434b44fda6b5b0148c8bebcee8a57f627c58c2700b1117`, 복원 원문 SHA는 `ace91ec759cb7282f58829d048f580ed81a3af7c11abb7cc141266d5574bd556`이다. 포장 뒤 archive body SHA는 `af5c635913bef994965a308362baf5983945f380b06ef635eeb8eb9537294f30`이며 원래 개별 결과와 표본값은 그대로다. 이전 ready receipt를 최신 포장 receipt로 덮어쓰지 않았다. [E023](gauge/evidence/scale-expansion/lossless-review-packaging-attempt1.json)

새 view adapter는 실제 기록의 C00, 세 독립 t₀ flow, a²/t₀에 대한 m√t₀, 같은-a L 및 T의 다섯 패널을 만든다. 관측점·오차·systematics는 저장된 수치를 사용한다. 공개 UI 통과를 최종 수용할 때 source/result hash·패널 선택·warning 표시·export/fresh replay를 함께 확인해야 한다. [E182](web/gauge-study-view.mjs)

### 3.3 Navier: 실제 source 구성의 진전과 아직 없는 전 단계

새 원래 source 실행은 7개 heavy test를 실제 수행했고 모두 통과했다. 관찰된 시간은 897,813.082897 ms, progress sample 중 최대 RSS는 6,394,392,576 bytes, Node old-space 예산은 8,192 MiB였다. 최대 RSS는 OS 전체 peak 측정이라고 확대하지 않는다. 원래 source 의존 파일 108개와 command/raw log/정확한 graph hash를 보존한다. [E079](navier/evidence/source-current-20261012/source-current-execution.json)

선택한 원래 band/member의 full curl, 여섯 cylindrical covariance, 현재 P/J, A0를 유지한 초기 full auxiliary pressure, 두 원래 pulse의 C4/C5 variation 및 실제 source-derived signed target/update가 생겼다. H와 a를 다시 선택하지 않았고 ∂Z(Jz+cρP)의 전체 곱을 유지한다. 선택 member의 주항은 ηβ²Σ이며 전체 partition의 Σ 항등식은 아직 주장하지 않는다.

그 receipt는 `allBandsAndLabelsAssembled=false`, `initializedJ0=false`, `updatedFullAuxiliaryPressureConstructed=false`, `completeUpdatedPhysicalPDEJetCompared=false`, `allOrderGlobalClassBounds=false`, `finalLocalFieldConstructed=false`, `numericalSourceFieldEnclosureComputed=false`를 명시한다. 따라서 완전한 초기 상태→모든 보정→shrinking local sum→localized force→terminal jet/energy/blowup의 연결은 아직 완성되지 않았다. 이들은 단지 난제가 열려 있다는 선언이 아니라, 이 프로젝트에서 아직 생성·적용·계산하지 못한 구체 결과와 그에 필요한 proof obligation이다.

별도 periodic Galerkin branch의 Fourier, dealiasing, 시간 적분은 원문 N8-01/02/03의 수치 기준을 충족한 범위로 유지한다. 새 81점 관측은 physical/normalized view, streamline/pathline, velocity/angular velocity, whole-box/core energy를 실제 구분한다. 원래 source의 near-terminal field나 global force energy를 이 periodic 예제로 대신하지 않으므로 N8-04/05/08은 아직 실질 잔여다.

### 3.4 완료된 유한 Lean 범위

Gauge Y7의 legacy/exact finite 소스 재검사와 별도 Real Mathlib CI는 분리되어 있다. Real CI 38215697672의 8개 target·9개 가정 제거 쌍·20개 raw log·3,439개 import closure와 modelId/cutoff를 남기는 정확한 C⁴ fixture가 source에 묶였다. 양의 finite weighted spectral sum과 −log ratio 하한이 직접 연결되어 있지만 임의 편집 JSON의 새 consumer 인증이나 Wilson 전체 Hilbert 공간/continuum을 자동 증명하지 않는다. [E020](gauge/evidence/real-lean-release.json), [E019](gauge/evidence/real-lean-audit/audit.json)

브라우저의 45개 source SHA 일치 검사는 기록된 실제 kernel 근거의 적용 가능성을 확인하는 장치다. 새로운 kernel 실행과 다르다. 공개 transport에서 문자열이 바뀌면 unverified가 되었던 실제 실패를 수정했으며 검사를 약화시키지 않았다. 이후 proof source가 달라지면 동일 규칙을 다시 적용해야 한다.

## 4. 최종 검증 대기 14개 — 후속 갱신을 허용하는 정확한 목록

이 절은 **아직 수용되지 않은 최종 증거를 넣을 자리**다. local 실행/단위검사가 있다는 사실을 현재 CI/API/UI의 성공으로 복사하지 않는다. 공개 화면을 관찰하는 중간 진행 메시지만으로도 true를 만들지 않는다. 각 행은 본문 §6의 동일 ID와 연결된다.

| ID | 현재 boolean/status | 이미 있는 증거 범위 | 마지막으로 관찰·결속할 관문 |
|---|---|---|---|
| P7-01 | `false` / `PARTIAL` | 현재 source의 local 25회 실행/25 fresh replay; 해당 유한 증거. 공통 최종 combined unit/API gate 미수용. | 새 공개 local/normalization 결과에서 최소모형·bad factor·root number·L^S·영점/극점 변환 기록을 선택/내보내기하고 현재 API 실행·fresh replay를 확인한다. |
| P7-02 | `false` / `PARTIAL` | 현재 source의 local 25회 실행/25 fresh replay; 해당 유한 증거. 공통 최종 combined unit/API gate 미수용. | critical-strip continuation의 ball과 세 오차 구분, finite Euler domain 거부가 새 API/UI에서 유지되는지 확인한다. |
| P7-03 | `false` / `PARTIAL` | 현재 source의 local 25회 실행/25 fresh replay; 해당 유한 증거. 공통 최종 combined unit/API gate 미수용. | 현재 T20/T30의 strip count·Hardy 고립·endpoint·multiplicity와 제한된 RH_VERIFIED_TO_T 문구를 실제 UI/내보내기에서 확인한다. |
| P7-04 | `false` / `PARTIAL` | 현재 source의 local 25회 실행/25 fresh replay; 해당 유한 증거. 공통 최종 combined unit/API gate 미수용. | 실제 x=10.5 prime side, smoothed 규약·상수·tail·넓은 band가 표시되고 unsmoothed 진단이 별도로 남는지 확인한다. |
| P7-05 | `false` / `PARTIAL` | 현재 source의 local 25회 실행/25 fresh replay; 해당 유한 증거. 공통 최종 combined unit/API gate 미수용. | 사용자 operator/domain/assumption 등록, 실제 finite 비교와 반례 저장, 보정된 입력 replay와 global/RH 미승격을 공개 UI에서 확인한다. |
| P7-06 | `false` / `PARTIAL` | 현재 source의 local 25회 실행/25 fresh replay; 해당 유한 증거. 공통 최종 combined unit/API gate 미수용. | central parity/derivative와 새 modular-symbol 경로를 따로 실행·표시하고 37a1 symbol zero 단독이 exact rank 1로 승격되지 않는지 확인한다. |
| P7-07 | `false` / `PARTIAL` | 현재 source의 local 25회 실행/25 fresh replay; 해당 유한 증거. 공통 최종 combined unit/API gate 미수용. | 실제 descent lower/upper, singleton rank, saturation/period/Sha 상태와 외부 의존성이 새 API/UI 및 export에 보존되는지 확인한다. |
| P7-08 | `false` / `PARTIAL` | 현재 source의 local 25회 실행/25 fresh replay; 해당 유한 증거. 공통 최종 combined unit/API gate 미수용. | 네 타입의 실제 새 결과, 누락 inventory, finite-field/RH 범위 거부, 가정 export와 null/open refined 의무를 공개 UI에서 확인한다. |
| P8-06 | `false` / `PARTIAL` | 유효 certificate 기반 새 local /2 mutation: 6 child, 9 test. 새 CI artifact 미수용. | 현재 유효한 rank-upper certificate 삭제·zero-box 변조의 새 GitHub CI artifact를 byte 검증하고, 패키지 및 새 공개 replay에서 해당 실패와 downstream badge 취소를 확인한다. |
| Y5-05 | `false` / `IMPLEMENTED_PENDING_LIVE_UI` | 새 실제 scale/production 자료·독립 수치 검토·replay 및 view adapter. 새 study 공개 gate 미수용. | 새 공개 study에서 β/a/L/T, 독립 t₀, target/측정값/오차, 원래 실패/동일-prefix 연장, archive newExecution:false와 실제 새 chain 실행의 구별을 확인한다. |
| Y5-06 | `false` / `IMPLEMENTED_PENDING_LIVE_UI` | 새 실제 scale/production 자료·독립 수치 검토·replay 및 view adapter. 새 study 공개 gate 미수용. | 실제 negative C·불가능 acosh·fit 실패, bounded vacuum 차분과 finite-T/cosh/overlap 조건, 올바른 gap 부등식이 새 study 결과/선택에 표시되는지 확인한다. |
| Y5-08 | `false` / `IMPLEMENTED_PENDING_LIVE_UI` | 새 실제 scale/production 자료·독립 수치 검토·replay 및 view adapter. 새 study 공개 gate 미수용. | 실제 C00/독립 scale/a²/L/T 다섯 패널과 오차·matching·fit window/가정·ESS·격자화 차이·null 차이 구간/continuum 하한을 확인한다. |
| N8-06 | `false` / `PARTIAL` | 실제 finite flow/claim 구조와 trajectory/axis/energy/tamper 검사. 새 control 공개 gate 미수용. | 새 physical/normalized, streamline/pathline, velocity/angular velocity, core/global controls를 모두 실제 조작한다. selection/import/replay에서 고정 좌표·단위·색 범위·vector scale을 검사한다. |
| N8-07 | `false` / `PARTIAL` | 실제 finite flow/claim 구조와 trajectory/axis/energy/tamper 검사. 새 control 공개 gate 미수용. | 관측별 원문/정의·수치 test·analytic/Lean 링크와 부재 표기를 실제 공개 화면에서 확인한다. hash/claim 변조 거부와 interval/domain/가정 없이는 certified approximation을 주지 않는 것을 확인한다. |

### 4.1 최종 증거 입력 양식

| 필드 | 이 snapshot 값 | 후속 수용 조건 |
|---|---|---|
| 새 CI run / checkout commit / job 결론 | **미수용** | 실제 run URL/ID, checkout SHA, 원문 command·exit, artifact ID와 archive/file SHA, 적용 source epoch가 모두 일치 |
| 현재 API 실행 및 fresh replay | **미수용** | 실제 입력·operation·결과 hash, 실행 environment/source, 별도 새 replay의 결과 비교와 scope label을 보존 |
| 공개 UI version / source / case | **미수용** | 실제 게시 version, 번들/원본 source hash, 조작 case ID·결과·스크린샷/로그를 source/result와 연결 |
| 해당 criterion의 실패/변조 관문 | **미수용** | 그 원문이 요구하는 음성 입력이 적절한 단계에서 거부되고 downstream 권위가 취소되는지 확인 |
| 승격 ID와 이유 | **없음** | 위 14개 중 직접 충족된 ID만 나열하고 원문 문장·evidence hash와 1:1 매핑 |

P7/P8의 새 hosted backend 관문과 Gauge/flow의 browser-worker 관문은 실제 실행 위치를 다르게 기록한다. 수치 archive 열람은 새 chain 실행이라고 기록하지 않고, N6 heavy source summary 재생성은 전체 장의 새 재구성 실행이라고 기록하지 않는다. 오래된 kernel artifact는 그 artifact가 검증한 동일 proof source에만 적용한다.

## 5. 실질 잔여 19개를 해석하는 방법

N6 8개와 N7 8개는 원래 논문 구성의 현재 source를 끝까지 조립·계산·검증하는 연쇄 의무가 남는다. 선택 member와 부분 보정을 실제 실행했다는 진전은 인정하지만 전체 partition, 초기 j=0, 각 보정의 full pressure/residual, 공통-domain all-order 상수, shrinking sum과 국소화 뒤 terminal/energy/path를 아직 연결하지 못했다. N8-04/05/08도 그 전체 source에 대한 near-terminal 평가·독립 refinement·완전한 재현 자료가 필요하다.

아래 각 항목은 **구성·계산 의무**와 **증명·오차 의무**를 따로 기록한다. 전자는 실제 자료·함수·단계가 아직 없거나 적용되지 않은 문제이며, 후자는 그 결과가 원문 domain/가정/모든 차수/무한 tail에서 성립한다는 근거가 필요한 문제다. 모든 항목을 “미해결 수학 문제” 하나로 묶지도, 유한 sample 통과만으로 전역 의무가 해결되었다고 하지도 않는다.

새 UI·CI가 14개 대기 관문을 통과해도 이 19개는 자동으로 완료되지 않는다. N8-01/02/03의 periodic benchmark와 N6 source reconstruction, 내부 pulse C5와 terminal C∞, mean pressure와 full auxiliary pressure, 선택 ηβ²Σ와 global Σ, 숫자 τ 보존과 실제 near-terminal velocity enclosure를 각각 구분해야 한다.

## 6. 원문 64개별 판정·근거·잔여

각 항목의 원문 SHA는 같은 PDF의 SHA이며, 원문 본문 블록은 카탈로그 text를 그대로 보존한다. 증거 E번호는 §7의 파일·bytes·SHA에 대응한다. evidence 목록은 해당 진행표가 인용한 경로를 모두 포함하며 `p7/examples/`는 그 immutable commit의 실제 파일 목록으로 펼쳤다. 완료 항목의 “추가 합격조건 없음”은 명시된 범위 안에서의 뜻이고, 별도 연구 한계가 없다는 뜻이 아니다.

### P7 — 0/8 완료

#### P7-01 — 전역 정규화와 모든 국소 인자를 완성한다

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [P7_PROGRESS.json](P7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.34 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
ζ의 completed ξ와 E의 Λ_E=N_E^{s/2}(2 π)^{-s}Γ(s)L(E,s)를 각각 명세한다. minimum model/Tate reduction, root
number, bad factors의 certificate를 묶는다. 합격: good-only product는 L^S라고 표시한다. ζ↔ξ 또는 L↔ Λ의 영점·극
점·trivial zero 차이가 자동 변환 기록에 남는다.
```

**현재 구현·증거의 범위:** 지원하는 유리수 타원곡선에서 새 공식 PARI 2.19.0 실행으로 전역 최소모형과 Tate reduction을 구하고, 내보낸 좌표 변환·판별식 소인수·good/bad Euler 인자·도체·Tamagawa·root number와 유한 계수를 독립 정확 산술로 검사한다. ζ/ξ 및 L/Λ의 영점·극점·trivial-zero 차이와 good-only L^S 표기를 자동 기록한다. CAS 최소성·국소 가해성 알고리즘은 명시된 외부 계산 의존성이다.

**연결 증거:** [E102](p7/elliptic_arithmetic.py), [E103](p7/elliptic_complex.py), [E104](p7/euler_product.py), [E105](p7/evidence/arithmetic-20261012/unit-tests.json), [E106](p7/evidence/final-all64-20261012/attempt1/arithmetic-11a1.json.gz), [E107](p7/evidence/final-all64-20261012/attempt1/arithmetic-37a1.json.gz), [E111](p7/evidence/final-all64-20261012/attempt1/complex-additive-32.json.gz), [E112](p7/evidence/final-all64-20261012/attempt1/euler-finite.json.gz), [E114](p7/evidence/final-all64-20261012/attempt1/manifest.json), [E128](p7/evidence/final-all64-20261012/attempt1/zeta-2.json.gz), [E144](p7/normalization.py), [E147](p7/pari_backend.py), [E150](p7/tests/test_elliptic_arithmetic.py).

**남은 원문 합격 관문:** 새 공개 local/normalization 결과에서 최소모형·bad factor·root number·L^S·영점/극점 변환 기록을 선택/내보내기하고 현재 API 실행·fresh replay를 확인한다.
현재 source에 결속된 최종 combined unit/API 결과를 관찰·검증한 뒤, 해당 새 public UI 및 export/replay를 확인해야 한다. local 25/25 실행 성공만으로 이 false 값을 바꾸지 않는다.

**범위·연구 한계:** 최소성·local-solubility CAS 의존성의 새 Lean 형식화는 없다.

#### P7-02 — 해석적 연장 backend와 Euler-product 영역을 분리한다

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [P7_PROGRESS.json](P7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.34 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
유한 Euler product는 ζ에서 Re(s)>1, E good-factor product에서 Re(s)>3/2의 탐색으로 제한한다. critical strip 계산은
certified analytic continuation과 complex balls를 사용한다. 합격: s=1/2+it에서 finite Euler product를 ζ의 인증값으로
반환하면 실패한다. 반올림·series truncation·tail error를 각각 포함한 ball을 내보낸다.
```

**현재 구현·증거의 범위:** ζ Euler–Maclaurin의 유한 ball 산술, unit-cell 급수 잘림, 무한 구간 tail을 분리한다. 타원곡선 L의 복소 Mellin 연장도 유한 incomplete-gamma 평가와 계수 tail을 분리한다. 유한 Euler 탐색은 원문 Re(s)>1 또는 Re(s)>3/2 영역만 허용한다. FLINT 원시 특수함수 내부 enclosure와 상위 명시적 tail은 서로 다른 근거이며, 새 modularity 증명을 주장하지 않는다.

**연결 증거:** [E097](p7/COMPLEX_CONTINUATION_KO.md), [E103](p7/elliptic_complex.py), [E104](p7/euler_product.py), [E110](p7/evidence/final-all64-20261012/attempt1/complex-37a1.json.gz), [E111](p7/evidence/final-all64-20261012/attempt1/complex-additive-32.json.gz), [E112](p7/evidence/final-all64-20261012/attempt1/euler-finite.json.gz), [E114](p7/evidence/final-all64-20261012/attempt1/manifest.json), [E129](p7/evidence/final-all64-20261012/attempt1/zeta-em-critical.json.gz), [E131](p7/evidence/pari-runtime-20261012/receipt.json), [E144](p7/normalization.py), [E151](p7/tests/test_elliptic_complex.py), [E155](p7/tests/test_zeta_em.py), [E157](p7/zeta_em.py).

**남은 원문 합격 관문:** critical-strip continuation의 ball과 세 오차 구분, finite Euler domain 거부가 새 API/UI에서 유지되는지 확인한다.
현재 source에 결속된 최종 combined unit/API 결과를 관찰·검증한 뒤, 해당 새 public UI 및 export/replay를 확인해야 한다. local 25/25 실행 성공만으로 이 false 값을 바꾸지 않는다.

**범위·연구 한계:** 고급 continuation/modularity와 FLINT primitive enclosure의 외부 정리/산술 의존성을 그대로 유지한다.

#### P7-03 — 영점 고립·개수·중복도를 인증한다

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [P7_PROGRESS.json](P7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.34 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
N(T)는 0<Imρ≤T인 strip 전체 영점의 중복도 포함 개수로 정의한다. Hardy Z의 실수 영점 고립으로 Re ρ=1/2를 인증하고 독
립 zero counter와 비교한다. T=20,30의 endpoint exclusion도 확인한다. 합격: N(20)=1, N(30)=3을 count certificate
로 재확인한다. 임계선에서 찾은 영점 수와 전체 strip의 count가 다르면 RH_VERIFIED_TO_T를 주지 않는다.
```

**현재 구현·증거의 범위:** 전체 strip의 argument-principle 개수 계산과 임계선 Hardy Z 고립을 서로 다른 알고리즘으로 실행한다. T=20,30에서 각각 N(T)=1,3, 경계 영점 배제와 중복도 포함 개수 포화를 확인하고 새 replay가 일치했다. 두 알고리즘이 공통 FLINT 산술 backend를 쓴다는 한계와 유한 높이 범위를 남긴다.

**연결 증거:** [E004](evidence/p7-release-20261011/attempt3/zeros-to-20.json), [E005](evidence/p7-release-20261011/attempt3/zeros-to-30.json), [E105](p7/evidence/arithmetic-20261012/unit-tests.json), [E114](p7/evidence/final-all64-20261012/attempt1/manifest.json), [E126](p7/evidence/final-all64-20261012/attempt1/zeros-20.json.gz), [E127](p7/evidence/final-all64-20261012/attempt1/zeros-30.json.gz), [E154](p7/tests/test_result_claims.py), [E156](p7/zero_certificate.py).

**남은 원문 합격 관문:** 현재 T20/T30의 strip count·Hardy 고립·endpoint·multiplicity와 제한된 RH_VERIFIED_TO_T 문구를 실제 UI/내보내기에서 확인한다.
현재 source에 결속된 최종 combined unit/API 결과를 관찰·검증한 뒤, 해당 새 public UI 및 export/replay를 확인해야 한다. local 25/25 실행 성공만으로 이 false 값을 바꾸지 않는다.

**범위·연구 한계:** T=20,30 범위를 넘어선 임의 높이나 무한 RH 및 별도 독립 산술 구현을 주장하지 않는다.

#### P7-04 — 명시적 공식의 유한 잘림 오차를 계산한다

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [P7_PROGRESS.json](P7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.34 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
우선 x를 half-integer로 제한한 ψ(x)와 symmetric zero sum을 제공한다. 숫자 오차 밴드는 선택한 truncated/smoothed
formula의 명시 상수·가정·tail bound가 있을 때만 인증한다. 합격: x=10.5의 prime side=log2520. ψ 또는 ψ₀ endpoint
convention을 기록한다. 이름만 있는 O(·)나 수치 residual을 rigorous tail bound로 쓰면 실패한다.
```

**현재 구현·증거의 범위:** half-integer ψ와 절대수렴하는 적분형 explicit formula의 unit secant를 사용한다. x=10.5의 독립 prime side는 log(2520)이며 ψ/ψ₀ endpoint 규약을 기록한다. 실제 대칭 영점합·nontrivial/trivial tail·ball 오차를 분리한다. T=30의 인증 밴드는 넓고, unsmoothed 진단에 smoothed tail을 전용하지 않는다.

**연결 증거:** [E007](evidence/resume-20261012/attempt2/explicit-psi.json.gz), [E113](p7/evidence/final-all64-20261012/attempt1/explicit-psi.json.gz), [E114](p7/evidence/final-all64-20261012/attempt1/manifest.json), [E141](p7/explicit_formula.py).

**남은 원문 합격 관문:** 실제 x=10.5 prime side, smoothed 규약·상수·tail·넓은 band가 표시되고 unsmoothed 진단이 별도로 남는지 확인한다.
현재 source에 결속된 최종 combined unit/API 결과를 관찰·검증한 뒤, 해당 새 public UI 및 export/replay를 확인해야 한다. local 25/25 실행 성공만으로 이 false 값을 바꾸지 않는다.

**범위·연구 한계:** 유한 T=30에서 band가 넓다. 좁은 오차나 임의 높이 확장을 주장하지 않는다.

#### P7-05 — global operator 후보를 반증 가능한 입력으로 만든다

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [P7_PROGRESS.json](P7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.34 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
사용자가 operator/domain, spectrum-zero 대응, regularized determinant, trace formula, duality/positivity 가설을 등
록하게 한다. truncation별 spectrum·극점·중복도·정규화·functional-equation residual을 비교한다. 합격: 누락 영점, 잘못
된 trivial-zero factor, determinant의 상수/선형 exponential normalization 차이, multiplicity 불일치는 counterexample
후보로 저장한다. 유한 통과가 전체 operator의 존재나 RH 증명이 되지 않는다.
```

**현재 구현·증거의 범위:** 사용자가 operator/domain, zero-spectrum 대응, determinant, trace, duality/positivity 가설과 고유 ID를 등록할 수 있다. 2–4개 유리수 행렬 cutoff의 정확 spectrum·pole·multiplicity·constant/linear exponential 정규화를 비교한다. 원문이 요구한 누락·변조를 포함한 10개 실제 음성 사례를 보존한다. 유한 행렬의 통과로 고전 ζ의 무한 operator 존재나 RH를 승인하지 않는다.

**연결 증거:** [E099](p7/OPERATOR_REGISTRY_KO.md), [E105](p7/evidence/arithmetic-20261012/unit-tests.json), [E114](p7/evidence/final-all64-20261012/attempt1/manifest.json), [E117](p7/evidence/final-all64-20261012/attempt1/operator-reference.json.gz), [E118](p7/evidence/final-all64-20261012/attempt1/operator-registered.json.gz), [E135](p7/examples/registered-operator.json), [E145](p7/operator_candidates.py), [E146](p7/operator_registry.py), [E153](p7/tests/test_operator_candidates.py).

**남은 원문 합격 관문:** 사용자 operator/domain/assumption 등록, 실제 finite 비교와 반례 저장, 보정된 입력 replay와 global/RH 미승격을 공개 UI에서 확인한다.
현재 source에 결속된 최종 combined unit/API 결과를 관찰·검증한 뒤, 해당 새 public UI 및 export/replay를 확인해야 한다. local 25/25 실행 성공만으로 이 false 값을 바꾸지 않는다.

**범위·연구 한계:** 지원하는 유리수 finite matrix cutoff의 비교 도구다. classical ζ의 실제 global operator 존재 정리가 아니다.

#### P7-06 — analytic rank를 증명 범위별로 계산한다

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [P7_PROGRESS.json](P7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.34 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
root-number 대칭으로 강제되는 vanishing과 exact modular-symbol vanishing, 도함수의 rigorous nonzero ball을 구분
한다. completed Λ의 Taylor parity를 사용한다. 합격: w=−1이면 Λ(1)=0의 정확한 이유를 기록하고 0∉ Λ′(1)의 인증구간
이 있어야 rank=1. 0을 포함하는 작은 interval은 vanishing 증명이 아니다.
```

**현재 구현·증거의 범위:** 37a1에서 root-number parity가 주는 정확한 Λ(1)=0과 0을 배제하는 rigorous Λ′(1) 구간을 결합한 analytic rank 1, 11a1의 중심값 nonzero에 의한 rank 0을 구별한다. 별도 실제 modular-symbol 경로는 11a1/37a1의 정확한 중심 경로 비영/영을 내보낸다. 중앙 parity/도함수 생산자의 modularSymbolsExecuted=false는 그대로이고, 37a1의 symbol 영만으로는 rank≥1만 결론낸다.

**연결 증거:** [E006](evidence/resume-20261012/attempt2/central-37a1.json.gz), [E098](p7/MODULAR_SYMBOLS_KO.md), [E101](p7/elliptic_analytic.py), [E105](p7/evidence/arithmetic-20261012/unit-tests.json), [E108](p7/evidence/final-all64-20261012/attempt1/central-11a1.json.gz), [E109](p7/evidence/final-all64-20261012/attempt1/central-37a1.json.gz), [E114](p7/evidence/final-all64-20261012/attempt1/manifest.json), [E115](p7/evidence/final-all64-20261012/attempt1/modular-11a1.json.gz), [E116](p7/evidence/final-all64-20261012/attempt1/modular-37a1.json.gz), [E130](p7/evidence/modular-symbols-20261012/receipt.json), [E143](p7/modular_symbols.py), [E149](p7/result_claims.py), [E152](p7/tests/test_modular_symbols.py), [E154](p7/tests/test_result_claims.py).

**남은 원문 합격 관문:** central parity/derivative와 새 modular-symbol 경로를 따로 실행·표시하고 37a1 symbol zero 단독이 exact rank 1로 승격되지 않는지 확인한다.
현재 source에 결속된 최종 combined unit/API 결과를 관찰·검증한 뒤, 해당 새 public UI 및 export/replay를 확인해야 한다. local 25/25 실행 성공만으로 이 false 값을 바꾸지 않는다.

**범위·연구 한계:** 일반 higher analytic rank와 새 Lean modularity/continuation 정리는 제공하지 않는다. 정확한 symbol 값의 정규화는 Néron period 정규화가 아니다.

#### P7-07 — arithmetic rank와 leading BSD data를 독립 인증한다

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [P7_PROGRESS.json](P7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.34 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
독 립 유 리 점 ·height/ regulator 로 lower bound, descent/ Selmer certificate 로 upper bound 를 얻 는 다. tor-
sion·saturation·Tamagawa·period·Sha 의 known/ conditional/ unknown 을 각 각 저 장 한 다. 합 격: rank interval
[r_min,r_max]가 한 점일 때만 해당 곡선 rank 확정. Sage L_ratio() 등의 숨은 Manin-constant 가정이 충족되지 않으면 조
건부로 표시한다.
```

**현재 구현·증거의 범위:** 독립 유리점·명시적 canonical-height bound·양의 Gram 행렬로 lower bound를, 새 pinned PARI 2-descent/Cassels 계산과 정확한 cover-map 항등식 검사로 upper bound를 얻는다. 실제 11a1 [0,0], 37a1 [1,1]을 포함한 지원 예에서만 singleton rank를 확정한다. torsion·rank-one saturation·regulator·전체 실수 주기를 분리하고 Sha는 UNKNOWN으로 남긴다. rank database·analytic rank·숨은 Manin 상수에서 산술 rank를 추론하지 않는다.

**연결 증거:** [E096](p7/ARITHMETIC_CERTIFICATES_KO.md), [E102](p7/elliptic_arithmetic.py), [E105](p7/evidence/arithmetic-20261012/unit-tests.json), [E106](p7/evidence/final-all64-20261012/attempt1/arithmetic-11a1.json.gz), [E107](p7/evidence/final-all64-20261012/attempt1/arithmetic-37a1.json.gz), [E114](p7/evidence/final-all64-20261012/attempt1/manifest.json), [E131](p7/evidence/pari-runtime-20261012/receipt.json), [E142](p7/height_certificate.py), [E147](p7/pari_backend.py), [E148](p7/period_certificate.py), [E150](p7/tests/test_elliptic_arithmetic.py).

**남은 원문 합격 관문:** 실제 descent lower/upper, singleton rank, saturation/period/Sha 상태와 외부 의존성이 새 API/UI 및 export에 보존되는지 확인한다.
현재 source에 결속된 최종 combined unit/API 결과를 관찰·검증한 뒤, 해당 새 public UI 및 export/replay를 확인해야 한다. local 25/25 실행 성공만으로 이 false 값을 바꾸지 않는다.

**범위·연구 한계:** Selmer local-solubility/basis completeness와 CAS Tate는 외부 의존성이다. Sha order, universal BSD, arbitrary-rank saturated basis는 얻지 않는다.

#### P7-08 — RH·BSD 연구 결과를 제한된 범위로 내보낸다

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [P7_PROGRESS.json](P7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.34 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
finite-height zero certificate, 특정 curve의 rank equality, refined leading-term 검증, universal conjecture를 별도 결
과 타입으로 제공한다. coefficient/prime/zero completeness의 빠진 항을 자동 목록화한다. 합격: 한 E에서 두 rank가 같
다고 universal BSD를 표시하지 않는다. finite-field RH theorem을 classical RH axiom으로 복사하는 요청은 거부한다. 연
구가설은 Lean 가정 목록과 함께 내보낸다.
```

**현재 구현·증거의 범위:** 유한 높이 영점, 특정 곡선 rank equality, refined leading term, universal 연구를 네 결과 타입으로 분리하고 계수·소수·영점 inventory의 누락/중복을 자동 나열한다. 한 곡선에서 universal 결론으로의 승격과 finite-field RH 공리 복사를 거부한다. Lean export는 명시적 Prop/proof binder의 실제 컴파일과 가정 제거 실패를 갖지만 자연어 연구가설의 수학적 의미 번역은 수행하지 않았다. refined 예의 Sha 의무도 열린 상태다.

**연결 증거:** [E100](p7/RESULT_CLAIMS_KO.md), [E105](p7/evidence/arithmetic-20261012/unit-tests.json), [E114](p7/evidence/final-all64-20261012/attempt1/manifest.json), [E119](p7/evidence/final-all64-20261012/attempt1/typed-finite-20.json.gz), [E120](p7/evidence/final-all64-20261012/attempt1/typed-finite-field-copy.json.gz), [E121](p7/evidence/final-all64-20261012/attempt1/typed-omitted-coefficient-prime.json.gz), [E122](p7/evidence/final-all64-20261012/attempt1/typed-omitted-zero.json.gz), [E123](p7/evidence/final-all64-20261012/attempt1/typed-rank-37a1.json.gz), [E124](p7/evidence/final-all64-20261012/attempt1/typed-refined-37a1.json.gz), [E125](p7/evidence/final-all64-20261012/attempt1/typed-universal-open.json.gz), [E132](p7/evidence/research-export-20261012/audit.json), [E133](p7/examples/finite-zero-20.json), [E134](p7/examples/refined-37a1-conditional.json), [E135](p7/examples/registered-operator.json), [E136](p7/examples/reject-finite-field-rh-copy.json), [E137](p7/examples/reject-omitted-coefficient-and-prime.json), [E138](p7/examples/reject-omitted-zero.json), [E139](p7/examples/specific-rank-37a1.json), [E140](p7/examples/universal-bsd-research.json), [E149](p7/result_claims.py), [E154](p7/tests/test_result_claims.py).

**남은 원문 합격 관문:** 네 타입의 실제 새 결과, 누락 inventory, finite-field/RH 범위 거부, 가정 export와 null/open refined 의무를 공개 UI에서 확인한다.
현재 source에 결속된 최종 combined unit/API 결과를 관찰·검증한 뒤, 해당 새 public UI 및 export/replay를 확인해야 한다. local 25/25 실행 성공만으로 이 false 값을 바꾸지 않는다.

**범위·연구 한계:** Lean binder conjunction은 opaque 가정을 묶는다. operator/trace/RH 의미를 정의·증명하는 bridge는 별도이고 refined Sha 정보는 열린 의존성이다.

### P8 — 7/8 완료

#### P8-01 — 객체 정체성과 증거 등급을 직교화한다

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [P8_PROGRESS.json](P8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.36 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
CW_TOY, DERIVED_MODEL, PRISMATIC_VIA_COMPARISON, NATIVE_PRISMATIC을 object kind로 둔다. exact/
ball/approximate와 Lean-checked/external-theorem/hypothesis를 별도로 관리한다. 합격: PRISMATIC_VIA_COMP
ARISON이어도 Lean dependency가 외부면 FORMAL_COMPLETE가 아니다. 숫자 grade 값을 크게 바꾸어 theorem 상태
로 승격시키는 schema fixture가 실패한다.
```

**현재 구현·증거의 범위:** object kind, exact/ball/approximate, Lean/external-theorem/hypothesis 축을 독립 관리한다. 숫자 grade나 직렬화한 proof 권위만 바꾸어 theorem 상태를 얻는 fixture를 거부한다.

**연결 증거:** [E167](p8/evidence/p8-local-acceptance-20261012.json), [E175](tests/p8-contracts.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### P8-02 — 3D 구조의 좌표 계약을 고정한다

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [P8_PROGRESS.json](P8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.36 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
degree-basis-valuation, Hodge/Newton polygons, prime-degree-Frobenius weight, refinement tower를 각 view로
제공한다. 클릭하면 chain basis·matrix column·map·source theorem을 보이게 한다. 합격: view matrix·camera·LOD 변
경은 수학 결과를 바꾸지 않는다. 3D projection을 원래 공간과의 동형·차원 축소 증명으로 저장할 수 없다.
```

**현재 구현·증거의 범위:** 네 실제 M2 구조 view를 source-bound Canvas2D fallback과 함께 제공했다. 공개 v87 선택은 원래 basis·matrix column·map·source theorem, Newton slope·Frobenius 값·유한 refinement로 연결되었다. camera/LOD와 route 복귀가 수학 기록을 바꾸지 않는 실제 UI/renderer 검사가 있다. 투영 그림은 동형이나 차원 축소 증명이 아니다.

**연결 증거:** [E003](evidence/live-ui/p8-refinement-v87.jpg), [E166](p8/evidence/p8-live-v87-20261012.json), [E168](p8/evidence/p8-renderer-local-20261012.json), [E177](tests/p8-visual-models.test.mjs), [E178](tests/p8-visualization.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### P8-03 — 비교 diagram의 조건을 클릭해서 검사한다

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [P8_PROGRESS.json](P8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.36 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
노드는 계수환과 base를, 화살표는 tensor/twist/completion/inversion/fixed-point 또는 quasi-isomorphism을 명세한
다. 잘못된 base-change 순서는 composability 검사로 막는다. 합격: bounded/smooth/proper/perfect 등 각 edge의 필
요한 가정이 표시된다. 조건을 제거한 replay에서는 edge가 유효하지 않다는 이유를 반환한다.
```

**현재 구현·증거의 범위:** 실제 M2 비교 route의 계수환·base·화살표 연산과 필요한 가정을 보존한다. 순서를 바꾼 base change, 가정 제거, 재해시한 diagram 변조가 정확한 이유와 함께 거부된다.

**연결 증거:** [E167](p8/evidence/p8-local-acceptance-20261012.json), [E175](tests/p8-contracts.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### P8-04 — Lean은 작은 인증 정리부터 쌓는다

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [P8_PROGRESS.json](P8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.36 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
정수 d², unit contraction, chain equivalence, point counts, trace recurrence, bounded residue reconstruction, finite
Euler identity를 우선 구현 후보로 둔다. 고급 비교정리의 현재 라이브러리 범위를 별도 조사한다. 합격: 각 후보에는
theorem statement·입력 타입·핵심 lemma·certificate 소비 방식·추가 axiom이 명시된다. 컴파일되지 않은 코드를 형식화
완료라고 표시하지 않는다.
```

**현재 구현·증거의 범위:** 원문 일곱 후보 범주마다 statement·입력 타입·핵심 lemma·consumer·추가 axiom 정책을 기록한다. exact finite F5 입력의 12개 compiled target과 8개 semantic negative control이 기록되어 있다. 전용 chain-equivalence consumer는 미컴파일 후보로 남는다. 원문은 후보 목록과 정확한 증거 범위 표시를 요구하므로 이 부분을 형식화 완료로 표시하지 않는다.

**연결 증거:** [E161](p8/evidence/lean-release-provenance.json), [E162](p8/evidence/lean-release.json), [E171](p8/theorem-backlog.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### P8-05 — 조건부 corollary의 의존성을 숨기지 않는다

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [P8_PROGRESS.json](P8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.36 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
새 operator/trace/duality 가정은 고유 ID와 정확한 수학 명제를 갖는다. theorem의 실제 의존 axiom을 출력하고 그 axiom
을 지운 상태의 재검증을 지원한다. 합격: Lean #print axioms와 입력 assumption ledger가 일치한다. target conjecture
자체를 가정하고 얻은 corollary는 CONDITIONAL_ON_TARGET으로 명확히 분류한다.
```

**현재 구현·증거의 범위:** 실제 공식 Lean CI 38213076249가 conditional source와 fresh import를 컴파일하고 assumedTarget 의존성을 출력했으며, 해당 axiom을 삭제한 source는 실패했다. 공개 v87은 고유 ID·literal proposition·실제 axiom 목록과 실패를 RECORDED_CI_SOURCE_MATCH / CONDITIONAL_ON_TARGET으로 표시했다. 브라우저의 표시를 새 kernel 실행으로 부르지 않는다.

**연결 증거:** [E158](p8/evidence/conditional-lean-release.json), [E159](p8/evidence/conditional-local-20261012/receipt.json), [E160](p8/evidence/lean-attempt7-38213076249.zip), [E161](p8/evidence/lean-release-provenance.json), [E166](p8/evidence/p8-live-v87-20261012.json), [E173](p8/tools/test_conditional_audit.py).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### P8-06 — 반증용 mutation과 재현 bundle을 만든다

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [P8_PROGRESS.json](P8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.36 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
bad prime 하나, Frobenius coefficient 하나, truncation bound 하나, zero box 하나, rank upper certificate 하나를 제
거·변조하여 관문을 다시 실행한다. 합격: 변조된 입력은 해당 단계에서 실패하고 후속 theorem badge가 취소된다. session
저장은 입력 해시·정밀도·비교 근거를 보존하며 재계산 결과와 일치한다.
```

**현재 구현·증거의 범위:** 기존 bad-prime·Frobenius·truncation·comparison 변조에 더해 실제 유효한 산술 descent upper certificate를 삭제하는 새 audit /2를 실행했다. zero-box 변조와 함께 6개 child 실행·9개 test가 통과했다. 이전 /1 receipt는 역사 기록으로 남고, 새 CI artifact 포장과 공개 검증은 대기 중이다.

**연결 증거:** [E105](p7/evidence/arithmetic-20261012/unit-tests.json), [E163](p8/evidence/p7-mutation-arithmetic-20261012-attempt1/process.json), [E164](p8/evidence/p7-mutation-arithmetic-20261012-attempt1/report.json), [E165](p8/evidence/p7-mutation-release.json), [E167](p8/evidence/p8-local-acceptance-20261012.json), [E172](p8/tools/audit_p7_mutations.py), [E176](tests/p8-mutation-audit.test.mjs), [E179](tests/test_p8_p7_mutations.py).

**남은 원문 합격 관문:** 현재 유효한 rank-upper certificate 삭제·zero-box 변조의 새 GitHub CI artifact를 byte 검증하고, 패키지 및 새 공개 replay에서 해당 실패와 downstream badge 취소를 확인한다.

#### P8-07 — 새 연구를 위한 구체적인 탐색 도구를 제공한다

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [P8_PROGRESS.json](P8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.36 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
global operator 후보의 finite compression, determinant normalization quotient, trace moment matching, func-
tional equation·duality consistency, zero multiplicity coverage를 자동 비교한다. 반례는 재현 가능한 최소 입력으로 줄
인다. 합격: 후보 A와 B가 같은 그림을 내어도 다른 characteristic polynomial·trace·rank이면 구별된다. 미증명 bridge는
각각 RESEARCH OPEN이며 실패/통과한 유한 테스트를 나란히 표시한다.
```

**현재 구현·증거의 범위:** 유리수 finite compression에서 characteristic polynomial·trace·rank·determinant 정규화 몫·reflection/duality·multiplicity를 비교한다. 같은 그림을 가진 서로 다른 후보도 구별하며, 명시한 bounded principal compression 범위에서 실패 predicate를 보존하는 반례 축소를 실행한다. 미증명 무한 bridge는 OPEN이다.

**연결 증거:** [E167](p8/evidence/p8-local-acceptance-20261012.json), [E174](tests/p8-candidate-search.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### P8-08 — 마일스톤 review packet으로 승인 기준을 고정한다

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [P8_PROGRESS.json](P8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.36 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
P1-P3 기본 계산, P4 실제 zeta 연결, P5-P6 고급 base, P7 분석 인증, P8 통합을 각각 독립 review packet으로 작성한다.
지원범위·fixture 결과·미완료 증명·새 연구 질문을 담는다. 합격: 출시 준비와 수학적 난제 해결을 다른 체크박스로 둔다. 이
번 산출물은 설계도이며 구현·컴파일·배포가 완료되었다는 상태를 생성하지 않는다.
```

**현재 구현·증거의 범위:** P1–P3/P4/P5–P6/P7/P8의 다섯 review packet이 지원 입력·현재 원문 기준·역사적 fixture·열린 증명과 연구 질문을 각각 보관한다. release review와 난제 해결 승인을 분리하고, P7 포함으로 확장된 현재 요청에서도 옛 실행을 새 실행으로 바꾸어 표시하지 않는다.

**연결 증거:** [E167](p8/evidence/p8-local-acceptance-20261012.json), [E169](p8/review-fixture-evidence.json), [E170](p8/review-packets.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

### Y5 — 5/8 완료

#### Y5-01 — Δ 모드와 변경 효과 선언

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.46 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
declared lower bound / units-rescaling / explicit effective model / empirical ensemble estimate의 4모드를 둔다. 합
격: 가정 모드에서는 A와 샘플 hash가 유지되고 axiom revision만 바뀐다. Δ≤0·단위 없음·다른 모드 자료 혼합은 거부한다.
```

**현재 구현·증거의 범위:** 네 Δ 모드의 효과를 구분하고, declared lower bound 변경 시 A/F·sample·original hash는 유지하면서 axiom revision만 바뀌는 것을 실행 검사했다. Δ≤0, 누락 단위, 모드 자료 혼합을 거부한다.

**연결 증거:** [E035](gauge/field-family.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y5-02 — 실제로 변하는 유효 4D 장족

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.46 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
자연단위에서 ℓ Δ=1/Δ, ρΔ=κℓΔ를 모델 규칙으로 지정한다. A Δ=ιA_BPST(ρΔ)+εℓΔ⁻¹Σcφ((x−x₀)/ℓΔ)Ta를 생성한다. 합
격: Δ₁≠Δ₂이면 고정 관측 좌표의 A/F·길이 척도·투영이 규칙대로 변한다. ε≠0의 장은 off-shell일 수 있으며 ρΔ=κ/Δ는 양자
YM 정리가 아니다.
```

**현재 구현·증거의 범위:** 기존 실제 행렬 Lie 기저에서 BPST와 전 기저 perturbation을 계산한다. 고정 4D 좌표에서 Δ에 따라 A/F·길이·밀도가 실제로 바뀐다. ε≠0의 off-shell 가능성과 ρ=κ/Δ가 모델 규칙이라는 의미를 보존한다.

**연결 증거:** [E035](gauge/field-family.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y5-03 — 명시적인 유효 스펙트럼 연결

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.46 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Ej(Δ)=Δ+εj, εj≥0 및 wj≥0의 유한 모형으로 C Δ(t)=Σwj exp( −Ej t)를 만든다. ε₀=0,w₀>0이면 이 모형의 최저 에너지는
Δ다. 합격: CΔ(t)≤exp(−Δt)Σwj를 정확한 가정 아래 검증한다. Y5-02 장과 이 스펙트럼의 연결은 model assumption ID를
가져야 한다.
```

**현재 구현·증거의 범위:** 비음수 weight/excess를 가진 유한 지수합과 양의 envelope를 계산하고 장↔스펙트럼 연결의 assumption ID를 보존한다. 일반 Real 정리의 실제 kernel 근거는 별도 Y7-03 receipt에 결속한다.

**연결 증거:** [E048](gauge/spectral.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y5-04 — 단위 변환과 실제 dilation 구별

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.46 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Δphysical=(ℏc/at)(atΔ)의 단위를 고정한다. A λ(x)=λA(λx)의 고전 scaling과 단순 표시 단위 변경을 구별한다. 합격: 4D 고
전 작용의 scaling 불변과 ρ→ρ/λ를 확인한다. quantum gap scaling은 H λ=λUHU⁻¹ 등 별도 가정 없이는 유도하지 않는다.
```

**현재 구현·증거의 범위:** 실제 dilation의 밀도×16·marginal×8·BPST 고전 작용 불변을 확인하고, 동일 물리장의 표시 단위 변환을 별도로 처리한다. 독립 scale 입력에 대한 질량 환산은 명시한 단위를 사용하며 별도 Hamiltonian 동치 가정 없이 quantum gap scaling을 유도하지 않는다.

**연결 증거:** [E035](gauge/field-family.mjs), [E048](gauge/spectral.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y5-05 — Δ 타깃에 대한 양자 격자 앙상블족

**판정:** 최종 검증 대기 · `status=IMPLEMENTED_PENDING_LIVE_UI` · `originalCriterionComplete=false` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.46 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
PΔ(U)∝exp[−Sβ(Δ),G(U)]의 생성 규칙을 지정한다. β·a·L·T를 바꾸는 calibration table와 독립 scale-setting으로 타깃을
찾는다. 합격: 모든 Δ 결과는 실제 새 chain 또는 검증된 재가중 경로에 연결된다. 타깃 Δ와 추정 mchannel±오차를 나란히
표시하고 동일성을 미리 강제하지 않는다.
```

**현재 구현·증거의 범위:** 전체 연속 SU(2) Wilson heatbath·overrelaxation과 target/channel과 독립인 표준 t₀²E(t₀)=0.1 scale chain을 실제 실행했다. 세 β의 β/a/L/T calibration, 표시 7행의 channel configuration 12,288개와 독립 scale 384개를 보존한다. pilot 후 고른 Δ=.9/1의 별도 validation chain에서 m√t₀±오차를 나란히 표시하며 target 1.25 미달과 최초 coarse 실패를 유지한다. 짧은 새 실행과 8개 실제 production attempt의 저장 archive를 구분한다.

**연결 증거:** [E008](gauge/SCALE_STUDY_KO.md), [E021](gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json), [E022](gauge/evidence/scale-expansion/live-scale-replay-attempt1.json), [E024](gauge/evidence/scale-expansion/matched-public-example-attempt2.json), [E025](gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz), [E034](gauge/experiments/verify-study-numerics.py), [E047](gauge/scale-study.mjs), [E049](gauge/study-record.mjs), [E051](gauge/su2-kernel.mjs).

**남은 원문 합격 관문:** 새 공개 study에서 β/a/L/T, 독립 t₀, target/측정값/오차, 원래 실패/동일-prefix 연장, archive newExecution:false와 실제 새 chain 실행의 구별을 확인한다.

**범위·연구 한계:**

- 실측 앙상블은 full-Haar pure SU(2) 유한 Wilson 모형이다. 다른 G로 확대하거나 외부 fm/MeV anchor를 사용했다고 주장하지 않는다.
- 기준 단위 √t₀는 target와 독립이지만 통계 구간은 stationarity와 bootstrap 모형에 조건부다. β2.3 scale cold ESS15.7138<16 상태를 유지한다.
- 목표 .9/1은 pilot 후 고르고 별도 새 chain으로 평가했다. 구간에 들어가는 것과 정확한 목표 달성은 다르다.

#### Y5-06 — 상관함수와 유효질량 추정

**판정:** 최종 검증 대기 · `status=IMPLEMENTED_PENDING_LIVE_UI` · `originalCriterionComplete=false` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.46 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
전체 진공 공간을 제거한 gauge-invariant 관측 벡터의 C(t)를 측정한다. 유일한 진공이면 평균 제거를 사용하며, 주기 시간
에는 finite-T/cosh와 operator channel을 명시한다. 합격: C(t)≤0 또는 cosh 역함수의 불가능 입력을 abs/clip으로 숨기지
않는다. 양의 스펙트럼 가정에서 gapglobal≤Echannel≤meff 방향을 표시한다.
```

**현재 구현·증거의 범위:** time-local gauge-invariant APE 3채널의 raw/connected C, periodic cosh, GEVP, block bootstrap을 실제 표본에서 계산했다. 명시한 유한 pure-gauge full-Haar SU(2) kernel의 진공 유일성 논증과 bounded w=(I−T̄)Oψ₀, P₀w=0, C_D(t)=〈w,T̄^(t−1)w〉를 분리한다. finite-T 표본 평균은 정확한 진공 평균이 아니고 비영 열적 excited-to-excited 전이는 남는다. 음의 C·불가능 acosh·실패 fit을 보존하며 양의 vacuum spectral 조건에서만 gapglobal≤Echannel≤meff를 적용한다.

**연결 증거:** [E008](gauge/SCALE_STUDY_KO.md), [E021](gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json), [E025](gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz), [E034](gauge/experiments/verify-study-numerics.py), [E046](gauge/scale-analysis.mjs), [E049](gauge/study-record.mjs), [E054](gauge/tests/scale-analysis.test.mjs), [E055](gauge/tests/su2-study-kernel.test.mjs), [E056](gauge/vacuum.mjs).

**남은 원문 합격 관문:** 실제 negative C·불가능 acosh·fit 실패, bounded vacuum 차분과 finite-T/cosh/overlap 조건, 올바른 gap 부등식이 새 study 결과/선택에 표시되는지 확인한다.

**범위·연구 한계:**

- 유일성은 명시한 full-Haar pure SU(2) 유한 모형의 해석적 논증이며 새 Lean receipt가 아니다. 추가 action·fermion·sector/cutoff 변경은 적용을 거부한다.
- 유한T 표본평균을 정확한 진공 평균이라고 부르지 않는다. C_D의 열적 excited-to-excited 전이를 vacuum-only spectrum으로 해석하지 않는다.
- 늦은 시간과 일부 fit window/GEVP는 미해결이다. 원문은 전체 스펙트럼 복원이나 성공 plateau를 별도 합격조건으로 요구하지 않으며 이를 완료 결과로 주장하지 않는다.

#### Y5-07 — 전달 연산자·GEVP·인증 경계

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.46 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
양의 self-adjoint T에서 En −E0=−at⁻¹log(λn/λ0)를 사용한다. GEVP는 관측량 기저와 excited-state 오염을 함께 기록한
다. 합격: 수치 eigenvalue는 추정이다. 전체 진공 공간을 제외한 최대 λexc/λ₀≤r<1과 전체 비진공 공간의 제어가 있을 때만
해당 모델 gap 하한 −log(r)/at를 인증한다.
```

**현재 구현·증거의 범위:** 수치 GEVP는 유한 관측량 span·condition/residual·overlap·finite-T 오염을 가진 추정이다. 완전한 유한 diagonal 모형은 퇴화 진공 전체와 모든 비진공 ratio를 정확 유리수로 검사하고, 별도 Real Mathlib CI가 modelId/cutoff를 남기는 −log(r)/at 하한 및 정확한 4-state fixture를 검증했다. 이 모형을 실제 Wilson 전체 Hilbert 공간이나 continuum과 동일시하지 않는다.

**연결 증거:** [E013](gauge/evidence/lean-audit.json), [E019](gauge/evidence/real-lean-audit/audit.json), [E020](gauge/evidence/real-lean-release.json), [E038](gauge/lean/FiniteSpectral.lean), [E039](gauge/lean/RealSpectralBridge.lean), [E048](gauge/spectral.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

**범위·연구 한계:**

- 인증은 명시한 완전한 유한 모형에 한정한다. 실제 Wilson 전체 Hilbert-space와의 동일시나 continuum gap을 주장하지 않는다.
- 임의로 편집한 JSON 입력은 exact arithmetic check이며 해당 입력을 묶는 새 Lean consumer receipt가 필요하다. Float64 log 값은 표시용이다.

#### Y5-08 — 한계 순서와 불확실성 비교

**판정:** 최종 검증 대기 · `status=IMPLEMENTED_PENDING_LIVE_UI` · `originalCriterionComplete=false` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.46 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
통계·operator overlap·T·L·a·표현 cutoff 오차를 구분한다. 일정 물리량 조건에서 a→0,L→∞,T→∞를 비교한다. 합격: 한
operator channel의 양의 질량이나 유한 격자의 양의 gap을 continuum의 양의 하한으로 표시하지 않는다. 외삽 그래프에
는 사용한 가정·fit window·데이터를 공개한다.
```

**현재 구현·증거의 범위:** 세 β/t₀에서 감소하는 a를 L/√t₀=8,T/√t₀=16에 맞춰 비교한다. 실제 최대 matching 편차 2.002%, 지정 허용치 8%와 원래 표본을 공개한다. 동일 β/reference에서 Ns6→8와 Nt12→24를 따로 실행하여 L/T를 분리한다. 통계·overlap·T·L·a·표현 cutoff·scale 오차, 조건부 a² fit의 자료·window·가정을 보존한다. continuum positive lower bound는 null/OPEN_CONTINUUM이다.

**연결 증거:** [E008](gauge/SCALE_STUDY_KO.md), [E021](gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json), [E025](gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz), [E026](gauge/evidence/scale-expansion/production-L8-attempt1/result.json), [E027](gauge/evidence/scale-expansion/production-T24-attempt1/result.json), [E034](gauge/experiments/verify-study-numerics.py), [E046](gauge/scale-analysis.mjs), [E049](gauge/study-record.mjs), [E050](gauge/study-review.mjs).

**남은 원문 합격 관문:** 실제 C00/독립 scale/a²/L/T 다섯 패널과 오차·matching·fit window/가정·ESS·격자화 차이·null 차이 구간/continuum 하한을 확인한다.

**범위·연구 한계:**

- a/√t₀≈1.00–1.63의 유한 세 점에서 조건부 외삽을 비교한다. continuum/무한부피 극한의 존재나 asymptotic scaling 영역을 증명하지 않는다.
- clover−plaquette t₀ 차이0.21458/0.34583/0.40067은 큰 격자계통효과이며 작은 RK3 step 차이로 상쇄되지 않는다.
- base 공유 scale은 중복 독립표본으로 세지 않는다. L/T 차이 bootstrap 유효98/102는 기준103 미달이므로 차이 구간은 null이다.
- 단일 채널 질량·유한 lattice gap·조건부 fit 절편을 continuum gap 하한으로 승격하지 않는다.

### Y6 — 8/8 완료

#### Y6-01 — 원본·표현·근거를 연결

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.48 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Original에는 A/F 또는 links/ensemble, Representation에는 slice·marginal·LOD, Evidence에는 source·오차·proof를 보
관한다. 합격: 3D selection은 원본 4D 좌표·configuration·관측 연산자로 이동한다. 화면 mesh나 색상으로 원본의 새 물리
상태를 생성하지 않는다.
```

**현재 구현·증거의 범위:** Original/Representation/Evidence를 분리하고, selection이 실제 4D 좌표·configuration·관측 연산자 및 A/F 재계산으로 이동한다. mesh나 색상에서 새 원본 물리장을 생성하지 않는다.

**연결 증거:** [E017](gauge/evidence/live-ui-v85-v89-gauge.json), [E031](gauge/evidence/ui-criterion-assessment.json), [E035](gauge/field-family.mjs), [E036](gauge/index.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y6-02 — x ₄=c 절단

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.48 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
q(y,c), energy density, 선택된 invariant observable을 3D에 표시하고 c를 연속/격자 index로 조절한다. 합격: 기존 SU(2)
BPST slice의 해석식을 회귀검사한다. interpolated slice는 보간 방식과 오차를 표시하고 실제 격자면과 구별한다.
```

**현재 구현·증거의 범위:** x₄=c 연속 절단과 정수 timeIndex의 실제 격자면을 제공한다. SU(2) BPST 해석식·source 좌표·index guard를 검사했고 보간을 수행하지 않는다.

**연결 증거:** [E017](gauge/evidence/live-ui-v85-v89-gauge.json), [E031](gauge/evidence/ui-criterion-assessment.json), [E035](gauge/field-family.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y6-03 — x ₄ 방향 적분·평균 구별

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.48 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
marginal at Σn q(y,n at), 평균 (1/Nt) Σn q, 한 표본과 ensemble 평균을 서로 다른 연산자로 둔다. 합격: marginal의 단위
가 q×length로 바뀐다. BPST 무한 방향 해석식과 finite window tail을 확인하고 at 누락·합/평균 혼동을 잡는다.
```

**현재 구현·증거의 범위:** 저장된 chain links의 4D 밀도에서 at 가중 marginal, 시간 평균, configuration 평균을 별도 계산한다. 선택은 기여한 모든 시간/표본 fibre로 돌아간다. BPST 무한 marginal과 finite-window tail을 확인한다. 수치 적분/step refinement를 directed interval 증명이라고 표시하지 않는다.

**연결 증거:** [E011](gauge/evidence/lattice-chain-marginal-mean.json), [E012](gauge/evidence/lattice-flow-tests.tap), [E017](gauge/evidence/live-ui-v85-v89-gauge.json), [E031](gauge/evidence/ui-criterion-assessment.json), [E035](gauge/field-family.mjs), [E037](gauge/lattice-observation.mjs), [E053](gauge/tests/lattice-observation-flow.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y6-04 — 안전한 게이지 불변 기본 화면

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.48 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
plaquette energy·Wilson character·정규화된 density·correlation을 기본 채널로 둔다. A/F 성분은 gauge를 고정한 진단
모드에 둔다. 합격: gauge transformation 전후 기본 채널은 같고 성분 채널에는 gauge ID가 보인다. gauge-dependent
arrow의 형태에서 질량 간극을 추론하지 않는다.
```

**현재 구현·증거의 범위:** 기본 invariant density와 gauge ID가 명시된 A/F 진단을 분리한다. 실제 비상수 gauge transform 전후 invariant residue와 성분의 변화를 검증했다.

**연결 증거:** [E017](gauge/evidence/live-ui-v85-v89-gauge.json), [E031](gauge/evidence/ui-criterion-assessment.json), [E035](gauge/field-family.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y6-05 — Flow와 투영된 loop의 의미 보존

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.48 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
gradient flow time을 독립 매개변수로 둔다. 4D loop를 3D에 그릴 때 원래 경로와 x ₄ 이동을 함께 보관한다. 합격: flowed
density를 원본 density로 덮어쓰지 않는다. 원래 loop holonomy와 projected path에서 다시 계산한 holonomy를 동일시
하지 않는다.
```

**현재 구현·증거의 범위:** 명시한 유한 SU(2)/G2 lattice의 비정상 Wilson flow를 전체 Lie 기저와 불변 Gram metric으로 실행한다. 원본·flow time·step-halving·full-trajectory gauge covariance와 4D/평탄화 경로 차이를 보존한다. 수치 solver이며 continuum flow 또는 전역 rigorous error 정리가 아니다.

**연결 증거:** [E012](gauge/evidence/lattice-flow-tests.tap), [E017](gauge/evidence/live-ui-v85-v89-gauge.json), [E031](gauge/evidence/ui-criterion-assessment.json), [E032](gauge/evidence/wilson-flow-g2.json), [E033](gauge/evidence/wilson-flow-su2.json), [E035](gauge/field-family.mjs), [E053](gauge/tests/lattice-observation-flow.test.mjs), [E059](gauge/wilson-flow.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y6-06 — Δ별 상태 비교

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.48 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
같은 좌표 범위·단위·color scale로 Δ₁,Δ₂의 field family와 상관함수를 비교한다. 독립 정규화는 선택적으로 표시한다. 합격:
색상 auto-normalization으로 가려지는 밀도 크기 차이를 확인할 수 있다. assumed/effective/estimated 상태가 모든 비교
패널에 나타난다.
```

**현재 구현·증거의 범위:** Δ별 field/spectrum을 같은 물리 좌표·단위·공통 색 척도에서 비교한다. 실제 공개 패널은 EFFECTIVE/ESTIMATED를 표시하며 C00 curve의 목표 Δ와 측정 의미를 분리한다. 이 완료는 상태 비교 계약의 검증이다. 새 독립 scale study의 Y5-05 공개 gate는 별도 대기한다.

**연결 증거:** [E010](gauge/ensemble-family.mjs), [E017](gauge/evidence/live-ui-v85-v89-gauge.json), [E031](gauge/evidence/ui-criterion-assessment.json), [E035](gauge/field-family.mjs), [E048](gauge/spectral.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y6-07 — 그림에서 Lean 명제로 연결

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.48 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
관측을 선택하면 정확한 observable·domain·projection·claim type을 내보낸다. proof 후보는 fibre 조건과 reconstruction
certificate를 요구한다. 합격: 같은 3D 투영을 가진 다른 4D source를 반례 fixture로 제공한다. projection 그림의 동일성
만으로 4D 성질·spectral gap을 복원하는 명제를 거부한다.
```

**현재 구현·증거의 범위:** 서로 다른 4D BPST 원본이 같은 3D density slice를 내는 반례를 제공한다. 정확 domain/projection/claim 계약을 내보내고 fibre·reconstruction·올바른 전체 spectrum 전달 조건 없이 그림의 일치에서 원본 성질을 복원하지 않는다.

**연결 증거:** [E013](gauge/evidence/lean-audit.json), [E017](gauge/evidence/live-ui-v85-v89-gauge.json), [E031](gauge/evidence/ui-criterion-assessment.json), [E038](gauge/lean/FiniteSpectral.lean), [E045](gauge/proof.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y6-08 — 세션 재현·접근성·stale 확인

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.48 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
수치 테이블·키보드·색각 독립 표식과 원본 데이터를 제공한다. scene/model/proof revision을 분리하여 저장한다. 합격: 재
열기 시 같은 source·관측·가정을 복원한다. G· Δ 모형·경계·proof source 변경은 관련 결과를 stale로 만들고 단순 카메라 이
동은 만들지 않는다.
```

**현재 구현·증거의 범위:** 재계산 replay, 재해시한 변조 거부, scene/model/assumption/proof revision과 stale 조건의 분리를 실제 검증했다. camera 이동은 수학 결과를 stale로 만들지 않는다. source/environment가 다른 기록은 입력 복원만 허용하고 과거 receipt를 현재 proof authority로 채택하지 않는다.

**연결 증거:** [E017](gauge/evidence/live-ui-v85-v89-gauge.json), [E031](gauge/evidence/ui-criterion-assessment.json), [E036](gauge/index.mjs), [E045](gauge/proof.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

### Y7 — 8/8 완료

#### Y7-01 — 기존 검증 범위를 고정

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.50 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Core와 Mathlib scaffold의 실제 source hash·toolchain·axiom audit를 유지한다. 기존 선언형 quantum model을 full
QFT로 오인하지 않는다. 합격: 기존 Core 10개의 axiom-free 보조정리와 사용자 axiom 의존 corollary를 분리한다.
Mathlib 표준 axiom과 사용자 YM axiom도 별도 표시한다.
```

**현재 구현·증거의 범위:** legacy Core10 원본을 같은 source hash로 새 공식 Lean kernel에서 재검사했다. axiom-free 보조정리·사용자 YM axiom corollary·표준 Mathlib axiom을 분리한다. 이전 Mathlib scaffold의 receipt는 inherited evidence이며 선언형 quantum model을 full QFT로 부르지 않는다.

**연결 증거:** [E013](gauge/evidence/lean-audit.json), [E040](gauge/legacy/MathScopeConditionalYM.lean), [E041](gauge/legacy/MathScopeConditionalYM_Core.lean), [E042](gauge/legacy/original-validation.json), [E044](gauge/proof-data.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y7-02 — 유한 대수 인증서를 Lean에 연결

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.50 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Y1 bracket table·Y2 embedding·Y3 path/Wilson 항등식의 정확 데이터를 import하고 kernel에서 검사한다. 합격: 생성
기의 성공 로그 대신 Lean certificate와 source hash가 필요하다. 잘못된 Jacobi·경로 순서·embedding index fixture가 실
제 거부된다.
```

**현재 구현·증거의 범위:** 보호된 M1의 exact SU3/G2/transport/conditional 원문을 바꾸지 않고 새 공식 Lean kernel로 재검사한다. 잘못된 Jacobi·embedding index·Wilson path 입력이 실제 거부된 로그를 갖는다.

**연결 증거:** [E013](gauge/evidence/lean-audit.json), [E014](gauge/evidence/lean/NegativeEmbeddingIndex.log), [E015](gauge/evidence/lean/NegativeJacobi.log), [E016](gauge/evidence/lean/m1-NegativeWilson.log), [E057](gauge/verify_lean.py).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y7-03 — 유한 spectral certificate

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.50 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
유한 양의 가중치·spectral sum·전달행렬 enclosure를 각각 formalize한다. 숫자 고유값 출력과 enclosing proof를 구분한
다. 합격: 계수 sign·at>0·r<1·비진공 subspace 조건을 빠뜨리면 해당 하한 정리를 사용할 수 없다. certificate의 모델 cutoff
를 결론에 남긴다.
```

**현재 구현·증거의 범위:** 유한 Lean suite와 별도 실제 Real Mathlib CI의 source를 결속했다. 양의 Real exp/log와 전체 비진공 transfer enclosure를 직접 연결하는 8개 target, model/cutoff가 남는 정확한 4-state fixture, 9개 양성/가정 제거 음성 consumer를 검증했다. custom axiom/sorry가 없으며, 20개 raw log·3,439개 import closure가 기록되어 있다.

**연결 증거:** [E013](gauge/evidence/lean-audit.json), [E019](gauge/evidence/real-lean-audit/audit.json), [E020](gauge/evidence/real-lean-release.json), [E038](gauge/lean/FiniteSpectral.lean), [E039](gauge/lean/RealSpectralBridge.lean), [E043](gauge/package_lean.py), [E058](gauge/verify_real_lean.py).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y7-04 — 사용자 존재·간극 axiom의 출처 저장

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.50 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
고정된 모델 의미·G·단위· Δ·quantifier를 갖는 가정을 등록한다. user/paper/heuristic 출처와 source revision, 의존 정리를
기록한다. 합격: 상충하는 spectrum/Δ 가정을 감지하면 중단한다. 임의 Prop P 모두를 참으로 선언하는 식의 광범위 axiom
은 금지하고 YM 의미 술어를 고정한다.
```

**현재 구현·증거의 범위:** 고정된 YM 의미·quantifier·G·단위·Δ·출처·SHA·revision·의존 ID를 갖는 가정을 등록한다. 상충 spectrum, 광범위 axiom, 잘못된 quantifier와 누락/순환 의존을 거부한다.

**연결 증거:** [E045](gauge/proof.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y7-05 — 투영 뒤 corollary의 정확한 계약

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.50 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
projection observation이 fibre-constant인지, reconstruction이 어느 집합에서 성립하는지, spectrum 전달은 어떤 포함
가정인지 요구한다. 합격: 그림을 다시 Lean 형태로 적었다는 사실만으로 새 정리를 승인하지 않는다. conditional theorem
에는 필요한 reconstruction/transfer 가정과 사용자 axiom 목록이 남는다.
```

**현재 구현·증거의 범위:** fibre-constant 또는 제한 domain reconstruction과 전체 original positive spectrum inclusion의 올바른 방향을 요구한다. 사용자가 입력한 certificate 모양은 조건부 가정이며 그림을 Lean 문장으로 옮긴 것만으로 새 theorem을 승인하지 않는다.

**연결 증거:** [E013](gauge/evidence/lean-audit.json), [E038](gauge/lean/FiniteSpectral.lean), [E045](gauge/proof.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y7-06 — OS/transfer 재구성 의무 분리

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.50 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Schwinger functions/observable algebra, regularity, Euclidean symmetry, reflection positivity, clustering·vacuum
조건과 재구성 정리 적용을 독립 작업으로 둔다. 합격: 특정 lattice 외부 정리의 가정이 매핑되어도 continuum 재구성 완료
로 체크하지 않는다. gauge-invariant observable의 재구성 문제를 gauge potential positivity와 구별한다.
```

**현재 구현·증거의 범위:** observable algebra·regularity·Euclidean symmetry·reflection positivity·clustering·vacuum·reconstruction을 독립 OPEN 의무와 dependency로 관리한다. 유한 lattice 가정 매핑이 continuum 재구성 완료를 만들지 않는 동작을 검증한 기준이다.

**연결 증거:** [E009](gauge/contracts.mjs), [E045](gauge/proof.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y7-07 — 새 continuum YM 구성의 연구 목표

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.50 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
일정 물리량 조건의 continuum·무한 부피 극한, 비자명성, 필요한 QFT axioms, uniform positive gap을 서로 다른 proof
obligation으로 둔다. 합격: 각 극한의 존재·모형 식별·uniform bound 근거 없이는 OPEN CONTINUUM을 유지한다. 격자
simulation·유효모형·사용자 존재 axiom으로 Clay 완료 상태를 만들지 않는다.
```

**현재 구현·증거의 범위:** continuum/무한부피 limit, nontriviality, QFT axioms, uniform gap의 별도 OPEN_CONTINUUM 상태를 유지한다. 존재·모형 식별·uniform bound 근거가 없는 simulation/유효모형/사용자 axiom으로 Clay 완료를 만들지 않는 원문 관문을 충족한다.

**연결 증거:** [E009](gauge/contracts.mjs), [E045](gauge/proof.mjs), [E052](gauge/tests/gauge-m3.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### Y7-08 — 최종 회귀검사와 증거 bundle

**판정:** 원문 기준 완료 · `status=COMPLETE_WITHIN_STATED_SCOPE` · `originalCriterionComplete=true` · 진행표 [GAUGE_PROGRESS.json](GAUGE_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.50 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
핀된 Lean/mathlib, no-sorry 검사, axiom audit, negative control, 소스·데이터 hash, 예측된 failure cases를 묶는다. 합
격: 변경된 소스는 새 kernel 결과가 나올 때까지 unverified다. 보고서에는 유한 결과·조건부 결과·추정·열린 의무가 각각의
범위와 함께 표시된다.
```

**현재 구현·증거의 범위:** 핀된 Lean/mathlib, no-sorry·axiom·negative control과 source/data hash를 실제 유한/Real kernel 로그에 결속한다. 변경된 source는 새 kernel 결과까지 unverified이다. 게시 transport 변조를 검출·수정한 뒤 45개 source 일치를 실제 확인했다. 브라우저 source 검사를 새 kernel 실행이나 수치 추정의 증명으로 바꾸지 않는다.

**연결 증거:** [E013](gauge/evidence/lean-audit.json), [E017](gauge/evidence/live-ui-v85-v89-gauge.json), [E018](gauge/evidence/package-guard-audit.json), [E020](gauge/evidence/real-lean-release.json), [E030](gauge/evidence/source-transport-audit.json), [E043](gauge/package_lean.py), [E044](gauge/proof-data.mjs), [E052](gauge/tests/gauge-m3.test.mjs), [E057](gauge/verify_lean.py).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

### N6 — 0/8 완료

#### N6-01 — 초기 finite state 구성

**판정:** 실질 잔여 · `status=OPEN` · `originalCriterionComplete=false` · 진행표 [N6_PROGRESS.json](N6_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.62 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
primary curls 뒤 temporal mean update와 다섯 moment correction을 수행하여 j=0 상태를 만든다. 합격: Proposition9.5
의 B0=0.7,C0*=1.2와 (9.9),(9.10) 명세를 충족한다. 명세의 상수 없이 경험적 power slope만으로 인증하지 않는다.
```

**현재 구현·증거의 범위:** 변경하지 않은 common6 생성자를 실제 실행했다. 선택한 원래 band/member의 전체 curl, 여섯 angular/Haar covariance, 현재 P/J와 전체 초기 auxiliary-torus pressure, 원래 두 pulse의 C4/C5 variation이 존재한다. 아직 Proposition 9.5의 j=0 이전 상태다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E075](navier/evidence/source-current-20261012/current-state.json), [E077](navier/evidence/source-current-20261012/full-pressure.json), [E078](navier/evidence/source-current-20261012/higher-pulse-jets.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E087](navier/source-inheritance.json), [E088](navier/source-mean-map.mjs).

**남은 구성·계산:** 모든 필요한 원래 band/label을 조립하고 실제 temporal-mean 및 five-moment update를 적용한 뒤 전체 압력을 다시 계산하여 j=0을 만든다.

**남은 증명·오차 검증:** 정확한 B₀=0.7, C₀*=1.2 및 (9.9)–(9.10)의 원래 class 상수를 검증한다.

#### N6-02 — 전체 residual 재계산

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N6_PROGRESS.json](N6_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.62 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
R(u+δu,p+δp)=R(u,p)+Lu(δu,δp)+div(δu⊗δu)를 사용하며 매 substep 후 최신 압력을 복원한다. 합격: 독립 직접 PDE
평가와 decomposed residual이 오차 예산 내 일치한다. 기존 flat tail와 새 quadratic remainder를 장부에서 누락하지 않
는다.
```

**현재 구현·증거의 범위:** 별도 유한 Fourier quadratic residual identity와 omitted-square 음성 대조가 있다. 실제 선택 source의 초기 전체 auxiliary pressure는 A0를 유지한다. signed update는 previous-curl·new-curl·square와 여섯 mean covariance 및 갱신된 mean pressure를 보존한다. 모든 substep 뒤의 완전한 physical PDE jet 독립 대조는 없다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E072](navier/evidence/acceptance.json), [E074](navier/evidence/source-current-20261012/current-signed-stress.json), [E077](navier/evidence/source-current-20261012/full-pressure.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E081](navier/galerkin.mjs).

**남은 구성·계산:** 실제 signed update와 이후 각 보정 substep 뒤의 전체 auxiliary pressure를 구성하고, 독립적인 완전한 physical PDE 평가를 준비한다.

**남은 증명·오차 검증:** 같은 source의 decomposed residual과 대조하면서 old flat tail, 모든 quadratic product 및 명시적 오차 예산을 포함한다.

#### N6-03 — 비영 angular harmonics 보정

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N6_PROGRESS.json](N6_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.62 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
현재 source의 모든 nonzero harmonics를 (7.13) inverse로 풀고 source-supported potentials에 cutoff 후 curl한다.
합격: same-label 곱에서 m+m′ 신규 주파수가 생성된다. 단계별 최대 harmonic을 기록하고 조용한 truncation 대신
discarded-mode bound를 제공한다.
```

**현재 구현·증거의 범위:** 실제 원래 두 pulse 행렬의 C4/C5 slow jet, 계수/시간 FTC body, 각각 112차원 noncommuting variation과 factorial ordered-integral tail을 구성했다. 이는 선택 signed curl의 미분 의존성을 보완하며, 현재 source 전체 nonzero-harmonic correction 자체는 아직 아니다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E061](navier/corrections.mjs), [E062](navier/evidence/N6-harmonic.json), [E078](navier/evidence/source-current-20261012/higher-pulse-jets.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E086](navier/source-higher-jets.mjs).

**남은 구성·계산:** 갱신된 현재 source의 같은-label harmonic 계수 전체를 도출하고 실제 (7.13) projected transport 및 supported physical curl을 구성한다.

**남은 증명·오차 검증:** m+m′ inventory, commutator·support·미분 조건과 retained/discarded mode tail을 검증한다.

#### N6-04 — Signed covariance increment

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N6_PROGRESS.json](N6_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.62 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
고정 positive a±에 대해 δa=(Hcov^−1(Σ/ε))/(2a)를 사용한다. 새 Σ는 signed일 수 있다. 합격: B(W0,LΣ)=Σ와 (7.41)의
세 remainder를 모두 검사한다. 앞 단계 a±를 새 residual에 맞춰 몰래 재선택하지 않는다.
```

**현재 구현·증거의 범위:** 실제 현재 Eθ/Ez 및 P/J로 Corollary 8.5의 radial inverse target을 만들고 원래 H와 양의 a를 고정했다. 양 부호 source-signed curl과 공유 미분 body, 세 (7.41) remainder 및 square, 갱신된 mean covariance/P/J를 유지한다. 선택 member의 principal identity는 ηβ²Σ이며 한 member로 global Σ를 주장하지 않는다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E061](navier/corrections.mjs), [E064](navier/evidence/N6-signed.json), [E074](navier/evidence/source-current-20261012/current-signed-stress.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E087](navier/source-inheritance.json), [E089](navier/source-signed-stress.mjs).

**남은 구성·계산:** 전체 source partition을 조립하고 실제 초기화된 현재 stage에 signed update와 전체 압력 재계산을 적용한다.

**남은 증명·오차 검증:** global averaged B(W₀,LΣ)=Σ, 세 (7.41) remainder, 원래 support/edge 및 모든 차수 derivative-class bound를 고정 H/a 아래 확인한다.

#### N6-05 — Zero auxiliary mean Fourier inverse

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N6_PROGRESS.json](N6_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.62 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(8.19)의 1/(2 πi vt·k) multiplier로 (8.20)을 풀고 axial increment는 (8.14)의 potential로 실현한다. 합격: zero mode가
0이고 Nφ=F가 맞는다. |vt·k|^ −1≤C(1+|k|) 및 4개 추가 도함수를 포함한 Fourier tail를 기록한다.
```

**현재 구현·증거의 범위:** vt=(√2−1,1)의 정확한 대수적 divisor와 선언한 유한 Fourier inverse가 있다. 초기 전체 torus pressure/residual과 C5 pulse source 입력도 생겼다. 실제 전체 auxiliary Fourier 계수와 모든 필요한 C^(m+4) tail 상수는 아직 없다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E061](navier/corrections.mjs), [E066](navier/evidence/N6-workbench.json), [E077](navier/evidence/source-current-20261012/full-pressure.json), [E078](navier/evidence/source-current-20261012/higher-pulse-jets.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json).

**남은 구성·계산:** 실제 zero-mean source Fourier 계수와 inverse를 계산하고 axial potential (8.14), divergence-compatible radial update, A₁/cutoff remainder를 다음 압력·residual에 반영한다.

**남은 증명·오차 검증:** zero mode=0, Nφ=F 및 원래 Diophantine 상수와 각 필요한 차수의 추가 네 미분 손실·Fourier tail 상수를 검증한다.

#### N6-06 — 다섯 radial equations와 압력

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N6_PROGRESS.json](N6_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.62 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(8.25)로 두 보존 모멘트와 P,J θ,Jz를 보정하고 (8.12)로 pressure를 다시 계산한다. 합격: 두 보존 적분은 0으로 유지되고 새
결함은 (8.26),(8.27)의 nonlinear remainder와 일치한다. λ의 작은 값에 따른 condition number를 통제한다.
```

**현재 구현·증거의 범위:** 원래 양의 λ에 대한 five-moment inverse가 변경 없는 M2 helper에 연결되어 있다. 실제 primary curl의 현재 P,Jθ,Jz를 만들고 signed update 뒤 다시 계산했지만, temporal update 이후의 현재 defect에 five-moment inverse를 아직 적용하지 않았다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E063](navier/evidence/N6-moments.json), [E065](navier/evidence/N6-source-mean.json), [E074](navier/evidence/source-current-20261012/current-signed-stress.json), [E075](navier/evidence/source-current-20261012/current-state.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E088](navier/source-mean-map.mjs).

**남은 구성·계산:** temporal update 뒤의 현재 defect에 원래 fixed five-moment map을 적용하고 완전한 갱신 압력을 계산한다.

**남은 증명·오차 검증:** 두 conservation integral=0, 전체 nonlinear current mean을 가진 (8.26)–(8.27), 원래 λ에 조건화된 미분 bound를 검증한다.

#### N6-07 — 고정 도메인과 차수 향상

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N6_PROGRESS.json](N6_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.62 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
σj=1/5+j/10, gj=hj/10 및 (9.17),(9.18)의 Km,ℓm,log powers를 추적한다. 합격: 모든 finite stage가 같은 q<qbig 도메
인을 사용한다. 단 한 번의 step에서 샘플 잔차가 늘면 정밀도/범위/상수부터 조사하고 차수 theorem과 혼동하지 않는다.
```

**현재 구현·증거의 범위:** 유리수 exponent ledger와 원래 양의 λ/h, 원래 admissible band/member, 고정 radial integration envelope, 계수 FTC norm 및 명시적 Volterra tail을 보존한다. 유한 선택 chart의 구성으로 전 stage 공통 qbig·모든 Km/ℓm/log 상수를 증명하지 않는다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E061](navier/corrections.mjs), [E066](navier/evidence/N6-workbench.json), [E074](navier/evidence/source-current-20261012/current-signed-stress.json), [E078](navier/evidence/source-current-20261012/higher-pulse-jets.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json).

**남은 구성·계산:** 완전한 초기화/보정 stage에 대해 공통 원래 qbig를 고정하고 exponent·harmonic·상수 원장을 조립한다.

**남은 증명·오차 검증:** 원래 σj/gj, 모든 Km/ℓm/log power, 모든 physical derivative loss와 differentiated tail을 같은 domain에서 증명한다.

#### N6-08 — 최종 local 합성

**판정:** 실질 잔여 · `status=OPEN` · `originalCriterionComplete=false` · 진행표 [N6_PROGRESS.json](N6_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.62 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(9.21)에서 Aj,Bj,pj에 shrinking cutoff를 적용하고 curl하여 local field를 만든다. finite residual의 flat terms를 무조건 합
산하지 않는다. 합격: Lemma5.4의 tail 비교로 (9.20)을 연결한다. 평가 구간의 active indices와 생략 tail의 bound를 저장
하고 없으면 finite-stage approximation으로 제한한다.
```

**현재 구현·증거의 범위:** 실제 선택 source의 signed update는 존재한다. 초기화된 보정열과 shrinking-cutoff local sum은 아직 없다. browser summary는 무거운 실행의 기록과 한계를 보여주며 새 생성자 실행이나 Lemma 5.4 인증서가 아니다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E074](navier/evidence/source-current-20261012/current-signed-stress.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E083](navier/index.mjs), [E085](navier/source-current-evidence.mjs), [E087](navier/source-inheritance.json).

**남은 구성·계산:** 실제 j=0부터 완전한 유한 보정열을 만들고 shrinking cutoff Aⱼ/Bⱼ/pⱼ와 각 평가 domain의 active index를 구성한다.

**남은 증명·오차 검증:** 미분된 summable tail, 고정-stage Lemma 5.4→(9.20) 비교와 rigorously omitted tail을 제공한다.

### N7 — 0/8 완료

#### N7-01 — 시간·공간 cutoff 선택

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N7_PROGRESS.json](N7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.64 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
q≤C0(τ+|z|^(1/D))로 support를 q<q*/2 안에 놓고 c= χxχt를 선택한다. χx는 r²,z에 smooth하게 둔다. 합격: u=p=0인
초기 시간구간과 고정 compact K가 존재한다. t가 1에 가까울 때 원점 근방에서 cutoff가 정확히 1이어야 한다.
```

**현재 구현·증거의 범위:** 명시적인 cutoff-support 부등식과 r²/z smooth recipe는 실행 가능하다. 새 선택 N6 pressure/signed source는 최종 A/B/p local sum이 아니므로 원래 qstar, compact K와 초기 zero interval을 아직 제공하지 않는다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E068](navier/evidence/N7-workbench.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E084](navier/localization.mjs).

**남은 구성·계산:** 완전한 N6 A/B/p local sum과 qstar를 얻고 실제 χx(r²,z)χt를 적용한다.

**남은 증명·오차 검증:** 초기 zero interval, 원점 부근 cutoff=1, q≤C₀(τ+|z|^(1/D))와 고정 compact K를 실제 원래 상수로 검증한다.

#### N7-02 — Localization 교차항 보존

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N7_PROGRESS.json](N7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.64 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(10.4)의 curl(cA), 특히 ∇c×A를 포함하고 f를 전체 PDE residual로 정의한다. 합격: 직접 계산된 f와 cutoff 전 residual+모
든 commutator 전개의 일치 여부를 검사한다. ∇·u=0은 구조적으로 유지한다.
```

**현재 구현·증거의 범위:** curl(cA)=c curl A+∇c×A 계약은 cutoff 미분을 유지한다. 새 source curl은 localization 이전 유한 표현이고, 완전한 localized source force와 독립 commutator 평가는 아직 없다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E084](navier/localization.mjs).

**남은 구성·계산:** 완전한 실제 N6 potential/pressure를 localization하고 전체 force 및 cutoff commutator를 독립 계산한다.

**남은 증명·오차 검증:** ∇c×A와 모든 derivative product를 유지하여 structural div u=0 및 두 force 평가의 명시적 오차를 검증한다.

#### N7-03 — Force의 발산과 압력 계약

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N7_PROGRESS.json](N7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.64 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
원문 p118에 따라 f는 divergence-free일 필요가 없다. −Δp=∂i∂j(uiuj)−div f를 검사한다. 합격: div f≠0을 실패로 처리하
지 않는다. 임의 Leray projection으로 f를 바꿔 compact support/pressure 조건을 훼손하지 않는다.
```

**현재 구현·증거의 범위:** 실제 초기 source pressure는 auxiliary radial remainder를 유지한다. 별도 localization 계약과 periodic 유한 검사는 −Δp=∂i∂j(uiuj)−div f와 비영 div f를 허용한다. 완전한 localized source force를 이 항등식에 대입한 결과는 아직 없다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E070](navier/evidence/N8-acceptance.json), [E077](navier/evidence/source-current-20261012/full-pressure.json), [E081](navier/galerkin.mjs), [E084](navier/localization.mjs).

**남은 구성·계산:** 같은 완전한 localized velocity/force를 pressure identity에 실제 대입한다.

**남은 증명·오차 검증:** −Δp=∂i∂j(uiuj)−div f, support/pressure 가정을 확인한다. 임의 force projection으로 div f 항을 없애지 않는다.

#### N7-04 — Terminal force jets

**판정:** 실질 잔여 · `status=OPEN` · `originalCriterionComplete=false` · 진행표 [N7_PROGRESS.json](N7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.64 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Fj(x)=lim(t↑1)∂t^j f(x,t), ∂x^ αFj(0)=0을 (10.6)-(10.10)에 맞춰 구축한다. 합격: 유한 jet order M의 수치 근사와 ∀order
smooth-extension 정리의 의존성을 분리한다. 몇 개 finite differences가 작다는 이유로 C∞ force라 표시하지 않는다.
```

**현재 구현·증거의 범위:** 원래 pulse ODE의 C4/C5 jet는 실제 구성되었다. 이는 선택 내부 chart의 slow coefficient 미분이며 localized residual의 terminal-time jet가 아니다. all-order terminal limit와 원점 flatness를 추론하지 않는다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E068](navier/evidence/N7-workbench.json), [E078](navier/evidence/source-current-20261012/higher-pulse-jets.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E084](navier/localization.mjs).

**남은 구성·계산:** 완전한 localized residual로 t↑1의 실제 terminal Fj를 구성한다.

**남은 증명·오차 검증:** 모든 필요한 공간·시간 차수의 terminal limit 및 원점 flatness를 증명한다. 내부 pulse C5를 terminal C∞로 대체하지 않는다.

#### N7-05 — t>1 force extension

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N7_PROGRESS.json](N7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.64 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
(10.11)의 Σχ0(bjσ)σ^jFj/j!, σ=t−1≥0를 사용하며 (10.12)의 differentiated tail constraints로 bj를 선택한다. 합격:
force는 t≤2에서 compact support를 갖고 모든 인증된 jets가 접합된다. 이는 velocity를 t=1 이후 smooth하게 연장하는
알고리즘이 아니다.
```

**현재 구현·증거의 범위:** 조건부로 주어진 유한 jet-bound 입력에 대해 미분 cutoff 제약을 만족하는 증가 bj를 계산한다. 실제 source의 전체 terminal Fj와 infinite tail이 없으므로 t=2까지 compact all-order extension을 완료했다고 하지 않는다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E068](navier/evidence/N7-workbench.json), [E084](navier/localization.mjs).

**남은 구성·계산:** 실제 Fj와 derivative 상수를 받아 bj를 선택하고 t=2까지 force extension과 jet 접합을 구성한다.

**남은 증명·오차 검증:** (10.12)의 완전한 differentiated infinite tail, compact support 및 모든 접합 차수를 검증한다. velocity의 t>1 extension을 주장하지 않는다.

#### N7-06 — 전역 에너지 balance

**판정:** 실질 잔여 · `status=OPEN` · `originalCriterionComplete=false` · 진행표 [N7_PROGRESS.json](N7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.64 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
d(∥u∥²₂/2)/dt+ν∥∇u∥²₂=⟨f,u⟩를 전체 K에서 적분한다. core만의 에너지와 구분한다. 합격: 정규화 energy defect가
독립 space/time refinement에서 감소한다. ν=1에서 (10.13)의 ∥u(t)∥² ₂+2∫∥∇u∥²₂≤(∫∥f∥₂)² 상계와 모순 없어야
한다.
```

**현재 구현·증거의 범위:** 별도 periodic Galerkin 관측은 whole-box 물리적 에너지와 고정 core-box midpoint 에너지를 구분하고 독립 quadrature/time 근거를 제공한다. 원문의 localized field와 force를 compact K 전체에서 적분한 계산은 아니다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E069](navier/evidence/N8-TG.json), [E080](navier/flow-observations.mjs), [E081](navier/galerkin.mjs), [E093](navier/tests/flow-observations.test.mjs).

**남은 구성·계산:** 실제 localized source에 대해 K 전체의 energy·force work를 계산하고 공간/시간 quadrature를 독립 세분화한다.

**남은 증명·오차 검증:** energy balance와 원래 ν=1의 force-norm bound (10.13)에 필요한 적분·오차 부등식을 검증한다.

#### N7-07 — 실제 blowup 경로와 오차

**판정:** 실질 잔여 · `status=OPEN` · `originalCriterionComplete=false` · 진행표 [N7_PROGRESS.json](N7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.64 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
xτ=(√(2Xinτ),0,0), η=0에서 τ^A u θ=e0+O(τ^(2h)), e0>0를 측정한다. 합격: e0의 양의 하한과 remainder의 explicit
bound가 있어야 해석적 성장 certificate로 연결한다. 유한 값 plot의 증가만으로 τ→0의 무한대를 증명하지 않는다.
```

**현재 구현·증거의 범위:** 양의 τ와 원문 symbolic scaling은 보존한다. 새 유한 source expression graph는 전체 원래 blowup path의 numerical enclosure가 아니며 양의 e0 하한과 τ remainder 상수도 아직 없다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E071](navier/evidence/N8-nearT.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E084](navier/localization.mjs).

**남은 구성·계산:** 완전한 reconstruction velocity를 원래 Xin 경로/η₀에서 평가한다.

**남은 증명·오차 검증:** 엄격히 양인 e₀ 하한, 명시적 Cτ^(2h) 오차 상수와 유효 τ domain을 제공한 뒤 analytic growth certificate를 판정한다.

#### N7-08 — 비교 정리·주기화· ν 확인

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N7_PROGRESS.json](N7_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.64 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
Lemma10.5의 동일 force/data 비교, (10.22)의 ν rescaling, Corollary10.6의 지지 축소 후 disjoint translate를 검토한다.
합격: C/D 결론에 필요한 energy·periodic pressure·same forcing가 모두 남는다. periodization을 arbitrary overlapping
copies의 합으로 대체하면 nonlinear cross terms 때문에 실패다.
```

**현재 구현·증거의 범위:** 동일 force/data, support separation, viscosity와 periodic-pressure guard가 실행된다. 현재 부분 N6 source만으로는 원래 비교 정리·ν 재척도화·서로 떨어진 periodization에 필요한 완전한 local solution과 energy 가정을 충족하지 못한다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E067](navier/evidence/N7-periodic.json), [E084](navier/localization.mjs).

**남은 구성·계산:** 동일한 완전한 field/force/data에 비교 정리·ν scaling을 적용하고 축소된 서로 떨어진 source translate를 구성한다.

**남은 증명·오차 검증:** energy·forcing·periodic pressure의 원래 모든 가정과 disjointness를 검증한다. 겹치는 translate의 nonlinear cross term을 생략하지 않는다.

### N8 — 3/8 완료

#### N8-01 — Divergence-free Fourier 기저

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [N8_PROGRESS.json](N8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.66 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
2π 주기 영역에서 k· ûk=0, û−k=conj(ûk), Pk=I −kkᵀ/|k|²를 사용한다. k=0은 별도 mean equation이다. 합격: 제약이 초
기·각 accepted step에서 유지되고 pressure 회복에 div f가 포함된다. 이 branch의 periodic domain을 whole-space 논문
해와 혼동하지 않는다.
```

**현재 구현·증거의 범위:** 독립 2π-periodic Fourier Galerkin branch에서 초기 및 accepted step마다 divergence·conjugate symmetry·zero mode를 검사하고 pressure에 div f를 포함한다. bounded state history 추가가 마지막 적분 계수를 bit-for-bit 바꾸지 않음을 검사했다. 원문의 whole-space source와 다른 명시적 계산 domain이다.

**연결 증거:** [E069](navier/evidence/N8-TG.json), [E070](navier/evidence/N8-acceptance.json), [E081](navier/galerkin.mjs), [E093](navier/tests/flow-observations.test.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### N8-02 — 비선형 convolution과 dealiasing

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [N8_PROGRESS.json](N8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.66 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
모든 p+q=k 상호작용을 계산한다. quadratic product는 3/2 padding 또는 그와 동등한 정확한 retained-mode convolu-
tion을 사용한다. 합격: 작은 random solenoidal fixture에서 direct convolution과 FFT product가 정규화 10^ −11 이내
일치한다. high-mode aliasing negative control이 검출된다.
```

**현재 구현·증거의 범위:** retained direct convolution 전 상호작용과 별도 padded FFT의 차이를 1e−11 아래에서 비교한다. 고주파 aliasing 누락 사례를 실제 거부하고 독립 NumPy 결과를 보존한다. 새 observation 기능은 이 kernel을 바꾸지 않는다.

**연결 증거:** [E072](navier/evidence/acceptance.json), [E073](navier/evidence/independent-numpy.json), [E081](navier/galerkin.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### N8-03 — 시간 적응과 에너지 안정성

**판정:** 원문 기준 완료 · `status=PASS` · `originalCriterionComplete=true` · 진행표 [N8_PROGRESS.json](N8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.66 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
diffusion integrating factor/IMEX 등으로 stiff linear term을 처리하고 advection CFL·embedded local error·energy
defect로 step을 승인한다. 합격: Taylor-Green의 amplitude/energy를 시간 반분에서 설계 차수로 수렴시킨다. dt를 줄여
도 사라지지 않는 energy defect는 spatial/aliasing 오류로 조사한다.
```

**현재 구현·증거의 범위:** IMEX에 advection CFL, embedded step doubling, energy-defect acceptance를 유지한다. Taylor–Green 진폭 및 에너지의 시간 2차 refinement를 확인했다. 새 path 적분의 자체 오차 추정을 PDE solver 관문과 섞지 않는다.

**연결 증거:** [E070](navier/evidence/N8-acceptance.json), [E073](navier/evidence/independent-numpy.json), [E080](navier/flow-observations.mjs), [E081](navier/galerkin.mjs).

**원문 기준의 남은 합격조건:** 이 snapshot의 진행표에는 없음. 위 유한/조건부/도구 계약 범위를 유지한다.

#### N8-04 — τ 기반 near-terminal sampling

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N8_PROGRESS.json](N8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.66 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
s=−logτ를 주 변수로 쓰고 τ>0만 평가한다. normalized coordinates와 velocity를 계산한 뒤 physical scaling을 적용한다.
합격: τ=10^−2,10^−4,10^−8,10^−12 예시와 더 작은 값의 precision mode가 재현된다. 표시 t가 1로 반올림돼도 내
부 τ>0 계약은 유지한다.
```

**현재 구현·증거의 범위:** 표시 t가 1로 반올림되어도 1e−1000까지 양의 decimal τ와 log 좌표를 보존한다. 새 periodic 정규화는 x/(2π)이며 원문 q-scaled source 좌표가 아니다. 원래 near-terminal velocity와 정밀도 enclosure는 아직 없다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E071](navier/evidence/N8-nearT.json), [E080](navier/flow-observations.mjs), [E084](navier/localization.mjs).

**남은 구성·계산:** 원래 normalized source 좌표에서 실제 velocity를 τ=1e−2,1e−4,1e−8,1e−12에 대해 계산하고 physical scaling을 적용한다.

**남은 증명·오차 검증:** 원문이 허용하는 domain에서 interval/tail로 제어한 정밀도 mode를 제공한다. τ 표현의 정확성만으로 velocity enclosure를 승인하지 않는다.

#### N8-05 — 공간·급수·정밀도 적응

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N8_PROGRESS.json](N8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.66 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
core radius, axial length, pulse wavelength, active cutoff orders를 함께 해결한다. 각 refinement 축을 독립 증가시킨
다. 합격: 2배 grid, Fourier cutoff, coefficient order, arithmetic precision 비교표와 별도 tail bound를 저장한다. 예산
초과 시 last-resolved τ와 원인을 표시한다.
```

**현재 구현·증거의 범위:** finite solver의 자원 한계, midpoint core quadrature 비교, coarse/fine RK4 path와 명시적 history decimation을 제공한다. 원래 source의 독립 grid/Fourier/coefficient/arithmetic-precision refinement 표와 rigorous omitted tail은 아직 없다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E072](navier/evidence/acceptance.json), [E073](navier/evidence/independent-numpy.json), [E080](navier/flow-observations.mjs), [E081](navier/galerkin.mjs).

**남은 구성·계산:** 실제 core/axial/pulse scale과 active cutoff를 해상하고 grid·Fourier·coefficient order·arithmetic precision 각각의 독립 2배 refinement 표를 만든다.

**남은 증명·오차 검증:** 엄밀한 source tail, 마지막 resolved 양의 τ와 실패 이유를 기록한다. 유한 path/core 적분 오차를 생략된 PDE source tail로 대신하지 않는다.

#### N8-06 — 시각화·물리량 연결

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N8_PROGRESS.json](N8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.66 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
fixed physical bounds와 normalized view를 제공하고 instantaneous streamlines/particle paths, 속도/각속도, core/
global energy를 구분한다. 합격: 모든 scene은 실제 run hash·샘플 위치·단위·색 범위·vector scale를 갖는다. 자동 확대나
vector 정규화가 core 수축·성장을 숨기지 않는다.
```

**현재 구현·증거의 범위:** 실제 유한 실행의 81개 좌표/벡터, 고정 물리 bounds, 별도 normalized periodic view를 보존한다. 최종 순간 streamline과 저장 coefficient-history particle path, velocity와 원점 의존 axial angular velocity, whole-box Parseval과 fixed-core midpoint energy를 구분한다. axis undefined와 실제 입력/run hash를 유지하는 trajectory/seam/axis/quadrature/tamper 검사는 통과했고 새 공개 control 검증은 대기 중이다.

**연결 증거:** [E002](evidence/live-ui/acceptance.json), [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E069](navier/evidence/N8-TG.json), [E076](navier/evidence/source-current-20261012/fast-tests.log), [E080](navier/flow-observations.mjs), [E083](navier/index.mjs), [E092](navier/tests/flow-interface.test.mjs), [E093](navier/tests/flow-observations.test.mjs), [E181](web/extended-view-contract.mjs), [E183](web/tests/extended-worker.test.mjs).

**남은 원문 합격 관문:** 새 physical/normalized, streamline/pathline, velocity/angular velocity, core/global controls를 모두 실제 조작한다. selection/import/replay에서 고정 좌표·단위·색 범위·vector scale을 검사한다.

#### N8-07 — Claim-test-proof 연결

**판정:** 최종 검증 대기 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N8_PROGRESS.json](N8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.66 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
각 관 측 량 에 원 문 reference, numerical test, analytic certificate, Lean theorem 을 별 도 링 크 한 다. 합 격: arbitrary
sampled array를 axiom으로 놓고 PDE 해라고 결론 내리지 않는다. certified approximation 표시는 해당 구간의 error
enclosure와 조건을 요구한다.
```

**현재 구현·증거의 범위:** 각 flow 관측은 source-definition/finite-test metadata와 명시적 null analytic/Lean proof를 갖는다. 오차 지표를 certified enclosure로 부르지 않는다. N6 summary는 실제 heavy 실행 source hash와 남은 의무를 따로 내보내며 browser replay는 요약만 재생성한다. path/settings/claim authority 변조를 거부하고 새 공개 연결을 확인해야 한다.

**연결 증거:** [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E072](navier/evidence/acceptance.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E080](navier/flow-observations.mjs), [E083](navier/index.mjs), [E085](navier/source-current-evidence.mjs), [E092](navier/tests/flow-interface.test.mjs).

**남은 원문 합격 관문:** 관측별 원문/정의·수치 test·analytic/Lean 링크와 부재 표기를 실제 공개 화면에서 확인한다. hash/claim 변조 거부와 interval/domain/가정 없이는 certified approximation을 주지 않는 것을 확인한다.

#### N8-08 — 재현 패키지와 최종 체크

**판정:** 실질 잔여 · `status=PARTIAL` · `originalCriterionComplete=false` · 진행표 [N8_PROGRESS.json](N8_PROGRESS.json).

**원문 출처:** `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-005314).pdf` p.66 · PDF SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.

```text
판본·commit·상수·기저·domain·time schedule·quadrature·truncations·precision·tails·residual·energy·camera·build
logs를 묶는다. 합격: 다른 환경에서 fixture와 selected run이 같은 허용오차로 재현된다. 이번 문서 작성 턴의 상태는 설계
완료이며 구현·사이트 변경·배포 완료로 표시하지 않는다.
```

**현재 구현·증거의 범위:** source gate는 원문 의존 bytes, 실제 command/log, graph/artifact hash 및 유한 범위를 보존한다. flow 기록은 integrator/observation settings, accepted history/decimation, trajectory/refinement, 좌표/core quadrature를 갖고 local replay가 변조를 거부한다. 전체 원문 reconstruction 패키지는 아직 없으며 독립 NumPy·역사적 public import·새 hosted 실행을 구별한다.

**연결 증거:** [E001](CI_EXECUTION_WORKSPACES.md), [E002](evidence/live-ui/acceptance.json), [E060](navier/SOURCE_RECONSTRUCTION_KO.md), [E072](navier/evidence/acceptance.json), [E073](navier/evidence/independent-numpy.json), [E079](navier/evidence/source-current-20261012/source-current-execution.json), [E082](navier/implementation-pin.mjs), [E087](navier/source-inheritance.json), [E090](navier/tests/build-source-current-evidence.py), [E091](navier/tests/build-source-inheritance.py), [E092](navier/tests/flow-interface.test.mjs), [E094](navier/tests/independent_numpy.py), [E095](navier/tests/run.mjs), [E180](web/build_extended.py), [E181](web/extended-view-contract.mjs), [E183](web/tests/extended-worker.test.mjs), [E184](web/tests/test_extended_build.py).

**남은 구성·계산:** 완전한 실제 reconstruction 실행에 source 상수·기저/domain·schedule·quadrature·truncation·precision·residual/energy·camera/log와 교차환경 재현을 묶는다.

**남은 증명·오차 검증:** 아직 없는 전체 source reconstruction 및 필요한 tail/enclosure를 증거에 결속한다. 새 CI/UI 게시만으로 미구성 수학 자료를 채운 것으로 판정하지 않는다.

## 7. 연결 증거 원장 — immutable snapshot의 실제 bytes

아래 184개 파일의 SHA는 `a12d95b9b466aab187d6afcca089b0ac7685dc27`에서 읽은 원문 bytes 기준이다. 코드는 구현 경로, test source는 검사 정의, receipt/log는 기록된 실행, 진행/문서는 해석과 범위라는 각 역할을 가진다. 모든 파일을 같은 종류의 증명으로 취급하지 않는다. 하위 raw log·source capture가 manifest 안에 연결된 경우 그 manifest의 목록·hash와 원래 command를 함께 따라가야 한다.

압축 `.gz` 행의 기본 SHA는 압축 bytes다. 복원한 JSON의 SHA도 함께 적어 포장 변경과 수치 내용 변경을 구별한다. 후속 파일이 같은 경로에서 바뀌면 이 표는 새 파일의 hash라고 읽지 말고 지정 commit의 snapshot을 열어 비교한다.

| ID | 파일 | bytes | SHA-256 |
|---|---|---:|---|
| E001 | [CI_EXECUTION_WORKSPACES.md](CI_EXECUTION_WORKSPACES.md) | 5165 | `c6eb8cff77636c922678278e20107da8fddb0faa722c623936705a3698dbad5a` |
| E002 | [evidence/live-ui/acceptance.json](evidence/live-ui/acceptance.json) | 223548 | `ad15205805dade8f24cc4d75a52fb00ad7740932fb2f8387ee6348d816e2d408` |
| E003 | [evidence/live-ui/p8-refinement-v87.jpg](evidence/live-ui/p8-refinement-v87.jpg) | 90888 | `c59d516c292b4cf80d404b62a67a894ff1b99cefbaf564a7bc294276ec3bf495` |
| E004 | [evidence/p7-release-20261011/attempt3/zeros-to-20.json](evidence/p7-release-20261011/attempt3/zeros-to-20.json) | 7701466 | `69aa32d67472696b0398987b1638d019225c5fb4252f936b69dacd085cc43750` |
| E005 | [evidence/p7-release-20261011/attempt3/zeros-to-30.json](evidence/p7-release-20261011/attempt3/zeros-to-30.json) | 13055576 | `0a525a17d97c3e28e610c0ffb524e6142f47372415062c7d1a20b9970c0e33a5` |
| E006 | [evidence/resume-20261012/attempt2/central-37a1.json.gz](evidence/resume-20261012/attempt2/central-37a1.json.gz) | 6621 | `93cdc564b1eb1c66a5584e7e95f5ac5cadcc6e0bf94a7c9618ea99d94f651cdb`<br>복원 `a81c9448590dbaf92d48f824f9819fbc218bb5ea75dfa0e2ed560e735222bf37` (32070 bytes) |
| E007 | [evidence/resume-20261012/attempt2/explicit-psi.json.gz](evidence/resume-20261012/attempt2/explicit-psi.json.gz) | 969442 | `99e81e68c8a2d111d1f18ddb5651d9c914aa9d46c3bc918c62ddd195070ec1f0`<br>복원 `b88121bbde14ab6908d31b9fb0cfab14a82b590f8f5601609a7e2cb462c218ba` (13854057 bytes) |
| E008 | [gauge/SCALE_STUDY_KO.md](gauge/SCALE_STUDY_KO.md) | 16917 | `9d90326c10825450e643b339a7145eebc6a958794c9883f2ceec0f24225bae6f` |
| E009 | [gauge/contracts.mjs](gauge/contracts.mjs) | 7281 | `18fcb8237f5547eae3b60879e8fd28baef09cc200c96f4dcb6a82a101a8c57fa` |
| E010 | [gauge/ensemble-family.mjs](gauge/ensemble-family.mjs) | 15963 | `587157317f0accb863aa698029f4afe42e45ccb486d5bfb83a36b676c8ee30b0` |
| E011 | [gauge/evidence/lattice-chain-marginal-mean.json](gauge/evidence/lattice-chain-marginal-mean.json) | 477982 | `576462954f07f88f43713a4adabf0aa6c58946942b48427185dddfcfe74fefd6` |
| E012 | [gauge/evidence/lattice-flow-tests.tap](gauge/evidence/lattice-flow-tests.tap) | 1858 | `c11928b201ad1b819e09a4626a0539ed8c913f4610164c34cecb94ab49eead1d` |
| E013 | [gauge/evidence/lean-audit.json](gauge/evidence/lean-audit.json) | 28054 | `23510ec876bc5f6f6b3442fbe13acafa303f7e53588a9d327e32d0581b1dd02a` |
| E014 | [gauge/evidence/lean/NegativeEmbeddingIndex.log](gauge/evidence/lean/NegativeEmbeddingIndex.log) | 247 | `69695150b0deb17ad54406536bb2bef995b72b19f5252faf4b585cdbe6dd2af7` |
| E015 | [gauge/evidence/lean/NegativeJacobi.log](gauge/evidence/lean/NegativeJacobi.log) | 306 | `b6a0b1535d9f4d08e30f8a1f23e9be9bfaa9b26cc55f8f00c4532da403e03e4d` |
| E016 | [gauge/evidence/lean/m1-NegativeWilson.log](gauge/evidence/lean/m1-NegativeWilson.log) | 233 | `f3bdc32819754f28b1b2e6bac2e5e0167374d5fed021a591329ac153255131e0` |
| E017 | [gauge/evidence/live-ui-v85-v89-gauge.json](gauge/evidence/live-ui-v85-v89-gauge.json) | 121993 | `9729ad0f3a4af8d04b578319eaf79b19e0efe590f14289dc747d64c574531bbf` |
| E018 | [gauge/evidence/package-guard-audit.json](gauge/evidence/package-guard-audit.json) | 15813 | `06319f02529ebb16a0a9691a95b9516410af29d042809de42f9d7e04465f2e2a` |
| E019 | [gauge/evidence/real-lean-audit/audit.json](gauge/evidence/real-lean-audit/audit.json) | 21850 | `bcc6a0d60c9b39f11fcf8b854af9b42dfb50f77f789b7dc4f3228f505ef03413` |
| E020 | [gauge/evidence/real-lean-release.json](gauge/evidence/real-lean-release.json) | 24155 | `3eef9ae012dcc15a120dcfd5180ebf07c04ccabe04b5b1f4920b707ced836d81` |
| E021 | [gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json](gauge/evidence/scale-expansion/independent-numerical-review-attempt1.json) | 7475 | `915d5731aedbb2b13517d4755bbe19008326bcec4f3151f9b08975047a94271c` |
| E022 | [gauge/evidence/scale-expansion/live-scale-replay-attempt1.json](gauge/evidence/scale-expansion/live-scale-replay-attempt1.json) | 1814 | `fe6656362972f4473185faceb3b70a80644a6a64c064d662e047b2d15b7226ed` |
| E023 | [gauge/evidence/scale-expansion/lossless-review-packaging-attempt1.json](gauge/evidence/scale-expansion/lossless-review-packaging-attempt1.json) | 1192 | `fca455567df9ae9c1a25b69ec9b2fc6b53306573f3ab227d68b25f95983b3978` |
| E024 | [gauge/evidence/scale-expansion/matched-public-example-attempt2.json](gauge/evidence/scale-expansion/matched-public-example-attempt2.json) | 6455 | `783cecabe1b27bd691f7e0066bee6b80f14fb1055007cb75f6cf204f35722cc7` |
| E025 | [gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz](gauge/evidence/scale-expansion/matched-study-review-attempt1/review.json.gz) | 5490955 | `f0faafb05fff3db0e3434b44fda6b5b0148c8bebcee8a57f627c58c2700b1117`<br>복원 `ace91ec759cb7282f58829d048f580ed81a3af7c11abb7cc141266d5574bd556` (13395492 bytes) |
| E026 | [gauge/evidence/scale-expansion/production-L8-attempt1/result.json](gauge/evidence/scale-expansion/production-L8-attempt1/result.json) | 2621833 | `284f659a9a163c77fcccc08dd954e0f01741b8495d02833ba82f41242c608947` |
| E027 | [gauge/evidence/scale-expansion/production-T24-attempt1/result.json](gauge/evidence/scale-expansion/production-T24-attempt1/result.json) | 3436936 | `bd9eff40bd9b4676939ca0dc321e1750a3f37ac212fb135ae4c03c64e7cb8f3c` |
| E028 | [gauge/evidence/scale-expansion/ready-for-live-ui-attempt1.json](gauge/evidence/scale-expansion/ready-for-live-ui-attempt1.json) | 9933 | `7ab8cb777b18ea7bea283d8ae4456bd2a1f609223561eb85638f36bdc44ed6e6` |
| E029 | [gauge/evidence/scale-expansion/y5-criterion-assessment-attempt1.json](gauge/evidence/scale-expansion/y5-criterion-assessment-attempt1.json) | 11381 | `02e11552e90c2e96a2604aeff924d68927f600f45b6f71b6219073c203280363` |
| E030 | [gauge/evidence/source-transport-audit.json](gauge/evidence/source-transport-audit.json) | 12330 | `7be4c6f271f3f7f6250b988e5243ba0313b48726afcacb8368ed12d8720a65a1` |
| E031 | [gauge/evidence/ui-criterion-assessment.json](gauge/evidence/ui-criterion-assessment.json) | 12086 | `7197fa143ca054431e5c96258feb366d98b8bf9c8dc641a23c61220754917c83` |
| E032 | [gauge/evidence/wilson-flow-g2.json](gauge/evidence/wilson-flow-g2.json) | 462530 | `2b7f3e5e7b60bc021ca05c79e5149e81771be76c382e6661a2ff28fd0bf3b8cc` |
| E033 | [gauge/evidence/wilson-flow-su2.json](gauge/evidence/wilson-flow-su2.json) | 299202 | `cb308ad712a9aa7c68dd17e9817749bb93aa7ad5b79ca7956ebb7949e42c1888` |
| E034 | [gauge/experiments/verify-study-numerics.py](gauge/experiments/verify-study-numerics.py) | 10240 | `c7d48bb5b4b8c4a44eb7ef664535cf265b2f56a88b34ad83768c860ca4a44fa0` |
| E035 | [gauge/field-family.mjs](gauge/field-family.mjs) | 15006 | `a044f36ece053a5b06baedcd201ffc550e918dcda0afb5b6c48a7372a995b1f2` |
| E036 | [gauge/index.mjs](gauge/index.mjs) | 10385 | `5c47d1624939d6e7207283d6d1b6a0fce977c81b8a22705d3d3fc602eb31b863` |
| E037 | [gauge/lattice-observation.mjs](gauge/lattice-observation.mjs) | 11890 | `c258abb337c07f338aac90451bc4ea99d7c9964a37d20197e1f6d8ebb7ec90bb` |
| E038 | [gauge/lean/FiniteSpectral.lean](gauge/lean/FiniteSpectral.lean) | 5750 | `3a0d62e4f64f46ab7fa77038cc7f335182bdac9b154c509b407ddc934f9380f4` |
| E039 | [gauge/lean/RealSpectralBridge.lean](gauge/lean/RealSpectralBridge.lean) | 8645 | `6361ae4a03fc003e0e3cccc21eb5af38dba37a40ed148a5b76d89dcfad886d53` |
| E040 | [gauge/legacy/MathScopeConditionalYM.lean](gauge/legacy/MathScopeConditionalYM.lean) | 8325 | `6d64aa5b3f4a62477a6732ed1b6018f4ee588ffd051e22a04fcce9fcbfaa234c` |
| E041 | [gauge/legacy/MathScopeConditionalYM_Core.lean](gauge/legacy/MathScopeConditionalYM_Core.lean) | 7173 | `c4316c0c6b8d3ba1461b675a377728b8baf2096b6f0ea6938fa9653eb1326639` |
| E042 | [gauge/legacy/original-validation.json](gauge/legacy/original-validation.json) | 11249 | `70d8981c33cf1141336ee1f8213ded28e03978337a244f92e683e3a4f63d5a1f` |
| E043 | [gauge/package_lean.py](gauge/package_lean.py) | 6340 | `49bdf74eb63bcd98fe3dc9ed3bc01dc5d85c4cab70ef69e25cb7292cf46125da` |
| E044 | [gauge/proof-data.mjs](gauge/proof-data.mjs) | 216798 | `05679b173ccb3cc20a10364ac3d8f7003f2f69b7ec198b498a8337e4747273a0` |
| E045 | [gauge/proof.mjs](gauge/proof.mjs) | 14220 | `78fed2a8f916cee4c18e4c52f6a2375a3150dcc578bd3622ffcb3fa09e46ca34` |
| E046 | [gauge/scale-analysis.mjs](gauge/scale-analysis.mjs) | 18910 | `eb88ac63f866fae784cf26b8dd814b3bf50da5a8a5f3704044230d71a56603a0` |
| E047 | [gauge/scale-study.mjs](gauge/scale-study.mjs) | 14656 | `da60447cd7555fad97115891c1ab0e4679fc1f663d84da4bb67a3269fd26dc21` |
| E048 | [gauge/spectral.mjs](gauge/spectral.mjs) | 11105 | `ef3cfcb950e26482739e2bb4ce2314a9a9b2d708122b2c41036968066b607d3e` |
| E049 | [gauge/study-record.mjs](gauge/study-record.mjs) | 5002 | `260f79ee5f3b52c500abb858cdf2e84126b815ec86962c4b309dfd7b5dd4ba51` |
| E050 | [gauge/study-review.mjs](gauge/study-review.mjs) | 6049 | `9ed1f1c1549d0cd7a54254827355934d3fbb7a0d86b4bbb5f784b5898cfef96b` |
| E051 | [gauge/su2-kernel.mjs](gauge/su2-kernel.mjs) | 14330 | `dc7a29773017ba52428c46755737940d8d07d50985f362624bf07a28108eabb2` |
| E052 | [gauge/tests/gauge-m3.test.mjs](gauge/tests/gauge-m3.test.mjs) | 15801 | `e946ffdad8e689a76c295ea938c96bc6d1f20abfc96bb81797be6735c4415a13` |
| E053 | [gauge/tests/lattice-observation-flow.test.mjs](gauge/tests/lattice-observation-flow.test.mjs) | 6142 | `48af2079b8fec60a43ea27ec88aad2a74c492ede52efe2d4fd4e11a8e5de150d` |
| E054 | [gauge/tests/scale-analysis.test.mjs](gauge/tests/scale-analysis.test.mjs) | 3883 | `897e33022ff9e1515b270c30fd1211b3994e08080039592fa87f9db148e68dbc` |
| E055 | [gauge/tests/su2-study-kernel.test.mjs](gauge/tests/su2-study-kernel.test.mjs) | 5560 | `a4d5317801638bb7cdd30babde96b2e1764ec691b18bfc135422c6a2c468a4e9` |
| E056 | [gauge/vacuum.mjs](gauge/vacuum.mjs) | 10216 | `6ed27df08fd69d05c14df632b4100c2bcdb132037a69759adcfb662d4377a407` |
| E057 | [gauge/verify_lean.py](gauge/verify_lean.py) | 6599 | `aa5f176d96e17d995daa707c624d77cd94ccb14ca4473e7f17ec7b2f141b52c0` |
| E058 | [gauge/verify_real_lean.py](gauge/verify_real_lean.py) | 11477 | `5116567220fba46bffe8c9bff354aa8f6d6fd65654cc0cc807b093dd996e9793` |
| E059 | [gauge/wilson-flow.mjs](gauge/wilson-flow.mjs) | 10262 | `38b11e8cea65280c43c7d5a4a824ab063d137c38e4c6b99d0fa2ca6e36f147cf` |
| E060 | [navier/SOURCE_RECONSTRUCTION_KO.md](navier/SOURCE_RECONSTRUCTION_KO.md) | 14106 | `e5bca98ad51d2b3e1e72cd7ea93ea2720b130f9c27a1622e8a6356020a4d52b5` |
| E061 | [navier/corrections.mjs](navier/corrections.mjs) | 22955 | `120c595312afb232138a4e23b26ae7a7de987aa15729af8fe9f50f5bccea2c8f` |
| E062 | [navier/evidence/N6-harmonic.json](navier/evidence/N6-harmonic.json) | 183762 | `c062d07837f7e13fabbab71e6e7ed38d916453779baa0afd60b013a620146562` |
| E063 | [navier/evidence/N6-moments.json](navier/evidence/N6-moments.json) | 8442 | `f81d008ca74cc4be147c648523d469e6e061b1bd5d4dd4adfae28c8148307e6f` |
| E064 | [navier/evidence/N6-signed.json](navier/evidence/N6-signed.json) | 6076 | `4880f1e72596f4cc5d7424b7af44704cceace1839faeb550bc72ab20eb7292ad` |
| E065 | [navier/evidence/N6-source-mean.json](navier/evidence/N6-source-mean.json) | 48954 | `445487febc8b71c352bd41595bfd331e46ca7a80d209bd9400591c8a5ee03ed9` |
| E066 | [navier/evidence/N6-workbench.json](navier/evidence/N6-workbench.json) | 62684 | `19a3e1120f5ecd734d877480ddb60f18bab41eb22f89e863f69512d1545550d9` |
| E067 | [navier/evidence/N7-periodic.json](navier/evidence/N7-periodic.json) | 5394 | `3dfec6b6c207da3373d50b25709a1c112fe13c47a65e379ac5dd3f702d740948` |
| E068 | [navier/evidence/N7-workbench.json](navier/evidence/N7-workbench.json) | 26238 | `8ddf1c4e79291c38993bb1707c7668e083e41475bb132103593edce2777203b3` |
| E069 | [navier/evidence/N8-TG.json](navier/evidence/N8-TG.json) | 83969 | `0e7168cf3c5c7d44bac56560fe293d16461c698899b8698c1e0f1f0dfddf8e6a` |
| E070 | [navier/evidence/N8-acceptance.json](navier/evidence/N8-acceptance.json) | 112069 | `f9cd254feb4179486732254804e2d547227a9eae1785fb959bed2cc5b36ea505` |
| E071 | [navier/evidence/N8-nearT.json](navier/evidence/N8-nearT.json) | 10627 | `a4770f90b44d56f5528c198942b40a089dcd27062322d6b88b43890f6f24ce76` |
| E072 | [navier/evidence/acceptance.json](navier/evidence/acceptance.json) | 8058 | `c5fd58431dd79791be60564cd207e6f63f1e351fda82908ff1592b6eb01f928d` |
| E073 | [navier/evidence/independent-numpy.json](navier/evidence/independent-numpy.json) | 914 | `8c92db3341050cae05b037c536a3fa0b77e4fd1a8509df81a0cb19271f8fb2d7` |
| E074 | [navier/evidence/source-current-20261012/current-signed-stress.json](navier/evidence/source-current-20261012/current-signed-stress.json) | 1945856 | `8cf28b1e96dd0f0964ea8cf9bc9556c3bf945cc1cc998bc81103b34e063c106a` |
| E075 | [navier/evidence/source-current-20261012/current-state.json](navier/evidence/source-current-20261012/current-state.json) | 168039 | `361d4f2a1b3ef30a26e84d96bd7c28cd1e29b8a36418dbf78c9ed3f0459d6af2` |
| E076 | [navier/evidence/source-current-20261012/fast-tests.log](navier/evidence/source-current-20261012/fast-tests.log) | 1937 | `6f9c18994e6386a0228677d816046a0c3d1b141fa1c8b9fa51006fd00302fc44` |
| E077 | [navier/evidence/source-current-20261012/full-pressure.json](navier/evidence/source-current-20261012/full-pressure.json) | 16479 | `2f149bc253668282684879d561338247c0d2dcf805a98c7c1a6c599f8fc100b4` |
| E078 | [navier/evidence/source-current-20261012/higher-pulse-jets.json](navier/evidence/source-current-20261012/higher-pulse-jets.json) | 1425164 | `4e6865ff830dd3369fbd7b0cb314c4e45c0cc49ee5247be2e8ec7de73cd71917` |
| E079 | [navier/evidence/source-current-20261012/source-current-execution.json](navier/evidence/source-current-20261012/source-current-execution.json) | 11552 | `3c24c84c3356b458d4866cf2008047ff809dfb0a51524caed1044c5c73334b21` |
| E080 | [navier/flow-observations.mjs](navier/flow-observations.mjs) | 10838 | `35af196af374197aec2600d58a9506ab92a7bcecc6321e83a6ec1ddb5ae733c7` |
| E081 | [navier/galerkin.mjs](navier/galerkin.mjs) | 19226 | `8be8c663346816cfd079702b07521ef3c4b106944ec1a047f36ec84d77dad787` |
| E082 | [navier/implementation-pin.mjs](navier/implementation-pin.mjs) | 2108 | `05bf99ee7b9f90a2296c4411f554fdbe7bf5c500bdda3ed04f183714de95e0ee` |
| E083 | [navier/index.mjs](navier/index.mjs) | 15264 | `8395b74896a551ee0c9dbc86d608c7ccd74a08ae452babac354fa0c64702d431` |
| E084 | [navier/localization.mjs](navier/localization.mjs) | 9727 | `1754c965e6cc977d1e304d16b8eb20578ff27e6158801ea426a4e94f29b090fb` |
| E085 | [navier/source-current-evidence.mjs](navier/source-current-evidence.mjs) | 15825 | `6a97c4e9b342e3d0271d6745c1c29ce9647f8ad32c367c661660f49da6bf4b60` |
| E086 | [navier/source-higher-jets.mjs](navier/source-higher-jets.mjs) | 22067 | `48434439e3f5969fa4b1c295cc6af5c5031fcf85da5d74a30b86db71b4e233e1` |
| E087 | [navier/source-inheritance.json](navier/source-inheritance.json) | 78056 | `9331db2e45701ac472b21ad179cd9c821aa1abc6674b1555650b63b6815c8ea6` |
| E088 | [navier/source-mean-map.mjs](navier/source-mean-map.mjs) | 11303 | `072f9cbaa7fedab6ea2cdb64158a7d5af3c3916685dfefeef65e977219ef09b7` |
| E089 | [navier/source-signed-stress.mjs](navier/source-signed-stress.mjs) | 19168 | `c0882d323cfb6f23fac966bf9fe86810a569ab5bde5ea2b020d062e6029b1dbd` |
| E090 | [navier/tests/build-source-current-evidence.py](navier/tests/build-source-current-evidence.py) | 6055 | `55e34daaa7e27b2ac2415ed8cebaa02a14ae6eb9707029e9b8870b405d128a78` |
| E091 | [navier/tests/build-source-inheritance.py](navier/tests/build-source-inheritance.py) | 5385 | `0a6911fc6c254df556257591323f9d316c0763884235f82dc93c1da6805f874e` |
| E092 | [navier/tests/flow-interface.test.mjs](navier/tests/flow-interface.test.mjs) | 3167 | `8cd9444d46ce31041f4453b594ff12bd5c20129b1dd9424bb46747f30e5903ce` |
| E093 | [navier/tests/flow-observations.test.mjs](navier/tests/flow-observations.test.mjs) | 4824 | `07862090e4c748ed2bfaae374e3b9c6d62c081e00559ac75274130b380f7738e` |
| E094 | [navier/tests/independent_numpy.py](navier/tests/independent_numpy.py) | 3179 | `040cf3c90ae4f240be3314c3cc019ab175f8bf7d96899f04743fb83012b28a9b` |
| E095 | [navier/tests/run.mjs](navier/tests/run.mjs) | 3270 | `0b3c0d2f0c1490288337c3f6e2f795060411f0454e53b5245fb5c8336143dda2` |
| E096 | [p7/ARITHMETIC_CERTIFICATES_KO.md](p7/ARITHMETIC_CERTIFICATES_KO.md) | 8377 | `ef6fb6890fb64dc453035198aa92116e076f9873341c03cbb10cdb070d81c9f2` |
| E097 | [p7/COMPLEX_CONTINUATION_KO.md](p7/COMPLEX_CONTINUATION_KO.md) | 9747 | `dbccf2fa387f3c28131ae384c3ba3e9683ee730217d486dc1871b69a5da0de68` |
| E098 | [p7/MODULAR_SYMBOLS_KO.md](p7/MODULAR_SYMBOLS_KO.md) | 7754 | `42e0d3149641fbb2c68559a8fac1c16449276edda52165705ad1f014e4c9d6c5` |
| E099 | [p7/OPERATOR_REGISTRY_KO.md](p7/OPERATOR_REGISTRY_KO.md) | 5926 | `8fa545c8ae8a3e42c1bca3104da80df102724ff368a9bf8ddead8babfa7e9b35` |
| E100 | [p7/RESULT_CLAIMS_KO.md](p7/RESULT_CLAIMS_KO.md) | 5063 | `b027ed3a8a120ba6dc371e100533f30a49987ce113b8b5ed5f06751bd0f05607` |
| E101 | [p7/elliptic_analytic.py](p7/elliptic_analytic.py) | 15809 | `b77ce56be3ee9ace1f76ec10ea088bccb9a7f1d583b9164542f9816a3ddb007f` |
| E102 | [p7/elliptic_arithmetic.py](p7/elliptic_arithmetic.py) | 25248 | `ac29e261acca0ec671cfa0286e201d23b46623671cda6ea735f8e6a27e06e154` |
| E103 | [p7/elliptic_complex.py](p7/elliptic_complex.py) | 9210 | `70bd068de7a8a54808be70f85700fc7fdc0f326276477cc49346b94467a06535` |
| E104 | [p7/euler_product.py](p7/euler_product.py) | 6289 | `531dadf3e3c06144de66473d0e5c204840e5adc76ebb05f70ae911f456bd051d` |
| E105 | [p7/evidence/arithmetic-20261012/unit-tests.json](p7/evidence/arithmetic-20261012/unit-tests.json) | 3318 | `e135c069203e52a42b160326ec088439aee0090cf11c0abce9ee03dc4d454ad1` |
| E106 | [p7/evidence/final-all64-20261012/attempt1/arithmetic-11a1.json.gz](p7/evidence/final-all64-20261012/attempt1/arithmetic-11a1.json.gz) | 9642 | `30197fef037cb3b264b595d500b7bb1bec3f498b5ca7cb0b7776209354ab4edd`<br>복원 `b0be8c96a2ab67bbf7cae8ca18494b48d5b8185e4de9bd22b26fb71b44ec45cc` (38742 bytes) |
| E107 | [p7/evidence/final-all64-20261012/attempt1/arithmetic-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/arithmetic-37a1.json.gz) | 59172 | `3d6f0c8d73587622d3bad2f89016d2700cb47dda952e6860efb04c72a9cad9c2`<br>복원 `61d3e2dea1f6dfac6857b8d9eb8b8095a540755de6273e15763d4a01ce88c70e` (302498 bytes) |
| E108 | [p7/evidence/final-all64-20261012/attempt1/central-11a1.json.gz](p7/evidence/final-all64-20261012/attempt1/central-11a1.json.gz) | 8173 | `b1b60ac311cf808645a3476c3e76a043536545d242fcca9c7373386c9926d0df`<br>복원 `5b8e8fc98d97b919db6428fb26d4301fa8d0461da4f84abf09c2949061ee3d07` (36747 bytes) |
| E109 | [p7/evidence/final-all64-20261012/attempt1/central-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/central-37a1.json.gz) | 8061 | `9665deac16eeb5303f92265444f4de132f1d105ae0ece6f5d643b9b0bc0452dc`<br>복원 `37e08bdffd6759d5049ad9f3e4aae7edb22c201a33f3bc1f7ede71631fc3e305` (36318 bytes) |
| E110 | [p7/evidence/final-all64-20261012/attempt1/complex-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/complex-37a1.json.gz) | 28249 | `baa9db49f9afbcf438aeb5a6703f04b76c541f015bd53cc64a259f35a547f43a`<br>복원 `1f5afd5ad0aab31aaa01da56989d78a9e03fda329e82152ebb926dfc6019a772` (220250 bytes) |
| E111 | [p7/evidence/final-all64-20261012/attempt1/complex-additive-32.json.gz](p7/evidence/final-all64-20261012/attempt1/complex-additive-32.json.gz) | 12940 | `0db1a56780902a6b463bd600311f2738ed0155ab099da1052933ca3403a7c672`<br>복원 `c29683edb0b7ca0bd3e64865a1390f47aa4bccc1b4aeab907226ab4039c78fd8` (85388 bytes) |
| E112 | [p7/evidence/final-all64-20261012/attempt1/euler-finite.json.gz](p7/evidence/final-all64-20261012/attempt1/euler-finite.json.gz) | 4259 | `89799cf8d4b2e7261c9d870e1c4cc0c2974d64b7a37f18369862e760724e0fb8`<br>복원 `a7b055f8536ce619dbf9e68f9b2b99e9c3f7d077a591d368a91a067bfde6bf22` (18668 bytes) |
| E113 | [p7/evidence/final-all64-20261012/attempt1/explicit-psi.json.gz](p7/evidence/final-all64-20261012/attempt1/explicit-psi.json.gz) | 970264 | `50f6c14521fc233038051b97e5ca7a4cccb056b9ea6c6f07640750fff48def41`<br>복원 `f6f5c2da1ef1c1c21eadd8bab003cc8032fe2db38b77a8b3a6a2454626e1647c` (13856484 bytes) |
| E114 | [p7/evidence/final-all64-20261012/attempt1/manifest.json](p7/evidence/final-all64-20261012/attempt1/manifest.json) | 134769 | `3c6e378b624a48ef0d03068d28b363e4e245266041d463770d308183a76d458d` |
| E115 | [p7/evidence/final-all64-20261012/attempt1/modular-11a1.json.gz](p7/evidence/final-all64-20261012/attempt1/modular-11a1.json.gz) | 8491 | `4fbc49f99c378f7c48ea0e4789bdde3ab10b110087b414f4803f84cd0f883a63`<br>복원 `403ebf8124d5bab8df06bae32c0e0bff26c06fb8d03451ae1e29e925602cfb93` (27672 bytes) |
| E116 | [p7/evidence/final-all64-20261012/attempt1/modular-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/modular-37a1.json.gz) | 8866 | `28a8671ca96d9f7f7b367f68c031b9024c3c95b8bd57f990a45070dd472c4220`<br>복원 `9de6144315630a86d9b8d3ec4f7a2f994fcb961d2dc781389fb5f1f735a8aaa9` (32766 bytes) |
| E117 | [p7/evidence/final-all64-20261012/attempt1/operator-reference.json.gz](p7/evidence/final-all64-20261012/attempt1/operator-reference.json.gz) | 7038 | `a6c6496775e6bc96f718dad8f8eea8140a389804c1cce55643184864b57e74e6`<br>복원 `183b74f71e8002f231dc618aa006f8c3a06f3e666ad4b4038332c3a72b1be838` (28595 bytes) |
| E118 | [p7/evidence/final-all64-20261012/attempt1/operator-registered.json.gz](p7/evidence/final-all64-20261012/attempt1/operator-registered.json.gz) | 9589 | `1ca0484eefa09cf65e11e050927f4179116e18253d7e15f8372b153d776e1a81`<br>복원 `7c7ad65e239dfcef9505aa380a04f838f6bd53f66443fb5620931611c84d4506` (138620 bytes) |
| E119 | [p7/evidence/final-all64-20261012/attempt1/typed-finite-20.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-finite-20.json.gz) | 434495 | `0fc7986d61a885e0a3a599ea7585981653283e68d948285d411bfc543a81e90f`<br>복원 `e3678d71bdb0ab79fcb836ccc490c6cee710b1489dd025421850db910995b7b1` (8054459 bytes) |
| E120 | [p7/evidence/final-all64-20261012/attempt1/typed-finite-field-copy.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-finite-field-copy.json.gz) | 4740 | `8de297e443c9adbd5d9531af1f48e2cdb187d0c914bf0ed376da058fcb8530d6`<br>복원 `05ba80be96479a950aa98b58343787396ed422876e957d05b5968c72578effd8` (13169 bytes) |
| E121 | [p7/evidence/final-all64-20261012/attempt1/typed-omitted-coefficient-prime.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-omitted-coefficient-prime.json.gz) | 68112 | `9b2d3f618aa1419069302a7fb4397fe888e16aa95c2751f65503d839ff8d92b0`<br>복원 `f0f3e40d3102b412ae347dfad6bc3dccbabd9dac50acc3e91933c9412abff0ba` (359248 bytes) |
| E122 | [p7/evidence/final-all64-20261012/attempt1/typed-omitted-zero.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-omitted-zero.json.gz) | 434582 | `dace822ad853a08562176a42733e3ed0c42d07fedf1b71ca3be45ab92d34f1ef`<br>복원 `c98579a505ab985b7af379218450947eb40cd1f185bc9e0fa7837006ed3691a7` (8054729 bytes) |
| E123 | [p7/evidence/final-all64-20261012/attempt1/typed-rank-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-rank-37a1.json.gz) | 67743 | `ce20d0d59e77afa0350875647f11349e4f8b0fb6e1510314fdd41091f2ee2750`<br>복원 `8bd1f8563ded094b4504f1a4614fca608949bdb5d03e707eb215d8571269c164` (356726 bytes) |
| E124 | [p7/evidence/final-all64-20261012/attempt1/typed-refined-37a1.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-refined-37a1.json.gz) | 68857 | `2612a5f0dc0c3a9cbe9d317b6fd231b3dd15e35c617505da59d5ba57ab4c7ab6`<br>복원 `ab8b0384d3c1d37e05d3d2b8064f3f3da22bd870e282cdf81f3a7290a31ff1b9` (361286 bytes) |
| E125 | [p7/evidence/final-all64-20261012/attempt1/typed-universal-open.json.gz](p7/evidence/final-all64-20261012/attempt1/typed-universal-open.json.gz) | 5724 | `d03adfe9a4a277614b5c8f5f7b5476db90c4300d4ffc7b23e09fdf2c3aecf108`<br>복원 `b9be315e21fdb5fcfdce1a305e79b14901c2de311ec74a7a5ff8065ef00bd716` (20860 bytes) |
| E126 | [p7/evidence/final-all64-20261012/attempt1/zeros-20.json.gz](p7/evidence/final-all64-20261012/attempt1/zeros-20.json.gz) | 415505 | `78bf0a3bb54736a0bde330a04296bff8b5cfb7e3051e6fc20c2daa60c5573030`<br>복원 `a905f494583e87434733cdc34b555675edd63b0651aa9cc7f0aadf6e873c5add` (7148400 bytes) |
| E127 | [p7/evidence/final-all64-20261012/attempt1/zeros-30.json.gz](p7/evidence/final-all64-20261012/attempt1/zeros-30.json.gz) | 701690 | `f211b4f1db38f7cfa810a460a9cef59900b88805ddfde11b0d9a532c01ea85e5`<br>복원 `f7c18ba0e8c8ca64822714f2af10076ee15d3c97c0273e25b63c907142330fcb` (12118254 bytes) |
| E128 | [p7/evidence/final-all64-20261012/attempt1/zeta-2.json.gz](p7/evidence/final-all64-20261012/attempt1/zeta-2.json.gz) | 4128 | `006cf1ee445d95e3ee5a29d77ec6abd025d0c69fab460fdc7cf86381d702684e`<br>복원 `d5a9991cb80b0695072d16b4e88dcb326af9b469da9e902184b94e224fc1fcc8` (12826 bytes) |
| E129 | [p7/evidence/final-all64-20261012/attempt1/zeta-em-critical.json.gz](p7/evidence/final-all64-20261012/attempt1/zeta-em-critical.json.gz) | 16380 | `3fbc69393e2def7cb6bf3b9464e5e3d59725379146aaf0605505ade9044c6339`<br>복원 `bcaf1c59e155de130b53bb9b0b1421a490c8f70a16bbe1dd96c9b7fa739e8e46` (132675 bytes) |
| E130 | [p7/evidence/modular-symbols-20261012/receipt.json](p7/evidence/modular-symbols-20261012/receipt.json) | 7252 | `f9c55715af4d2307c95496ee6c4f8fe2ff4253454bd2be819748492a04cd7868` |
| E131 | [p7/evidence/pari-runtime-20261012/receipt.json](p7/evidence/pari-runtime-20261012/receipt.json) | 5090 | `b477d8767b51f448ca8a7dc9e4eb7915eeed69c074ca23add5e6cf3fbc8904b6` |
| E132 | [p7/evidence/research-export-20261012/audit.json](p7/evidence/research-export-20261012/audit.json) | 3819 | `00f69a0a23627d2f808a2db0193958cacc8cae4bcb999851585a8c94319429a0` |
| E133 | [p7/examples/finite-zero-20.json](p7/examples/finite-zero-20.json) | 200 | `840616c7a71ef28818c961d99d65bc3ff60f1e14394cafe89204d5101fe1ba7a` |
| E134 | [p7/examples/refined-37a1-conditional.json](p7/examples/refined-37a1-conditional.json) | 203 | `2db1dc8a88e672607cd3cb0e873a099e22f3b20ba1690f807d549c59fb8e182b` |
| E135 | [p7/examples/registered-operator.json](p7/examples/registered-operator.json) | 6924 | `7bba02e00b382d1299206c8cc6928999077efab5ea0ca96b51d599a9a2849067` |
| E136 | [p7/examples/reject-finite-field-rh-copy.json](p7/examples/reject-finite-field-rh-copy.json) | 301 | `ff8eaed77ffd52f6ee3cd497ed4b1ab7b40639dd1da6c32dc4b097ed14b16071` |
| E137 | [p7/examples/reject-omitted-coefficient-and-prime.json](p7/examples/reject-omitted-coefficient-and-prime.json) | 1260 | `0f5837b547928c7ce9ae9c73899e798a1f7cb537b29aa701875a42cd5ef59971` |
| E138 | [p7/examples/reject-omitted-zero.json](p7/examples/reject-omitted-zero.json) | 328 | `02ac1169af0854603c18e94f52ee1ae31a37900a9fdeae50ab683304fd2d5f40` |
| E139 | [p7/examples/specific-rank-37a1.json](p7/examples/specific-rank-37a1.json) | 173 | `afc96a3e2929817fca0831892ab699b18561eb5bc36c8f8de925eb7070ae941c` |
| E140 | [p7/examples/universal-bsd-research.json](p7/examples/universal-bsd-research.json) | 149 | `aa4421cd19be04580428a2768fc2deea3a4809715878b7fd70427c3f45016c7c` |
| E141 | [p7/explicit_formula.py](p7/explicit_formula.py) | 16522 | `a3c7f5a6056156ad3094a54f0000a04e08ee316bf302f445c2b1ee6327216961` |
| E142 | [p7/height_certificate.py](p7/height_certificate.py) | 17417 | `c02e78fa1fdef0832e062b0e097eda2debf0c20ab833eafbed92b41a222d0aa9` |
| E143 | [p7/modular_symbols.py](p7/modular_symbols.py) | 25099 | `01c810b86ccd6daa496264536af0fd6a61966c4c6d5a56ff4234c855c1ebb7b9` |
| E144 | [p7/normalization.py](p7/normalization.py) | 4818 | `86d8f8dd32fa4cb02926c410b1eca56af8ab75dd0738360659efe2eeb5f50770` |
| E145 | [p7/operator_candidates.py](p7/operator_candidates.py) | 19662 | `7a1b8a8786b726fbf7ac94b2b78d6ca163f45750ac6e465be8a742027ba731c5` |
| E146 | [p7/operator_registry.py](p7/operator_registry.py) | 21755 | `c7d6bbbc1f46ca1bc3765147b57a3f3e8c13d193fc250a9a0011b2d67ed73026` |
| E147 | [p7/pari_backend.py](p7/pari_backend.py) | 15550 | `5a446e441830650c792d3ce779cf78b58c2ea0355427003fd991978cc857bac8` |
| E148 | [p7/period_certificate.py](p7/period_certificate.py) | 7668 | `30da2f2a41a49756b948f9c282a08de0c2d35278ef9b9d2411b424db49d731e8` |
| E149 | [p7/result_claims.py](p7/result_claims.py) | 20043 | `808fb7746a579a9ff522d8e17bba30fcf2c92eae5009ce703a3fe6fe3121d4f5` |
| E150 | [p7/tests/test_elliptic_arithmetic.py](p7/tests/test_elliptic_arithmetic.py) | 13129 | `5b6da96be6288880504299a9ec47cff20a11c8dd57cd47df5d3096b53fee63b6` |
| E151 | [p7/tests/test_elliptic_complex.py](p7/tests/test_elliptic_complex.py) | 6568 | `4b53b19aa9891f7bf9e9e67c7ff8dc2e244f09d76e3c2a41845da23a6a2ae648` |
| E152 | [p7/tests/test_modular_symbols.py](p7/tests/test_modular_symbols.py) | 11068 | `2d4236a5a2117c725a17764ecedba544ad634bc3a919ed01512b9a69a10f9e3b` |
| E153 | [p7/tests/test_operator_candidates.py](p7/tests/test_operator_candidates.py) | 5445 | `b6fe7cfeedd12bb6f2f025c4ca3a6cbb84299e57e8286619d618eb22afa43e6a` |
| E154 | [p7/tests/test_result_claims.py](p7/tests/test_result_claims.py) | 9196 | `e209a35fc824d96c14f608a93b8721dde65528ea0854f14a0fce9a4da9ab2048` |
| E155 | [p7/tests/test_zeta_em.py](p7/tests/test_zeta_em.py) | 4509 | `452193bf764561fd5fce611a6ad332fd12b20d84f2590cef5297ff620c9c8525` |
| E156 | [p7/zero_certificate.py](p7/zero_certificate.py) | 21621 | `3d0355994605d7203b5f9b35d22ffe3ae97aadd26e65c8b6eb6c20c0a929a1ba` |
| E157 | [p7/zeta_em.py](p7/zeta_em.py) | 11215 | `1e6c73cda3aedf94e6db4962199d001511782bab2e1ea8ebccf041b6084452d8` |
| E158 | [p8/evidence/conditional-lean-release.json](p8/evidence/conditional-lean-release.json) | 5800 | `d9793a3a4242c8dd06c0ae89ca928eddff3df7bbfb9b0cc88624a4b2c0a3fa0e` |
| E159 | [p8/evidence/conditional-local-20261012/receipt.json](p8/evidence/conditional-local-20261012/receipt.json) | 4361 | `5abd83b35420bf6b32edf3d07ae3bfd8d9e69467e7ad0819fda699a69294e16f` |
| E160 | [p8/evidence/lean-attempt7-38213076249.zip](p8/evidence/lean-attempt7-38213076249.zip) | 544101 | `b2373daa628b2bd736f7a45ef6970b9c473e5b06841a0ab514aeb6a8f7635b91` |
| E161 | [p8/evidence/lean-release-provenance.json](p8/evidence/lean-release-provenance.json) | 1097 | `d9f2809f7bab440d8643bd9517ebd5709324d8c4c2facb1004ba9bb7f49b39f5` |
| E162 | [p8/evidence/lean-release.json](p8/evidence/lean-release.json) | 25666 | `6dfbda277e97d50a77e52fe4250548ee2b4e1db24ec3dcc342cc7c740ed08d3f` |
| E163 | [p8/evidence/p7-mutation-arithmetic-20261012-attempt1/process.json](p8/evidence/p7-mutation-arithmetic-20261012-attempt1/process.json) | 5047 | `a2aa887aaa47452bab149ecebc95ae8e7a9e935881b28d69a7009ebb5a000587` |
| E164 | [p8/evidence/p7-mutation-arithmetic-20261012-attempt1/report.json](p8/evidence/p7-mutation-arithmetic-20261012-attempt1/report.json) | 34221 | `86e2109fafbaf6ade4b8d4f71fdfc89d136c9ec83f1158f756d890a6cabadaf0` |
| E165 | [p8/evidence/p7-mutation-release.json](p8/evidence/p7-mutation-release.json) | 29118 | `7871d7f89f395916952e3f21261d7d4e7bbf3bcb1378db1f7245b8b1ebc4fc28` |
| E166 | [p8/evidence/p8-live-v87-20261012.json](p8/evidence/p8-live-v87-20261012.json) | 102744 | `e6e1095bea78d9c3d22a124d1fa5bff1406ba5eb140dcbb0d3388e482688d0a5` |
| E167 | [p8/evidence/p8-local-acceptance-20261012.json](p8/evidence/p8-local-acceptance-20261012.json) | 28292 | `21830db348976f74b12eff9e4b150c78119351f04a44fcf6394f3cb6cd00551d` |
| E168 | [p8/evidence/p8-renderer-local-20261012.json](p8/evidence/p8-renderer-local-20261012.json) | 2716 | `b4b10655d5167f755c752cc5a4b3a3f09e52eb73d372f53aa7f72166f779b520` |
| E169 | [p8/review-fixture-evidence.json](p8/review-fixture-evidence.json) | 94979 | `2fdd9d17d1434a5626e8a63bab9362a0b8a9e301f8a01a21afbff9c7ce3aaaa3` |
| E170 | [p8/review-packets.mjs](p8/review-packets.mjs) | 5546 | `21843b4020866ce2c624ca9f14a4eaf2f7c2aa61fac577fd243361987caa9813` |
| E171 | [p8/theorem-backlog.mjs](p8/theorem-backlog.mjs) | 9515 | `c41b33ae0b960493ace981619bfc4bb6f5850fb95b28b9f1665a0716a5f44ca2` |
| E172 | [p8/tools/audit_p7_mutations.py](p8/tools/audit_p7_mutations.py) | 13738 | `b84dc4abea84c109fed164d266c8d5ec197a28e6384409dae9b6c990a62bbb40` |
| E173 | [p8/tools/test_conditional_audit.py](p8/tools/test_conditional_audit.py) | 3107 | `d2a89e8950f47c6fb4676226fecf58297fecd6ab862e2c4bd84481e30205a0d3` |
| E174 | [tests/p8-candidate-search.test.mjs](tests/p8-candidate-search.test.mjs) | 7866 | `38c2b3d9b7b8385831a2c0ddfe84206847fc38c4daba6ddd92b62f98b4bdbcc4` |
| E175 | [tests/p8-contracts.test.mjs](tests/p8-contracts.test.mjs) | 16799 | `23501ba7c05f7bcff41dc6b6790ba85f49f7c4ab6fbba1823aec7cd6d18591d4` |
| E176 | [tests/p8-mutation-audit.test.mjs](tests/p8-mutation-audit.test.mjs) | 8456 | `07bee26d06a72426f2ed440b154682978dc4da556443ed67281091cc495b0be8` |
| E177 | [tests/p8-visual-models.test.mjs](tests/p8-visual-models.test.mjs) | 6557 | `b21807f7095d7fa604f9460da40b2f6a0d60abaf5d55bc11e5287ffdfee449d1` |
| E178 | [tests/p8-visualization.test.mjs](tests/p8-visualization.test.mjs) | 15930 | `e0b14c5473db42c1c8e091af5d8492c1691d4d255ce0af47b6e17e10a58e28ac` |
| E179 | [tests/test_p8_p7_mutations.py](tests/test_p8_p7_mutations.py) | 10563 | `cce4a0377098d32154eab27067e1fe7790ff6e13f66df5fb8e630378aeebdc03` |
| E180 | [web/build_extended.py](web/build_extended.py) | 9401 | `a173f9c23c3036f8de1db94cc978f4e2dcd2b6df3f057e5688a4761620e862f5` |
| E181 | [web/extended-view-contract.mjs](web/extended-view-contract.mjs) | 7850 | `3c14a9f0a7e72fbe75d6dbe6f24202d3174acb2ebbb251c967e007da825673c2` |
| E182 | [web/gauge-study-view.mjs](web/gauge-study-view.mjs) | 11929 | `3f4486b352fa13f0d4d02891e3796838dbe074f9b3d90d478de0c6994d402df5` |
| E183 | [web/tests/extended-worker.test.mjs](web/tests/extended-worker.test.mjs) | 7184 | `2bfa571eacf8e408636f60afee42d440fa0ec06d9418db88c04e437f992c6ff6` |
| E184 | [web/tests/test_extended_build.py](web/tests/test_extended_build.py) | 6929 | `2fb6f4fe842b9c63b027a93f15caaa3c9a20c4f1fa3d870cbf5a1e6bef32c057` |

### 7.1 추가 읽기 전용 수치 교차검토: N8 시간 refinement

완료된 N8-03의 에너지 시간 차수를 점검하기 위해 실제 `integrateGalerkin`을 `cutoff=2`, `endTime=.5`, `fixedStep=true`, `initialStep=.1,.05,.025`로 실행했다. 세 실행은 모두 FINITE_RUN_COMPLETE, 최종 시간 .5였다. 함수와 benchmark 범위는 [E081](navier/galerkin.mjs)에 고정한다. 다음 값은 이 검토 중의 local Float64 관찰이며 CI receipt나 rigorous enclosure로 표시하지 않는다.

| dt | E(T)=Σ coefficient²/2 | exp(−2)/4와의 절대 오차 | 다음 refinement 관측 차수 |
|---:|---:|---:|---:|
| 0.1 | 0.033607658187327964 | 0.00022616262182521135 | 2.0028945035119854 |
| 0.05 | 0.03377739347845149 | 0.00005642733070168604 | 2.000721915274009 |
| 0.025 | 0.03381972103367981 | 0.000014099775473362663 | — |

기존 acceptance 및 독립 NumPy도 direct/FFT retained convolution, aliasing 거부, Taylor–Green 시간/에너지 검사를 제공한다. 그 periodic benchmark의 성공을 N7의 원래 localized field의 global energy로 치환하지 않는다. [E070](navier/evidence/N8-acceptance.json), [E073](navier/evidence/independent-numpy.json)

## 8. 후속 최종 증거를 반영하는 방법

다음 순서로만 보고서를 갱신한다. 이 절은 현재 진행표를 수정하라는 실행 기록이 아니라 이후 실제 관문을 수용할 때의 절차다.

1. **실제 증거를 동결한다.** CI run/checkout/artifact/log SHA, API의 입력·현재 source epoch·출력과 별도 fresh replay, 공개 page version/source/result·case·스크린샷/로그를 새 경로로 보존한다. 역사적 attempt/receipt와 기존 56개 보고서를 덮어쓰지 않는다.
2. **원문과 직접 대조한다.** §4의 해당 ID에 필요한 실수치·실패 사례·scope label·선택·export/replay를 그 증거에서 확인한다. 각 행의 domain, model/cutoff, assumption, 오차 종류와 연구 한계는 유지한다.
3. **14개 whitelist 안에서만 상태를 바꾼다.** P7-01…08, P8-06, Y5-05/06/08, N8-06/07 중 실제 충족된 행에 한해 소유자가 `originalCriterionComplete`와 status/remaining/evidence를 함께 갱신한다. 전부를 일괄 true로 바꾸지 않는다.
4. **보고서에 승인 근거를 추가한다.** §4의 “미수용”을 정확한 receipt 경로/hash·commit·case와 승격 ID로 바꾸고, §6 해당 행의 새 상태/근거 및 §1 집계를 갱신한다. 이전 31/14/19 snapshot은 아래 개정 기록에 남긴다. 갱신된 진행표 SHA와 새 evidence 원장도 기록한다.
5. **19개 실질 잔여는 별도 검토한다.** 해당 구성·계산·전역 증명/오차 의무가 실제 수행되었다는 새 증거가 있기 전에는 UI나 CI 배포 통과를 이유로 이 행을 승격하지 않는다.
6. **수와 원문을 다시 검증한다.** 전체 ID가 여전히 정확히 64개인지, 완료+대기+실질잔여=64인지, 정확한 title/text/page/PDF SHA가 유지되는지 확인한다. 기존 `M3_REVIEW_KO.md`의 SHA도 다시 비교한다.

### 8.1 개정 기록

| 개정 | 기준 source commit | 완료 / 대기 / 실질 잔여 | 최종 관문 수용 |
|---|---|---|---|
| ALL64 검토 1 | `a12d95b9b466aab187d6afcca089b0ac7685dc27` | **31 / 14 / 19** | 이 보고서에서 새 CI/API/UI 완료 승격 없음 |

### 8.2 반드시 분리해서 유지할 최종 의미

| 질문 | 이 snapshot의 답 |
|---|---|
| 원문 M3 64개가 모두 완료되었는가? | **아니다. 31개 완료, 33개 false다.** |
| 최종 검증 대기 14개는 이미 실패했는가? | 아니다. 현재 구현/실행 근거가 있고 지정 마지막 관문의 수용을 기다린다. |
| 남은 19개는 전부 단순 UI 작업인가? | 아니다. 실제 source 구성·계산과 그 전역 증명/오차 의무가 남는다. |
| universal RH/BSD, continuum YM 및 uniform positive gap을 증명했는가? | **아니다.** 유한·조건부·연구 타입과 OPEN 의무를 보존한다. |
| 원래 Navier 전체 local/global field와 blowup 경로를 완전히 구성·인증했는가? | **아니다.** 실제 선택 source 구성은 전진했지만 초기화·전체 보정·합성·국소화 이후 의무가 남는다. |
| 새 수치 archive 화면은 새 chain 실행인가? | 아니다. 원래 실제 실행의 source/data가 일치하는 저장 기록이며 새 실행 여부를 별도 표시한다. |
| source SHA 일치 또는 Lean 가정 export는 그 자체로 새 정리인가? | 아니다. 원래 실행/정리의 source·가정·model/cutoff와 실제 kernel receipt가 필요하다. |

