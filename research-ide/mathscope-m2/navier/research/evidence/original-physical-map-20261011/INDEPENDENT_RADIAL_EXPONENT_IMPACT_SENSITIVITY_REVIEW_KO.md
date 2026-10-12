# 원문 radial exponent 계수 교정의 독립 영향 검토

검토자: `sensitivity_kernel`. 날짜: 2026-10-11 UTC.

이 문서는 원문 NS PDF p.63의 (6.2), (6.6), 현재 동결된 실제 source 모듈, 기존 수치 오차 장부와 새 경량 plateau 회귀를 읽고 작성한 독립 수학 검토다. 실제 source 생성기를 추가 실행하지 않았고, 실행 중인 source attempt 3의 imports를 수정하지 않았다. 작성 시 해당 실행의 최종 관측 결과를 승인하지 않았다. 여기서 확인한 **구 지도와 원문 지도의 불일치** 때문에 그 실행이 통과하더라도 교정된 원문 구현의 통과 증거로 사용할 수 없다.

## 1. 확인한 오류와 크기

원문의 정확한 식은

\[
\kappa_s=\frac1{100000},\qquad
\rho_g=\frac{\log(4-\sqrt2)}{\log(4+\sqrt2)},\qquad
d_r=2\big((1+h)\rho_g-h\kappa_s\big).
\]

현재 `actual-covariance-source-certificate.mjs`와 `actual-common-global-wave-bounds.mjs`는 마지막 항을 한 번만 빼는
\(d_{\rm old}=2(1+h)\rho_g-h\kappa_s\)를 계산한다. 추가로 `source-geometry.mjs`, `actual-full-curl.mjs`, `actual-terminal-physical-velocity-jets.mjs`의 같은 정의도 확인했다. 원래 양의 \(h\)와 covariance 방향 여유 상수는 서로 다르며, 이번 교정으로 이들 원래 매개변수를 바꾸면 안 된다.

\[
d_{\rm new}=d_{\rm old}-h\kappa_s,
\qquad
M_i=\Lambda_g^iQ^{d_r/2},\quad
\Lambda_g=4-\sqrt2,\quad\epsilon=Q^h.
\]

따라서 동일한 band와 palette index에서

\[
\frac{M_{i,\rm new}}{M_{i,\rm old}}
=Q^{-h\kappa_s/2}=\epsilon^{-1/200000}.
\]

\(d_r\)의 가산 차이가 작다는 사실은 이 비가 1에 가깝다는 뜻이 아니다. 원래 거대한 band의 \(\log Q\)를 곱하므로 작은 부동소수점 오차나 \(h=0\) 대입으로 처리할 수 없다. 실제 radial fast 계수까지 비교하면

\[
a(R)=M_i d_rR^{d_r-1},\qquad
\frac{a_{\rm new}(R)}{a_{\rm old}(R)}
=\frac{d_{\rm new}}{d_{\rm old}}
 \epsilon^{-1/200000}R^{-h\kappa_s}
\]

이다. \(M_i\)의 비를 곧바로 \(a(R)\) 전체의 비라고 부르면 안 된다.

## 2. 정확한 palette 상·하계와 inverse 여유

\(T_g=4+\sqrt2\), \(S=\ell^2\)라 쓰고 원래 floor의 오차를 \(0\le\theta<1\)로 두면

\[
i=\frac{-(1+h)\log Q-\log S}{\log T_g}-\theta.
\]

교정된 식을 **먼저 정확히 대입**하면

\[
M_i=\Lambda_g^{-\theta}\epsilon^{-\kappa_s}S^{-\rho_g},
\qquad
\Lambda_g^{-1}\epsilon^{-\kappa_s}S^{-\rho_g}
 <M_i\le\epsilon^{-\kappa_s}S^{-\rho_g}.
\]

이는 원문 (6.6)의 지수와 일치한다. \(\Lambda_g<3\), \(S\ge1\), \(0<\epsilon<1\), \(\rho_g<1\)에서 기존 inverse 증명이 사용한 더 약한 하계

\[
M_i>\frac{\epsilon^{-1/200000}}{3S}
\]

도 유지된다. 여기서 원문의 \(\epsilon^{-\kappa_s}\)를 \(\epsilon^{-\kappa_s/2}\)로 동일시한 것이 아니라, 전자에서 후자의 부등식을 도출한 것이다.

