# 작은-q 실제 covariance: 공통 보정 지지집합 뒤의 양성 구성

이 문서는 원본 source의 **실제로 선택한 작은-q pulse**를 만들고, 그 실제 두 covariance 열로부터 행렬식과 두 양의 가중치 및 제곱근 경계를 얻는 별도 구성을 설명한다. 기존 표시용 `ell=1` pulse를 양성으로 재분류하지 않는다.

새 구현은 [actual-admissible-terminal-covariance.mjs](../actual-admissible-terminal-covariance.mjs)이다. 정확한 원본 상수로 정의한 정수

\[
\ell_* = \ell_{\min}+8,\qquad Q_*=2^{-\ell_*},\qquad
S_*=\ell_*^2
\]

를 사용한다. `ell_*`의 천문학적인 정수 자릿수를 출력하거나 `Q_*`를 binary64로 바꾸지 않는다. 양성 증명은 새로 만든 실제 함수식에 결속된 서술형 해석 증명이며, 실제 source 검사와 정확한 대수·정수 검사로 그 결속을 확인한다. 새로운 해석학 Lean kernel 증명이나 전체 `H`의 수치 구간 인증은 별개다.

## 1. 이번에 다루는 정확한 정의역

원본의 모든 양의 차수 보정이 끝나는 공통 우측 지점을 `Xplus`라 한다. 이 구현의 열린 정의역은

\[
X_+<X_{\rm rep}<X_b,\quad X_+<X<X_b,\quad
\eta_{\rm rep},\eta\in[-1,1],\quad s_{\rm rep},s\in[1/2,2]
\]

이고, 대표점과 관측점은 같은 원본 slow box에 속하여 slow 좌표의 거리가 `4/S_*^3` 이하인 경우다. 실제 느린 좌표는

\[
R=\sqrt{2sX},\quad Z=s^{1/2-h}\eta,\quad T=s(1-\eta^2),
\quad q=Q_*s.
\]

`terminal`이라는 모듈 이름은 이 공통 보정 지지집합 뒤의 외측 제한을 뜻한다. 정의역 전체가 Appendix A의 마지막 길이 3인 terminal stage만이라는 뜻은 아니다. 그 마지막 stage 안의 구체적 점도 아래에서 실제로 대입한다.

대표점·정수 label은 slow 미분에서 고정한다. 양의 제곱근의 smoothness는 이 고정 label의 열린 slow chart 내부에 대한 명제다. `eta=±1`, 즉 `T=0`에서는 원래 heat의 `z>=0` 쪽 유한 jet의 연속 경계값을 사용한다. determinant·양성 부등식은 이 닫힌 경계값에도 적용하지만, 원래 실수 heat 적분을 `T<0`까지 연장했다는 주장은 하지 않는다. 평탄한 경계 `X=Xb`, 다른 label 사이의 접합, 모든 source box를 덮는 전역 조립은 이 인증서의 범위에 포함하지 않는다.

원문은 최종 `ell0`, `qbig`의 수치를 정하지 않는다. 이번 정수는 현재 원본 source 식으로 증명한 **covariance 충분조건 영역**의 실제 구성원이다. 이것만으로 임의의 원문 최종 `Gamma(ell0,qbig)`에 포함된다고 말하지 않는다. 해당 별도 조건과 전역 물리 잔차를 닫는 후속 구성이 전체 M2 목표에 여전히 필요하다.

## 2. 거대한 active prefix를 생략해도 되는 정확한 이유

작은 `q`에서는 많은 양의 차수 cutoff가 켜질 수 있다. 따라서 작은 `q`라는 이유로 첫 몇 항만 남기는 방법은 허용되지 않는다. 이번에는 **각 보정항 자체가 동일한 외측 영역에서 0**이라는 원본 식을 사용한다.

근거는 [actual-residual-order-induction-source.mjs](../actual-residual-order-induction-source.mjs)의 `completeOrder`와 [actual-continuation-exact-order-one.mjs](../actual-continuation-exact-order-one.mjs)의 실제 1차 완성이다.

