# 같은 공통 family의 실제 물리 중심 수치값: 독립 읽기 검토

검토일: 2026-10-11 UTC. 검토자: `/root/sensitivity_kernel`.

## 1. 결론과 검토 방법

새 `actual-physical-center-kernel.mjs`, `actual-common-physical-center-enclosure.mjs`, 실제 source runner, 두 경량 검사 파일, 한국어 본문과 성공 실행 기록을 읽었다. 선언한 범위인 **같은 공통 family의 첫 admissible band에서 새로 구성한 하나의 실제 물리 중심, 그 점의 두 source H/가중치와 세 펄스 성분, 활성 + 파동의 전체 curl 값의 스케일별 계수 구간**에 대해 수학적 결함을 찾지 못했다.

이 검토는 새 source 실행이나 Lean kernel 검사가 아니다. 이미 기록된 실제 source 실행의 import 102개를 현재 파일과 SHA256으로 직접 대조했고, 전부 일치했다. 원래 모듈·테스트·source 실행물을 변경하지 않았다. 아래에는 검토한 정확한 바이트를 기록한다.

| 검토 대상 | SHA256 |
|---|---|
| physical-center kernel | `11de13903f810a905e045f0b9080cb6fed32cc579a4d5a2e41b4fe7058ec7b42` |
| common physical-center adapter | `16a3050c772c78db2bffff0c49fd2abdd187f9cf05fd211249080df34f9641a2` |
| 실제 source 검사 | `4e1ea1a8c2f200932b36cf5c502845815b83b9dee1c59e5b3131bf14e27fc720` |
| 경량 kernel 검사 | `93eab94a7db5ffc165113aeab17fd64b9ae79718db9e6f4756767b5bdebaf4bc` |
| 경량 source-interface 검사 | `bb2c78a0c7acf02be468978296cfd561f0b01bf6f956a0b4125e69efe8f71e16` |
| Python 실행 관측기 | `875d625764c6b033b3cca6427ec07f98a29d98bdec985c0ea5d2d3e0aab5edf9` |
| 당시 한국어 본문 | `91fa480ff8b669794a72676cf1db42703b34346794f581be8475596e68cc3b68` |

본문에 이후 실행 표나 이 검토의 링크가 추가되면 새 문서 SHA로 기록해야 한다. 위 문서와 바이트가 같다고 소급해 표시하지 않는다.

## 2. 원래 torus map의 실제 역상과 새 대표점

