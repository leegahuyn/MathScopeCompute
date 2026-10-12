# 실제 nonlinear core 점 평가: 독립 수학·표시 계약 검토

검토일: 2026-10-10. 대상은 고정된 `same-profile-2026-10-10.3`이다.

**판정:** 아래 SHA의 `evaluateActualCorePoint`는 명시된 점별 값·도함수의
포함구간 API로 승인한다. 실제 비교 오차를 보존한 leading core 관측이며,
원래 N4/N5의 남은 여섯 항목을 PASS로 올리는 근거는 아니다. 이번 검토는
원문 유도와 코드·표시 계약의 읽기 검토다. 기존 파일이나 체크리스트는
수정하지 않았고, 담당자의 수치 검사·브라우저 검사 횟수를 독립 재실행한
것으로 세지 않는다.

## 1. 검토한 바이트와 근거

아래 경로는 `research-ide/` 기준이다. 통합 파일은 검토 시점의 스냅샷이다.

| 파일 | SHA256 |
|---|---|
| `mathscope-m2/navier/actual-core-evaluator.mjs` | `670952e4d28f1f6f81830e90a784192de3b387fc097db2576f9fd5716dc6d2a9` |
| `mathscope-m2/navier/research/ACTUAL_CORE_POINT_EVALUATOR.md` | `3f3f62d8606d96662bfa749039eb1207ba9b1e2ed69076a89354abfaec08bef9` |
| `mathscope-m2/navier/index.mjs` | `772e5643416938e4a7309f28e12ef2c9079f02d1afe1918817e3b71fb947a49b` |
| `mathscope-m2/visualization/actual-core-panels.mjs` | `9ea2386d14d30b48e0f6a60f8943df78e2ede6a575cf8c88b611157fca67c54b` |
| `mathscope-m2/evidence/original-m2-criteria.json` | `ae8d51410367ed147fda1e1e4c28bcc8df3e398378482e39102cef900ff15ed3` |
| `mathscope-m1/navier/followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md` | `1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920` |
| `mathscope-m1/navier/followup-20261010-same-datum-axis/EVALUATED_MIXED_PHI.md` | `e831255d5dd49a5493e2a70b71a7c57000650c374430f35b49dddc8353166853` |
| `mathscope-m1/navier/followup-20261010-symbolic-gluing/PRESSURE_DATUM_INTERVAL.md` | `8dfd40a7206871b425e69894ead0321fe6f476c338f0532739c1d055a920386d` |

중심 근거는 `SAME_DATUM_ANALYTIC_AXIS`의 (5), (14a), (16), (21), (22)와
`PRESSURE_DATUM_INTERVAL`의 (2), §4다. 이 문서들의 원전은 SHA256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`인
제공된 논문이다. 새로운 Lean kernel 정리의 완료를 주장하지 않는다.

## 2. 실제 실수 영역과 비교함수 복소 원판의 구분

원문의 Banach 공간은 실수 구간 `I=[-33/32,33/32]` 전체에서 정의되어 있고,
실제 fixed point와 비교함수의 거리 상계는 `29 Q^-53`이다. 따라서 현재
API가 받는 실제 `eta in [-1,1]`는 그 영역 안에 있다. 세 chart의 의미는
각각 `eta=r*rho`, `eta=r*j0`, `eta=r`이며, 허용되는 r의 범위는
`[-1/4,1/4]`, `[-1,1]`, `[-1,1]`이다.

이전 `EVALUATED_MIXED_PHI`의 `|xi|<=1/16`은 eta=0 중심의 명시적
비교함수 Taylor 평가에 사용한 원판이다. 실제 nonlinear 해에 대한 실수
eta 범위의 제한으로 가져올 수 없다. 새 구현은 각 요청 중심에서 비교식을
다시 평가하므로 그 옛 Taylor 다항식을 다른 중심으로 외삽하지 않는다.

새 비교 원판의 증명도 확인했다. `H=D eta+(1-eta^2)(4eta+j0)`에 대하여
실수 중심 eta0가 `[-1,1]`에 있고 `|eta-eta0|<=j0*10^-12`이면
`|H'|<30`이다. `sigma=j0/2000`, `a=60000*10^-12`라 두면