| 모든 차수에 공통인 식 | 정확히 0인 외측 영역 |
|---|---|
| 내부 cutoff를 적용한 `F_n`, `U_n`의 내부 부분 | `X>Xcut` |
| 실제 다섯 moment 보정 `dF_n`, `dU_n` | `X>IposRight` |
| 완성된 `M_n`과 `average_n` | `X>lastU` |
| 완성된 `Pi_n` | `X>Xplus` |
| `v_n`, 그리고 모든 유한 공간 미분 | `X>Xplus` |

원본 [support-order 증명](../actual-continuation-exact-support.mjs)은 이 끝점들이 `Xplus` 이하이며 `eta`와 무관함을 실제 A.2 stage와 원본 매개변수 식에 연결한다. `M_n`과 `Pi_n`의 0인 after-branch는 실제 다섯 moment의 소거를 마친 다음에만 사용한다. 적분 integrand가 compact하다는 사실만으로 그 누적 적분을 0이라 두지 않는다.

새 `commonCompletionSupportKernel`은 내부 함수와 moment debt 및 차수 `n`을 임의의 슬롯으로 둔 상태에서 같은 지지집합 구조가 닫힘을 확인한다. 별도로 실제 `n=1,2,3`의 원본 함수 본문과 moment 검사를 결속한다. 이는 세 차수를 보고 나머지를 추측하는 증명이 아니다. 모든 `n>=2`에 같은 `completeOrder`가 같은 끝점으로 쓰는 after-branch 구조에 대한 매개화된 귀납 단계이며, 실제 유한 실행은 그 구현의 회귀 증거다.

원래 canonical cutoff는 `c_n>=2^n`이므로 모든 `q>0` 부근에서 합이 국소적으로 유한하다. 이제 모든 양의 차수의 `F_n,U_n,M_n,v_n`과 모든 유한 미분이 `X>Xplus`에서 0이다. 따라서 `q^(2nh) chi(c_n q)`를 곱하거나 `chi`를 미분하거나 추가 stream cutoff 항을 넣어도 각 항이 0이다. 이 열린 영역에서

\[
\widetilde F(q,X,\eta)=F_0(X,\eta),\qquad
\widetilde G(q,X,\eta)=U_0(X,\eta)
\]

와 그 모든 유한 `q,X,eta` 미분의 일치가 성립한다. 모든 cutoff가 꺼져 있다는 주장을 사용하지 않는다. `X<=Xplus`에 이 축약을 적용하지 않는다.

## 3. 실제 source에 의존하는 정수 선택과 q 비교

원본 [actual-covariance-operator-bounds.mjs](../actual-covariance-operator-bounds.mjs)가 생성하는 고정 상수는

\[
B=2^{128}+R_{\rm env}^{4096}
  +B_{FG,\rm err}+B_b+B_F+B_G+B_{\rm chart,A}+B_{\rm chart,B}.
\]

각 항은 실제 `n=1,2`의 유한 C2 부분, 원래 canonical 전체 꼬리, 확대 annulus 위의 실제 leading C2와 source chart에서 온다. 표시용 `ell`이나 대표점은 이 상수에 들어가지 않는다. 새 검사는 위 덧셈식의 root, 자유 좌표가 없다는 사실, `E=Ed=Ef=Es=B^256`의 실제 결속을 다시 확인한다.

농축·moving frame·방향 조건을 모두 합친 원본 선택은

\[
\ell_{\min}=\left\lceil
\max\left(8,S_{\min},(64/h)^2\right)
\right\rceil,\qquad q_*=2^{-\ell_{\min}-4}.
\]

`S_min`에는 실제 frame 분모를 보호하는 `B^512`와 source 방향을 보호하는 `R_env^1024`도 포함한다. 양의 원본 `h=exp(-8002 T_prof)`를 유지한다.

`ell_*=ell_min+8`은 정수이므로 `ell_*>ell_min`, `S_*=ell_*^2>=S_min`이다. 원본 logarithm 부등식

\[
\log 3+4\log\ell-\tfrac12 h(\log2)\ell<0
\quad\text{for }\ell\ge(64/h)^2
\]

으로부터 `S_*^2 (epsilon+epsilon^2+1/k)<1`도 성립한다. 이는 `log2>=1/2`, `log ell<=sqrt ell`를 사용한 실제 selector의 동일한 증명이다.

전체 물리 band의 최대값은

