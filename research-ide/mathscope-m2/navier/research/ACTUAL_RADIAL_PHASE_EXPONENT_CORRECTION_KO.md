# 원문 물리 radial exponent의 계수 2 교정

## 1. 발견과 현재 판정

2026-10-11, M3의 원래 radial 역연산자 전제를 읽다가 M2의 물리 torus 정의에 원문과 다른 계수가 있음을 발견했다. 원문 **인쇄 페이지 63, 식 (6.2)** 의 이미지에는 다음과 같이 두 번째 항까지 감싸는 괄호가 있다.

\[
\kappa_s=10^{-5},\qquad
d_r=2\big((1+h)\rho_g-h\kappa_s\big),\qquad
\rho_g=\frac{\log(4-\sqrt2)}{\log(4+\sqrt2)}.
\]

이때까지의 구현은 `2*(1+h)*rho_g-h*kappa_s`를 사용했다. 두 번째 항의 계수 `2`가 빠졌으므로 두 식은 서로 다르다. 원래 양의 `h`가 매우 작다는 사실은 이 불일치를 없애지 않는다. 이 기록은 `h=0` 근사를 사용하지 않는다.

원문 PDF의 SHA256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. 같은 페이지의 (6.6)은 아래의 `epsilon^(-kappa_s)` 관계를 명시하므로, (6.2)의 괄호를 독립적으로 대조할 수 있다. [원문 페이지 이미지](evidence/radial-phase-exponent-correction-20261011/original-paper-p63.png)와 [검사 영수증](evidence/radial-phase-exponent-correction-20261011/source-radial-phase-exponent-kernel.json)을 보존했다. 부모와 두 검토자가 같은 원문 이미지를 각각 읽었다.

이 문서를 처음 작성할 때 기존 source3의 실행 입력은 동결 중이다. 따라서 기존 다섯 생성자와 실행 기록을 즉석에서 고치지 않았고, 교정 패치를 별도 파일로 준비했다. 그 실행이 끝나더라도 당시 결과는 **이전 물리 map의 구성 검사**로만 해석해야 한다. 원문과 일치하는 새 물리 생성의 성공으로 승격하지 않는다. 원문 물리 map을 사용하는 G-CURL/G-N5의 실행 결속과 G-NUM의 새 물리점 계산은 교정 후 다시 확인해야 한다.

## 2. 식 (6.6)의 정확한 유도

\[
\Lambda_g=4-\sqrt2,\quad T_g=4+\sqrt2,\quad
Q=2^{-\ell},\quad S=\ell^2,\quad\epsilon=Q^h,
\]

\[
i=\left\lfloor\log_{T_g}\frac{Q^{-1-h}}S\right\rfloor,
\qquad r_c=\frac{Q^{-1-h}/S}{T_g^i}.
\]

정확한 floor의 정의로 `1 <= r_c < T_g`이다. \(\Lambda_g=T_g^{\rho_g}\) 이므로

\[
\begin{aligned}
M_i
 &=\Lambda_g^iQ^{d_r/2}\\
 &=r_c^{-\rho_g}S^{-\rho_g}
   Q^{-(1+h)\rho_g+d_r/2}\\
 &=r_c^{-\rho_g}S^{-\rho_g}Q^{-h\kappa_s}\\
 &=r_c^{-\rho_g}S^{-\rho_g}\epsilon^{-\kappa_s}.
\end{aligned}
\]

따라서 원래 정의가 주는 정확한 양의 부등식은

\[
\Lambda_g^{-1}\epsilon^{-\kappa_s}S^{-\rho_g}
 <M_i\le\epsilon^{-\kappa_s}S^{-\rho_g},
\]

\[
\epsilon^{\kappa_s}S^{\rho_g}
 \le M_i^{-1}<\Lambda_g\epsilon^{\kappa_s}S^{\rho_g}.
\]

이전 잘못된 식으로 동일한 계산을 하면 `epsilon^(-kappa_s/2)`가 나온다. 정확한 차이는

\[
d_r^{old}-d_r=h\kappa_s>0,
\qquad \frac{M_i^{new}}{M_i^{old}}
=\epsilon^{-\kappa_s/2}>1.
\]

