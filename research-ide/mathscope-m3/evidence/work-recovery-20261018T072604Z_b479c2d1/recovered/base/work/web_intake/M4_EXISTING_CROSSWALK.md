# 현행 사이트 M4·R1과 원래 16조건 대응표

2026-10-18 읽기 전용 검토. **기존 구현·과거 증거는 상당 부분 남아 있으며, 현재 릴리스의 M4 완료 수는 재판정하지 않았다.** 미검증을 0/16로 표시하지 않는다. 사용자 순서인 **M3 64/64 → M4 → 게시**를 유지한다. root의 최신 전달에 따르면 M3 수치 gate 두 개가 남아 있으므로 사이트 수정·게시·새 M4 실행을 하지 않았다. 브라우저 연결 timeout 이후 다른 환경으로 대체하지 않았다.

요청 경로 `work/m4_criterialedger`는 없어서 실제 준비 장부 `work/m4_criteria/M4_ACCEPTANCE_PREPARATION_LEDGER.json`과 `M4_ORIGINAL_CRITERIA.json`을 사용했다. 비교 대상은 앞서 확보한 target v117(`d7474dd6`), HTML SHA `600703e1bf0d40d901c4cae1cb40e48822935b11b430bf8ce1fc601eea9200b1`의 inline M4/R1 데이터와 코드다. 추가 네트워크 요청이나 사이트 코드 실행은 없었다.

## 기준·manifest·실제 source의 결속

원 설계도 SHA `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`는 준비 장부와 사이트 양쪽에서 일치한다. **I3-01…08 및 R1-01…08의 ID·제목·쪽수·본문은 공백 차이를 제외하면 모두 동일**하다. 기준을 새 요약으로 대체하지 않았다. M4 panel의 별도 public baseline SHA는 `6189fd98be1bcd857f9b4c65f980746b15ab4dd95d64c4b2a3d1fe9655056eb9`이며, 이는 원 설계도 SHA가 아니다.

| 실제 정적 확인 | 결과와 의미 |
|---|---|
| M1 inline `WORKER_SOURCE` | JSON 문자열을 decode한 871,162 bytes의 SHA `0526fb1030c328e940c39672e86dfb9d24f09f4622794269c1e0eadbb92cc0ca`가 inline 상수 및 과거 R1 fixture receipt와 일치 |
| M2 inline `WORKER_SOURCE` | 3,998,124 bytes의 SHA `c34ab138ca5e088a4bb0a4564b8401b3caf384af4801d47eeb16088d8c4f8bb8`가 inline 상수 및 과거 R1 fixture receipt와 일치 |
| R1 catalog | embedded catalog를 원래 `JSON.stringify(...,null,2)+LF` 형식으로 복원한 21,127 bytes의 SHA `1d7dc292a72355bf8167bfba31ec41e7f1ac7aa32993e83cac71dc0ea5dc52dd`가 receipt와 일치. 문자열 직렬화·해시 계산만 수행 |
| 생성 Lean source | embedded `Generated.lean` 바이트 SHA `43cdc79ccee212a9152d90de8f58504bc9bff224da02c9d039183b01d7e247c6` 일치. 새 compile은 수행하지 않음 |
| 학생·전문가 설명 | 저장된 11개 claim에서 claim ID, scope, assumption IDs가 두 모드 사이에 동일. 현재 UI 동작을 관측한 결과는 아님 |

이 확인은 **정확한 바이트 동일성**이다. 당시 환경·결과·외부 receipt의 원문을 이번에 재검증했거나 현 브라우저에서 실행했다는 뜻은 아니다. 과거 source 결속을 보존해 필요한 검증만 이어갈 근거로 사용한다.

검토한 블록에는 최종 16조건 전체 인수를 부여하는 accepted manifest가 없다. 실제 있는 것은 expected 값과 예산을 가진 fixture catalog, 날짜가 명시된 scoped verification, kernel readback, 원래 기준 표시용 manifest이다. R1 verification의 `allOriginalR101Accepted`, `allOriginalR102Accepted`, `externalReaderR107Verified`, `wholeM4Complete`는 모두 false이고, kernel도 `originalCriteriaFinalAcceptance:UNCONFIRMED`, `grantsM4FinalAcceptance:false`, `publicationConfirmed:false`이다. 이 false는 과거 작업 전체를 취소하거나 현재 완료 수를 0으로 세는 근거가 아니다.

## I3 형식화·증거 관문

아래의 “구현/저장 증거”는 현행 원문에 존재하는 기능 또는 보관된 기록이다. “남은 확인”은 현행 릴리스에 대한 인수 근거가 이번 검토에서 확보되지 않았다는 뜻이다.