\[
 |H-H_0|/\sigma\le a,\qquad
 \frac{|H^2-H_0^2|}{H_0^2+\sigma^2}\le a+a^2=:e<10^{-6}.
\]

실수 H0에 대한 `2|H0|sigma<=H0^2+sigma^2`를 사용했다. 따라서 비교식
`chi=H^2/(H^2+sigma^2)`의 분모가 0이 되지 않고
`|chi|<=(1+e)/(1-e)<2`다. **이 원판은 명시적 비교함수에만 적용된다.**
nonlinear fixed point의 작은 복소 해석 영역을 이 크기로 넓혔다고
주장하지 않는다.

Phi jet은 `j0^m partial_eta^m partial_Y^k Phi`를 계산한다. 전체 비교
radial tail에 Cauchy 손실 `m!*10^(12m)`을 곱하고, 별도로 원문 (16)의
실제 nonlinear 오차

\[
 29Q^{-53}\rho^{-m}\frac{(m+k)!}{(m+1)^2 20^k}
 (1-Y/20)^{-m-k-1}
\]

를 보존한다. `rho^-1<=Q`, `Q>=2^260`, `j0^m<=1`로 만든 코드의 더 큰
유리수 상계는 유효하다. 현재 차수는 k,m=0..2이고 `0<=Y<=41/10`이다.
`Y<=4`는 실제 미수정 core, `4<Y<=41/10`은 B.26 입력용 자연 연장이다.
후자를 cutoff가 적용된 실제 물리 collar로 표시하면 안 된다.

## 3. 압력, 축방향 보정과 평균의 복원

원문의 실제 A.21 압력은 전체 수평 띠 `|Im eta|<=1/16`에서
`P/K=-cP/(1+eta^2)^2+E`, `|E|<2^-1400`을 만족한다. 실제 P(0)/K receipt를
부호 반전하고 이 오차만큼 넓혀 고정 상수 cP를 감싸는 것이 맞다. 각 실수
중심의 m차 Taylor 오차는 `16^m*2^-1400`이고, 코드가 도함수 변환의 m!를
포함하므로 ordinary eta 도함수 0..3도 올바르게 포함한다.

`U*=4eta+j0`, `H*=D eta+(1-eta^2)U*`, `L=1-2h eta^2`에 대해 코드의

\[
 Z_*/K=K^{-1}[-A(1-2\eta U_*)U_*-4H_*]
 -(1-\eta^2)P'/K+4A\eta P/K
\]

는 원문 (5)의 모든 항과 부호를 보존한다. 따라서
`u_ref/K=-Y(Z*/K)/(2L)`이며, Y에 선형인 reference의 radial 평균은
정확히 그 절반이다. 실제 오차의 원문 상계는 Y에 대해 단조 증가하므로
`0<=y<=Y`의 평균에도 같은 상계를 쓸 수 있다. 여기서 u/K와 평균의 eta
도함수는 ordinary 미분이다.

복원은 `U=4eta+j0+(K/Lambda)(u/K)`,
`M/X=4eta+j0+(K/Lambda)(A_Y u/K)`다. `K/Lambda<=2^-16380`이 유효하며,
J/RHO chart의 0차 출력을 j0로 나눌 때의 상계도

\[
 \frac{K}{\Lambda j_0}
 =2^{-16640}4000000^{-64}K^{-63}j_0^{127}<2^{-16640}
\]

로 확인했다. 작은 양수의 구간 하한이 0인 것은 그 소스 상수를 정확히 0으로
정의한 것이 아니다. g primitive, 실제 nonlinear 압력 보정 p 및 전체 물리
속도장의 복원은 이 API에서 완료하지 않는다.

