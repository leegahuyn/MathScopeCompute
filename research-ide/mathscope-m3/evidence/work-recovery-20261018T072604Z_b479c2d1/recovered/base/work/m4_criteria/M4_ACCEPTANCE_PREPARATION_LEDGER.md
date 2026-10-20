# M4 원문 인수 준비

현재 실행 판정이 아닌 인수 준비 초안이다. I3 확장 8개와 R1 8개를 원문에서 대조했다. 기존 승계 완료를 취소하지 않으며, 현재 미확인을 0/16 또는 0%로 표시하지 않는다. M3가 완료된 뒤 선택 릴리스의 정확한 소스에 기존 증거를 연결하고 남은 검사만 실행한다.

원문: `recovered/pdfs/MathScope_Research_IDE_Blueprint_v1_KO(1)(20261017-114129).pdf` · SHA256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac` · 99쪽. p12의 M4=I3 확장/R1이며, M0의 I3 기초와 중복 집계하지 않는다.

I3 패키지 완료 관문(p19)은 exact finite 정리 하나 이상과 조건부 analytic 정리 하나 이상의 실제 커널 통과 및 잘못된 소스·순환가정·hash 재사용 거부다. R1(p67)은 I0–I3 및 선택 릴리스에 포함한 P/Y/N 작업 완료를 선행으로 하며, 선택 범위의 모든 필수 검사와 증거 경계를 통과해야 한다.

| ID | 원문 제목 | 원문 쪽 | 현재 검토 상태 |
|---|---|---:|---|
| I3-01 | 정의와 연구가설의 파일 분리 | 20 | 인수 준비만 / 현재 릴리스 재판정 전 |
| I3-02 | 유한 대수 정리부터 형식화 | 20 | 인수 준비만 / 현재 릴리스 재판정 전 |
| I3-03 | 해석적 가정의 구체화 | 20 | 인수 준비만 / 현재 릴리스 재판정 전 |
| I3-04 | 외부 비교 정리의 adapter | 20 | 인수 준비만 / 현재 릴리스 재판정 전 |
| I3-05 | 소스 생성과 재검사 | 20 | 인수 준비만 / 현재 릴리스 재판정 전 |
| I3-06 | 커널·공리·빌드 감사 | 20 | 인수 준비만 / 현재 릴리스 재판정 전 |
| I3-07 | 연구 관문의 완료 조건 | 20 | 인수 준비만 / 현재 릴리스 재판정 전 |
| I3-08 | 교육용 설명과 전문가 감사 동기화 | 20 | 인수 준비만 / 현재 릴리스 재판정 전 |
| R1-01 | 기준 예제 전 구간 재현 | 68 | 인수 준비만 / 현재 릴리스 재판정 전 |
| R1-02 | 정밀도와 해상도 수렴 표 | 68 | 인수 준비만 / 현재 릴리스 재판정 전 |
| R1-03 | 출처에서 그림까지 추적 | 68 | 인수 준비만 / 현재 릴리스 재판정 전 |
| R1-04 | 세션·가정 변경 회귀 | 68 | 인수 준비만 / 현재 릴리스 재판정 전 |
| R1-05 | 화면·접근성·성능 검수 | 68 | 인수 준비만 / 현재 릴리스 재판정 전 |
| R1-06 | 증거 경계 공격 테스트 | 68 | 인수 준비만 / 현재 릴리스 재판정 전 |
| R1-07 | 연구·교육 시나리오 완료 | 68 | 인수 준비만 / 현재 릴리스 재판정 전 |
| R1-08 | 범위별 릴리스 판정 | 68 | 인수 준비만 / 현재 릴리스 재판정 전 |

## 항목별 원문과 필요한 현재 증거

### I3-01 — 정의와 연구가설의 파일 분리

Defs, Finite, Analytic, Comparison, Conditional, Open 모듈을 나누고 Open은 axiom-free theorem import 경로에 넣 지 않는다. 합격: unconditional target의 dependency closure에 사용자 공리가 있으면 해당 등급의 build가 실패한다.

현재 인수에 필요한 자료:

- Defs/Finite/Analytic/Comparison/Conditional/Open import boundary and target dependency closure
- Unconditional target rejects user axioms, including transitive dependencies

### I3-02 — 유한 대수 정리부터 형식화

delta identities의 허용 정밀도, d²=0, semilinear chain map, 유한 소수 구간 인증, Lie bracket, lattice holonomy를 작은 정리로 나눈다. 합격: 자체 fixture와 일부러 잘못된 certificate가 각각 수락·거부된다. 숫자 예시와 전칭 정리의 범위가 구분 된다.

현재 인수에 필요한 자료:

- Actual small finite theorem source and build outputs for the listed delta/d²/semilinear/finite-prime/Lie-bracket/lattice-holonomy targets; input/certificate fixtures
- Positive fixture accepted, deliberately bad certificate rejected, examples distinguished from universal claims

### I3-03 — 해석적 가정의 구체화

완비성, uniform convergence, 미분과 극한의 교환, semigroup bounds, spectral measure, stability constants의 정확 한 진술을 저장한다. 합격: 무한 합의 미분이나 continuum limit를 쓰는 lemma마다 필요한 norm·정의역·양화 범위가 표시 된다.

현재 인수에 필요한 자료:

- Every infinite-sum derivative or continuum-limit lemma records complete hypotheses, norm, domain and quantifiers
- Uniform convergence, interchange of limit and derivative, semigroup/spectral/stability assumptions are explicit

이미 있는 관련 입력 자료(이 항목의 완료 판정은 아님):

- `pdf_criteria/n601_candidate_review.json` · SHA256 `0d6a0c99bf96586215ac4c18da7ea60e88166899eeae9db1a99c44f1d556488a`
- `pdf_criteria/remaining_chain_candidate_review.json` · SHA256 `fbfb701aada8f8fff2fc9e6c8d4b6ab7cac11ae9136247ab74a94f782d5cf9ef`
- `work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json` · SHA256 `b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78`

### I3-04 — 외부 비교 정리의 adapter

프리즘 비교·trace formula·BSD의 알려진 경우·NS 원문 정리를 인용 레벨과 실제 Lean import 레벨로 구분한다. 합격: 문헌 링크만 연결된 결과는 THEOREM REFERENCE이며, 정확한 exported Lean theorem을 import한 경우에만 kernel 결과와 연결된다.

현재 인수에 필요한 자료:

- Separate paper reference adapters from exact exported Lean theorem imports
- Only the exact actual imported declaration may carry its kernel result

이미 있는 관련 입력 자료(이 항목의 완료 판정은 아님):

- `pdf_criteria/original_8_duties_criteria.json` · SHA256 `da4b6329672a4fdcc32b24bc85d74ad5e3ead09f30a5f5db9b2b7f88d0d75f4c`
- `pdf_criteria/n601_candidate_review.json` · SHA256 `0d6a0c99bf96586215ac4c18da7ea60e88166899eeae9db1a99c44f1d556488a`
- `pdf_criteria/remaining_chain_candidate_review.json` · SHA256 `fbfb701aada8f8fff2fc9e6c8d4b6ab7cac11ae9136247ab74a94f782d5cf9ef`

### I3-05 — 소스 생성과 재검사

사용자가 G· Δ·p·정밀도·계수식·가정을 바꾸면 새로운 ProofJob을 만들고, 이전 검사 결과는 hash 불일치로 분리한다. 합격: 기본 시나리오 소스를 한 글자 바꾸는 negative test에서 과거 PASS가 재사용되지 않는다.

현재 인수에 필요한 자료:

- New ProofJob on G/Delta/p/precision/coefficient/assumption changes
- One-character source mutation rejects old PASS by source hash

### I3-06 — 커널·공리·빌드 감사

Lean/mathlib commit, compile exit, warnings, sorry 여부, #print axioms, target theorem type, 소요 시간을 기록한다. 합격: 0=1을 rfl로 제출하는 통제 사례가 실패한다. kernel PASS가 UI에서 사용자 공리 의존성을 가리지 않는다.

현재 인수에 필요한 자료:

- Lean/mathlib commits, compile exit, warnings, sorry, #print axioms, target type and duration
- Actual 0=1 by rfl negative build and UI disclosure of user-axiom dependence

### I3-07 — 연구 관문의 완료 조건

RH global bridge, 전칭 BSD, 일반 G continuum quantum construction은 RESEARCH OPEN으로 관리한다. 알려진 prism 비교의 구현은 MODEL DEVELOPMENT로, 새로운 비교정리가 필요한 경우는 RESEARCH OPEN으로 구분한다. 합 격: 가정 자체를 결론으로 다시 쓰는 순환 증명과 대수적 이름만 붙인 의미 인터페이스가 연구 관문을 닫지 못한다.

현재 인수에 필요한 자료:

- Research-open register and scope distinctions for RH, universal BSD, general-G continuum, known/new prism comparison
- Circular assumptions or renamed semantic interfaces cannot close a research gate

### I3-08 — 교육용 설명과 전문가 감사 동기화

학생에게는 문장과 예제를, 연구자에게는 동일 claim의 정확한 Lean type·가정·출처·반례 조건을 보여준다. 합격: 두 모드가 같은 claim ID를 사용하고, 쉬운 설명에서 양화사·조건·근사 범위가 빠지지 않는다.

현재 인수에 필요한 자료:

- Student and expert views share exact claim ID and underlying declaration
- Both retain quantifiers, assumptions, source, counterexample conditions and approximation scope

### R1-01 — 기준 예제 전 구간 재현

점·P1·좋은 소수의 E, SU2/SU3/G2 지원 예제, heat exterior/axis profile/기준 PDE를 clean worker에서 실행한다. 합격: 명시된 작은 fixture에서 입력 hash·출력 불변량·오차 범위가 acceptance manifest와 일치한다.

현재 인수에 필요한 자료:

- Clean-worker replay of point/P1/good-prime E, supported SU2/SU3/G2, heat exterior/axis profile/baseline PDE fixtures
- Input hashes, output invariants and error ranges match an acceptance manifest

### R1-02 — 정밀도와 해상도 수렴 표

p-adic M, series order J, spatial K, lattice a/L, sample count를 하나씩 바꾸고 관측의 변화와 예측 오차를 기록한다. 합격: 인증된 수치 경계 위반은 실패다. 앙상블 통계는 사전 유의수준·autocorrelation·독립 반복 기준으로 판정하며 신뢰구간은 결 정론적 보장과 구별한다. 수렴표만으로 무한 극한 정리를 발급하지 않는다.

현재 인수에 필요한 자료:

- One-axis-at-a-time p-adic M, series J, spatial K, lattice a/L and sample-count variation
- Predicted-error table, certified-bound checks and appropriate preregistered statistical treatment; no infinite theorem from a convergence table

이미 있는 관련 입력 자료(이 항목의 완료 판정은 아님):

- `pdf_criteria/original_8_duties_criteria.json` · SHA256 `da4b6329672a4fdcc32b24bc85d74ad5e3ead09f30a5f5db9b2b7f88d0d75f4c`

### R1-03 — 출처에서 그림까지 추적

모든 핵심 그림의 점 또는 패치를 선택하면 원식, 논문 위치, job, 오차, theorem/assumption ID를 열 수 있게 한다. 합격: NS의 원문 식과 생성 계수, prism 비교사상, Δ state generator 각각 하나를 end-to-end로 추적한다.

현재 인수에 필요한 자료:

- Selectable core figure points/patches link original formula, paper locator, job, error and theorem/assumption IDs
- One complete trace each for NS source/generated coefficients, prism comparison map and Delta state generator

이미 있는 관련 입력 자료(이 항목의 완료 판정은 아님):

- `work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json` · SHA256 `5e32f8e32b95f319b681d4e92b7c01befba54bb2600af9655ace21562de689b9`
- `work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json` · SHA256 `bc0d40d467186f3024913ae50bf3b02e69e569110a1368ad1292ea28d70ffe3a`

### R1-04 — 세션·가정 변경 회귀

p·G·Δ·τ·cutoff·계수체 변경 후 정확한 downstream node만 STALE이 되는지 검사한다. 합격: 계산 중 입력 변경, 취소, 재 개, 내보내기/가져오기 후 다른 입력의 증거가 연결되지 않는다.

현재 인수에 필요한 자료:

- Exact downstream invalidation under p/G/Delta/tau/cutoff/coefficient-field changes
- In-flight edits, cancellation, resume, export/import never attach evidence from another input

### R1-05 — 화면·접근성·성능 검수

데스크톱과 모바일 한 종류 이상, 키보드, WebGL/CPU fallback, 긴 한국어·수식, 색 범위와 샘플 선택을 확인한다. 합격: 클 리핑·빈 3D·오류 overlay가 없고, 문서에 정한 표본 예산에서 조작 지연과 메모리 상한을 만족한다.

현재 인수에 필요한 자료:

- At least one desktop and mobile; keyboard, WebGL/CPU fallback, long Korean/math, color scale and sample selection
- No clipping, empty 3D or error overlay; documented sample-budget latency and memory limits measured on declared environment

### R1-06 — 증거 경계 공격 테스트

조작된 PASS, 잘못된 소스 hash, 원문과 다른 theorem type, 조작된 prime certificate, 잘못된 force/cutoff를 주입한다. 합격: 각 사례가 기대하는 이유로 거부되고 기존 유효 관측은 보존된다. 로그는 사용자가 원인을 이해할 수 있다.

현재 인수에 필요한 자료:

- Forged PASS, wrong source hash, wrong theorem type, altered prime certificate and wrong force/cutoff injected
- Each rejected for expected reason while valid observations survive and logs explain the cause

이미 있는 관련 입력 자료(이 항목의 완료 판정은 아님):

- `work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json` · SHA256 `5e32f8e32b95f319b681d4e92b7c01befba54bb2600af9655ace21562de689b9`
- `work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json` · SHA256 `bc0d40d467186f3024913ae50bf3b02e69e569110a1368ad1292ea28d70ffe3a`

### R1-07 — 연구·교육 시나리오 완료

학생용 계수체 실험, 연구용 Frobenius/local-factor 감사, Δ 상태족 비교, NS 근사/잔차 비교의 네 walkthrough를 수행한 다. 합격: 설명만 보고 다른 사람이 같은 입력과 결과를 재현할 수 있다. 결과의 의미와 미해결 가정을 직접 확인한다.

현재 인수에 필요한 자료:

- Four walkthroughs: student coefficient fields, research Frobenius/local-factor audit, Delta-family comparison, NS approximation/residual comparison
- Another person can reproduce identical inputs/results from the explanation and see meaning/open assumptions

### R1-08 — 범위별 릴리스 판정

지원 대상을 명시한 기능만 배포 후보로 묶고, 기존 전체 RELEASE HOLD와 구분해 모듈별 상태를 보고한다. 합격: 패치·테스 트·되돌리기 자료가 준비되고 실제 게시 후 화면을 확인한 시점에만 배포 완료를 기록한다.

현재 인수에 필요한 자료:

- Release scope/capabilities, HOLD items, tests, rollback/deployment patch and reproducibility packet
- Only actual post-publication screen verification permits deployed-complete status

## 증거 승계와 범위

M3의 source-bound 해석적 정리 적용, 원문·root/hash 대조 및 negative controls는 I3-03/I3-04/R1-03/R1-06 등의 입력이 될 수 있다. 그것만으로 Lean 커널 실행, 화면의 end-to-end 연결, 전체 공격 테스트 또는 통합 릴리스 인수를 완료했다고 판정할 수 없다.

16쪽 인수인계(p2,6,11,14)와 2026-10-13 재개 문서는 과거 Lean/worker/브라우저/배포의 근거와 미확인 항목을 전달한다. 이력은 보존하되 현재 release source에서 재실행·대조한 결과로 바꾸지 않는다. 이번 조사에서 현재 I3/R1 항목별 최신 acceptance manifest는 확인되지 않았다.

434,191바이트의 새 25쪽 개념 설계도는 886,241바이트의 99쪽 확장 설계도와 다른 문서다. 새 문서의 S3/3D/Claim/Lean 설계, 사용성 및 성능 제안은 `CONCEPT_3D_REQUIREMENTS.json`에 원문 쪽과 제안 수준을 표시했다. 기존 16개 ID에 새 임의 ID 또는 완료율 분모를 추가하지 않는다.

## 작성 범위

새 PDF를 실제 열어 byte/hash/쪽수와 내용을 확인했다. 기존과 같은 handoff/paper/expanded blueprint는 기존 추출을 재사용했다. 원본 변경, M4 실행, 사이트 변경, 배포, Git commit은 하지 않았다. 수치 구현팀용 원문 요구는 `M3_REMAINING_NUMERIC_REQUIREMENTS.json`에 별도로 기록했다.