이 차이는 실제 radial primitive, 그 미분, torus 역상과 가장 가까운 lift 선택에 영향을 준다. 단순히 주석만 고칠 수 있는 문제로 분류하지 않는다.

기존 보수적 수치 예산을 유지할 수 있는 이유도 명시적이다. \(1<\Lambda_g<3\), \(1/2<\rho_g<1\), \(S\ge1\)이며 \(0<\epsilon<1\)이므로

\[
M_i^{new}>\frac{\epsilon^{-\kappa_s}}{3S}
\ge\frac{\epsilon^{-\kappa_s/2}}{3S}.
\]

또한 \(\Lambda_g^2-T_g=14-9\sqrt2>0\)이므로 \(\rho_g>1/2\)이고, 원래 \(0<h<2^{-4096}\)에서 `1 < d_r < 3`이라는 넉넉한 경계도 그대로 성립한다. 따라서 이전의 더 약한 inverse-displacement 예산은 교정된 식에서도 유효하다. 다만 **그 예산의 유효성과 새 실제 point의 source 실행은 서로 다른 확인 사항**이다.

## 3. 공통 정의와 원문 식 검사

새 [source-radial-phase-exponent.mjs](../source-radial-phase-exponent.mjs)는 하나의 산술 recipe를 제공한다.

```js
originalRadialPhaseExponentRecipe(O, { h, rho, kappa })
// 2 * ((1 + h) * rho - h * kappa)

originalSourceRadialPhase(G, { h, Tg })
// { h, Lambda, Tg, rho, kappa, dr }

assertOriginalSourceTorusMap(G, { h, Tg, physicalMap })
// 원래 실제 root와 typed arithmetic body를 대조한 plain JSON 기록
```

첫 함수는 실제 source 그래프와 방향 반올림 구간 계산에서 공유한다. 두 번째 함수는 `h === G.parameter('h')`, `Tg === 4+sqrt(2)`를 요구한다. 세 번째 함수는 실제 `physicalMap.dr`, `Lambda`, `rho`를 비교하고, 작은 arithmetic dependency 전체를 별도의 원문 syntax tree와 대조한다. binary add/multiply의 교환법칙만 사용하며, 괄호를 버리거나 미확인 함수를 하나의 원자로 바꾸지 않는다.

이 대조는 `G.lookup`의 hash-cons 캐시를 신뢰하는 것만으로 끝나지 않는다. 기존 node가 변조되어 캐시가 오래된 root ID를 돌려주는 경우에도 literal body 대조가 실패한다. 원래 `h`, `T`, `Md`의 정의도 함께 보존한다.

\[
h=\exp[-8002T],\qquad T=\exp(M_d)+10,
\qquad M_d=1048576.
\]

반환한 JSON은 `{specification, roots, nodes, parameterBindings, comparison, scope}`를 포함한다. 이 함수는 private parent/source 인증 이후에 호출해야 한다. 저장된 `pass` 플래그를 입력으로 받지 않으며, 그 자체가 전체 물리 field의 실행이나 M2 전체 완료를 증명하지 않는다. 새 source 실행은 같은 실제 point의 `originalPhysicalMap`에서 이 기록을 생성해야 한다. 이전 실행에서 이 기록이 없다는 사실을 새 기록을 복사하여 보완하지 않는다.

## 4. 다섯 생성자와 영향 범위

직접 식을 만들던 다음 다섯 곳을 공통 정의로 전환하는 패치를 준비했다. 기존 실행의 SHA와 파일은 유지하며, 동결 해제 뒤에만 적용한다.

| 생성자 | 직접 영향을 받는 양 |
|---|---|
| `source-geometry.mjs` | 표시용 directed `d_r`, `M_i`, radial chain 계수 |
| `actual-covariance-source-certificate.mjs` | 원래 palette의 `physicalMap.dr`, `Y_i(r,t)` |
| `actual-full-curl.mjs` | 실제 local curl의 `M_i`, `radialFast` |
| `actual-terminal-physical-velocity-jets.mjs` | selected terminal 물리 map과 velocity 미분 |
| `actual-common-global-wave-bounds.mjs` | 실제 radial map 상수와 `epsilon^-kappa_s`의 원문 결속 |