또한 \(\Lambda_g^2>T_g\)는 \(14>9\sqrt2\), 곧 \(196>162\)에서 따르므로 \(1/2<\rho_g<1\)이다. 따라서 원래 \(0<h<2^{-4096}<1/16\)를 유지하면

\[
d_r=2\rho_g+2h(\rho_g-\kappa_s)>1,
\qquad d_r<2(1+h)<17/8<3.
\]

기존 `physicalCenterFrequencyAudit`의 source 지수 비교
\(\epsilon^{1/200000}S^{16384}<2^{-16384}\)와, \(B^{-1}<R_*<B\)에서의 다음 보수적 변위 상계에는 더 큰 오차 예산이 필요하지 않다.

\[
\begin{aligned}
|R_\#-R_*|&<12B^2S\epsilon^{1/200000},\\
|T_\#-1|&<6S\epsilon,\\
|\log(X_\#/X_*)|&<64B^3S\epsilon^{1/200000},\\
\text{mesh 변위}&<S^5\epsilon^{1/200000}.
\end{aligned}
\]

다만 **기존 실제 점을 재사용할 수는 없다.** anchor의 물리 \(Y_i\), nearest integer lift, \(1/d_r\)를 쓰는 radial inverse 모두 달라질 수 있다. 같은 anchor 근방에 두 점이 존재한다는 부등식은 같은 점이라는 증명이 아니다. 새 점을 실제로 구성한 뒤 같은 box의 대표점 조건과 열린 terminal 영역 조건을 다시 결속해야 한다.

## 3. 전역 물리 도함수·Gaussian 장부

현재 전역 source의 설명 중

`Lambda^i*Q^(dr/2) <= epsilon^(-kappa_s/2)*S^(-rho)`

는 구 식에서 나온 것이므로 교정해야 한다. 그러나 이어지는 **최종 손실 예산은 이미 \(\epsilon^{-\kappa_s}\)** 였다. 교정된 정확한 상계는
\(M_i\le\epsilon^{-\kappa_s}S^{-\rho_g}\le\epsilon^{-\kappa_s}\)이므로 그 최종 예산을 충족한다.

모든 고정 차수 \(j\)에 대해

\[
\partial_R^j a(R)
=M_i(d_r)_{\underline{j+1}}R^{d_r-1-j}.
\]

현재 `radiusRows`는 \(d_{\rm abs}=\sqrt{1+d_r^2}\)와
\(R_{\rm base}=2+R_{\rm lower}+R_{\rm lower}^{-1}+R_{\rm upper}>1\)를 써서

\[
\big|(d_r)_{\underline{j+1}}R^{d_r-1-j}\big|
\le(d_{\rm abs}+j+1)^{j+1}
 R_{\rm base}^{d_{\rm abs}+j+1}
\]

로 지배한다. \(1<d_{\rm new}<d_{\rm old}<3\)이므로 이 구조는 그대로 유효하다. 원문 식으로 source 상수를 다시 생성하면 되고, 더 큰 \(\epsilon\) 손실을 도입할 이유는 없다.

`actual-global-wave-bound-kernel.mjs`의 기존 일반 증명은 이미 다음을 사용한다.

- 각 radial fast 계수 미분은 \(\epsilon^{-\kappa_s}\) 한 인자와 실제 source 상수에 의해 제어된다.
- full curl remainder는 \(W_{1-\kappa_s}\)이고 \(\kappa_s<1/2\), \(0<\epsilon\le1\)에서 \(W_{1/2}\) 상계에 들어간다.
- radial physical loss의 상계는 \(1/2+h_{\max}\kappa_s=800001/1600000<1\)이다. 여유 \(799999/1600000\)는 교정 후에도 같다.
- 후속 물리 미분당 \(Q^{-2}\), residual \(C_mQ^{-2-2m}S^{b_m}\) 및 원래 양의 Gaussian tail을 사용하는 수치 지수 예산도 증가하지 않는다.

이는 **기존 일반 부등식이 교정된 source에서도 적용 가능하다는 수학적 판단**이다. 잘못된 물리 지도와 결속된 기존 private full-curl/global-wave/physical-residual certificate를 새 원문 certificate로 바꾸어 읽는 근거는 아니다. 원래 cutoff, 모든 Leibniz 항, cylindrical basis 연결항 및 양의 무한 tail을 보존한 source 연결을 다시 검사해야 한다.

## 4. 중앙 42개 물리 jet에서 큰 radial 계수가 사라지는 정확한 이유

현재 선택한 물리점의 \(\xi=0\)에는 원래 transverse cutoff \(\chi\)가 **열린 근방에서 상수 1**인 구간이 있다. 원래 phase와 \(t,H,y,n\), slow cutoff는 \(\xi\)에 독립이고, potential coefficient의 \(\xi\) 의존성은 \(\chi(\xi)\) 인자에 있다. 따라서

\[
D_r=\partial_R+a(R)\partial_\xi
\]

를 완전히 반복 미분하면 \(a,a',a''\) 등이 붙은 추가 항에는 반드시 양의 차수의 \(\xi\) 도함수가 남는다. 열린 plateau로 제한한 뒤 그 항들이 정확히 0이 된다. 이는 \(a\)의 크기와 무관하며, radial 3차 potential 및 RRZ/RRT/RRv를 포함한 필요한 혼합 미분에도 적용된다. \(\theta\) 방향의 \(R^{-1}\), 회전 basis와 connection을 미분하는 규칙은 그대로 유지된다.

이 순서는 중요하다. 원래 full potential/curl을 미분하기 전에 fast 항이나 sine remainder를 버려서는 안 된다. \(\psi\)도 중앙에서 상수인 것은 맞지만, 원래 \(w,t\)의 \(v\) 미분까지 0이 되는 것은 아니다. 또한 transverse 전이부나 임의 물리점으로 이 소거를 확대할 수 없다.

새 [radial correction 경량 회귀](../../../tests/actual-physical-center-radial-correction.test.mjs)를 독립적으로 읽었다. \(M>0\)에 상한을 두지 않고 \(a=MR^3\)의 1·2차 미분을 보존한 상태에서 실제 \(\chi\) 몸체를 사용한다. radial 1–3차, RRZ/RRT/RRv를 검사하고, 비평탄 \(\xi F\)에서는 \(aF\)가 실제로 남는 음성 대조를 포함한다. 구체적 결함을 찾지 못했다.

다른 검토자가 관측한 [경량 실행 기록](../radial-exponent-correction-20261011/physical-center-plateau-positive-stress-attempt1.json)은 3/3, exit 0, 512 MiB 한도, 48개 import 기록이다. 본 검토에서는 재실행하지 않았다. 이 회귀는 **일반적인 국소 plateau 항등식**이며 교정된 실제 물리점 생성이나 전체 source 인증이 아니다.

따라서 새 점을 원래 같은 terminal 근방에 다시 결속하고 원래 cutoff plateau를 다시 확인하면, 기존 normalized 물리 42행의 \(2^{-512}\) 양의 잔여 오차 예산을 늘릴 필요는 발견하지 못했다. 기존 point의 source IDs나 실제 값을 새 point에 그대로 옮길 수 있다는 결론은 아니다.

## 5. 270행, 양의 배율과 변경되지 않는 수학적 입력

`finiteJetClosedNumericalScale`의 정확한 단항식은 \(Q,\epsilon,k,L_s,R_\#,F,g,\gamma,A_c,u,\tau\) 등으로 표현되며 \(d_r\)를 직접 사용하지 않는다. 물리 42행의

\[
\Omega_r=B_su,\quad\Omega_z=B_s,\quad
\Omega_t=\widetilde pF,\quad\Omega_\theta=\widetilde p/R_\#
\]

와 \(k\sqrt\epsilon\)의 정확한 소거, \(Q\) 지수 계산은 유지된다. 반면 이 식 안의 **새 점의** \(R_\#,F,g,\gamma,A_c,u,\tau\) 및 carrier/대표점 데이터는 다시 결속해야 한다.

원래 배경으로 정한 \(B\), selector, \(\ell,S,Q,\epsilon,k\), palette index, \(c_i,L_s\)는 물리 radial exponent에 의존하지 않는다. 이 수학적 불변성과 다른 AST 생성 순서에서도 기존 node ID가 같다는 주장을 구분해야 한다. 모든 root는 새 실제 program의 own graph에 존재해야 한다.

228개 pulse 행의 radial 정규화는 고정된 \(R_\#^r\partial^\alpha\)이며, 42개는 원래 physical 값·방향·covariant Hessian이다. 양의 scale를 곱했다고 전자의 \(R_\#^r\)까지 나누어진 것으로 표시하면 안 된다. 새 point의 source-bound row map과 현재 수치 재계산을 결합할 때도 이 의미를 유지해야 한다.

## 6. 다시 검증해야 하는 경계

| 부분 | 수학적으로 유지되는 내용 | 필요한 후속 관측 |
|---|---|---|
| 원래 heat, cutoff 적분, 배경·공통 selector | 이번 \(d_r\) 교정에 독립인 식과 이미 검증된 일반 산술 | 변경된 import closure가 요구하는 byte/provenance 점검. 무관한 모든 과거 실험을 일괄 재실행할 필요는 없음 |
| palette와 physical inverse | 원문 식의 더 강한 \(M_i\) 하계가 기존 변위 상계를 함의 | 원문 계수 2 회귀, 실제 새 anchor/lift/inverse/대표점 생성 및 원래 map equality |
| 원래 Volterra·H·inverse·sqrt | 같은 terminal 근방의 원래 일반 부등식, 양의 domain과 조건수 장부 | 새 대표점의 두 부호 system/H/y와 실제 derivative root들을 다시 생성 |
| 228+42 수치·양의 scale | 고정된 일반 계수·잔여항·단항식의 오차 여유 | 새 원래 point의 270행 exact body, scale root, source error premises 및 최종 private seals와 관측 exit 0 |
| full physical curl·전역 wave/flat tail | 모든 Leibniz 항을 포함한 \(\epsilon^{-\kappa_s}\), \(Q^{-2-2m}\) 일반 상계 | 교정된 physical graph에 대한 source 결속과 covariance/NS-residual/\(E_B\) 통합 경계 재검증 |
| 설치 수치 실행·replay | 순수 directed 재계산과 명시적인 \(R_\#^r\) 의미 | 교정된 관측 source로 새 pin 생성, installed root map/SHA 검증, 실제 runtime/Worker parity·표시 검증 |

기존 구 지도 source 로그와 snapshots는 실패·성공 여부 그대로 보존해야 한다. 기존 구 지도 실행을 원문 실행으로 재명명하거나, 직렬화된 구 결과를 새 private 인증 객체로 바꾸어서는 안 된다. 교정된 source의 실제 관측 전에는 원문 M2 완료 및 다음 gate의 완료를 이 문서로 선언할 수 없다.

## 7. 읽기 검토의 자료·해시

다음 바이트를 직접 확인했다. PDF와 p.63 PNG는 기존 로컬 원문 자료이며, 이번 검토의 product source 변경은 없다.

| 자료 | SHA-256 |
|---|---|
| `tmp/physical_bridge_audit/navier-stokes.pdf` (2,959,204 bytes) | `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f` |
| `tmp/physical_bridge_audit/ns-page63-read.png` | `88db97971ba71ffe234ae80b20f618962bf5c6dc53958597dc9fc18c742db3f0` |
| `actual-covariance-source-certificate.mjs` | `5813b40c9be76b89944cf3b255cad67ac9f46dfeec28c42d1b95c3fb1da67769` |
| `actual-common-global-wave-bounds.mjs` | `63262e2bc53e2032fab12cfc8e1eac61021cc4728b8e5f49a5623fc9aa9089ad` |
| `actual-physical-center-kernel.mjs` | `11de13903f810a905e045f0b9080cb6fed32cc579a4d5a2e41b4fe7058ec7b42` |
| `actual-global-wave-bound-kernel.mjs` | `aed60d154195d07b38e2b7fa3005a1b792cc6e8c8867a91008fecec2d33ca6b9` |
| `actual-common-physical-center-enclosure.mjs` | `16a3050c772c78db2bffff0c49fd2abdd187f9cf05fd211249080df34f9641a2` |
| `actual-physical-center-jet-bodies.mjs` | `cb730c5bb7860687f393881dd176a1d3cd95f68dd507a4005415bfdfd1686105` |
| `actual-physical-center-jet-source-enclosure-bounds.mjs` | `4efc3c1892ed76454aba589b2a1fc886beb80e76308c927572464b095fe781a9` |
| `actual-positive-geometric-scale-kernel.mjs` | `19186b57fd40ec5461af6e51c7b6e1eb2827567ed31210770d0ae727a7807c07` |
| `tests/actual-physical-center-radial-correction.test.mjs` | `6b5b7baf8b3f56f89254e6091b1269bb9702ec6506a3856992d3906d90a1ffc3` |
| `physical-center-plateau-positive-stress-attempt1.json` | `04a2ea223d58e61db21ec0fb9b98b387a36eaee88693cca5e7593e05671ccd35` |

판정: **원문 계수 불일치는 확인됨. 기존 보수적 inverse·유한 수치·전역 손실 예산은 명시한 조건에서 유지 가능. 교정된 실제 source 및 설치 실행의 완료는 미검증.**
