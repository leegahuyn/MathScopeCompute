# MathScope 재개 체크포인트 — 실행 환경 연결 중단

이 문서는 2026-10-10 UTC의 재개 상태를 보존한다. **M2 전체 완료 보고서가 아니다.** 원문 64개 기준과 ID·제목·합격 문구·페이지를 변경하지 않았다. 사용자는 M2의 원래 PARTIAL 39개와 OPEN 5개 전부 완료 및 M1 누락 시각화 보완을 승인했으므로 작업·게시 승인을 다시 요구하지 않는다.

## 현재 게시·영구 보존 상태

- 페이지: https://project29770.websitepublisher.ai/v0.3.1.html
- M2: https://project29770.websitepublisher.ai/v0.3.1.html#research-m2
- M1: https://project29770.websitepublisher.ai/v0.3.1.html#research-objects
- WebsitePublisher get_page로 재확인한 버전: **65**, version_hash **20ff2fd3**.
- 게시 M2 runtime: **0.3.2**.
- 완전한 코드·검증·게시 체크포인트 commit: **e9bab80a48876262b209d0f339d83108eea8afea**.
- 그 commit의 tree: **2547b37128c8fc93d95b41c038cac0f6e72d3c0c**.
- 브랜치: **mathscope-m2-visuals-20261010**, 저장소 **leegahuyn/MathScopeCompute**.
- 이 문서의 새 commit은 복구 기록만 추가한다. 아래 v66 미게시 소스를 모두 저장한 commit이라고 해석하지 않는다.
- M2 Worker SHA-256: 601be23fedcd6a152f7551c54f6c4f107517160c0902014a07f628ce2b205d5f.
- M1 원래 Worker SHA-256: 0526fb1030c328e940c39672e86dfb9d24f09f4622794269c1e0eadbb92cc0ca. 변경하지 않았다.

## 실제 완료 집계

원래 baseline은 20 PASS / 39 PARTIAL / 5 OPEN이다. 원격 canonical baseline commit **2fc532bd8f5adf28e061282e34064cefbd50e8e6**, evidence/m2-criteria-status.json SHA-256 **0f54ea2e368bfb636aca85f73c9603abb9b47961b598e6ddda7572932a1ab920**이다. 과거 로컬 7cb1d59 표기 파일과 바이트가 같다.

| 원래 분류 | 현재 PASS | 현재 PARTIAL | 현재 OPEN |
| --- | ---: | ---: | ---: |
| 기존 PASS 20 | 20 | 0 | 0 |
| PARTIAL 39 | 38 | 1 | 0 |
| OPEN 5 | 3 | 2 | 0 |
| 전체 64 | 61 | 3 | 0 |

원래 미완료 44개 중 **41개가 PASS**다. OPEN→PARTIAL인 두 항목도 미완료다. 남은 기준은 **N4-04, N4-05, N5-06**이며 fullM2Complete, fullN4, fullN5, formalComplete는 false다.

v65에서 추가로 PASS가 된 항목은 N4-03, N5-04, N5-05다. 개별 원문에 명시된 인증된 유한 영역의 합격이며, 모든 차수·전체 배경·새 전역 정리의 완료를 주장하지 않는다. navier/research/FINITE_CRITERIA_REAUDIT_KO.md에 근거와 범위를 기록했다.

## 게시 v65 검증

- 등록 M2 예제 71개: 산술 25, 게이지 14, NS 21, I2 11.
- 기본 실행 상태 59 COMPLETED / 12 PARTIAL. 예제 수와 원문 기준 수는 별도다.
- v65 전체 71개 원본 모듈과 정적 Worker의 수학 결과가 일치한다.
- NS Node 141/141, 독립 검사 2778개.
- v65 신규 3예제 15패널 및 기존 core 5패널의 실제 브라우저 실행·원본 경로·유한 좌표 확인: evidence/v65-new-catalog-audit.json.
- 실제 amplitude를 새 job으로 replay하여 MATCH: evidence/v65-amplitude-replay.json.
- 이전 v64 전체 브라우저 검사 68예제·129패널: evidence/live-release-v64.json 등 버전별 live-release 기록을 확인한다. v65에서 전체 패널을 다시 순회했다고 확대하지 않는다.
- M1은 기존 빈 관측 26개를 보완하고 등록 59개 전부 브라우저 실행한 v62 기록을 보존한다.
- v65에서는 구간행·끝점이 footer와 겹치지 않도록 renderer를 수정하고 M1 열 적분 구간을 다시 실제 브라우저에서 확인했다.
- evidence/live-release.json, v65-publication.json, v65-m1-audit.json 및 실제 스크린샷 세 파일을 v65 commit에 보존했다.