| 원래 조건 | 기존 구현·저장 증거 | 현행 릴리스에서 남은 확인 |
|---|---|---|
| **I3-01** 모듈·가설 분리 | Conditional source 경로, `USER_AXIOM_CONDITIONAL`, `assumedComplete` 의존성과 unconditional 제한을 공개한다. foundation은 verifier의 승격 권한을 구분한다. | Defs/Finite/Analytic/Comparison/Conditional/Open의 실제 import closure와 전이적 사용자 공리 포함 시 unconditional build 거부. 표시된 source 경로만으로 모듈 분리 완료로 세지 않음 |
| **I3-02** 유한 대수 형식화 | delta numerator, 고정 d², scalar chain map, 30 미만 소수, bracket/Jacobi, shear plaquette의 target type·axiom·범위와 과거 negative 기록이 있다. | 정확한 현행 Lean source/환경/fixture와 잘못된 certificate 거부를 연결. scalar·identity fixture를 일반 semilinear·lattice 전칭 결과로 확대하지 않음 |
| **I3-03** 해석 가정 | PrecisionMetric 균등수렴·모든 근사함수의 균등연속·공통 N 등 양화 범위와 counterexample 조건이 있다. | 실제 선택 릴리스의 실수 norm·정의역·무한합 미분/극한 교환 adapter. 저장된 추상 연속성 정리는 derivative-limit interchange를 증명하지 않음 |
| **I3-04** 외부 정리 adapter | 정확한 exported continuity target·type·동일 가정을 표시하며 prism/BSD/NS 문헌 링크가 그 kernel 결과가 아님을 구분한다. | 각 실제 reference/import의 source 연결. Stage6 optional promotion guard가 없는 경우 통과하는 인접 패턴을 새 연결에 재사용하지 않음 |
| **I3-05** source 재검사 | GeneratedProofJob은 G·Δ·p·정밀도·계수·가정·source SHA를 결속한다. 생성 source 바이트 hash는 이번 정적 검토에서 일치한다. | 현행 한 글자 source 변조 후 기존 PASS 거부 실행. bound parameter 이름이 finite Int⁴ target의 수학적 범위를 넓히지 않음 |
| **I3-06** kernel·공리·build 감사 | 날짜별 Lean/mathlib pin, target type, axioms, 음성 대조 source/log SHA가 저장되고 UI가 kernel JSON을 표시한다. | 서로 다른 환경 receipt를 합치지 말고 현행 toolchain·로그·warnings/sorry·axioms·거짓 rfl을 확인. 이번 Lean 실행 없음 |
| **I3-07** 연구 관문 | RH/BSD/general-G continuum YM/new prism/derivative-limit adapter가 OPEN이며 사용자 공리와 모든 original-acceptance 비부여가 드러난다. | 순환 가정·이름만 붙인 의미 인터페이스가 연구 관문을 닫지 못하는 현행 거부 검증 |
| **I3-08** 설명·감사 동기화 | 11개 학생/전문가 claim의 ID·scope·assumption IDs가 정적으로 동일; 전문가 type·axioms·반례 조건 보존 | 선택 릴리스 전체 claim 범위 및 실제 두 모드 UI에서 양화사·조건·근사 범위가 유지되는지 확인 |

M4 panel의 `ms-m4-data`에는 이전 local replay의 Mathlib import 실패와 4.34.0-rc2/4.34.1 불일치가 남아 있다. R1의 `ms-r1-data`에는 그보다 뒤인 **2026-10-13 18:26 core receipt**가 있으며, mathlib 없이 추상 PrecisionMetric 연속성 등 제한된 target을 기록한다. 두 기록은 날짜·source·범위가 다르므로 하나의 실패 또는 하나의 성공으로 덮어쓰지 않는다.

과거 hosted run `38394604031`과 `38394614544`는 Lean 4.34.1/mathlib를 기록한다. 두 번째는 head SHA `f1206131fb87c929d89b5fcc8edf248e66692ac0`와 source commit `ef7a21f39b5caf5caa88588fcd8340316208df6b`를 별도로 가진다. 이를 동일 commit인 것처럼 정규화하지 않는다. 외부 원본 로그의 재인증은 이번 범위 밖이다.

## R1 통합 재현·릴리스