\[
q=Q_*s\le 2Q_*=2^{-\ell_{\min}-7}=q_*/8.
\]

따라서 대표점 하나에서만 추측한 smallness가 아니라 전체 `s in [1/2,2]` band가 source-certified covariance threshold보다 작다. 정수식의 값이 매우 크다는 사실은 이 비교의 장애가 아니다.

## 4. 새 band에서 실제 pulse를 다시 만드는 부분

기존의 private `ell=1` 객체는 실제 source·고정 norm·full target 생산자로만 사용한다. 그 객체는 보존한 채 그래프를 복사하고, 아래 모든 요소를 **새 정수 `ell_*`로 다시 만든다**.

1. `Q_*`, `epsilon=Q_*^h`, `k=ceil(epsilon^(-1/2))`, 원래 palette 정수와 `ci`, `Ls`.
2. 원래 leading frame의 `N,K,c0,lambda0` 및 새 `Bs`.
3. 두 부호의 nonzero rounded carrier, phase와 실제 `R,Z,T` 미분.
4. 움직이는 `n`, `n_prime`, pressure 항을 포함한 `Aphi`, 움직이는 `B`, `B_prime`.
5. 새 `w'=M(v)w`, `w(0)=(1,0)`인 실제 Volterra 두 시스템, 원래 `P(v)`, `t=B P w`.
6. 원래 transverse cutoff, longitudinal cutoff, Haar와 angular `1/2` 인자, 두 `H` 열과 두 양의 mass의 실제 적분.

주요 원래 연산은 [actual-covariance-matrix.mjs](../actual-covariance-matrix.mjs)의 `actualMovingPulseFrame`을 그대로 호출한다. pressure의 `-n_prime`이나 basis의 `B_prime`를 생략하지 않는다. source 실행에서는 생성된 새 행렬과 integrand가 이 식과 정확히 같음을 다시 확인한다.

원래 palette는 `Tg=4+sqrt(2)`, `r0=2^-34`에 대해

\[
a=\frac{(1+h)\ell_*\log2-2\log\ell_*}{\log T_g},
\quad m=\lfloor a\rfloor,\quad
c_i=T_g^m Q_*^{1+h},\quad L_s=2r_0/c_i.
\]

`0<=a-m<1`을 지수화하면

\[
\frac1{T_g S_*}<c_i\le\frac1{S_*},
\qquad 2r_0\le\frac{L_s}{S_*}<2r_0T_g.
\]

이는 기존 농축식의 `Lmin,Lmax`와 정확히 동일하다. 원래 `ell=1`의 짧은 pulse 길이를 재사용하지 않는다.

## 5. 실제 covariance와 양의 가중치 경계

`a_0=-c0>0`, `Ac=a_0 sqrt(1+u^2)`라 두자. 원래 농축 proof의 `amplitudeLower`, `amplitudeUpper`, `massLowerCoefficient`는 현재 source의 실제 고정 상수에서 계산한 정확한 양의 식이다.

두 부호 각각에 대해

\[
x=t_r=z_++z_->0,\qquad
m_\pm=J_i\int_0^{L_s}\psi(v)^2 x(v)^2\,dv,
\]

\[
J_i=\tfrac12 D_g c_i\int\chi(\xi)^2\,d\xi>0
\]

이다. `z_-/z_+`의 Riccati 불변구간과 원래 Gaussian envelope, `psi=1`인 중앙 구간으로

\[
m_\pm\ge m_{\rm low}
=J_i\,\mathrm{massLowerCoefficient}\sqrt{L_s}>0.
\]

추가로 원래 `P<=1`, `x<=amplitudeUpper P`, `psi<=1`이므로

\[
m_\pm\le m_{\rm up}=J_i\,\mathrm{amplitudeUpper}^2 L_s<\infty.
\]

이 유한 상한은 전체 `H`를 수치 적분하지 않고도 가중치의 양의 하한을 `H` mass 없이 적는 데 사용된다.

원래 source bound와 농축식은 실제 정규화 행렬

\[
C=\begin{pmatrix}-N^T/A_c\\K^T/u\end{pmatrix}
H\,\mathrm{diag}(m_+^{-1},m_-^{-1})
\]

에 대하여