원래 palette의 두 직교 벡터, \(D_g=4-2\sqrt2\), \(\Lambda=4-\sqrt2\), \(T_g=4+\sqrt2\)를 사용한다. anchor는 정수 lift와 mesh label을 고르는 데만 사용한다. 가까운 lift를 원래 두 벡터로 투영하고, 양의 radial 좌표에 대해 exp/log 역함수를 취하여 실제 \(r_\#,t_\#\)를 얻는다. 역상 radial 양성은 추측값이 아니라 palette와 실제 source 주파수 하한으로 입증한다.

주파수 여유의 독립 계산도 맞는다. \(t=\ell^{1/4}\)이면 \(\log_2\ell<8t\)이고, \(\ell\ge(64/h)^2\)로부터

\[
h\ell/t=h\ell^{3/4}\ge512/\sqrt h>512\,2^{2048}
\]

이다. 따라서 원래 양의 \(\epsilon=2^{-h\ell}\)에 대해

\[
\epsilon^{1/200000}S^{16384}<2^{-16384}
\]

를 갖는다. 이 과정은 \(h=0\)이나 \(\epsilon=0\)를 대입하지 않는다. 실제 radial/time/log-profile/mesh 이동 경계는 이 강한 부등식보다 작다. 새 \(s=T_\#\), \(\eta=0\), \(X=X_\#\)는 원래 implicit chart의 유일한 양의 해와 양의 제곱근 관계로 결속된다.

새 점은 기존 box의 열린 bump 지지집합 안에 있고 원문의 허용된 대표점으로 선택된다. 원문에 없던 격자 중심 조건을 추가하지 않는다. 같은 대표점을 실제 Volterra의 여섯 slow/reference 인자 모두에 넣는다. `source2`는 새 \(T_\#\)가 literal 1이 아니고 새 \(X_\#\)가 anchor root가 아님도 확인했다.

반대 부호 rectangle의 transverse 거리는 \(2^{-21}\)보다 크며 원래 지지 반경은 \(2^{-34}\)이다. 따라서 그 부호의 auxiliary 중심 H/t 계산을 이 같은 물리점에서 활성인 두 번째 파동으로 세지 않는다. 다른 label의 배제에는 같은 원래 universal palette 정리를 사용한다.

## 3. 실제 배경장·두 행렬·H·역가중치의 결속

원래 공통 completion의 support와 다섯 moment를 소비하여 \(X>X_+\)에서 모든 양의 차수 항과 그 유한 미분이 0임을 사용한다. 원래 axial primitive는 실제 최종 moment 조건으로 끝난 뒤 0이 된다. compact integrand만 보고 primitive가 0이라고 추론하지 않는다.

그 영역에서 완성된 배경장과 원래 full heat leading 몸체가 같고, \(G\) 및 국소 미분이 0이다. heat의 eta 짝함수성과 implicit chart의 Z 짝함수성은 새 \(T_\#>0\)에서도 \(F_Z=0\)를 준다. 실제 \(F>0,F_R<0\)와 Rayleigh radicand로

\[
N=(-1,0),\quad K=(0,-1),\quad
\lambda_0=2F\gamma,\quad
-RF_R=2F(1+\gamma^2),\quad \gamma=-c_0>0
\]

를 얻는다. \(s^{-A-1/2}\)를 포함한 원래 전체 target은 새 점에서 \(T_z=0,T_\theta>0\)이다.

두 부호 모두 원래 pressure, \(B'\), 실제 damping과 반올림된 nonzero angular carrier를 넣어 행렬을 재생성하여 결속한다. 전체 원래 H 적분, mass, \(H^{-1}\mathcal T\), Volterra 초기값 \((1,0)\)와 실제 중심 \(a_\pm\)를 같은 새 point에 대입한다. 기존 점의 숫자 root를 새 점이라고 바꾸지 않는다.

재사용하는 Gaussian/cone/adiabatic 부등식은 \(s=1,\delta=1/4\)라는 등호에 의존하지 않는 값 경계이다. 새 source의 \(g,A_c,B_s,\tau,L_s\)와 원래 양의 분모·rounding 경계를 다시 결속해 그 조건을 충족시킨다. 기존 점의 \(\mu,\nu\) 또는 slow 미분 수치를 이 새 점으로 옮긴 것으로 해석하면 안 된다.

정규화된 세 성분의 부호는 radial과 theta가 양수, z가 family sign이다. H는 양의 theta 행과 양수/음수 z 열을 가지며 determinant가 음수로 분리된다. 실제 inverse target weights와 그 제곱근은 양수 구간이다. 두 성분이 같은 구간에 들어가는 것과 서로 같은 실제 값이라는 주장을 구분한다.

## 4. 전체 curl의 값과 도함수의 경계

nonzero 원래 \(p\)로 \(\theta_\#\)를 선택해 원래 phase가 정확히 0이 되는 식과, 원래 물리 phase gradient가 \(n\)이라는 식을 확인한다. 원래 coefficient는

\[
C=\eta_\beta\sqrt\epsilon\sqrt y\,\chi\psi\,
\frac{n\times t}{k|n|^2}
\]

이다. real potential \(-C\sin(k\Phi)\)의 전체 원통 curl에는 coefficient curl과 principal cosine이 모두 남는다. 실제 radial fast 인자, \(D_z=\epsilon\partial_Z\), 원통 \(C_\theta/R\) 항도 포함한다.

원래 \(n_t=\sqrt{n_\theta^2+n_z^2}\)의 양의 제곱근 관계를 사용해 \(n\cdot B_j=0\), 따라서 \(n\cdot t=0\)를 얻는다. 정확한 삼중곱으로 phase 0에서 curl의 **값**은 \(\eta_\beta\sqrt\epsilon\sqrt y\,t\)이고, 물리 스케일 \(Q^{-A}\)를 한 번 곱한다. 압력 sine 항 역시 이 점의 값만 0이다.

source coefficient C는 zero-order 몸체가 실제 expression에 materialize됨을 확인한다. 이 packet에서 coefficient curl의 모든 공유 미분을 별도의 수치 변분계로 materialize했다는 주장은 하지 않는다. phase 0에서 sine 값이 사라져도 그 항의 미분은 남으므로, full curl 도함수나 nonlinear residual을 이 value 항등식으로 계산할 수 없다. 코드와 문서의 scope가 이 구분을 유지한다.

원래 cutoff 검사는 \(\chi(0)\)의 constant branch와, \(v=L_s/2\)에서 두 step 인자가 정확히 6임을 각각 확인한다. 남아 있는 `source_step_derivative(6,0)` 노드를 literal 1이라고 우기지 않는다. 원래 sigma의 \([1,\infty)\) constant-one 법칙으로 그 곱이 1임을 증명한다. 이것이 최초 실패를 고친 정확한 이유다.

Cartesian 값은 원래 큰 angle을 유지한 정확한 회전 표현이다. angle을 binary64로 반올림하여 세 Cartesian 성분의 높은 상대 정확도 소수를 얻었다고 주장하지 않는다.

## 5. 실행·실패 및 provenance

성공 실제 source는 `actual-common-physical-center-source-attempt2.json`이다.

| 항목 | 확인한 기록 |
|---|---|
| source 검사 | 12/12 PASS |
| constructor 내부 그룹 | 8/8 PASS |
| 외부 관측 종료 코드 | 0 |
| constructor 기록 시간 | 329.502436215초 |
| 외부 process 시간 | 329.902474249초 |
| peak RSS | 4,041,027,584 bytes |
| graph | 695,628 nodes, 31,297,485 canonical bytes |
| graph SHA256 | `d7fef39bfe7dbc377bf21c905da1b88d219eee604f55f6f2feb01ab1da1b4ad9` |
| 원래 common band graph SHA256 | `61796a9d07a50fd53beffa30531e90fe47e6b077926bf0e865ecd79513641da6` |
| source input SHA256 | `1b1aef77ba82fcadf1c1a013a2bf05661263a2eccc4b3b509923a0b8fcbca894` |
| source 당시 git HEAD | `87c7bb6fa1b24e1f8ea3d0281827665cc852de0e` |
| 102개 literal import closure SHA256 | `90f95cf7a4dcef2dd47516d491babb2c906585fa772de1a7022ed21523db791f` |
| source JSON SHA256 | `bcc676d87bb8de05765a7de2334fe296f95407788a5d2ce16439a9341902ad4e` |
| source log SHA256 | `7553bf8a5450967674302a880aef542b65d21a2ba5c4398eeca648f8f5d3de11` |
| process JSON SHA256 | `54d75afcf14954106de6825edb7553ef2ee3e311100b1c4b22357dabf04e4cce` |

별도 경량 `kernel-attempt3`은 12/12와 관측 exit 0이다. 일반 검사를 실제 source 검사에 합산하지 않는다. 최초 실제 `source-attempt1`은 cutoff plateau 결속 실패로 exit 1이며, 187.821013926초/peak 3,916,263,424 bytes와 당시 snapshot을 보존했다. 그 시도의 중간 구성 성공을 최종 PASS로 바꾸지 않았다.

복사 객체, 새 point의 변조, interval 변조, 행렬 변조와 program metadata 변조의 거부 및 합법적인 후속 append 후 고정 prefix 보존을 실제 source에서 확인했다. 이번 독립 검토에서는 그 실행을 다시 수행하지 않았다.

## 6. 승인되는 범위

이 기록은 원래 공통 source의 하나의 실제 물리점에 대한 directed **scaled 값**의 결속을 지지한다. 모든 양의 geometry/target 스케일의 수치 평가, 높은 상대오차의 unscaled Cartesian 숫자, slow/mixed/fast 도함수의 물리 수치 구간, 모든 label 수치 평가, 전역 physical residual 수치 경계, 전체 G-NUM, 새 Lean 증명 또는 M3 시작을 승인하지 않는다.
