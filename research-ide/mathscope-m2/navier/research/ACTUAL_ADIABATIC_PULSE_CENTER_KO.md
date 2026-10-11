# 원래 두 성분 펄스의 절대 중심 진폭과 공분산 계수의 엄밀 구간

## 1. 이번에 완료한 범위

고정된 원래 terminal 대표점에서 두 부호의 **전체 결합 Volterra 해**에 대한
\[
 a_\pm=w_{\pm,+}(L_s/2)
\]
의 엄밀한 수치 구간을 제공한다. 앞선 centered 결과에서 미평가 상태로 남겼던
\(a_\pm^2\)와 \(a_\pm^{-2}\)도 외향 반올림으로 계산하여, 원래 질량·공분산·역가중치의 계수에 전파했다.
두 \(a_\pm\)는 각각 같은 구간 안에 들어간다는 뜻이며 두 해가 정확히 같다고 주장하지 않는다.

원래 양의 \(h,\epsilon\), 정수 올림 주파수 \(k\), 팔레트와 \(L_s\), 반올림한 각운동량,
이동 압력, 이동 기저 및 두 번째 성분을 모두 보존한다. 실제 행렬을 비교용 대각 행렬로
대체하지 않았다. 비교 대각식과 원래 전체 해 사이의 오차는 엄밀히 양수인 나머지로 포함된다.

고정점은 앞선 centered source와 같다.
\(X=X_{\mathrm{rep}}=X_b e^{-1/4}\), \(\eta=\eta_{\mathrm{rep}}=0\),
\(s=s_{\mathrm{rep}}=1\), \(R=\sqrt{2X}\), \(Z=0\), \(T=1\), \(v=L_s/2\)이며,
band는 원래 충분조건의 \(\ell=\ell_{\min}+8\)로 생성한다.
표시용 \(\ell=1\) 프로그램의 양수성을 가정한 결과가 아니다.

## 2. 원래 전체 행렬에서 얻은 정확한 대각식

양의 source norm을 \(\mathfrak B\), 느린 원래 회전장을 \(F\)라 쓰고
\[
 f=2F,\qquad \gamma=-c_0>0,\qquad \alpha=\gamma^2,\qquad
 g_{\mathrm{abs}}=f(1+\alpha),\qquad \lambda_0=f\gamma
\]
로 둔다. 이 관계는 원래 Rayleigh 양의 제곱근, \(c_0\), 열방정식의 완성된 \(F\),
moment 복구 뒤 axial 장의 정확한 zero exterior에 결속되어 있다.
원래 \(\eta\)-짝대칭과 단조 chart도 함께 확인한다.