\[
\left\|C-\begin{pmatrix}1&1\\-1&1\end{pmatrix}\right\|_{\max}
\le\kappa/128
\]

을 준다. 이때 정확한 Bernstein audit 결과는

\[
15/8<\det C<17/8.
\]

원래 `(theta,z)` 행 순서와 `(plus,minus)` 열 순서의 행렬식은 **음수**이다.

\[
\det H=-A_cu\,m_+m_-\det C<0,
\quad
|\det H|>\frac{15}{8}A_cu\,m_+m_-
\ge\frac{15}{8}A_cu\,m_{\rm low}^{\,2}>0.
\]

full leading target `T`는 원래 heat/B8/C12/I1/I2와 두 점성 shear 항을 유지한 실제 식이다. `tau=-(N dot T)/Ac`라 두면 열린 stress shell에서 `tau>0`이다. 원래 target cone과 같은 box의 실제 방향 modulus를 결합하면

\[
\frac\kappa{64}\le\frac{m_\pm y_\pm}{\tau}\le2,
\qquad y=H^{-1}T.
\]

따라서 실제 두 가중치에 대한 정량적 경계는

\[
0<\frac{\kappa\tau}{64m_\pm}\le y_\pm\le\frac{2\tau}{m_\pm},
\]

또는 실제 mass 적분을 분모에서 제거한

\[
0<\frac{\kappa\tau}{64m_{\rm up}}
\le y_\pm\le\frac{2\tau}{m_{\rm low}}<\infty
\]

이다. 모든 경계식은 그래프 root로 반환한다. 아직 정밀한 수치로 평가한 값이라는 주장은 하지 않는다.

양의 제곱근 함수의 단조성으로 경계의 양변에 제곱근을 취할 수 있다. fixed label의 열린 slow 영역에서는 실제 source와 Volterra 해 및 target이 smooth하고 `det H!=0`, `y_±>0`이므로 `sqrt(y_±)` 역시 smooth하다. 이 논리는 실제 양성으로 보호되는 열린 영역에만 적용한다.

## 6. 실제로 대입하는 한 source 점

다음 점과 대표점을 동일하게 선택한다.

\[
X_*=X_b e^{-1/4},\quad \eta_*=0,\quad s_*=1,
\quad R_*=\sqrt{2X_*},\quad Z_*=0,\quad T_*=1.
\]

원래 `Xtail=Xb exp(-3)`이므로 마지막 stage의 좌표는 `11/4`다. 공통 보정 endpoint는 `Xplus=Xv exp(1)`이며 pulse 뒤의 interpolation만 길이 128이다. 모든 후속 stage 길이가 양수이므로 `Xplus<Xtail<X*<Xb`이다. 대표점과의 slow 거리는 정확히 0이다. 원래 box의 대표점 선택 규칙은 교차한 box 안의 이 점을 허용한다.

새 source 검사는 위 값을 두 실제 `H` 열, determinant, 실제 두 inverse weight, 제곱근, target과 경계식에 대입한 뒤 **모든 slow/representative 자유 좌표가 소거됐는지** 확인한다. pulse와 heat의 정의를 보유한 함수식이며, 유한 Volterra 부분합이나 rounded machine value가 아니다.

이 점에서 이전 `ell=1` 반례와 다른 점은 source나 heat를 바꾼 것이 아니라 **원래 충분조건을 만족하는 새 큰 정수 band와 그에 맞는 pulse 길이·carrier·실제 ODE**를 사용한다는 것이다. 이전 `ell=1` 부호 장애의 범위를 확대하거나 취소하지 않는다.

## 7. 검증과 provenance

- [generic kernel tests](../tests/actual-admissible-terminal-covariance-kernel.test.mjs)는 임의 차수 지지집합 구조, compact primitive 오판 방지, 잘못된 endpoint와 nonzero after-branch 거부, 정수 buffer, 외부 데이터/flag 거부를 검사한다.
- [actual source tests](../tests/actual-admissible-terminal-covariance-source.test.mjs)는 private 원본 보존, 실제 공통 support/moment 결속, 새 band·palette·moving pressure·Volterra·target, witness 대입, inverse identity와 양성 경계식의 실제 root를 검사한다.
- 변경한 inverse weight를 넣은 정확한 음성 대조는 `Hy=T`를 통과하지 않아야 한다. copied certificate, 바뀐 source node·Volterra matrix·scope flag, 바뀐 프로그램 metadata/node-array도 거부한다.
- 그래프는 고정 compiler prefix와 전체 metadata를 seal한다. 이후 독립적인 노드가 추가돼도 이미 발급한 graph hash는 변하지 않는다.
- source 실행 전후의 로컬 import closure 파일 SHA를 비교하며, 이 실행기의 SHA도 실행 기록에 보존한다. 실행 기록은 기존 파일을 덮어쓰지 않는다.

