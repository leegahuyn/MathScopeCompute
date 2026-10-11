# 실제 outer 공분산 제곱근의 경계 연장: 독립 읽기 검토

이 검토는 새 source 실행을 추가하지 않았다. `actual-outer-covariance-flat-extension.mjs`, 관련 기존 actual source와 최종 attempt3 JSON/log/process 기록, 그리고 literal import 54개의 SHA를 읽고 대조했다. 검토 시점에 54개 파일 모두 실행 당시 bytes와 같았다.

## 1. 실제 실행 및 변경 범위

| 항목 | 확인한 값 |
|---|---|
| 당시 repository HEAD | `a2bc6ef15632f2c953915e41352e03fbc096e4fc` |
| 최종 direct source 실행 | 14/14 검사 그룹 PASS, 내부 source 검사 18/18 PASS |
| 별도 process 관측 | exit 0, timeout 없음 |
| source 기록 시간 | 51,009.599234 ms |
| process 전체 wall time | 51,346.359917 ms |
| peak RSS | 3,173,842,944 bytes |
| 고정 graph | 249,810 nodes, canonical 10,003,412 bytes |
| graph SHA256 | `083f148b75f624a966c8b697481e8cc6d47b2e9c2bd8a19283f9a6a4bb9ed084` |
| module SHA256 | `d0a991f5e789aae7aa35dd8c18b9a82d9be40b8f31955ce9f166b108aef00c0c` |
| import manifest SHA256 | `bafcd3d06b9722362adad4d44c8fa826ddafbf6ed0721acf9825cbba8c83c923` |
| source JSON SHA256 | `0137b19520d54b49deeab969dae4b70a8282e12989f2597e24fb865ee04f7ecb` |
| process JSON SHA256 | `0754a785144a406a60f71b77763fee8700ef7f571554ee65393036a9569dae14` |

최종 실행은 이전 두 실제 개발 실패를 대체하여 지우지 않는다. 첫 실패는 정확한 endpoint/height 표현의 결속에, 두 번째 실패는 독립 endpoint 검사의 곱 결합 표현에 있었다. 최종 source의 내부 결속, 독립 테스트 성공 및 실제 프로세스 종료를 각각 확인했다. 일반 kernel의 유한 회귀와 실행한 3차 scalar jet을 모든 차수의 컴퓨터 실행으로 확대하지 않는다.

## 2. 원래 forward target과 정칙 backward factor

새 모듈은 private `actual-admissible-terminal-covariance`의 선택된 작은 $q$ source를 사용한다. 원래 $H$, $h>0$, 전체 heat/Gamma, 다섯 moment 복원과 I2 보상, terminal stage의 높이와 끝점을 유지한다. 당시 canonical $c_n$ 배경을 별도로 강화한 $a_n$ 배경과 동일시하지 않는다.

복사한 outer factor의 축방향 성분은 반드시 $\delta^6 b_z$다. 실제 chart target은

\[
\bar T=e^{-4/\delta^2}\delta^{-3}\bar b,
\qquad \bar b=s^{-A-1/2}(b_\theta,\delta^6b_z).
\]

코드가 이 $s$ factor와 $\delta^6$, A.54의 세 angular 항, 압력의 heat 제곱과 중첩 axial 적분을 모두 보존하는 점을 확인했다. 단순히 $T/|T|$를 경계에 대입하지 않는다.

원래 forward AST와 backward AST의 일치는 정칙 축 조건, 전체 moment 복원 및 원래 적분 항등식을 이용한 해석 명제다. 이 모듈은 그 둘이 하나의 rational normal form이라고 주장하지 않는다. 실제 forward target root는 계속 graph 안에 남아 있다. 공통 지지 $X_+$ 바깥에서는 모든 양의 completed 차수가 정확히 0이므로, 이 collar의 leading 식은 활성 항을 생략한 근사가 아니다.

정칙 커널

\[
\int_0^\infty e^{-4t}(1+\delta^2t)^{-(m+3)/2}
G\!\left(\frac{\delta}{\sqrt{1+\delta^2t}}\right)dt
\]

의 고정 유한 미분은 원래 compact collar에서 유계인 $G$의 유한 미분과 $t$의 다항식으로 제어된다. $e^{-4t}$의 모든 다항 moment가 유한하므로 지배수렴을 적용할 수 있고 경계값은 $G(0)/4$다. 이는 실제 integral의 경계 해석이며 수치 quadrature는 아니다.

## 3. 경계의 양수성 및 고정 대표점

정칙 angular 계수는

\[
b_\theta(0,\eta)
=\frac{16\rho E_{\mathrm{pow},b}H(2(1-\eta^2)/X_b;h)e}{\sqrt{2X_b}}>0
\]

이고 scaled axial 계수는 0이다. 코드가 특이한 내부식에 $\delta=0$을 넣는 대신 이 별도 경계식을 만들어 $H(0)W(0)=\bar b(0)$를 검사하는 점이 적절하다. $h$, $\rho$ 또는 원래 heat를 0이나 1로 바꾸지 않는다.

기존 actual direction의 $b_\theta\ge C^{-10}$, 같은 box의 음의 projection, 원래 $\mathcal A$ 및 $s$ 범위를 합하면

\[
R_{\rm env}^{-56}<\widetilde\tau
=-N\cdot\bar b/\mathcal A<R_{\rm env}^{8}.
\]

mass 상한에서 실제 인자들의 소거는

\[
\operatorname{haar}L_s
=\left(\frac{D_g}{2}c_i\mu_\chi\right)
\left(\frac{2r_0}{c_i}\right)
=D_gr_0\mu_\chi
\]

