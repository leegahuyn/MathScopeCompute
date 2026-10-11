# 원래 terminal potential의 전체 harmonic 3차 slow 미분

## 구성한 대상

이 확장은 앞서 검증한 실제 작은 $q$ terminal source의 실수 벡터 $C$와 원래 위상 $\Phi$를 그대로 사용한다. 원래 복소 potential

\[
\mathcal P=iC e^{ik\Phi}
\]

의 $R,Z,T$ 미분을 전체 차수 3까지 구성한다. 각각의 독립 slow 좌표에서 미분하며 $\xi$, pulse 시각 $v$, $\theta$, 대표점과 label은 고정한다. 원래 $k$와 고정 prefactor $Q^{1/2-A}$의 slow 독립성도 실제 source root에서 확인한다.

원래 $C$에는 전체 covariance 적분, target, 역행렬 및 양의 제곱근, moving pressure/frame, 전체 Volterra 해, transverse/longitudinal cutoff와 slow partition이 모두 남아 있다. 이 확장은 그 인자들을 다시 선택하거나 유한 표시식으로 바꾸지 않는다.

실행 파일은 [일반 harmonic kernel](../../../actual-harmonic-third-jet-kernel.mjs)과 [actual source adapter](../../../actual-terminal-harmonic-third-jets.mjs)이다. 원래 [C의 3차 검증 packet](../terminal-third-jets-20261011/terminal-third-jets-packet.json)에 들어 있는 68개 실행 파일은 이 작업에서 변경하지 않는다.

이 결과는 전체 진동항의 3차 slow 미분이다. 물리 좌표에 대입한 뒤의 $\xi/v$ chain, 원통 기저 미분 및 속도의 공간 2차 미분은 별도다. 기존 canonical $c_n$ 배경과 새 strengthened $a_n$ 배경을 동일시하지 않는다.

## 1. 실수부와 허수부를 직접 보존

복소 연산을 미지의 함수로 도입하지 않고, 원래 graph의 sine/cosine 연산으로

\[
\Re\mathcal P=-C\sin(k\Phi),\qquad
\Im\mathcal P=C\cos(k\Phi)
\]

를 만든다. 각 실제 body를 직접 AD하여 모든 $|\alpha|\le3$의 root를 생성한다. 세 변수의 다중지수 20개, 벡터 성분 3개, 실수부·허수부 2개로 부호마다 120개 scalar derivative root가 있다. 동일한 값이나 0으로 단순화되는 root를 서로 다른 graph node라고 세는 것은 아니다.

한편 복소 carrier를 공통으로 남기면

\[
\partial^\alpha\mathcal P=(A_\alpha+iB_\alpha)e^{ik\Phi}
\]

이므로 그 실수부와 허수부는

\[
A_\alpha\cos(k\Phi)-B_\alpha\sin(k\Phi),\qquad
A_\alpha\sin(k\Phi)+B_\alpha\cos(k\Phi)
\]

다. 직접 생성한 두 body의 AD가 이 두 식과 정확히 같은지, 일반식과 실제 body 결속을 분리해 검사한다.

## 2. 위상 미분과 완전한 곱 규칙

$E_\alpha=e^{-ik\Phi}\partial^\alpha e^{ik\Phi}$라 하면 차수 3까지의 식은

\[
\begin{aligned}
E_0&=1,\\
E_i&=ik\Phi_i,\\
E_{ij}&=ik\Phi_{ij}-k^2\Phi_i\Phi_j,\\
E_{ij\ell}
&=ik\Phi_{ij\ell}
-k^2(\Phi_{ij}\Phi_\ell+\Phi_{i\ell}\Phi_j+\Phi_{j\ell}\Phi_i)
-ik^3\Phi_i\Phi_j\Phi_\ell.
\end{aligned}
\]

반복된 방향도 위치를 그대로 세므로, $i=j=\ell$이면 필요한 3배 항들이 생긴다. 일반 다중지수에는