증거 위치는 `research/evidence/admissible-covariance-20261011/`이다. 실제 실행 결과는 다음과 같다.

| 실행 | 관측한 결과 |
|---|---|
| [generic kernel JSON](evidence/admissible-covariance-20261011/actual-admissible-terminal-covariance-kernel.json), [TAP](evidence/admissible-covariance-20261011/actual-admissible-terminal-covariance-kernel.tap) | 7/7 PASS, exit 0. 실제 source 실행으로 세지 않는다. |
| [actual source JSON](evidence/admissible-covariance-20261011/actual-admissible-terminal-covariance-source-attempt1.json), [TAP log](evidence/admissible-covariance-20261011/actual-admissible-terminal-covariance-source-attempt1.log) | 13/13 PASS, 실행 도구에서 exit 0 관측. 실제 source binding 28개와 두 inverse identity를 확인했다. |
| actual source 그래프 | 234,335 nodes, canonical compiler bytes 9,339,274 |
| actual source 시간·메모리 | 기록 시점 32.4705초, peak RSS 1,986,326,528 bytes |
| actual source import closure | 51개 파일의 SHA가 실행 전후 동일 |

실제 graph SHA256은 `8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a`다. source 실행 직후의 원본 JSON/log는 보존하며, 실행 프로세스 종료값과 후속 문서·독립 검토의 hash는 별도 validation packet에 결속한다. 이 숫자는 소프트웨어 source 결속 검사의 실행 결과이며 전체 M2나 새로운 해석학 kernel 증명의 완료 수가 아니다.

## 8. 여전히 남는 전체 G-POS와 M2 관문

이번 결과는 원본 작은-q 식에서 실제 양성이 작동하는 구성원과 열린 외측 영역을 제공한다. 다음 항목은 그대로 남는다.

| 남은 항목 | 필요한 구체적 입력·출력 |
|---|---|
| `X<=Xplus`의 active completed background | 실제로 활성인 모든 항을 보유한 원본 작은-q source 또는 그와 정확히 동치임을 증명한 전체-domain 표현을 입력으로 받아 실제 두 `H` 열을 구성해야 한다. |
| 모든 source box와 label | 같은 source selector 아래 각 box의 실제 field/phase/carrier/Volterra 정의와 원래 cover를 결속한 양성 인증이 필요하다. |
| 원문 최종 `Gamma` | 원문에서 아직 수치가 정해지지 않은 `ell0,qbig`를 covariance뿐 아니라 full physical residual와 weighted-stress 조건까지 만족하도록 선택하는 절차가 필요하다. |
| 평탄 경계의 제곱근 | 실제 flat factor의 전역 접합, 모든 필요한 slow 미분, 고정 label 간 조립을 보존한 smooth zero extension이 필요하다. |
| 정밀 수치 인증 | 실제 pulse 해, 전체 `H`, target과 determinant/weight의 폭이 제어된 구간 및 별도 quadrature/Volterra/rounding error budget이 필요하다. |
| 새로운 해석학 Lean 증명 | 실제 source 정칙성·적분·Volterra·농축·양성 추론까지의 정리와 kernel 결과가 필요하다. 기존 보편 대수 정리만으로 대체하지 않는다. |

따라서 `wholeGPOSComplete=false`, 전체 M2 완료 및 `m3MayStart=false`를 유지한다. 사용자의 전체 목표를 이 제한된 한 경로로 축소하지 않는다.

원문: [Navier–Stokes PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), SHA256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`. 실제 지지집합은 Lemma 5.2와 §5.5, pulse/covariance 구성은 §7 및 식 (7.27)–(7.29)에 연결된다.
