# 같은 공통 배경장의 전체 curl·공분산·물리 잔차 연결

이 묶음은 `actual-common-admissible-family.mjs`가 만든 하나의 원래 cutoff
수열 `b_n`을 사용한다. 각 band와 label의 완성된 배경, 고정 대표점,
반올림한 carrier, 두 실제 Volterra 해, 원래 적분 공분산 H와 그 양의
가중치를 해당 family에서 다시 구성한다. 이전의 다른 band에서 얻은
행렬 H나 서로 다른 그래프의 정수 root ID를 이식하지 않는다.

원문은 [Finite Time Blowup for Navier–Stokes](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)의
§§6–7, (7.27), (7.30), (7.37)–(7.42) 및 배경 stress의 §5이다.
검토한 PDF의 SHA-256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다.

## 공분산 가중치의 실제 미분

열벡터를 두 실제 pulse 적분으로 정의한 H에 대해 `H y = T_*`를 사용한다.
세 slow 좌표 i,j 각각에 대해 적용되는 식은

\[
y_i=H^{-1}(T_{*,i}-H_i y),\qquad
y_{ij}=H^{-1}(T_{*,ij}-H_{ij}y-H_i y_j-H_j y_i).
\]

각 양의 성분에서 σ=√y라 쓰면

\[
\sigma_i=\frac{y_i}{2\sigma},\qquad
\sigma_{ij}=\frac{y_{ij}}{2\sigma}-\frac{y_i y_j}{4\sigma^3}.
\]

실행 그래프는 실제 H의 integrand와 움직이는 적분 끝점을 미분하며,
원래 두 성분 ODE의 모든 총차수 3 이하 변분을 40개 성분의 계로 만든다.
원래 0차 해를 유한 합으로 바꾸지 않는다. H의 미분과 σ의 미분은
potential을 미분하기 전에 결속하므로, 전체 curl과 공간 2차 velocity에
필요한 모든 곱 미분에 들어간다.

양성의 정의역은 공통 family가 증명한 열린 annulus와 충분히 큰 원래
band이다. 원문 표시용 ell=1에 이 양성 정리를 적용하지 않는다.
경계에서는 양의 y를 나눈 식을 먼저 평가하지 않는다. 실제 두 radial
지수 인자가 각 고정 차수의 유한 극을 흡수한다는 경계 정리에 따라
함수와 도함수를 0으로 연장한다.

## 원래 좌표 변환 뒤의 전체 curl

`actual-common-band-physical-curl.mjs`는 원래 torus palette와 두 rectangle,
고정 label, 원래 `c_i`, `L_s`, `Q`, `epsilon`을 사용한다. 독립 좌표에서
먼저 계산하는 미분 연산자는

\[
D_r=\partial_R+a(R)\partial_\xi,\quad
D_z=\epsilon\partial_Z,\quad
D_t=-\epsilon\partial_T+\partial_v.
\]

원래 radial fast map을 미분해 a(R)를 얻으며, 원통 기저의 회전과 `1/R`
연결항도 미분한다. 원래 potential의 실수부는
`-C sin(k Phi)`이고, C에는 실제 `sqrt(epsilon)`, σ, transverse cutoff,
slow partition과 전체 moving normal이 들어간다.

각 부호에 대해 potential·velocity·gradient·Hessian·time·pressure gradient의
실제 표현식을 계산하고, 원래 torus map을 대입한 40개 scalar 식에
shell·transverse·time guard를 붙인다. 세 성분의 전체 pressure와 완성된
배경장 `(b, R F, G)`도 유지한다. b의 radial stream cutoff 미분항과
원래 pressure 축 datum은 생략하지 않는다.

원래 physical 배율은 potential에 `Q^(1/2-A)`, velocity에 `Q^(-A)`,
gradient에 `Q^(-A-1/2)`, Hessian에 `Q^(-A-1)`, time에 `Q^(-A-1-h)`,
pressure에 `Q^(-2A)`이다. 모든 지수에서 원래 양의 h를 보존한다.

## 시간 cutoff에서 생기는 별도 flat force

원래 ψ(v)는 세 공간 연산자로 미분하면 0이고 `D_t ψ=ψ'`이다.
따라서 시간 cutoff에서 생기는 정확한 항은

\[
F_\psi=Q^{-A-1-h}\psi'(v)\,\operatorname{curl}_* A_{\rm base}.
\]

여기에는 `A_base`의 전체 curl이 들어간다. principal pulse만 남기거나
ψ로 나누지 않는다. 실제 full residual에서 이 항을 빼고 남은 값은
명시적인 식으로 보관한다.

`actual-common-global-wave-bounds.mjs`는 같은 배경의 실제 `C_(m+3)`와
원래 target의 weighted norm `N_0,...,N_(m+1)`을 사용해 각 고정 m의
slow·fast·physical 미분 경계를 구성한다. 각 cutoff와 chart 계수의
FTC 경계도 실제 식에서 생성한다. 원래 두 radial 지수 인자를 이용한
극 흡수, 모든 정수 label의 `ell^18` 개수 경계, 시간 cutoff 지지에서의
Gaussian 감쇠를 합친다. `K^physicalPower`는 flat 상수와 무한 tail
양쪽에 보존한다. 고정된 q에서 최대 두 band가 겹치므로 전역 flat
상수에는 추가 인자 2를 곱한다. 이미 모든 band를 합친 무한 tail은
그대로 유지하며, 양의 식을 0으로 표시하지 않는다.