## 환경 중단

공유 executor가 다음 오류를 반환했다:

> 409 Conflict, environment_offline: Environment is not connected.

단순 pwd와 모든 agent의 read/write가 같은 오류를 반환했다. browser cua.rewriteDocumentation도 300초 후 timeout이었다. 반면 WebsitePublisher get_page와 GitHub connector는 작동해 v65 게시 및 원격 commit을 다시 확인했다. 사용자 승인 부족이나 자동 승인 거절이 아니다.

작업 디렉터리는 /workspace/scratch/ac3eb59922aa/MathScopeCompute 이다. 연결 복구 시 먼저 git status와 실제 파일 존재 여부를 확인한다. **미게시 수정이 남아 있으므로 hard reset, clean, 전체 checkout을 하지 않는다.** 이 복구 문서 commit을 병합할 때 새 로컬 파일을 보존한다.

## v66 공분산 추가분 — 로컬 구현·일부 검증, 미게시

### frozen 실제 producer

모든 경로는 research-ide/mathscope-m2/navier/ 아래다.

| 파일 | SHA-256 |
| --- | --- |
| actual-pulse-covariance-integrals.mjs | 6690a62a744195fa733f8a3b3f61f90b291a88c9cbb490e94e96d4963e3065c5 |
| actual-pulse-covariance-manifest.json | 9564c11a061d48c701cdecb2e39cc20fc26782e6eb5e12d28d6ea9e56d606fe6 |
| actual-mean-stress.mjs | 7dc194a8a33ff5a3882c1bedf82cf1d26efe3220f0bd66a1e550482369ccad71 |
| actual-pulse-covariance-matching.mjs | 924db93cd676a7f4ae4babe2a2a3687d78cf86cd8dbfec2931fe9c3dc2f08348 |
| actual-pulse-covariance-partition.mjs | 3b1a04bca5e969fb3f331d9d04d320f21326f786099a232202cb1e75b2d67329 |
| actual-pulse-covariance-matching-manifest.json | 65104b623a041109e9364c80c1d78827a66b1bcae3c41c32b816418df7a0702b |

각 manifest와 research/ACTUAL_PULSE_COVARIANCE.md, ACTUAL_MEAN_STRESS_KO.md, ACTUAL_PULSE_COVARIANCE_MATCHING.md 및 tests를 함께 확인한다. 기존 frozen v65 원본 바이트는 바꾸지 않았다.

실제 homogeneous pulse의 원래 left datum에서 생성한 양의 amplitude, Gaussian 좌표 w=sqrt(Gscale)(a−1)의 전체 cell enclosure와 양의 tail, angular 1/2·Haar Jacobian·한 transverse 질량을 연결했다. 같은 heat-prepared N3 stress의 exact F 식을 pulse의 F와 대조해 실제 양의 inverse를 계산한다.

512 cells에서 정규화 y+=y−는 [2.619808939012956, 2.787057138136905], 정규화 |det H|는 [0.06436922192916214, 0.07285020278808124]다. 양의 물리 배율은 정확식으로 보존한다. 원문이 허용하는 smooth 제곱분할을 실제로 선택하여 대표점의 한 band·한 slow box·내부 두 signs와 생략한 모든 정수 index의 정확한 support를 확인한다. 해당 점의 물리 (7.30) residual은 정확 [0,0]이다.

공통 analytic q*, enlarged slow neighborhoods와 whole-annulus 인증은 미완료다. sourceUniformQStarCertified:false, wholeAnnulusCovarianceMatched:false를 유지하고 원문 N5-06을 PASS로 바꾸지 않는다. qBigObservation=3Q/2는 그 점의 기하학적 선택이며 analytic q*가 아니다.