\[
A_\alpha+iB_\alpha
=i\sum_{\beta\le\alpha}{\alpha\choose\beta}C_\beta E_{\alpha-\beta}
\]

를 적용한다. $\Phi$의 2차·3차 도함수, $C$의 1차·2차·3차 도함수와 모든 혼합 곱을 유지한다.

예를 들어 3차 식을 풀어 쓰면

\[
\begin{aligned}
A_{ij\ell}={}&
-k(C_{ij}\Phi_\ell+C_{i\ell}\Phi_j+C_{j\ell}\Phi_i
+C_i\Phi_{j\ell}+C_j\Phi_{i\ell}+C_\ell\Phi_{ij}
+C\Phi_{ij\ell})\\
&+k^3C\Phi_i\Phi_j\Phi_\ell,\\
B_{ij\ell}={}&C_{ij\ell}
-k^2\bigl(C_i\Phi_j\Phi_\ell+C_j\Phi_i\Phi_\ell+C_\ell\Phi_i\Phi_j\\
&\hspace{3em}+C(\Phi_{ij}\Phi_\ell+\Phi_{i\ell}\Phi_j+\Phi_{j\ell}\Phi_i)\bigr).
\end{aligned}
\]

특히 반복 3차에서는

\[
\begin{aligned}
A_{iii}&=-kC\Phi_{iii}-3kC_i\Phi_{ii}-3kC_{ii}\Phi_i
+k^3C(\Phi_i)^3,\\
B_{iii}&=C_{iii}-3k^2C_i(\Phi_i)^2-3k^2C\Phi_i\Phi_{ii}.
\end{aligned}
\]

검사에는 이 명시적 반복 식과 완전히 혼합된 $RZT$ 식을 별도로 넣었고, 위상 3차 항이나 mixed pairing, 반복 배수를 빼면 실패하는 대조를 포함한다.

## 3. 독립 recurrence와 actual body 결속

위의 명시적 식을 생성한 뒤, 서로 다른 경로인

\[
\begin{aligned}
A_{\alpha+e_i}&=\partial_iA_\alpha-k\Phi_iB_\alpha,\\
B_{\alpha+e_i}&=\partial_iB_\alpha+k\Phi_iA_\alpha
\end{aligned}
\]

와 대조한다. $|\alpha|\le2$의 다중지수 10개에 세 방향을 적용하므로 부호마다 위상 recurrence 30개와 벡터 성분 recurrence 90개가 있다. 한 개의 canonical 미분 순서만 검사하지 않고 모든 유효 방향의 edge를 검사한다.

대수 계산용 share는 원래 $C$와 $\Phi$ body를 완전히 지정한다. 각 share의 20개 도함수를 실제 body로 materialize하고, 원래 직접 AD의 root와 문자 그대로 동일함을 확인한다. $C$의 각 결과는 앞선 private third source에 고정된 20개 도함수 root와도 동일해야 한다. 새로운 derivative matrix나 caller가 제시한 derivative array를 입력받지 않는다.

그 다음 common-denominator helper가 share를 대수적 원자로 취급하여 곱·합 식의 항등식을 확인한다. 이 helper 자체가 해석적 source 권한을 주는 것은 아니다. 실제 body materialization 검사는 이 kernel과 source caller가 별도로 수행한다.

## 4. 원래 source와 인증의 범위

Actual adapter는 private C-third constructor의 객체만 받는다. 복사한 결과나 JSON certificate, 바꾼 $\Phi$, 누락된 jet, 늘려 쓴 완료 flag는 이 권한을 얻지 못한다. 앞선 source prefix와 함수·Volterra 정의는 보존되고, 추가 독립 node는 발행한 graph hash에 포함되지 않는다.

