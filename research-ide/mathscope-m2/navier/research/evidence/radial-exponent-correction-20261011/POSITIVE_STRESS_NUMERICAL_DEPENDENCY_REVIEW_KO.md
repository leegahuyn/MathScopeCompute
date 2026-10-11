# 원문 (6.2) radial exponent 교정: 수치·inverse 의존성 읽기 검토

작성: positive_stress, 2026-10-11. 이 기록은 실행 중인 original physical full-jet source attempt 3의 imports를 변경하지 않고 작성했다. 해당 실행은 잘못된 radial exponent를 포함하므로, 성공 여부와 별개로 교정된 원문 source의 통과 증거가 아니다.

## 1. 정확한 변경과 보존할 원래 매개변수

원문 NS PDF p.63의 (6.2)는

\[
 d_r=2((1+h)\rho_g-h\kappa_s),\qquad
 \kappa_s=1/100000,\qquad
 \rho_g=\log(4-\sqrt2)/\log(4+\sqrt2)
\]

이다. 현재 실행한 다섯 정의 지점은 마지막 항에서 2를 빠뜨렸다. 이 \(\kappa_s\)는 covariance 방향 여유 `c.kappa=directionalMarginKappa`와 서로 다른 상수다. 원래 source의 `h`, `A`, `D`, 모든 profile·cutoff·`b_n` 및 선택 규칙은 교정 대상이 아니다.

`d_new=d_old-h*kappa_s`이므로, 같은 band에서

\[
 M_{i,\mathrm{new}}=M_{i,\mathrm{old}}\epsilon^{-\kappa_s/2},
 \qquad M_i=\Lambda^i Q^{d_r/2},\quad\epsilon=Q^h.
\]

따라서 큰 원래 band에서 이 차이를 작은 부동소수점 오차로 취급할 수 없다. 물리 radial fast 계수의 정확한 비는

\[
 \frac{a_{\mathrm{new}}(R)}{a_{\mathrm{old}}(R)}
 =\frac{d_{\mathrm{new}}}{d_{\mathrm{old}}}
   \epsilon^{-\kappa_s/2}R^{-h\kappa_s}
\]

이다. 두 정의에서 `a(R)=M_i*d_r*R^(d_r-1)`를 실제로 미분해야 한다.

## 2. 교정 후에도 유지되는 수치 여유

\(\Lambda=4-\sqrt2\), \(T_g=4+\sqrt2\), \(S=\ell^2\)라 하자. 원래 palette floor의 오차를 \(0\le\theta<1\)로 쓰면

\[
 i=\frac{-(1+h)\log Q-\log S}{\log T_g}-\theta,
 \quad
 \log M_i=-\kappa_s\log\epsilon-\rho_g\log S-\theta\log\Lambda.
\]

따라서 정확한 두 경계는

\[
 \Lambda^{-1}\epsilon^{-\kappa_s}S^{-\rho_g}
 <M_i\le\epsilon^{-\kappa_s}S^{-\rho_g}.
\]

`1/2<rho_g<1`, `Lambda<3`, `S>=1`, `0<epsilon<1`로부터 기존 physical-center 증명에 쓰인 **더 약한** 경계

\[
 M_i>\frac{\epsilon^{-1/200000}}{3S}
\]

가 계속 성립한다. 또한

\[
 d_r-1=(2\rho_g-1)+2h(\rho_g-\kappa_s)>0,
 \quad d_r<2(1+h)<17/8
\]

이며, 여기에는 `2*kappa_s<1`의 정확한 유리수 확인이 필요하다.

그러므로 `physicalCenterFrequencyAudit`의 `200000`, `power=16384`, `bits=16384`, 양의 displacement radius와 이후 `2^-15000`, `2^-560`, `2^-512` 오차 여유를 늘릴 필요가 없다. 단 원문 식에서 위의 강한 하계를 먼저 얻은 뒤 기존 약한 하계를 소비한다고 증명을 고쳐야 한다. `actual-global-wave-bound-kernel`은 이미 `epsilon^-kappa_s` radial 손실을 사용하므로 `W_(alpha-kappa_s)`와 physical Q 손실 수치도 교정된 식에 맞는다.

## 3. 실제 영향 경로

계산 정의 다섯 곳은 `source-geometry.mjs`, `actual-covariance-source-certificate.mjs`, `actual-full-curl.mjs`, `actual-terminal-physical-velocity-jets.mjs`, `actual-common-global-wave-bounds.mjs`다. 이들의 동일 helper 연결은 ns_proof_audit가 맡는다.