## 4. 발견하여 수정한 DIRECT_RATIONAL(0) 계약

초기 구현은 `coord.xi` 존재 여부로 U/j0 정규화를 골랐다. 이 조건은
DIRECT_RATIONAL(0)에도 참이 되어 직접 좌표의 0에서만 배율이 달라졌다.
담당자가 `normalizedCore = coord.kind !== 'DIRECT_RATIONAL'`로 고쳤고,
수정한 바이트를 다시 읽어 확인했다. 이제 DIRECT_RATIONAL은 0을 포함해
ordinary 배율이고, RHO/J chart의 0차 값만 j0로 나눈다.

아주 작은 직접 유리수 eta에서도 `2^-16384/|eta|`를 정확 유리수로 먼저
만들고 한 번 바깥 방향으로 반올림한다. 따라서 반올림된 eta를 0인 분모로
사용하지 않는다. 입력의 4096-bit 제한에 따른 `|eta|>=2^-4096`과
`|j0/eta|<=2^-12288`도 이 처리의 유효성을 뒷받침한다.

## 5. 코어 패널 읽기 검토

`index.mjs`의 job은 전체 결과를 `result.results`에 보관하며 상태를
PARTIAL로 유지한다. 전역 의무가 끝났다는 체크는 생성하지 않는다.
`actual-core-panels.mjs`의 점과 정확 표는 다음 저장 결과를 직접 참조한다.

| 표시 | 값의 결과 경로 | 정규화 |
|---|---|---|
| Phi 혼합 도함수 | `result.results.phi.rows[i].actualNonlinearInterval` | `j0^m partial_eta^m partial_Y^k Phi` |
| 축방향 보정과 평균 | `result.results.axial.rows[i].uOverK`, `.averageUCorrectionOverK` | K로 나눈 ordinary eta 도함수 |
| 복원 U와 평균 U | `result.results.axial.actualValues[i].U`, `.averageU` | 각 행의 `normalization`을 표시 |
| 실제 A.21 압력 | `result.results.axial.pressure.derivatives[i].interval` | `partial_eta^i(P/K)` |
| 좌표·오차·범위 | `result.results.request`, `.coordinates`, `.domain`, `.scope`, `.sourceBindings` | 원본 계약 |

각 mark와 표 cell의 경로는 위 데이터에 맞는다. 차트의 y는 저장된 화면용
enclosure의 중점이며, 정확한 유리수 끝점과 오차는 별도 표에 남긴다.
서로 다른 도함수를 공간상 표본처럼 연결하지 않고 `physicalDimension=0`,
행 순서 축, j0 정규화와 ordinary 미분의 차이, Y>4의 제한을 명시한다.
이 범위에서 수학적 값을 잘못 표시하는 오류는 발견하지 않았다.

초기 패널 검토에서 세 가지 provenance·표현 보완을 요청했고, 통합 담당이
반영한 최종 바이트를 다시 읽어 모두 확인했다.

- 두 축방향 패널의 y축 `sourceFields`에 U/uOverK와 함께 그리는 평균
  필드가 모두 기록된다.
- Phi 행 순서 및 `2*i+component`로 만든 축방향 x좌표의 변환을 저장행/
  성분 인덱스로 명시하여 sourceField와 표시좌표의 관계를 보존한다.
- Phi 표의 문구를 “Φ의 X·η 미분 환산 배율”로 고쳐 g나 전체 속도장의
  복원이 완료됐다는 의미로 확대하지 않는다.

표의 패널 SHA는 이 세 보완을 읽기 확인한 최종 스냅샷이다. 브라우저
렌더링 자체는 이 독립 검토의 대상에 포함하지 않는다.

## 6. 원래 여섯 기준을 아직 PASS로 판정할 수 없는 이유

