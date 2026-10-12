# 실제 중심 가중 radial slow 미분의 독립 source·수학 검토

검토자: `ns_proof_audit`  
재작성 시각: 2026-10-11 11:54 UTC  
검토 대상: `actual-centered-slow-jet-enclosure.mjs`, `actual-centered-slow-jet-enclosure-kernel.mjs`, `actual-centered-slow-jet-source-bounds.mjs`, 해당 한국어 증명 문서와 실제 source 두 번째 실행.

## 1. 기록 재발급과 결론

이 문서는 같은 검토자가 완료했던 독립 검토의 **새 시점 재작성본**이다. 이전 메시지에 기록한 SHA256 `c75068d9815223560aef0443262906d135810edb483de856ae8437098f67aa2a`의 원래 문서 바이트는 파일명 충돌로 덮어써졌고, git/index 또는 별도 snapshot에서 복구하지 못했다. 이 문서가 그 이전 바이트와 같다고 주장하지 않는다. 별도로 작성된 conditioning 검토는 `INDEPENDENT_CENTERED_SLOW_JET_CONDITIONING_REVIEW_KO.md`에 SHA256 `6cd32a8d7566ddaec5366ef53744e06d06442fba3a101557ea8a3a3e3564de8e` 그대로 보존했음을 덮어쓰기 전에 확인했다.

재작성하면서 실제 source 영수증의 **68개 literal import SHA를 현재 파일과 모두 다시 대조했고 전부 일치했다.** 원래 source, 수학 모듈, 실행 기록과 당시의 실패 기록은 수정하지 않았다. 이 작업은 새로운 source 실행이 아니다. 이전 읽기에서 검토한 원본 body, 양의 인자, 미분/잔여항 논증을 아래처럼 구체적으로 다시 기록한다.

**검토 결론:** 선언한 동일 terminal 평가점과 radial 가중 pulse의 세 1차·여섯 대칭 2차 slow 미분이라는 범위에서 실질적인 수학 오류를 발견하지 못했다. 원래 두 성분 해, pressure 행, 움직이는 기저, 완전 감쇠, 공분산 적분, target 미분과 양의 제곱근을 유지한 채 중심 정상화와 엄밀한 양의 오차를 사용한다. 이것은 아직 미평가 양의 scale 자체, 실제 torus 역상의 물리점, 다른 두 pulse 성분, fast 미분, 전체 물리 curl의 수치 인증이 아니다.

## 2. 실제로 평가한 함수와 좌표

함수는

\[
W_\pm(R,Z,T)=\sqrt{y_\pm(R,Z,T)}\,t_{r,\pm}(L_s/2;R,Z,T)
\]

이다. 평가점은 원래 인증된 terminal member의

\[
X=X_b e^{-1/4},\quad \eta=0,\quad s=1,\qquad
R=R_*=\sqrt{2X},\quad Z=0,\quad T=1
\]

이며 대표점도 이 점으로 먼저 고정한다. 정수 label, carrier, palette, band와 대표점은 미분 전에 고정한다. 따라서

\[
D_R=R_*\partial_R,\qquad D_Z=\partial_Z,\qquad D_T=\partial_T,
\qquad D_R^2=R_*^2\partial_R^2
\]

이다. 가변 계수 Euler 연산자의 제곱으로 읽으면 결과가 달라진다.

원래 양의 expression root

\[
g=\frac{3\lambda_0u^2}{(1+u^2)^{3/2}},\quad
m=\frac{r_0^2}{\sqrt{gL_s}},\quad
\tau=-\frac{N\cdot T_{\rm source}}{A_c}>0,\quad A_0=\sqrt{\tau/m}
\]

를 그대로 둔다. 세 1차 계수는 \(D_iW/(A_0\sqrt{gL_s})\), 여섯 2차 계수는 \(D_iD_jW/(A_0gL_s)\)이다. 출력은 이 정상화 계수의 구간이다. 새로운 실제 torus 역상에서 값이 비슷하다는 사실만으로 이 점의 \(\mu_i\) 수치를 다른 점에 옮길 수 없다.

## 3. source 미분과 해석적 정당화