개별 실행 근거:
- covariance Node 10/10 및 독립 Fraction/Decimal 294/294.
- actual mean stress Node 9/9 및 독립 700/700.
- actual matching/partition Node 12/12 및 독립 1195/1195.
- 원본 reviewer m2_gauge가 실제 대표점 범위만 독립 검토했다.
- root가 위 독립 checker를 실행했다. 원래 frozen fixture 파일과 checker 결과 receipt는 구별한다.

### root 통합 파일

- navier/index.mjs: 새 kind ns.actual-covariance-matching, 예제 ns-m2-actual-covariance-matching, 입력 y/cells/cutoffCells/bits와 예산·정밀도 guard 추가.
- 기본 입력 y=2.5, cells=256, cutoffCells=256, bits=512.
- bits는 target의 정확 enclosure exponent이며 전체 Gaussian 적분의 임의정밀도가 아니다. 계산은 outward binary64, precision bits>53 및 DIRECTED_BIGINT는 거부한다.
- visualization/actual-source-panels.mjs: 실제 weight, 적분, H행렬, Gaussian density, heat target, cutoff 질량, 활성 partition, 물리 identity의 **8패널**.
- visualization/m2-views.mjs: 새 main panel 연결.
- tests/actual-covariance-views.test.mjs: **6/6 통과**. 모든 표시점·끝점·정확표·axis·detail의 원본 경로 및 input/result/source 결속, 결과 비변조, 360/960 폭 유한 geometry, 작은 LOD, stale/failed 숨김, scope/precision/negative input 검사.
- navier/checklist.mjs: N5-06의 구현 근거·남은 의무만 갱신, 상태는 PARTIAL이고 기준 문자열은 그대로다.
- navier/README_KO.md, PROOF_OBLIGATIONS_KO.md에 추가분 반영.
- core/registry.mjs와 navier/index.mjs에 로컬 버전 0.3.3 설정. **게시된 버전은 여전히 0.3.2다.**
- navier/tests/navier.test.mjs의 예상 예제 수는22로 변경. 빌드 후 전체72예제가 되어야 한다.
- v66 새 Worker/bundle은 아직 생성하지 않았다. v65 build-manifest와 bundle을 새 소스와 일치한다고 사용하지 않는다.

### 즉시 수정할 evidence generator 오류

navier/tests/generate-evidence.mjs에 새 producer 3개 test suite와 독립 검사/manifest 결속을 추가했다. 실행 session20431은 다음에서 멈췄다:

TypeError: $: unsupported JSON value (undefined)
at canonicalStringify
at navier/tests/generate-evidence.mjs:82

원인은 실제 mean stress 독립 checker의 stdout audit에 files가 없는데 canonicalStringify(audit.files)를 호출한 것이다. frozen evidence/actual-mean-stress.json에는 files가 있다. 이는 수학 검사 실패가 아니라 결과 집계의 shape 오류다. **전체 acceptance 봉인 완료라고 표시하면 안 된다.**

복구 시 frozen receipt.files의 모든 현재 바이트를 먼저 검증하는 절차는 유지한다. Python checker stdout의 실제 shape를 읽어 pass/checks=700 및 producer/receipt 연결을 검증하고, 검증한 frozen file bindings를 실행 audit에 명시적으로 보존하도록 수정한다. 없는 stdout files를 있다고 가정하거나 hash검사를 제거하지 않는다.

새 test suite 실패를 통과해야 도달하는 이후 단계에서 이 오류가 났으므로 로컬 Node 172개 실행은 통과했다. 그러나 aggregate acceptance.json은 아직 v65 141/2778의 이전 완성본이다. 다음 성공 목표는 Node172, 독립4967, NS22예제이며 실제 성공 출력으로 확인한 뒤 문서와 build를 최종 봉인한다.

## 남은 수학 작업

### N4-04 — 실제 모멘트 복구