ID·제목·쪽수는 원래 criteria JSON의 것을 유지했다. 다음은 각 기준의
실제 남은 의무를 한 문장씩 기록한 것이다.

| 원래 기준 | 현재 구현으로 PASS라 할 수 없는 구체적 이유 |
|---|---|
| **N4-03 — 차수별 inner Picard 풀이** (p.58) | n=0의 점별 포함구간과 n=1의 국소 관측·상계만으로는 (5.7)–(5.8)의 실제 여섯 성분 partial sums를 변경하지 않은 공통 collar와 필요한 eta strip에서 구성하고, 복구된 이전 차수에 의존하는 후속 차수의 Cn·tail까지 연결했다는 결과가 되지 않는다. |
| **N4-04 — 차수별 radial cutoff와 모멘트 복구** (p.58) | 전체 continuation·cutoff를 포함한 실제 다섯 moment-debt 함수와 필요한 eta 도함수를 아직 감싸지 못해, 실제 inverse를 적용한 total moments=0 복구와 그 이후에만 다음 차수 source를 만드는 연쇄가 완료되지 않았다. |
| **N4-05 — 유한 배경 잔차 검증** (p.58) | 실제 복구된 coefficient/stress 수열의 Fslow=R+div T, CN,m·Km 및 같은 관측점에서 차수·격자·정밀도를 독립 변화시킨 잔차 검증이 없으므로, n=0 포함구간 폭이나 비교 오차를 원래 (5.25)의 검증된 residual tail로 바꿔 부를 수 없다. |
| **N5-04 — 위상·편극·주파수** (p.60) | 실제 Imean의 국소 frame 결과와 core 점 데이터는 원래 pulse 대상 annulus 전체에 필요한 N4 배경·도함수 및 공통 q_star 아래의 normal 분모·frame determinant 하한을 아직 제공하지 않는다. |
| **N5-05 — 성장·감쇠 ODE 풀이** (p.60) | reference log envelope와 Imean 비교 상계는 원래 left growing datum을 쓰는 실제 projected amplitude의 검증 가능한 해, energy balance·midpoint normalization·접공간 제약 및 필요한 모든 annular label의 양 끝 Gaussian 추정을 대신하지 못한다. |
| **N5-06 — 두 family의 positive covariance** (p.60) | 실제 heat-prepared stress T0와 두 homogeneous pulse의 Hcov 적분이 완결되지 않아, 그 실제 값으로부터 양의 y±·determinant 하한·C(W0)=epsilon T0,* 및 중복 없는 전역 (7.30) 조립을 인증할 수 없다. |

의존관계는 각 차수에서 **실제 Picard 해 → cutoff와 다섯 모멘트 복구 →
다음 차수 source**의 순서다. 필요한 배경과 stress가 준비되어야 유한
잔차와 전역 phase/frame을 평가할 수 있고, 그 실제 ODE 해와 stress가
두 family covariance의 입력이 된다. 새 점 평가기는 이 연쇄의 실제
leading core 입력을 강화했지만 뒤 단계의 완료 증거를 만들어 내지는 않는다.

이 한계는 상수가 너무 크다는 사실만으로 설명되지 않는다. 원문의 정확
정의는 존재하고, weighted Omega의 적분 부분적분 축약과 C.12 차이의
균일 상계도 이미 얻었다. 남은 작업은 그 동일한 함수를 전체 continuation과
cutoff에 걸쳐 검증 가능한 적분·도함수 포함구간으로 연결하고 실제 복구에
투입하는 것이다. 기호적 definite integral이나 국소 관측을 이미 평가된
전역 debt로 간주하면 이 의존관계를 건너뛰게 된다.

관련 독립 근거: `RESUMED_SOURCE_AUDIT_KO.md`,
`WEIGHTED_OMEGA_REDUCTION_KO.md`. 현재 여섯 기준의 PARTIAL을 유지하고,
다른 기존 PASS 항목의 원문 범위나 판정을 이 검토에서 변경하지 않는다.