`actual-common-band-physical-curl`은 palette의 실제 `dr`로 primitive와 `radialFast`를 만들므로, 해당 실제 velocity·gradient·Hessian·pressure·NS residual 및 global-wave certificate는 교정된 map으로 재생성해야 한다. 글로벌 covariance/Haar 및 palette의 추상 대수는 바뀌지 않지만, 새 물리 map과 결속하는 source 실행은 다시 필요하다.

`actual-common-physical-center-enclosure.buildPhysicalPoint`는 원래 anchor의 `Yi`와 nearest integer lift를 먼저 계산하고 그 뒤 `1/dr`로 invert한다. 이 floor와 lift는 바뀔 수 있다. 기존 `Rsharp`, `Tsharp`, 정확한 물리 angle을 그대로 재사용하면 안 된다. 새 대표점에서 `F`, frame, rounded carrier, 원래 Volterra system, `H`, `y`, target, 두 first/second variation과 270개 derivative body 및 positive normalizer를 다시 생성·결속해야 한다.

반면 `Bnorm`, 첫 selector의 여덟 constraint, `ell`, `S`, `Q`, `epsilon`, `k`, palette index, `ci`, `Ls`의 수학적 정의에는 `dr`가 없다. source-profile의 매개변수 표현 SHA와 원래 h를 변경할 이유도 없다. 구현 그래프의 다른 append 순서에서 node ID가 달라질 수 있으므로, 이런 수학적 불변성과 예전 graph ID 재사용을 혼동하면 안 된다.

## 4. 물리점의 유한 도함수 배율

`actual-positive-geometric-scale-kernel`의

\[
 \Omega_r=B_su,\quad \Omega_z=B_s,\quad
 \Omega_t=\widetilde pF,\quad
 \Omega_\theta=\widetilde p/R_\#
\]

와 `finiteJetClosedNumericalScale`의 Q/epsilon/k 지수는 `dr`를 직접 포함하지 않는다. 새 실제점의 값과 원래 positive roots를 다시 결속하면 이 공식 자체는 유지된다. 수치 구간이 이전과 우연히 같더라도 새로운 source proof가 필요하다.

이 판단은 원래 phase가 xi에 독립이고, 선택한 xi=0의 열린 근방에서 원래 transverse cutoff가 상수이기 때문이다. 원래 potential coefficient는 `chi(xi)`와 xi-independent factors의 곱이다. 완전한 `D_r=partial_R+a(R)*partial_xi`를 먼저 미분하면 a와 그 도함수를 포함하는 모든 추가 항에는 양의 차수의 transverse cutoff 도함수가 붙는다. 중앙 열린 plateau에서 이 항들이 정확히 0이다. 원래 sine remainder의 다른 slow/time 도함수와 cylindrical frame/direction connection은 유지된다. 전영역에서 fast derivative를 삭제하는 주장은 아니다.

이를 새 `tests/actual-physical-center-radial-correction.test.mjs`에서 검사했다. 상한이 없는 양의 M과 `a=M R^3`를 사용해 a', a''를 미리 없애지 않고 radial 3차 및 RRZ/RRT/RRv 미분을 계산했다. xi-dependent 비평탄 body에서는 생략한 fast 항이 실제로 남는다. **경량 3/3, 관측 exit 0**이며 `physical-center-plateau-positive-stress-attempt1.json`에 48개 import의 당시 SHA를 기록했다. 이는 cutoff 국소 항등식 검사이며 교정된 전체 source 실행은 아니다.

## 5. 맡은 후속 수정과 필요한 관측

root의 실행 종료·thaw 허가 뒤 positive_stress가 수정할 것은 `actual-physical-center-kernel`의 잘못된 hypothesis 식과 위 강한 하계에서 기존 약한 하계로 가는 증명이다. 실제점 adapter에서는 새로운 `assertOriginalSourceTorusMap`을 `buildPhysicalPoint`의 palette/inverse 연결에 명시적으로 적용해 다른 radial exponent를 받아들이지 않게 한다. 범용 `exactInversePhysicalTorusCenter`의 임의 양의 dr 계약은 유지한다.

교정된 common physical package 및 physical full-jet original source를 관측한 다음 source/worker의 새로운 pinned evidence를 만들어야 한다. 과거 통과·실패 로그와 snapshots는 변경하지 않으며, 이 기록으로 M2나 M3 gate가 닫히지 않는다.