blueprint_review 소유의 다음 파일이 offline 전 생성됐다(아직 freeze되지 않음):
actual-continuation-exact-core.mjs, -exact-tail.mjs, -exact-functions.mjs, -exact-pregluing.mjs, -exact-b8-data.mjs, -exact-b8.mjs, -exact-loop.mjs, tests/actual-continuation-exact.test.mjs.

실제 natural-series recurrence와 explicit convergent tail, B.22→B.26→B.34→B.8의 다섯 원본 debt·부호·정규화·root 연결까지 진행했다. exact tests12/12는 loop 추가 전 결과다. loop η2 그래프16930nodes/652882bytes compile이 마지막 성공이며 loop 독립 검사는 아직 없다. m1_visualization의 읽기 검토는 B22/B26/B34/B8 부호·정규화만 승인했다.

즉시 다음 단계는 actual C12 five integrals→실제 normalized matrix/inverse/root→I1 partial M→final U/M/V/Ω의 regular six integrals 및 axis boundary다. 그다음 실제 n1 inner convergent Picard/cutoff/Ipos inverse, repaired V1/Π1, 다섯 total moments0 및 n≥2 gate를 연결한다.

원문 C12 contract 검토 노트(아직 코드 적용·검증 안 됨):
actual raw five debts≤R^6/N, λ^-2 포함 normalization operator<R^7 ⇒ normalized rhs<R^13/N. 실제 continuous Aλ^-1의 독립∞norm<2^30<R^3를 쓰면 preconditioned rhs<R^16/N<R^-34<1e−8. λ≤2^-200 및 quadratic norm≤64에서 r=1e−6의 contraction/selfmap을 검증할 수 있다. I1 correction δU=Kλ(z0b0+z1b1), δE=Kλ(z2b2+z3b3+z4b4)는 실제 C12 다섯 적분의 음수를 RHS로 쓰고 두 번째 행의 λ^-2를 보존해야 한다. 수치 적분/완전한 수렴 evaluator가 실행됐다고 AST node count만으로 주장하지 않는다.

### N4-05 — 실제 residual 및 차수 개선

m1_visualization이 원문 5.25/5.26과 fixed compact의 실제 residual을 검토했다. 새 residual 파일은 환경 중단 전 쓰지 않았다. agent의 아직 미실행 유도: 0<h<1/4에서 공통 K_m=2+m, 실제 axis datum U*=4η+j에서 U1_X(0,0)=A j, N0 axial axis residual2A j, N1 axial residual의 선형 X 계수(9/2−18h²)j. 이를 source Picard/Cauchy norm과 결속한 fixed positive X interval 검증, 독립 N/공간격자/산술정밀도 변화, 실제 C_N,m 계산이 남았다. 전체 원문 범위에는 repaired tuple 연결이 필요하며 Imean의 vanishing만으로 PASS시키지 않는다.

### N5-06 — uniform 실제 source와 covariance

m2_gauge의 additive actual-covariance-uniform.mjs와 tests/fixture는 offline 전 작성됐다. 커널 Node11/11까지 통과했다. 독립 Python 파일 write 응답이 끊겨 저장 여부를 확인해야 한다. 아직 freeze되지 않았다.

실제 κ source graph에 결속해 0<κ≤1의 다항식8개를 BigInt rational Bernstein 계수로 검사한다. target freeze error≤κ/16, 각 normalized H column error≤κ/128가 실제 입력으로 증명되면 det C>15/8, z±∈[κ/64,2], ||C^-1||∞≤2를 계산한다. n'·t·pressure·forcing projection·cylindrical connection을 보존하는 exactFrozenPulsePrincipalOperator도 있다. caller jet에 sourceProfile만 붙여 actual로 승인하지 않는다.

원문 (5.46)의 C² tail은 n≥2부터이므로 필수 initial block을 실제 n1의 completed C² norm으로 줄일 수 있다. 모든 n≥2의 실제 coefficient-to-cutoff certificate가 있으면 tail≤(1/2)q^(2h), 따라서 (5.42) B2를 actual n1 completed norm+1/2로 잡는 경로를 검토했다. 실제 n1 global moment repair norm, all-n cutoff producer, edge-direction modulus 및 integrated H column budgets는 아직 미설치다.