각 부호 \(\varsigma\in\{+1,-1\}\)에 대해
\[
 b=\frac{p}{R B_s},\qquad
 s=\varsigma u\left(\frac12+\frac v{L_s}\right),\qquad
 s_A=\frac{\varsigma u}{2}+v g_{\mathrm{abs}}b,\qquad
 D=1+s^2,\quad D_A=1+s_A^2+b^2,\quad t=\sqrt{1+b^2}.
\]
\(b\)에는 **실제 반올림한** \(p\)가 남아 있고 \(b\)는 \(v\)에 독립이다.
원래 법선은 \(n=B_s(s_A,b,-1)\), 따라서 \(s_A'=g_{\mathrm{abs}}b\)이다.
이동 제약에서 생기는 \(n'\)와 \(B'\)를 포함하여 원래
\(B_{\mathrm{left}}(A_\phi B-B')\)를 계산하면
\[
\boxed{\;
 M_{11}
 =-\frac{s_A s_A'}{D_A}
  -\frac{s s'}{2D}
  +\frac{\lambda}{2}\left(\frac{Dt}{D_A}+\frac1t-2\right)
  -(d-d_{\mathrm{ref}}),\qquad
 \lambda=\frac{\lambda_0}{\sqrt D}.
\;}
\]
원래 damping 관계는
\[
 d-d_{\mathrm{ref}}
 =\frac{\lambda_0}{(1+u^2)^{3/2}}(D_A-D)
\]
이다. 여기에도 반올림 오차와 법선 오차가 그대로 들어간다.

일반 대수 검사는 \(b=2z/(1-z^2)\),
\(t=(1+z^2)/(1-z^2)>0\), \(-1<z<1\)로 제곱근 관계를 정확히 환원한다.
모든 유한 실수 \(b\)에는 \(z=b/(\sqrt{1+b^2}+1)\)가 존재한다.
정확한 유리식 검사 다섯 개와, \(n'\) 압력 항 또는 \(B'\) 연결 항을 빼면 실패하는
음성대조 두 개가 이를 확인한다. 이 일반 검사만으로 원래 source를 인증하지 않으며,
소스 adapter가 원래 두 행렬의 네 성분을 각각 별도로 결속한다.

## 3. 실제 반올림·결합 모드 오차

원래 selector와 source norm에서
\[
 \mathfrak B\ge2^{128},\qquad S=\ell^2\ge\mathfrak B^{1024},
 \qquad S/\mathfrak B\le L_s\le S,\qquad k>S^8
\]
를 얻는다. 마지막 부등식은 \(\ell\ge(64/h)^2\),
\(\log 2>1/2\), \(\log\ell<\sqrt\ell\)를 원래
\(k=\lceil\epsilon^{-1/2}\rceil\), \(\epsilon=2^{-h\ell}\)에 적용한 것이다.
천문학적 정수나 양의 \(h\)를 기계수로 바꾸지 않는다.

\[
 b_0=\frac{\varsigma u}{L_s g_{\mathrm{abs}}},\qquad
 \delta b=b-b_0
\]
는 **오차를 정의하기 위해서만** 사용한다. 원래 식에서
\[
 |\delta b|\le\frac{\mathfrak B^2}{S^8},\qquad
 |b|\le\frac{\mathfrak B^4}{S},\qquad
 |s_A-s|\le\frac{\mathfrak B^3}{S^7}
 \quad(0\le v\le L_s/2)
\]
를 얻는다. 위의 정확한 대각식과 양의 분모를 이용하면
\[
 \left|L_sM_{11}+\frac32\frac{s\varsigma u}{1+s^2}\right|
 \le \frac{\mathfrak B^{14}}S.
\]
실제로 합산한 상계는
\[
 \frac{L_sg_{\mathrm{abs}}|\delta b|}{2}
 +u|s_A-s|+\frac{ub^2}{2}
 +\mathfrak B L_s\left(\frac52b^2+(4u+2)|s_A-s|\right).
\]
유한 계수의 합과 사용한 \(\mathfrak B\)-지수 여유는 BigInt 유리수로 검사한다.

동일한 실제 행렬의 cone 추정에서
\[
 w_+>0,\qquad |w_-/w_+|\le\mathfrak B^{260}/S,\qquad
 |M_{12}|\le\mathfrak B^{256}/S
\]
를 소비한다. 따라서 \(\tau=v/L_s\)로 쓰면 실제 해의 정확한 식
\[
 \partial_\tau\log w_+
 =L_sM_{11}+L_sM_{12}(w_-/w_+)
\]
의 두 번째 항도 최대 \(\mathfrak B^{516}/S\)로 포함된다.
이 항을 0으로 두지 않는다.

## 4. 정확한 transport 적분과 외향 구간

비교 transport는 수치 적분 없이 정확히 적분된다.
\[
 A_{\mathrm{ref}}=
 \left(\frac{1+u^2/4}{1+u^2}\right)^{3/4},\qquad
 a_\varsigma=A_{\mathrm{ref}}\exp(e_\varsigma),
\]
\[
 |e_\varsigma|
 \le \frac12\left(2^{-129280}+2^{-65024}\right).
\]
원래 \(u=2R_{\mathrm{env}}^{10}\), \(R_{\mathrm{env}}>2^{4096}\)에서
\[
 0<A_{\mathrm{ref}}-\frac1{2\sqrt2}<\frac3{u^2},\qquad
 u^{-2}<2^{-81922}.
\]
\(|x|\le1/2\)일 때 \(|\exp(x)-1|\le2|x|\)를 적용하여
\[
 \boxed{\left|a_\varsigma-\frac1{2\sqrt2}\right|<2^{-8192}}
\]
를 얻는다. 모든 분석적 오차는 엄밀히 양수다.

이 나머지는 192-bit 산술의 한 ulp보다 작다. 구현은 이를 0으로 버리지 않고
외향 반올림한 양의 ulp로 확대한다. 양의 제곱근, 곱, 나눗셈, 각 결과의 폭 검사는
BigInt dyadic interval로 수행한다. Binary64 값은 어떤 증명 판정에도 쓰지 않는다.
각 중심의 요청 폭은 \(10^{-40}\), 질량·공분산·역가중치 계수의 요청 폭은 \(10^{-12}\)이다.

| 실제 평가량 | 읽기용 근삿값 | 엄밀 유리수 구간의 폭 |
|---|---:|---:|
| \(a_\varsigma=w_{\varsigma,+}(L_s/2)\) | 0.3535533905932737622 | \(<4.780\times10^{-58}\) |
| \(a_\varsigma^2\) | 0.125 | \(<6.373\times10^{-58}\) |
| 원래 radial \(t_{\varsigma,r}(L_s/2)\) | 0.3535533905932737622 | \(<7.966\times10^{-58}\) |
| \(\mathrm{mass}_\varsigma/\mathrm{massScale}\) | 0.2519367539124190 | \(<3.053\times10^{-17}\) |
| \(y_\varsigma\,\mathrm{massScale}/\tau_0\) | 1.9846250784584430 | \(<2.405\times10^{-16}\) |

표의 소수는 결과의 읽기용 표현이다. 정확한 구간 끝점은 실행 JSON의
certificate.numerics.values에 유리수 문자열로 저장된다.
\(\mathrm{massScale}=r_0^2/\sqrt{gL_s}\), \(\tau_0=T_\theta/A_c>0\)는
앞선 centered source의 동일한 정확한 인자다.
\(\tau_0\)는 시간 변수 \(\tau=v/L_s\)와 다른 양이다.

## 5. 원래 공분산과 역가중치에 전파한 내용

앞선 결과가 실제 source에서
\[
 \widetilde H=H\,\operatorname{diag}(a_+^{-2},a_-^{-2}),
 \qquad
 \widetilde y=\operatorname{diag}(a_+^2,a_-^2)y
\]
를 사용했다면, 이번에는 두 \(a_\varsigma^2\)의 구간을 각 열의 질량·공분산 계수에
곱하고 역가중치 계수에는 그 역수를 곱한다. 서로 다른 부호의 구간은 독립적인 구간으로
전파한다. 두 중심을 동일한 스칼라로 간주하여 의존성을 잘못 없애지 않는다.

원래 \(H\)·질량·\(H^{-1}T\)의 center rescaling 항등식 여덟 개도 정확히 검사한다.
양의 질량과 역가중치의 분모 및 앞선 Gaussian·원래 cutoff 적분 오차는 그대로 유지한다.
이에 따라 미평가였던 **Volterra 중심 인자**는 제거되지만,
\(\mathrm{massScale},A_c,u,\tau_0\) 등 나머지 원래 양의 기하·목표 인자는
정확한 표현식으로 남아 있다.

## 6. 실패를 보존한 source 비교와 최종 실행

첫 source 실행은 170.828초 뒤 표현 비교에서 실패했고 exit 1을 반환했다.
원래 반올림식은 frozen label에만 의존하지만, 기존 derivative 구현은
그 미분에 세 branch가 모두 0인 smooth_piecewise를 남긴다.
정확한 독립성 guard가 이를 0으로 반환한 재생성 행렬과 비교할 때,
기존 유리식 검사는 조각식 전체를 불투명 원자로 취급하여 항등식을 확인하지 못했다.
실패 실행의 코드 사본, JSON, 로그, 실제 exit code를 모두 보존했다.

두 번째 실행 전에 작은 원래 반올림 fixture에서 이 차이를 재현했다.
새로 덧붙인 congruence는 세 분기가 정확히 같을 때에만 공통 값으로 환원한다.
비영인 가운데 분기는 보존하며, 조건·반올림 값·원래 해의 정의역은 바꾸지 않는다.
중첩된 \(F,\lambda_0,c_0\)는 완전한 operand를 먼저 확인하는 동시 DAG 치환으로
형식적 기호에 결속한다. 기존 source 함수나 derivative 구현은 수정하지 않았다.

| 항목 | 최종 결과 |
|---|---|
| 실행 | actual-adiabatic-pulse-center-source-attempt2 |
| 독립 source 검사 | 12/12 PASS |
| 최종 내부 검사 | 9/9 PASS |
| 각 부호의 원래 결속 검사 | 7/7씩 PASS |
| 일반·음성대조 kernel 검사 | 8/8 PASS |
| 관측한 실제 process 종료 | exit 0, 외부 timeout 아님 |
| source 실행 시간 | 106.062초 |
| peak RSS | 3,169,415,168 bytes |
| 최종 그래프 | 266,582 nodes / 11,009,588 canonical bytes |
| import closure | 실제 실행 전후 62개 SHA 동일 |

최종 그래프 SHA-256은
c754994bb73422e47b9bdbeda9fe55b6a454280c8ae768b2f5fa6e67b9e0563e 이다.
원래 centered graph bfd72c11e7e2e854183de2a30294b9f6e93c1b956d7045a76c43c6e7a48e3f75 및
선행 actual selected graph 8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a 도 재현했다.
이 root 결속은 일반 대수 kernel의 성공과 별도로 검사했다.

실행 자료:

- [최종 source JSON](evidence/adiabatic-pulse-center-20261011/actual-adiabatic-pulse-center-source-attempt2.json)
- [최종 source 로그](evidence/adiabatic-pulse-center-20261011/actual-adiabatic-pulse-center-source-attempt2.log)
- [실제 process 종료 기록](evidence/adiabatic-pulse-center-20261011/actual-adiabatic-pulse-center-source-attempt2-process.json)
- [일반·음성대조 kernel 기록](evidence/adiabatic-pulse-center-20261011/actual-adiabatic-pulse-center-kernel-attempt2.json)
- [보존한 첫 실패 JSON](evidence/adiabatic-pulse-center-20261011/actual-adiabatic-pulse-center-source-attempt1.json)
- [첫 실행 당시 코드 manifest](evidence/adiabatic-pulse-center-20261011/attempt1-source/manifest.json)
- [원래 행렬·정량 오차·실행 기록의 독립 검토](evidence/adiabatic-pulse-center-20261011/INDEPENDENT_ADIABATIC_PULSE_CENTER_REVIEW_KO.md)

## 7. 다음 수치 작업과 남은 범위

이 결과는 선택한 실제 두 펄스의 중심 진폭, radial 중심값, 그리고 미평가 center 인자를 제거한
공분산·역가중치 계수의 수치 결과다. 아직 slow·혼합 미분의 수치 구간,
fast 미분의 수치 구간, 원래 기하·목표 인자를 모두 평가한 절대 \(H/y\),
전체 물리 curl의 수치 구간, 전체 시간·모든 label 및 전역 물리 잔차를 완료하지 않았다.
동일 source의 정확한 higher jet 식과 그 수치 오차 검증은 구분한다.

현재 wholeGNUMComplete, globalPhysicalResidual, newLeanKernelProof,
workerExecution, browserExecution, m3MayStart는 모두 false이다.
이 direct-source 성공을 Worker 실행·공개 브라우저 실행이나 전체 NS 증명의 완료로 확대하지 않는다.