현재 live 설명 `ACTUAL_LOCAL_FULL_CURL_KO.md`의 식도 같은 교정 대상이다. 과거 실행 증거와 당시 독립 검토문은 당시 바이트를 보존한다. [준비된 패치](evidence/radial-phase-exponent-correction-20261011/original-radial-phase-five-callers-and-live-doc.pending.patch)와 [적용 전후 예상 SHA](evidence/radial-phase-exponent-correction-20261011/pending-correction-manifest.json)는 적용 전 기록이다.

| 항목 | 유지되는 수학 | 새로 확인해야 하는 source 결속 |
|---|---|---|
| G-POS | 실제 `H`, frame, Volterra, target, 양의 weight 및 경계 sqrt 정리에는 `d_r`가 들어가지 않는다. | 새 물리 point에서 그 실제 객체들을 다시 구성하는 실행은 별도 필요하다. |
| G-N4 | auxiliary에 독립인 배경 `b,F,G,p`, leading cancellation, stress와 동일 `b_n` tail 논증은 변하지 않는다. | physical graph를 포함하는 통합 기록의 바이트와 root namespace는 새 실행으로 대조한다. |
| G-CURL | 임의의 매끄러운 radial coefficient에서 full curl/divergence 항등식은 유지된다. | 교정된 원래 map에서 얻은 실제 curl/미분과 zero extension의 새 실행이 필요하다. |
| G-N5 | pulse Gaussian, 안정 전파, 원래 Haar/covariance와 모든 label의 algebra는 유지된다. 사용한 physical loss 예산은 이미 `epsilon^-kappa_s`이다. | 원래 physical map 및 그 temporal force/잔여항과의 연결을 다시 실행해야 한다. |
| G-NUM | 이전 기준점의 centered/absolute-a/138 계수 수치, 원래 양의 parameter 및 selector arithmetic의 자체 식은 변하지 않는다. | 수정된 nearest lift와 inverse point, 두 실제 H/weight, 새 target, 270 body와 normalizer 결속을 다시 구성해야 한다. |
| M3 N6 | 이번 확인은 원문 radial inverse가 얻는 `epsilon^kappa_s`의 정확한 출처를 복구한다. | M2 완료 이전에 N6 구현이나 완료 판정을 시작하지 않는다. |

실제 point의 열린 fast-cutoff plateau에서는 모든 필요한 `xi` 미분이 0이어서 보수적 centered coefficient 예산을 바꿀 필요가 없다는 독립 검토가 있다. 이 사실은 실제 source에서 plateau와 새점의 equality를 다시 확인해야 한다는 요구를 없애지 않는다. phase가 0인 한 점의 velocity 값만으로 도함수나 비선형 잔여항을 0으로 두지 않는다.

## 5. 검증 상태와 다음 실행

새 경량 검사는 **8/8 PASS, 실제 관측 exit 0**이다. 원래 positive h를 가진 작은 literal graph를 사용한다. 괄호식, \(-\kappa_s\) exponent의 정확한 대수, 이전 식 거부, `h=0`/잘못된 `Tg` 거부, 캐시를 남긴 node 변조, `h` 정의 변조, directed finite interval, append와 저장 기록의 독립성을 확인한다. 이는 heavy 원본 물리 source 실행이 아니다.

다음 순서를 유지한다.

1. 진행 중인 이전-map source3의 결과와 모든 초기/late import SHA를 보존한다.
2. 동결 해제 뒤 다섯 source 정의와 실제 point의 equation audit 삽입을 함께 적용한다.
3. 원문 식의 private point 검사, 원래 실제 H/target/weight 및 full physical source를 다시 실행한다.
4. 새 물리 source와 수치 source의 실제 성공, scope, import SHA와 equation audit가 맞는 경우에만 새 기록을 설치한다.
5. G-NUM을 포함한 전체 M2 관문이 실제로 닫힌 다음 사용자가 요청한 M3 순서를 시작한다.

이 기록은 프로그램 검사 수가 원문 수학을 대신하지 못한다는 구체적인 사례다. 기존 실행의 통과 수를 숨기거나 새 원문 정의를 통과한 기록으로 다시 이름 붙이지 않는다.