## 복구 후 실행·게시 순서

1. 현재 로컬 변경·미추적 파일을 보존하고 위 frozen hashes를 확인한다. pending write의 파일 존재 여부를 확인해 중복 편집을 피한다.
2. mean-stress evidence stdout shape 오류를 수정하고 navier evidence를 실제 성공까지 생성한다. 원문 상태 대조도 다시 실행한다.
3. 새 source-bound view 검사를 포함한 시각화와 Worker·core 통합 검사, build_m2.py와 tests/check_assembly.py를 수행한다.
4. 실제 사이트는 v65이므로 **현재 get_page의 version hash**를 새로 읽는다. v54의23개 전체 patch set을 라이브에 재적용하지 않는다.
5. v65 정확한 로컬 snapshot /tmp/mathscope-v65-live-9re3khfs의 app/visual script와 새 build의 두 inline script만 UNIQUE replace한다. provider get_page의 [REDACTED] 값을 전체 HTML로 덮어쓰지 않는다. 원래 M1 Worker는 그대로 보존한다.
6. 실제 브라우저에서 새8패널/precision/재현/원본 결속을 검증하고 이미지·게시 receipt를 저장한다. 등록 전체 source/staticWorker parity의 새 개수72를 확인한다.
7. 검증된 v66 코드·근거를 같은 원격 브랜치에 저장한다. 이 문서 commit과 새 로컬 변경을 보존한 채 Git expected_sha lease를 사용한다.
8. 남은 실제 N4-04/05와 N5-06을 끝까지 구현·검증하기 전 전체44개 완료 또는 fullM2Complete:true라고 보고하지 않는다.

## 연결 중단 후 추가 확인 — 미게시·미적용 노트

### 정확한 stress 집계 복구 절차

원격 v65 tree에는 actual-mean-stress와 actual-covariance-uniform 신규 파일이 없음을 확인했다. 이러한 파일이 e9bab80 또는 본 handoff commit에 보존되어 있다고 말하지 않는다.

1. frozen evidence/actual-mean-stress.json SHA-256 **130a3e7f468f519f5d769abf104f4c032ed84597fbc89160a794e17aacdf826f**를 대조하고, 내부 files에 기록한 모든 source bytes/hash를 검증한다.
2. 현재 Python stdout을 JSON parse하여 실제 pass 및 checks=700, Object.keys를 확인한다. stdout의 files는 없으며 receipt의 존재는 아직 확인하지 못했다. 없는 필드를 읽지 않는다.
3. frozen evidence에 저장한 실제 receipt를 verifyActualMeanStress로 현재 producer에 재실행하거나 같은 input의 evaluateActualMeanStress와 canonical 비교한다. 위치와 shape를 실제 파일로 확인한다.
4. 새 audit에는 frozenEvidence, sourceByteVerification, independentExecution(command/script SHA/checks/stdoutKeys), receiptReplay(input/storedHash/currentHash/match)를 별개로 보존한다. source hash 검사를 제거하여 집계 오류를 피하지 않는다.

### Uniform 커널 저장 범위

저장을 직접 확인한 것은 navier/actual-covariance-uniform.mjs, tests/actual-covariance-uniform.test.mjs, tests/actual-covariance-uniform-fixture.mjs이다. Node11/11은 이 파일들의 실행 결과다. tests/actual-covariance-uniform-independent.py는 쓰기 응답이 중단돼 존재·완성 여부가 불확실하다. evidence/actual-covariance-uniform.json 및 research/ACTUAL_COVARIANCE_UNIFORM_REVIEW_KO.md는 아직 작성 전이다.

### 다음 실제 모멘트·잔차 검증을 위한 수학 노트

