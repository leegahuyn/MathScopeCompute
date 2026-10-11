# 실제 두 펄스의 절대 중심 진폭: 독립 수학·소스 검토

## 판정과 범위

`actual-adiabatic-pulse-center-kernel.mjs`,
`actual-adiabatic-pulse-center-enclosure.mjs`, 원래 centered/terminal 구성,
최종 설명과 두 실행 기록을 읽어 대조했다. **선택한 terminal midplane의 실제 두
Volterra 해**에 대한 중심 진폭 구간과 그 공분산 계수 전파에서 수학적 결함을 발견하지 못했다.
이 판정은 원래 전체 결합 행렬, 실제 반올림된 carrier, 이동 압력 및 이동 기저를
유지하는 서술형 증명과 실제 source 결속에 대한 검토다. 일반 대수 시험의 성공만을
원래 해에 대한 정리로 사용하지 않았다.

고정점은 `X=Xrep=Xb*exp(-1/4)`, `eta=etaRep=0`, `s=sRep=1`,
`R=sqrt(2X)`, `Z=0`, `T=1`, `v=Ls/2`다. Band는 이전 terminal 구성에서
명시적으로 선택한 충분조건을 만족한다. 현재 표시용 ell=1, 임의의 대표점,
모든 band/label에 이 수치 결과를 확대하지 않는다. 미지인 원문 허용 상수의
실제 값을 평가했다고 보지도 않는다.

## 1. 실제 행렬과 중심 transport

원래 full leading/완성된 F의 열 적분과 slow 인자 `s^(-A-1/2)`를 유지했다.
이 점에서 모든 양의 차수 correction은 원래 support 밖이며,
복구된 원래 axial moment의 exterior가 0이다. 실제 eta 짝대칭을 사용하여
F_Z=0, G=G_R=G_Z=0을 얻는 경로가 source 검사에 들어 있다.

`f=2F`, `gamma=-c0>0`, `alpha=gamma^2`, `gabs=f(1+alpha)`,
`lambda0=f*gamma`로 둔다. 원래 반올림값을 포함한 `b=p/(R*Bs)`에 대해

\[
 n/B_s=(s_A,b,-1),\qquad s_A'=g_{\rm abs}b,\qquad
 s=\varsigma u(1/2+v/L_s),\quad D=1+s^2,\quad D_A=1+s_A^2+b^2.
\]

원래 `Bleft*(Aphi*B-Bprime)`에서 얻는

\[
 M_{11}=-\frac{s_As_A'}{D_A}-\frac{ss'}{2D}
 +\frac\lambda2\left(\frac{D\sqrt{1+b^2}}{D_A}
 +\frac1{\sqrt{1+b^2}}-2\right)-(d-d_{\rm ref})
\]

을 독립적으로 대조했다. 특히 `nPrime`에 의한 움직이는 pressure 행과
`Bprime`에 의한 기저 연결을 빼면 성립하지 않는다. 일반 kernel의 해당 음성대조와
실제 양쪽 행렬의 네 성분 결속은 서로 별도의 검사다.

제곱근을 유리 매개변수 `b=2z/(1-z^2)`로 환원하는 방법은
`z=b/(sqrt(1+b^2)+1)`가 모든 유한 실수 b에서 `|z|<1`을 만족하므로 적용 가능하다.
양의 제곱근의 가지를 보존한다.

## 2. 반올림 오차와 두 번째 성분

`b0=varsigma*u/(Ls*gabs)`는 비교를 위한 값이고 실제 b를 대체하지 않는다.
원래 선택 조건에서 `S>=B^1024`, `B>=2^128`, `S/B<=Ls<=S`, `k>S^8`을 얻는다.
후자의 지수 비교는 원래 양의 h와 정수 올림을 유지한 채
`ell>=(64/h)^2`에 적용한 것이며 h=0 근사가 아니다.

원래 rounding bound에서

\[
 |b-b_0|\le B^2/S^8,\quad |b|\le B^4/S,\quad
 |s_A-s|\le B^3/S^7
\]

을 얻고, 각 양의 분모를 유지한 대각식 오차 합이

\[
 \left|L_sM_{11}+\frac32\frac{s\varsigma u}{1+s^2}\right|
 \le B^{14}/S
\]

에 들어간다. 동일 source의 Riccati cone으로 `wplus>0`,
`|wminus/wplus|<=B^260/S`를 사용한다. 원래 off-diagonal 성분은 남아 있으며
`|M12|<=B^256/S`와 결합하여 `Ls*M12*wminus/wplus`의 절댓값을
`B^516/S`로 제어한다. 실제 두 성분 해를 대각 비교 해라고 선언하지 않는다.

따라서 실제 scalar logarithmic equation을 적분하면

\[
 a_\varsigma=
 \left(\frac{1+u^2/4}{1+u^2}\right)^{3/4}\exp(e_\varsigma),\qquad
 |e_\varsigma|\le\tfrac12(2^{-129280}+2^{-65024}).
\]

