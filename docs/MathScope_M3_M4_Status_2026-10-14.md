# MathScope M3 M4 작업 상태 2026년 10월 14일

운영 웹에 실제 계산·재현 작업대를 추가하고 GitHub에 소스와 검증 기록을 저장했습니다. **원래 M3 인수는 56/64이며 남은 8개는 아직 완료되지 않았습니다. M4 I3/R1 전체 최종 인수도 미확인입니다.** 새 기능의 실행 성공과 원래 수학 관문의 완료를 구별합니다.

운영 웹: [MathScope v0.3.1](https://project29770.websitepublisher.ai/v0.3.1.html) · 게시 판본 **v106 / `20181a02`**. 소스 검토: [PR #23](https://github.com/leegahuyn/MathScopeCompute/pull/23), 작업 브랜치 `mathscope-m3-m4-20261014`. 이 상태 문서의 점검 기준 커밋은 `0c4b3fe2a8e392283cc9c5486e4bac30407d64fb`입니다.

## 이번에 실행하고 저장한 범위

- **13개 fixture:** 점, P¹, E/F₅, SU2/SU3/G2, heat, r>0 외곽, 명시적 rational-pressure 국소 축 해, 별도 Taylor–Green PDE, prism 비교 모델, Δ 고전 상태족, identity 격자. 각 계산을 새 isolated Worker와 소스 모듈에서 실행하여 입력·수학 결과 hash 및 불변량을 대조했습니다. 13/13 통과입니다.
- **6개 독립 비교축:** p-adic N=4/8, 축 tail degree=8/16, 외곽 radialCount=3/6, 고정 Ns에서 lattice a=0.5/0.25, 고정 a에서 Ns=2/3, Δ grid=3/5. 6/6 비교 검사를 통과했습니다. 축의 정확 생략 tail은 감소 상계이며, 외곽·Δ는 표본 검사, identity 격자는 평평한 유한 대조입니다.
- **새 커널 claim 11개:** 유한 δ·d²=0·identity semilinear map·작은 소수 목록·2×2 정수 행렬 bracket·shear plaquette·생성된 정수 벡터, 조건부 uniform-limit continuity와 정확한 import adapter, 사용자 공리의 명시적 조건부 예제를 제공합니다. 승계 target을 포함한 새 로컬 실행은 14개 target, exit 0입니다.
- **재현·관측 기능:** 원식과 소스, 실제 job/hash, 원시 값과 오차까지 연결하는 inspector, 입력 변경의 STALE, 취소·중단 입력 재개, export/import 후 새 계산, 위조 상태·다른 입력·소스 거부, 표본 선택용 브라우저 도구를 추가했습니다. 런타임 회귀 검사는 9/9 통과입니다.

새 uniform-limit 정리는 공급된 `PrecisionMetric`의 법칙과 전역 균등수렴·각 근사 함수의 균등연속성을 가정합니다. 실제 실수/Banach norm adapter, 무한합의 미분 교환, semigroup·spectral measure·continuum 구성은 이 정리의 결론에 포함되지 않습니다. 11개 claim 모두 원래 I3/R1 항목의 최종 인수를 자동 부여하지 않습니다.

## M3 남은 8개와 정확한 다음 관문

| ID | 이번 실제 진행 | 원래 기준을 닫기 위해 남은 것 |
|---|---|---|
| **N6-01** | 저장된 최신 source와 monotone/quadratic 암시적 미분 규칙을 결속했습니다. 관련 실행 검사는 통과했습니다. | temporal mean 뒤 순차 다섯 moment의 실제 j=0 전체 class, 최신 압력, B₀=0.7·C₀*=1.2 및 (9.9)/(9.10). |
| **N6-02** | 전체 mean 직접 감사 11/11 실행 검사 통과. 수학 상태는 **UNRESOLVED**입니다. | source node 539400의 maximum 선택을 R로 미분할 때 branch smoothness가 미증명입니다. 전체 직접 PDE와 분해 residual, 모든 quadratic remainder·압력·flat tail의 일치가 아직 필요합니다. |
| **N6-07** | 기존 finite-stage 도메인·차수 장부를 보존했습니다. | 모든 finite stage의 공통 q<qBig, 모든 요구 차수의 상수·log power·미분 손실·tail. 새 전칭 인수 없음. |
| **N6-08** | 기존 cutoff·합성 도구와 증거를 보존했습니다. | 동일 최종 장의 (9.21) shrinking cutoff 합성, Lemma 5.4 tail 비교, active indices와 생략 꼬리 상계. |
| **N7-04** | 유한 jet/계약과 전역 의무의 경계를 유지했습니다. | 동일 최종 국소화 장에서 모든 요구 terminal force jets와 원점 flatness. 유한 차분만으로 C∞를 승인하지 않습니다. |
| **N7-05** | force extension 도구의 제한된 기존 범위를 유지했습니다. | N7-04 전체 jets에서 bⱼ와 differentiated tail을 선택하여 접합·t≤2 compact support를 인증. velocity의 smooth 연장이 아닙니다. |
| **N7-06** | 별도 Taylor–Green 기준 PDE의 평균 에너지 관계를 확인했습니다. | 원래 최종 장의 **전체 고정 K** energy/dissipation/force work와 독립 공간·시간 refinement, (10.13) 상계. 기준 PDE 성공으로 대신하지 않습니다. |
| **N8-05** | 같은 소스의 core 평가 11건과 temporal 보정 전 Fourier-tail 기록 16행을 비교했습니다. | 원래 pulse 파장·axial 길이·Fourier cutoff·correction order·산술 정밀도의 전체 독립 적응, 실제 tail 및 마지막 양의 resolved τ. |

이번 implicit integration attempt 2는 직접 감사 11개, quadratic 12개, monotone 10개로 **33/33 실행 검사 통과**입니다. Quadratic 도함수는 `actual_natural_series` node 4483에서 미해결이며, monotone은 system 2의 조건부 대수만 확보했고 systems 0/1과 analytic branch/domain이 열려 있습니다. 이 실행 기록은 N6-01/02 또는 M3 완료 증명이 아닙니다.

Fourier-tail 그림의 `1/K`는 K=1의 저장 상계에 대한 **정확한 상대 비율**입니다. source scalar 노드 번호는 미평가 수식 참조이며 실제 수치값이 아닙니다. N8-05 완료 필드는 false로 유지합니다.

## M4 구현과 원래 인수의 구별

아래 16개 원래 기준의 최종 인수는 모두 **UNCONFIRMED**입니다. 구현·선택 범위 검증이 있는 항목을 0%로 재설정하거나, 기능 존재만으로 16/16로 바꾸지 않습니다. I3 기초는 M0와 중복 합산하지 않습니다.

| 기준 | 현재 구현과 검증 범위 | 전체 인수에 남은 범위 |
|---|---|---|
| I3-01 | Defs/Finite/Analytic/Comparison/Conditional/Open 분리와 사용자 공리 등급 감사. | 전체 릴리스 target의 실제 dependency closure 인수. |
| I3-02 | 11개 claim 중 명시된 작은 유한 정리의 실제 커널 결과와 오류 대조. | 각 원래 대상의 정확한 정밀도·모형·전칭 범위 인수. |
| I3-03 | uniform-limit 정리의 norm 대용 구조·정의역·양화사와 별도 해석 의무 명세. | concrete real/Banach adapter, 미분 교환·semigroup·spectral measure·stability 증거. |
| I3-04 | uniform-continuity exported theorem의 실제 import adapter. | prism·trace formula·BSD 알려진 경우·NS의 구체적 Lean adapter. 문헌 링크는 THEOREM REFERENCE 유지. |
| I3-05 | 입력·가정 hash 결속, 생성 소스 재검사, 1글자 변조 거부. | 전체 지원 입력과 ProofJob 경로의 인수. |
| I3-06 | 실제 Lean 실행의 버전·exit·target type·axioms·sorry 및 오류 대조 기록. | 수정 중인 최종 Linux CI의 실제 성공 receipt와 최종 후보 결속. |
| I3-07 | 순환 가정과 사용자 공리의 무조건 등급 거부; RH/BSD/YM OPEN 유지. | 전체 연구 관문·semantic adapter의 범위 인수. |
| I3-08 | 동일 claim ID의 학생 설명과 전문가 type·가정·출처·반례 조건. | 지원 전체 claim의 조건·양화사 parity 인수. |
| R1-01 | 13 fixture의 새 clean Worker와 소스 모듈 hash·불변량 대조. | 원래 릴리스 전체 지원 범위의 acceptance manifest 인수. |
| R1-02 | 독립 6축 비교와 bound type·오류·표본 경계 공개. | 전체 대상의 인증 수치 경계와 ensemble 통계·독립 반복 인수. |
| R1-03 | 실제 표본 → 원시 값·원식·source·job/hash inspector. | NS·prism 비교사상·Δ generator의 원래 전체 end-to-end 경로 인수. |
| R1-04 | 작업대 입력 변경·취소·재개·재실행·다른 입력 STALE 회귀. | 기존 전체 ResearchSession의 정확한 downstream 전파 인수. |
| R1-05 | desktop/mobile·키보드·SVG/CPU 검수 대상인 새 작업대 구현과 브라우저 확인. | 최종 게시 readback 결속과 전체 기존 3D/WebGL fallback, 긴 수식·한글 및 전체 지연·메모리 예산 인수. |
| R1-06 | 위조 PASS·source/type·잘못된 소수·입력·공리 경계 공격 거부. | 원래 전체 prime/force/cutoff 공격과 유효 관측 보존의 인수. |
| **R1-07** | 네 연구·교육 walkthrough 문서 제공. | **외부 사람이 설명만 보고 재현하는 검수는 실행하지 않았습니다.** |
| R1-08 | v106의 선택 기능 게시, 추가 패치와 되돌리기 구조. | 최종 CI·현재 공개 readback·최종 지원/HOLD 판정 결속. 전체 freeze는 보류. |

## 소스와 과거 증거 보존

M0–M2 승계와 M3 56/64, 과거 TIME_LIMIT·실패 receipt를 변경하지 않았습니다. M1/M2 `workspace.mjs`와 `workspace.bundle.js` 네 파일 및 선택한 원래 계산 producer 두 파일을 현재 Git blob과 직접 비교하여 바이트 일치를 확인했습니다. 새 공개 API는 추가 constructor/normalizer bridge이며, 기존 계산 코드와 설치 Worker 바이트를 대체하지 않습니다.

추가 HTML 패치를 역으로 제거한 빌드 후보는 v103 원래 바이트와 일치했습니다. v103 기준 SHA는 `e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784`입니다. 새 공개판의 최종 HTTP 전체 SHA와 게시 후 검증 receipt는 아래 고정 필드에 연결합니다.

## 최종 릴리스 고정 필드

| 필드 | 상태 |
|---|---|
| 최종 Git 소스 commit SHA | `mathscope-m3-m4-20261014` 최신 HEAD; 공식 커널 증명 소스는 `0c4b3fe2a8e392283cc9c5486e4bac30407d64fb`와 해시 일치 |
| 최종 Linux CI run 및 실제 결과 | [38447226581](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38447226581) · [38447237944](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38447237944): 공식 Linux Lean 4.34.1 커널 **SUCCESS**; 전체 체크는 PR에 별도 표시 |
| v106 공개 HTML SHA256 | `edd3f0aa700525f1002400df889e0acbcc369e979391bb540ac82e11e39cb915` |
| 최종 게시 후 브라우저 readback receipt | `docs/evidence/m3-m4-release-lab-20261014/publication-v106.json` 및 `browser-v105.json` |
| 최종 릴리스 지원 범위와 HOLD 판정 | 유한 계산·재현·출처 관측 작업대 게시. 원래 M3 잔여8·M4 전체 인수와 전체 freeze는 **HOLD**. |

새 로컬 커널은 Lean 4.34.0-rc2 Windows이며, 승계된 공식 Linux Lean 4.34.1/mathlib 실행과 별도로 기록합니다. 최신 Linux run `38446065282`의 새 core compile은 메모리 예산에서 실패했고 원본 artifact를 보존했습니다. 수정된 소스의 공식 Linux 실행 두 건은 모두 성공했습니다. 실제 소스·로그·olean 바이트와 14개 core target, 기존 pinned target 5개, 보호 검사 26/26을 확인했습니다. 전체 저장소의 다른 체크와 원래 수학 인수는 구별합니다.

주요 증거 경로는 저장소 `research-ide/` 아래의 `mathscope-m4/release-lab/evidence/test-20261014-attempt1/verification/manifest.json`, `mathscope-m4/release-lab/evidence/runtime-review-20261014-attempt3/execution.json`, `mathscope-m3/evidence/resume-20261014/implicit-integration-attempt2/receipt.json`, `mathscope-m3/evidence/resume-20261014/refinement-attempt1/receipt.json`, `mathscope-m4/evidence/formal-audit-20261014.json`, `mathscope-m4/evidence/core-kernel-20261014-attempt4/receipt.json`입니다.

운영 v105의 데스크톱 1440×1050, 모바일 390×844, 키보드 표본 선택, 새 Worker의 Δ 실제 계산 및 독립 재실행 MATCH를 확인했고 콘솔 오류·경고는 없었습니다. 새 작업대의 가로 overflow는 두 크기 모두 없었습니다. 플랫폼이 기존 WPE loader/widget을 마지막으로 이동하고 JSON의 동등한 escaping을 바꾼 것 외에는 실제 소스·수학 데이터·관련 없는 내용이 일치했습니다. 새 페이지나 자산은 생성하지 않았습니다.

전체 CI에서 발견한 Navier 구현 파일 목록 누락과 Windows 메타데이터 줄바꿈 해시 문제는 엄격한 검사를 유지한 채 수정했습니다. Source pin은 118개 파일이며 raw Git/Linux 바이트로 생성했고, 새 메타데이터 보호 회귀 2/2와 temporal-tail 검사 4/4는 통과했습니다.

M3 브라우저 번들도 원래 검사로 재생성·검증하여 v106에 저장했습니다. 785개 source binding, 원래 48개 기준, gauge16/navier25 예제를 보존했고 worker bundle SHA는 `57bb531b256633d278e816cbfde3c1f95cb2f26dc99e64931864006f12b1d4d1`입니다. 게시 후 전체 HTTP 바이트가 예상 페이지와 정확히 일치했고, 새 R1 모델·다른 내용도 그대로 보존되었습니다.