다. 그러므로 source cone을 $HW=\bar b$에 적용한 $W_i\ge\kappa R_{\rm env}^{-56}/(64m_{\rm up})>0$는 band에 독립인 양의 source 표현식이다. 같은 lower bound가 정칙 경계에 연속적으로 남는다.

실제 endpoint witness는 $X=X_{\rm rep}=X_b$, $\eta=\eta_{\rm rep}=0$, $s=s_{\rm rep}=1$을 모든 해당 root에 대입한다. 원래 대표점 선택 규칙에서 허용되는 boundary point 자체를 대표점으로 고정한다. 반올림 label의 불연속을 지나며 연속성을 가정하지 않는다. 이는 선택된 source sufficient domain의 결과이며 원문에 미지로 남은 최종 $\Gamma(q_{\rm big},\ell_0)$ 전체를 평가한 결과가 아니다.

## 4. 행렬식, 안정 전파자와 유한 차수 성장

실제 행렬식 하한에서 양의 $\sqrt{L_s}$의 제곱을 $L_s$로 바꾸는 domain rule과 나머지 rational identity가 분리되어 있다. 원래 $L_s>0$, $c_i>1/(T_gS)$ 및 $\mathcal A>R_{\rm env}^{-6}$로 실제 상수 $d_*>0$를 구성하여

\[
|\det H|\ge d_*/S,\qquad
\|H^{-1}\|_\infty\le C_*S
\]

를 얻는다. $d_*$와 $C_*$는 원래 source node로 만들어졌고 수치로 계산된 값이라는 주장은 없다.

전파자에는 원래 정규화 행렬의 부호

\[
M=\operatorname{diag}(0,-2\lambda)+E_{\rm actual}
-(d-d_{\rm ref})I
\]

가 중요하다. 실제 identity가 이 음의 두 번째 대각항을 보존한다. 각 entry 오차 $E/S$와 damping 오차 $E_d/S$에서

\[
\mu_\infty(M)\le(2E+E_d)/S
\]

이고 $L_s\le L_{\max}S$이므로 forward propagator는 $S$에 독립인 $\exp((2E+E_d)L_{\max})$로 제어된다. 절대 행렬 norm을 써서 음의 대각항을 잃는 추론은 아니다.

원래 compact collar의 유한 leading jets와 보호된 분모에서 $M_j,B_j=O(S^j)$가 나온다는 전제를 명시한 뒤, 변분식은 $w_j=O(S^{2j})$를 준다. 실제 forcing 항의 거듭제곱은 $1+k+2(j-k)\le2j$, $1\le k\le j$다. $P$는 slow 관측 좌표에서 고정이며 원래 $P\le1$ bound를 유지하므로, full covariance 적분에서 $H_j=O(S^{2j})$다.

$HW=\bar b$의 미분에는 source 역행렬의 $O(S)$가 한 번 더 들어가고, 각 forcing의 지수는

\[
1+2k+3(j-k)+1\le3j+1.
\]

따라서 $W_j=O(S^{3j+1})$다. 양의 $W$ 하한이 $S$와 독립이므로 sqrt recurrence의 모든 strict subindex를 포함하면 $(\sqrt W)_j=O(S^{4j})$, $j\ge1$이다. 이는 source에 결속한 서술형 귀납 증명이며, 모든 차수의 수치 norm이나 모든 jet AST를 실행했다는 뜻은 아니다.

## 5. 평탄 인자와 전체 0 연장

$f(\delta)=e^{-2/\delta^2}\delta^{-3/2}$의 코드상 recurrence

\[
P_{j+1}(x)=\left[4-\left(\tfrac32+3j\right)x\right]P_j(x)+2x^2P'_j(x)
\]

와 $f^{(j)}=e^{-2/\delta^2}\delta^{-3/2-3j}P_j(\delta^2)$의 지수는 맞다. $B_j=\sum_k|p_{jk}|4^{-k}$, $M=\lceil(3+6j+2N)/4\rceil$에 대해

\[
|f^{(j)}(\delta)|\le B_j M!\,\delta^N e^{-1/\delta^2},
\qquad 0<\delta\le\tfrac12
\]

를 얻는다. $e^{1/\delta^2}\ge\delta^{-2M}/M!$와 $2M\ge3/2+3j+N$을 그대로 이용하므로 단순 표본 외삽이 아니다.

실제 $\sqrt{y_i}=f\sqrt{W_i}$에 곱 규칙과 위의 source-bound 유한 jet을 적용하면 모든 고정된 유한 차수에서 임의의 추가 $\delta^N$이 남는다. $\delta\le0$에서 전체 함수를 먼저 0으로 정의하므로 내부의 $\log\delta$나 $\sqrt W$를 정의역 밖에서 평가할 필요가 없다. 경계에서 모든 jet이 0으로 맞는다.

이 결론의 smoothness는 고정 label의 outer radial edge에서, 열린 $\eta$ chart 내부에 관한 것이다. $\eta=\pm1$에서는 원래 heat의 한쪽 finite jets를 쓰며 $T<0$로 연장했다는 주장은 없다. 안쪽 edge, 활성 completed prefix가 있는 모든 내부 box, 전체 label 합, 전체 물리 NS 잔차·flat-error, 전체 G-POS/G-NUM, 새 Lean kernel 증명 및 M2/M3 gate는 여기서 승인되지 않는다.

읽기 검토에서 이 제한된 actual outer 제곱근 0 연장 명제의 수학 오류를 찾지 못했다. 확인한 것은 source 결속, 정확한 대수 검사, 서술형 해석 증명과 실제 실행 기록의 일관성이다.