| 원래 조건 | 기존 구현·저장 증거 | 현행 릴리스에서 남은 확인 |
|---|---|---|
| **R1-01** 기준 예제 재현 | point/P¹/E/SU2/SU3/G2/heat/exterior/axis/Taylor–Green 및 prism/Δ/lattice의 13 fixture catalog, bounded fresh-engine 실행 코드, 날짜별 input/result/worker hash·불변량 기록. 현재 worker/catalog 바이트가 기록과 동일 | 기록 자체가 원래 R1-01 전체 인수는 false로 한정. 현행 환경·선택 scope·오차를 실제 인수 manifest와 맞추는 확인 필요. fixture는 전체 원래 NS field 실행이 아님 |
| **R1-02** 독립 정밀도·해상도 | p-adic N, tail degree, radial count, lattice spacing, lattice extent, Δ samples의 여섯 축과 원자료 표시. exact/local-tail/sampling/trivial identity 등급을 구분 | sourceRefinement는 pre-temporal 꼬리 배율 기록일 뿐 fresh Fourier sum·최종 field·active cutoff·4축 완료가 아님. 실제 인증 경계 위반 및 ensemble 통계 조건의 현행 증거 필요 |
| **R1-03** source→그림 추적 | sample inspector가 원식·논문 위치·claim/job·input/worker/env/result SHA·sourcePath·raw value/error를 표시; M3 artifact inspector도 존재 | NS 원문 계수, prism 비교사상, Δ generator의 세 end-to-end 경로를 실제 UI에서 확인. 공개 링크와 실제 final-field 동일성은 별도 |
| **R1-04** 변경·세션 회귀 | per-fixture revision, stale export 거부, 다른 import 입력 분리, cancel/resume/replay, 편집 입력 보존, M4 import quarantine 코드 | 계산 중 입력 변경 race, 정확한 downstream 범위, 취소/재개·교차입력 import의 실제 현행 회귀 관측 |
| **R1-05** 화면·접근성·성능 | 키보드·표 대안·reduced-motion·WebGL fallback·dispose·표본 예산 구현 | desktop/mobile·focus·clipping·빈3D·overlay·CPU fallback·지연·메모리 실측. 브라우저 연결 불가이므로 현재 인수 없음 |
| **R1-06** 증거 공격 | replay trust/schema/hash guard와 verifier 권한 분리; false/prime/matrix 및 M3 변조 대조의 과거 기록 | 위조 PASS/hash/theorem type/prime/force/cutoff의 전체 현행 공격을 실제 주입하고 이유·기존 관측 보존 확인. 일부 과거 대조를 전체 suite로 승격하지 않음 |
| **R1-07** 외부 사용자 walkthrough | 설명·입력·source 링크·실행·export/replay 재료가 있다. 기록은 외부 독자 검증 false를 명시 | 네 walkthrough를 다른 사람이 문서만으로 재현하고 결과·미해결 가정을 확인하는 관측 필요 |
| **R1-08** 범위별 release | M4 UNCONFIRMED, scoped non-grant 상태, 기존 공개 HTML snapshot과 source manifest를 보존 | M3 64/64 선행 충족, 이후 M4 선택 scope 인수, patch/test/rollback 준비, **실제 게시 후 화면** 확인. 현재 published 상태는 과거 사이트의 상태이며 이번 작업 완료가 아님 |

R1 historical verification은 2026-10-13에 Node v24.18.0, win32/x64, source commit `f1206131fb87c929d89b5fcc8edf248e66692ac0`를 기록한다. `script-35.js`의 current UI는 별도의 fresh browser engine을 생성하도록 작성되어 있으나 이번에 실행하지 않았다. Node로 catalog를 직렬화·해시한 것은 이 실행실을 구동한 것이 아니다.

## 게시 준비 시 보존할 경계

기존 56/64와 integrated 57/64는 날짜가 붙은 과거 snapshot으로 보존하고 최신 M3 gate는 별도 현행 receipt에 결속해야 한다. M4 view export는 인수 권한을 담지 않으며 import는 quarantine을 유지한다. source-only 압력/수식 node ID, pre-temporal 꼬리 막대, 지수 비교를 실제 공간 속도값으로 바꾸지 않는다.

M3 선행 조건을 충족한 뒤에는 이번에 확인한 source/hash 일치를 활용해 정확히 같은 scope의 과거 증거를 조정·승계하고, 현재 환경·추가 source·누락된 UI/공격/외부사용자 검증만 구분해서 수행할 수 있다. 전체 code 개편, 새 페이지·자산 추가, 유료 변경은 준비안에 없다. 실제 patch 직전 version hash 재조회와 게시 후 승인된 브라우저 확인이 필요하며, 그 전까지 새로운 M4 실행 PASS나 배포 완료 수치를 발급하지 않는다.

모든 16개 원문·준비 장부의 required evidence·site checks·해당 코드 위치·source SHA는 `M4_EXISTING_CROSSWALK.json`에 보존했다. 기존 준비 장부와 사이트 source는 수정하지 않았다.