원래 `u=2*Renv^10`, `Renv>2^4096`를 이용한 비교 중심 오차와 합쳐
`|a_varsigma-1/(2*sqrt(2))|<2^-8192`가 성립한다.
지수/계수 여유와 이 합의 방향을 다시 확인했다.

## 3. 엄밀 구간과 실제 covariance 연결

작은 분석 나머지는 192-bit 격자의 한 ulp보다 작아도 0으로 버리지 않는다.
외향 반올림한 양의 구간으로 확대하고 BigInt 유리수 산술로 a, a^2, a^-2에
전파한다. Binary64는 읽기용 숫자를 표시할 때만 사용한다.

각 부호의 `a_varsigma`는 같은 enclosure 안에 있지만 서로 같은 해라는 주장은 없다.
앞서 인증한 `Htilde=H*diag(a_plus^-2,a_minus^-2)` 및
`ytilde=diag(a_plus^2,a_minus^2)*y`의 열별 항등식에 해당 독립 구간을 곱한다.
그 결과 이전에 미평가였던 실제 Volterra 중심 인자 자체는 제거된다.
`massScale`, `Ac`, `u`, `tau0` 등 나머지 원래 양의 기하·목표 인자는
정확한 함수식으로 남는다. 이 결과를 모든 인자를 평가한 절대 H/y의 고정 상대오차
구간으로 표현하지 않은 현재 범위가 맞다.

## 4. 표현 동치와 원래 본문 보존

`adiabaticExactBranchNormalizer`는 세 정규화된 branch가 모두 같을 때만
공통값으로 바꾼다. 비영인 가운데 branch를 보존하는 음성대조가 있다.
원래 frozen rounding의 값이나 원래 적분·해의 정의역은 바뀌지 않는다.

`adiabaticReplaceExactOperands`는 일치한 전체 operand부터 동시 치환하여
중첩된 F, c0, lambda0가 서로 다른 표현으로 남는 일을 피한다. 서로 충돌하는
치환과 적분 binder 치환을 거절하고, 일치하지 않은 불투명 source 함수는
그대로 둔다. 실제 source 행렬의 모든 성분은 별도로 보존·결속되어 있다.

첫 실행의 실패는 원래 frozen rounding 미분에 남는 all-zero 조각식의 표현
비교 문제였다. 첫 source, snapshot, 로그, 실제 exit 1을 보존했다.
두 번째 실행의 성공은 이 실패 기록을 없애거나 설계된 음성대조로 재분류하지 않는다.

## 5. 실행·해시 대조

이번 검토에서 새 source 실행은 하지 않았다. 저장된 다음 기록을 읽고 현재 파일을
해시했다.

| 근거 | 확인 결과 |
|---|---|
| 실제 source attempt2 | 12/12 검사, 내부 9/9 PASS |
| process 관측 | observedReturnCode=0, timedOut=false |
| constructor 경과 | 106.062초 |
| 외부 process 경과 | 106.340396427초 |
| peak RSS | 3,169,415,168 bytes |
| 최종 graph | 266,582 nodes / 11,009,588 canonical bytes |
| literal import closure | 62/62 현재 SHA가 실행 기록과 일치 |
| 기존 centered graph | 원래 bfd72c11… 그래프 재현 검사 PASS |
| 일반/음성대조 kernel | 저장된 최종 8/8 PASS |

주요 SHA-256:

- source JSON: `3552e92c2e413a25d18b3d743a635c2d401ed00d622b6147228fd5ccdced7c96`
- process JSON: `ed3d3f01c013c258cc34eba8229ac248002c8cf9924d0029d277deeabeed9df9`
- source log: `d54ec6aade3d9596eb94ae48a665e53c5154cfb74ceeb7b9bf3451b276453553`
- graph: `c754994bb73422e47b9bdbeda9fe55b6a454280c8ae768b2f5fa6e67b9e0563e`
- kernel: `7401a2edc03d01420e685ed35197ff67fa42ad02ec19ac086e95096ba57b6875`
- adapter: `74c0a8677984d3f7f9cb818e47b7361f331f1f81c2c466854b2ed2ad1b83a46f`
- 설명 문서: `f73d4fd9871cf304e772162ff8d01deb7b13627b6edfc5a2cd39b19526c7e45e`

참조: [수학 설명](../../ACTUAL_ADIABATIC_PULSE_CENTER_KO.md),
[최종 source](actual-adiabatic-pulse-center-source-attempt2.json),
[최종 process](actual-adiabatic-pulse-center-source-attempt2-process.json),
[보존한 첫 실패](actual-adiabatic-pulse-center-source-attempt1.json).

## 6. 유지해야 할 제한

Slow/혼합 수치 미분, fast 수치 미분, 모든 기하·목표 인자를 평가한 절대 H/y,
전체 물리 curl의 수치 구간, 전역 label 합과 잔차 완료를 이 검토가 인증하지 않는다.
Worker/browser 실행도 추가하지 않았다. 새로운 Lean 선언이나 전체 M2/M3 완료를
이 범위의 수치 PASS에서 추론하지 않는다.