실제 영역은 앞선 작은 $q$ terminal source와 같은 열린 고정 label chart다. 인증된 양의 covariance 영역을 새로운 가정으로 교체하지 않는다. $\eta=\pm1$에서는 원래 heat의 한쪽 jet만 사용할 수 있고, 이 harmonic 인증은 원래 열린 chart 범위를 이어받는다. $T<0$로 heat를 연장하지 않는다.

원래 고정 prefactor $Q^{1/2-A}$를 곱한 root도 보존한다. 그 prefactor는 slow 좌표에서 실제로 고정이므로 각 derivative에 곱해진다. 이를 물리 좌표 합성 및 cylindrical basis 미분을 수행했다는 뜻으로 읽어서는 안 된다.

## 5. 실행 기록

[일반 kernel 실행](harmonic-third-jet-kernel-before-source1-runtime.json)은 7/7 PASS, exit 0이다. 여기에는 선형 위상에서의 독립적인 $(ik)^{|\alpha|}$ 식, 비선형 위상의 반복·완전 혼합 식, 원래 cutoff/sqrt/integral body, 잘못된 carrier 및 위조된 source 권한 대조가 포함된다.

실제 [source attempt1](actual-terminal-harmonic-third-jets-source-attempt1.json)은 11/11 runner 검사와 내부 8/8 source 검사를 통과했다. [별도 process 기록](actual-terminal-harmonic-third-jets-source-attempt1-process-runtime.json)에 실제 종료 코드 0의 관측을 남겼다. 이 실행은 45,872.619964 ms, peak RSS 1,905,029,120 bytes를 사용했다.

원래 C source graph 363,295 nodes, canonical 15,756,568 bytes와 SHA256
e96bcba6819970cf60fc32613a753a70775ea7f44592ecdcf8c0129cc8c7f688을 새 private 생성에서도 정확히 재현했다. 이번 harmonic graph는 376,092 nodes, canonical 15,852,199 bytes이며 SHA256은
235374c4fe2bfe79912ed0a653c594864fc6a221c92f1142bef5ac0665bf0cd6이다.

실행한 literal import 70개 manifest SHA256은
25bc52614a5862c171ad3615a52e1f09e1266c7215c2f65a69937ca4d25d5980이다. 실제 실행 뒤에도 모든 import 파일이 같은 bytes임을 확인했다. 입력은 원래 고정 source profile과 표시용 terms=1이며, 원래 입력 SHA256
cc2537ef8f432302ecd5f40228f3392031ed2347a1380962e67573691247c621를 사용했다. 표시용 유한 적분항은 exact harmonic body에 대입하지 않았다.

Source 테스트는 두 부호의 전체 120개 root, 30개 위상·90개 성분 recurrence, 실제 share materialization, 고정 prefactor를 곱한 직접 AD, 위조·누락된 root와 넓혀 쓴 완료 flag의 거부, 원래 source와 새 certificate hash의 append 불변성을 포함한다. 일반 7개 검사를 이 11개 source 검사와 같은 실행이라고 세지 않는다.

[독립 수학 검토](INDEPENDENT_TERMINAL_HARMONIC_REVIEW_KO.md)는 두 모듈, 실제 기록과 70개 import SHA를 대조했고, 명시된 제한 범위의 수학 오류를 찾지 못했다. 검토는 별도의 heavy source 실행이나 Lean 증명이 아니다. 실행 당시 파일 SHA와 모든 기록은 [고정 packet](terminal-harmonic-third-jets-packet.json)에 연결한다. Worker·browser 및 새 Lean kernel 실행은 이 추가 모듈에 대해 하지 않았다.

전체 속도 2차 미분, $\xi/v$ 미분의 물리 합성, $\theta$ 기저 connection, pressure와 NS 잔차의 전체 조립, 모든 label의 합·전역 flat-error, 전체 G-NUM, G-N5 및 새 Lean kernel 증명은 이 packet만으로 완료되지 않는다. M3 시작 gate도 이 결과에서 올리지 않는다.