- C2 direct inverse와 normalized RHS 검토를 m2_gauge가 독립 확인했다. η0..2의 최대 raw derivative norm에서는 Leibniz를 포함해 quadratic selfmap≤4λ·2^36·r², Lipschitz≤8λ·2^36·r<1/4라는 넓은 상수를 사용한다. 다른 Banach norm convention의2r bound와 혼동하지 않는다.
- blueprint_review는 pure V8 BigInt로 해당 bound의8개 대수 검사를 실행했지만, 파일·Node·Python 증거로 저장하지 못했다. 정식 테스트 집계에 추가하지 않는다.
- m1_visualization은 pure V8 BigInt 유리수 다항식으로 source U*=4η+j의 Z 연산 관련8개 항등식을 대조했다. α=U1_X(0,η)=−(1/2)Z_-1 Z_-A U*, α(0)=Aj, α′(0)=12, α″(0)=2Aj(8h−3). 실제 N1 axial residual의 선형 X 계수는 (9/2−18h²)j>0, N1 radial Q1=(Ω1−2XF1²)/X의 axis값은0이다.
- N0 radial axis coefficient Ω0/X=−2Π1_X=24−4AP(0)+P″(0)는 기존 actual A21 interval과 연결해 양의 하계를 확인해야 한다. 위 유도만으로 고정 X residual remainder나 N4-05의 PASS를 인정하지 않는다. Cauchy remainder·실제 norm·고정 좌표 및 N/격자/precision 분리 검증이 필요하다.

## 실제 I1 다음 단계의 식 — 코드 구현 전 기록

C12가 만드는 실제 함수 차이를 deltaU, deltaE라 하면 원래 incoming debt의 다섯 밀도는 다음이다. 적분 integrand 자체를 연결해야 하며 그 작은 상계를 RHS로 대체하지 않는다.

- deltaM = integral deltaU.
- deltaI = integral sqrt(2X)*deltaE.
- deltaJ = integral sqrt(2X)*(E*deltaU+U*deltaE+deltaU*deltaE).
- deltaS = integral (2U*deltaU+deltaU^2−E*deltaE−deltaE^2/2).
- deltaCp = integral (2E*deltaE+deltaE^2)/(2X).

원래 정규화 다섯 성분:
(deltaM/(X0*K*lambda),
 (deltaJ/(sqrt(2)*X0^(3/2)*K^2)−deltaM/(X0*K))/lambda^2,
 deltaI/(X0^(3/2)*K*lambda),
 deltaS/(X0*K^2*lambda),
 deltaCp/(K^2*lambda)).

I1의 실제 연속 행렬에는 U2×2 block determinant |det|≥1/200, E3×3 block |det|>3/64000000의 하계가 있고 그 실제 Cramer inverse의 infinity norm<2^30 경로를 검토했다. λ가 작은 실제 원본 범위를 유지한다. 이 constants를 unit-input finite probe만으로 실제 source norm으로 승격하지 않는다.

실제 I1 root의 첫 번째 모멘트 방정식으로 deltaM=0을 얻은 이후에만 I1 뒤의 M이 기존 outer와 같다는 분기를 사용한다. deltaU의 support가 끝났다는 이유만으로 그 primitive deltaM이0이라고 가정하면 안 된다.

원래 weighted Omega0의 regular integrals에는 축 경계
V0_X(0,eta)=[2A*eta*(4eta+j0)−4(1−eta^2)]/L
를 유지한다. eta=0에서 −4다.

양의 n1 producer는 실제 inner Picard와 cutoff의 local 5integrals에 완성한 global Omega0 두 weighted integrals를 더한 total debt를 만들어 Ipos inverse에 입력해야 한다. V1/Pi1 forward reconstruction, axis regularity, five total moments0 및 원래 support를 검사하기 전에는 n+1 source gate를 열지 않는다. n1의 support는 [Xminus,Xb], n≥2는 [Xminus,Xplus]로 구별하며 Xplus는 실제 leading axial support Xv 이후에 있어야 한다.

현재 구현한 정확 함수 program은 모든 실제 크기에서의 임의정밀도 interval interpreter와 같지 않다. 유한 root 반복값의 양의 tail, value inverse tail과 eta derivative tail의 차이, 자연급수의 거대한 required degree와 실제 materializer resource budget을 각각 보존한다. 이 노트는 blueprint_review의 원격 원문 및 독립 산술 검토를 보존하며 아직 로컬 code/test에 적용된 것으로 간주하지 않는다.