원래 \(w'=Mw\), \(w(0)=(1,0)^t\)에서 두 부호 각각 20성분 계를 생성한다. \(1+3+6\)개의 두 성분 block이며

\[
w_i'=Mw_i+M_iw,\quad
w_{ij}'=Mw_{ij}+M_iw_j+M_jw_i+M_{ij}w.
\]

같은 방향에서는 두 forcing 항이 합쳐져 계수 2가 된다. \(M\)은 원래 moving pressure, \(B'\), \(d-d_{\rm ref}\)를 포함한다. caller가 제시한 미분행렬이나 norm을 받아 원본이라고 간주하는 경로가 없다.

각 부호에서 \(M,M_i,M_{ij}\)의 40개 scalar body와 실제 \(v\) 미분을 사용하여

\[
U(f)=\sqrt{1+f(0)^2}
+\int_0^{L_s}\sqrt{1+(\partial_vf)^2}\,dv
\]

를 만든다. 이는 시간에 균일하고 slow 매개변수에 의존하는 실제 FTC 상계다. 원래 매끄러운 body와 비영 분모, 국소 연속성/국소 유계성을 사용해 미분된 Volterra 급수의 국소 균등 수렴을 정당화한다. 이 식을 수치 적분한 것으로 표시하지 않는다. 수치 오차를 얻는 power 장부는 별도의 논증이다.

전체 covariance 적분의 40개 jets, inverse의 20개 관계, sqrt의 18개 관계에서 retained shared body의 materialization을 원래 AD root와 따로 대조한다. 형식적인 Leibniz/역행렬 재귀 검사 자체가 원본 body 결속까지 수행한다고 확대하지 않는다. 원래 frozen carrier에 나타난 세 분기가 모두 같은 piecewise는 정확한 함수 항등식으로만 정규화하며, 값이 다른 활성 분기를 없애는 규칙은 없다.

## 4. full heat와 원래 slow scale

실제 열린 terminal 근방에서는 양의 차수 보정이 원래 지지집합 밖에 있고, 원래 global moment를 복구한 axial field도 0이다. 단순 leading 근사가 아니라 원래 after-branch와 global moment 항등식으로 그 사실을 결속한다. 원래 slow factor까지 포함하면

\[
F=\mathcal B_*(R)f_o(y)H(z),\qquad
\mathcal B_*(R)=E_*(R^2/2)^{-1-h},
\quad y=\log\frac{R^2}{2sX_{\rm tail}},\quad z=\frac{4T}{R^2}.
\]

원래 \(s^{-A-1/2}\)를 미분 전에 포함해야 한다. \(A=1/2+h\), \(X=R^2/(2s)\)를 대입한 양의 실수 거듭제곱 항등식이 위 radial factor를 준다. \(z\)가 \(Z\)에 독립인 것과 전체 \(F_{ZZ}\)가 0인 것은 다르다. 원래 \(f_o(y)\) 및 \(s-Z^2s^{2h}=T\)의 곡률이 남는다.

원래 Gamma 밀도를 유지하고

\[
H=1-hzD_0,\quad H'=-hD_1,\quad H''=h(1+h)D_2
\]

를 사용한다. 유한 Taylor 식과 부호 있는 다음항 경계, 전체 Gamma moment가 구간의 근거다. moment의 무한급수 수렴을 가정하지 않는다. \(h\)와 \(z\)가 매우 작더라도 정확한 양의 인자로 남는다.

평가점의 reflected step argument는 정확히 \(1/8\)이다. \(a=\sigma(1/8)/256\), \(b_s=\sigma'(1/8)/512\), \(c_s=-\sigma''(1/8)/1024\), \(f=1-ha\)로 놓으면

\[
\alpha=(-c_0)^2=h\mathcal A,
\qquad \mathcal A=1-\frac{b_s}{f}-\frac{zD_1}{H},
\]

\[
\mathcal A_T=\frac{c_s}{f}-\frac{hb_s^2}{f^2}
-\frac{zD_1}{H}+\frac{z^2(1+h)D_2}{H}
-\frac{hz^2D_1^2}{H^2}.
\]

이 부호와 완전 감쇠항의 미분을 독립 계산했다. \(\alpha_RR_*=-2\alpha_T\), \(F_T/F=\alpha-h\)를 사용할 때도 \(h\) 항을 소거하지 않는다. 이 검토의 식은 이 고정 평가점의 식이며 임의 terminal 점에 대한 동일 수치표를 뜻하지 않는다.

## 5. 유한 source power 상수와 시간 전체의 잔여항

원래 chart, step, Gamma heat의 혼합 5차까지 양의 coefficient majorant를 만드는 유한 유리수 재귀를 읽었다. 관측한 최댓값 \(1178784498865381440<2^{512}\)는 같은 원래 body의 유한 차수 상계다. 실제 \(F\), \(R_{\rm env}\), 양의 \(B_s\) 공통 인자의 정확한 약분을 통해 정상화 frame의 장부로 이전한다.

검증한 power 예산은 \(3313<3840<4096\)이며 필요한 \(M,M_i,M_{ij},L_sM_{iv}\)와 비교에 사용한 한 auxiliary 방향에 적용된다. 이를 별도의 모든 4차 slow jet 전체에 대한 실행으로 읽지 않는다. moving pressure와 \(B'\)의 항을 생략하면 작은 원본 frame 음성대조가 실패한다. 실제 midplane에서 정상화한 \(n_z=-1\)이 분모의 양의 하한을 준다.

target의 whole backward primitive, 원래 \(b_\theta\) 하한과 실제 heat를 포함한 별도 장부는 \(\tau>R_{\rm env}^{-60}\), 충분한 target power 여유를 준다. 원래 target 미분을 상수처럼 다루지 않는다.

Riccati cone에서 첫 변분 \(r_i\), 둘째 변분 \(r_{ij}\) 및 중심 log 진폭 \(q_i,q_{ij}\)의 차이를 통제한다. 본문에서 쓰는 충분한 여유는 \(|r_i|\le B^6\), \(|r_{ij}|\le B^{14}\), 시간 전체에서 \(|q_i''|\le B^{268}/S\), \(|q_{ij}'|\le B^{20}\)이다. 이 범위가 Gaussian core 안에만 제한되어 있으면 밖의 적분 오차를 닫을 수 없는데, 코드는 \(0\le v\le L_s\) 전체의 원래 유리식 분모 하한으로 이를 제시한다.

\[
x=(v-L_s/2)\sqrt{g/L_s}
\]

에서 중심 Taylor 오차는 \(B^{300}/\sqrt S\)와 \(|x|+x^2\) 또는 \(|x|\)의 곱으로 억제된다. 필요한 polynomial 차수는 4까지이며 Gaussian tail을 포함해 전체 구간에서 적분한다. 이로부터 \(2^{-620}\) 수준의 작은 양의 오차를 \(2^{-600}\) 여유로 옮기는 계산이 일관된다. \(S\ge B^{1024}\)의 실제 band 조건, 원래 cutoff, finite \(u\), \(h\), rounding과 \(\epsilon\) 항은 모두 유지한다.

## 6. 움직이는 중심 진폭을 먼저 미분한 후 정확히 약분

각 family의 \(a_i(R,Z,T)=w_{+,i}(L_s/2;R,Z,T)>0\)는 slow 변수에 따라 변한다. 이를 먼저 상수로 고정해서 미분하면 틀린 결과가 된다. 코드에서는 실제 모든 slow jets를 유지하고

\[
\overline H_{ji}=\frac{H_{ji}}{D_jma_i^2},\qquad
\overline Y_i=\frac{y_i ma_i^2}{\tau},\qquad
\frac{W_i}{A_0}=\sqrt{\overline Y_i}\frac{t_{r,i}}{a_i}
\]

의 양의 항등식을 사용한다. \(D_j\)는 두 행의 실제 기하 scale이다. 공분산의 inverse와 sqrt 미분이 이 동적 중심 응답을 상쇄하는 과정을 각 body에 결속한다.

중심 Gaussian의 홀수 moment가 1차 비교항을 0으로 만들며, 원래 양의 remainder를 남긴다. 2차에서는 \(\overline H_{ij}\)의 \(2\mu_i\mu_j\) 항이 inverse와 sqrt를 지나

\[
\frac{D_iD_jW}{A_0gL_s}\approx-\mu_i\mu_j\frac W{A_0}
\]

를 준다. 이것은 0이나 유한 수치 비교식을 원래 함수의 정확한 도함수로 치환하는 절차가 아니다. 전체 \(H\) 적분, target 및 다른 성분의 응답은 엄밀한 구간 반경에 남는다.

관측한 대표 중심은 \(RR\approx-0.3458850187\), \(RT\approx4.1205\times10^{-26}\), \(TT\approx-4.908723\times10^{-51}\)이다. 원래 rational endpoints가 정식 출력이며 이 소수는 읽기용이다. \(Z\) 관련 및 1차의 0 비교도 양의 폭을 가진 구간이지 exact-zero 선언이 아니다.

## 7. 실제 실행과 provenance 대조

source 두 번째 실행은 12/12 검사와 내부 source 검사 11개 PASS, 외부 관측 종료 코드 0이다. 내부 경과 시간은 81.980566994초, 외부 프로세스 경과 시간은 82.388881157초, peak RSS는 2,992,844,800 bytes다. 실행마다 구분하는 시간과 메모리 단위를 혼동하지 않는다.

- 최종 graph: 439,629 nodes, 18,565,716 canonical bytes.
- graph SHA256: `c4d8b3daca26c061ae227a6744654d41c67b6ffa98a8d7c62dfd518f52e04a00`.
- 원래 source SHA256: `8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a`.
- 본 실행에서 좁힌 centered tolerance의 선행 graph SHA256: `aeb9c5d5f9b2fd2ee3e33e45ed7f39c11f4907e703be87440446017d997dc1e0`.
- source JSON SHA256: `6af25b8966fd14ed0c064de8f5e92dfd18d2755b6ffc26927bb6897d168cffa7`.
- source log SHA256: `f48828f5ab62130aab774948aee5f54ce1d0439043b7308a1a470f1a2a3f3ef4`.
- process JSON SHA256: `add61ea97950e544f11f89374df2e3783530105cf128d14a058b1d95b3393b54`.
- 68개 import manifest SHA256: `0b0c3c0048b0f6c25104fc82dc352c336635b61be2f6c25db167417a62df9b4f`.

현재 세 새 수학 모듈 SHA256은 다음과 같다.

| 모듈 | SHA256 |
|---|---|
| `actual-centered-slow-jet-enclosure.mjs` | `5624f5b284639baed56c8d97b3335e2f357bbee49b0b00896b9f53b723d93c8e` |
| `actual-centered-slow-jet-enclosure-kernel.mjs` | `5380b3b9857cb3df1e185675647337f9da12308ebaff260c57c3076d577449ab` |
| `actual-centered-slow-jet-source-bounds.mjs` | `b459a15cf3efdc21588f77f25573a7fabf5f05a8bc03b02865e0503f7265011b` |

한국어 증명 문서의 이번 읽기 SHA256은 `91388a6f8ee80f8338f2bc28caa9ce98b4acdd31eb876aff1e912fa321b7d672`이다. light kernel 11/11 기록과 source 실행 기록은 별개다. sealed body/interval/matrix 변조 거부, 복사 객체 거부, later append 뒤 고정 prefix hash 불변 검사를 읽었다.

첫 source 실행은 원래 slow exponential의 동치 지수 묶음을 literal equality로 비교한 지점에서 실패했다. `exp((-A-.5)*log s)`와 `exp(-((A+.5)*log s))`를 원래 producer의 동일 구조로 결속하도록 새 adapter를 수정한 후 통과했으며, 원래 source는 그대로다. 이 실패를 성공이나 음성대조로 바꾸지 않는다. 새 작은 회귀는 원래 slow factor를 실제로 누락하면 거부한다. 첫 실행의 JSON/log와 source snapshot은 남아 있다.

## 8. 이 검토가 승인하지 않는 확대

이 검토는 하나의 원래 terminal 점에서 부호당 radial 9 slow jets, 총 18개 정상화 수치 구간과 그 source 결속에 한정한다. 다음을 완료로 읽지 않는다.

- 원래 \(g,L_s,\tau,A_0\) 등의 양의 scale 자체의 절대 수치 평가.
- 같은 수치표를 다른 representative, torus 역상 또는 모든 label에 적용.
- 세 pulse 성분의 모든 fast/physical 미분, absolute \(H,y\)의 slow 수치 jets.
- 전체 물리 curl 또는 전역 물리 잔차의 수치 enclosure.
- 새 해석학 Lean 정리 또는 M2 전체 / M3 진입 승인.

실제 universal background/positivity/flatness의 별도 패킷은 자체 source와 서술형 증명 범위로 평가해야 한다. 유한 실행 PASS의 수가 그 전역 정리의 대체 증거가 아니다. 이 재작성은 source 실행이나 수학적 결과를 바꾸지 않으며, 문서 provenance 충돌의 이력만 명시한다.