실제 활성 band가 모두 공통 가정을 만족하도록 정의역을
`q < 2^(-(ell0+4))`로 줄인다. 같은 `b_n`을 유지한 채 충분조건인 영역만
줄이는 것이다. 각 고정 미분 차수와 flat 차수마다 같은 원본에서
유한 생성기를 적용한다는 정리이며, 무한히 많은 그래프를 실제 실행한
기록은 아니다. η=±1에서는 원래 T≥0 쪽의 도함수를 사용한다.

## 원래 stress와 N6에 넘기는 잔차

`actual-background-residual-flatness.mjs`는 같은 배경의 완전한 finite
계수 잔차와 남은 차수 tail을 결합한다. 원래 leading primitive
I/J/S/Cp와 두 shear를 그대로 미분해 stress 취소에 연결한다.
`actual-common-band-background-residual.mjs`는 그 정리와 물리 그래프의
실제 배경을 대조하고

\[
E_B=\operatorname{NS}(u_B,p_B)+\operatorname{div}T_B
\]

의 세 실제 성분을 계산한다. E_B를 0으로 만드는 force를 임의로 정의하지
않는다. q=0에서의 모든 고정 차수 flat 경계와 물리 원점에서의 smooth
zero extension은 같은 source 정리의 별도 단계다.

`actual-common-global-covariance.mjs`의 C와 B는 원문의 원통 성분으로
계산한 곱의 원래 angular 평균과 normalized Haar 평균을 모두 포함한다.
Cartesian velocity를 그대로 첫 두 성분의 곱에 넣지 않는다. 물리 NS의
점별 곱은 별도로 유지한다. signed 역을 성공적으로 호출할 때마다 같은
물리 원본과 양의 가중치가 변경되지 않았는지 다시 검사한다.
원래 위상·H·σ를 유지한 signed target 역은

\[
\delta a_j=\frac{(H^{-1}\Sigma)_j}{2\epsilon\sigma_j}
\]

이다. Σ는 원래 slow 좌표와 고정 대표점에만 의존해야 한다.
`Sigma in M_alpha`라는 함수 공간 가정은 단순한 좌표 검사를 통해
자동으로 발급되지 않는다. 원문의 `U in W_(1/2)`와 `U=W_0+E`,
`E in W_rho` 가정도 유지한다. 새로운 보정의 제곱항, 기존 오차와의
교차항, 실제 curl remainder 및 eikonal 항은 N6 입력에 남긴다.

이 묶음은 완전한 비선형 NS 잔차를 계산하지만, 보정 전의 그 잔차 전체가
0 또는 flat이라고 주장하지 않는다. 이후 N6는 원문의 Definition 9.4,
Propositions 9.5–9.6, Lemmas 9.7–9.8, Proposition 9.9 순서로 진행한다.

## 실제 실행 상태

첫 통합 시도는 **2/8**, 두 번째 시도는 **3/8**로 종료했다. 두 실패
기록과 각 실행 시점의 source snapshot을 보존했다. 첫 시도의 leading
미분식 표현 비교 문제는 두 번째 시도에서 수정되어 같은 배경장의
잔차 경계 검사가 실제로 통과했다. 전체 물리 curl 단계는 두 차례 각각
의존성 캐시와 치환 캐시가 JavaScript Map 한도에 도달해 중단됐다.

새 국소 subclass는 자유좌표 집합을 사용해 의존성을 저장하고,
실제로 해당 자유좌표가 없는 치환만 건너뛴다. 의존하는 치환은 기존
alpha-renaming, moving integral limit, piecewise 및 Volterra 규칙을
그대로 사용한다. 수정 뒤 보조 검사 **15/15, 종료 코드 0**을 관측했고,
독립 코드 검토에서도 이 최적화의 의미 보존을 확인했다. 관측 기록은
`evidence/common-physical-package-20261011/common-physical-kernels-after-substitution-fix.json`이다.

세 번째 실제 source 통합 실행은 앞의 **5개 검사 PASS** 뒤 720초 제한으로
종료됐다. 전체 curl·전역 Gaussian·전역 primary 공분산과 signed 역은
생성됐고, 공통 배경 잔차 정리도 seal 단계까지 도달했다. 마지막 E_B
연결은 시작했지만 완료되지 않았다. 제한 시간 종료는 전체 PASS로
기록하지 않는다. 독립 검토에서 확인한 겹치는 band의 인자 2, C/B의
평균 표기, signed 호출의 원본 재검사 및 E_B의 실제 미분식 비교를
보완한 다음 통합 실행으로 확인한다.

이 문서 작성 시점에는 최종 통합 완료, 수치 도함수 전체 완료, 새로운
해석학 Lean 정리 또는 M2 전체 완료를 선언하지 않는다. 원문 64개
기존 PASS, source 내부 항등 검사, generic 검사 수는 서로 합산하지 않는다.
