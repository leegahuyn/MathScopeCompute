# ell=1 말단 후보점의 A.13 스칼라 경계 독립 검토

작성일: 2026-10-11. 이 문서는 현재 고정된 N3 매개변수와 원래 A.13 적분식을 사용하여 말단 대기 길이의 양성, 외부 반경의 상한 및 후보점의 \(0<F<1\)을 도출한다. 큰 지수를 binary64로 평가하거나 작은 양의 \(h\)를 0으로 대체하지 않는다.

검토 대상은 [원래 outer 일정](../../../actual-global-source-outer.mjs), [고정 매개변수](../../../source-profile-data.mjs), [실제 heat를 붙인 leading source](../../../actual-continuation-exact-heat.mjs) 및 [heat 계수 정의](../../../actual-mean-stress.mjs)이다. 아래 계산은 그 식에 대한 독립적인 해석적 증명이며, 새로운 actual-source 실행 기록이나 Lean kernel 증명은 아니다. 후보점의 실제 graph 결속은 별도 source 검사에서 확인해야 한다.

## 1. 서로 다른 Q와 rho를 구분한다

다음은 고정 profile의 정확한 정의다.

\[
\begin{aligned}
T&=\exp(1048576)+10\ge128,\\
P_*&=e^{2T},\qquad \lambda=e^{-1000T},\qquad h=e^{-8002T},\\
B_{\rm outer}&=1000T,\quad T_f=128,\quad c_o=1/256,\\
\rho_o&=c_oh=h/256,\qquad L_{\rm hold}=-4\log h=32008T.
\end{aligned}
\]

이 문서의 \(\rho_o\)는 A.13의 \(c_oh\)다. profile에 별도로 정의된 복소 근방의 `rho`와 동일시하지 않는다. 마찬가지로 아래 \(Q_{\rm prof}\)는 profile의 큰 상수 `Q`이며, ell=1 pulse band의 \(Q=1/2\)와 다른 객체다.

\[
0<h<\lambda<1/16,\qquad 0<\rho_o<1/4096.
\]

\(a=1-\lambda\), \(b=1-h\)라 놓으면 \(1/2<a,b<1\)이다. 원래 cutoff는 \(0\le\sigma\le1\), \(\sigma'\ge0\), \(\sigma(0)=0\), \(\sigma(1)=1\), \(\sigma(1-s)=1-\sigma(s)\)를 만족한다. 따라서

\[
S(s)=\int_0^s\sigma(t)\,dt,\qquad
0\le S(s)\le s\quad(0\le s\le1),\qquad S(1)=1/2.
\]

## 2. Qsteep 및 Qb의 양성과 크기

현재 `compileActualOuterAxialProgram`의 A.13 부분은 다음을 정확히 구성한다.

\[
\begin{aligned}
Q_0&=\frac{\lambda-h}{a},\\
Q_{\rm steep}
&=e^{-a/2}\left[
Q_0+\int_0^1 e^{a(s-S(s))}
\bigl(\lambda+a\sigma(s)-h\bigr)\,ds\right],\\
Q_{\rm hold}&=Q_{\rm steep}+bL_{\rm hold},\\
Q_b&=e^{-b/2}\left[
Q_{\rm hold}+\int_0^1e^{bS(s)}b(1-\sigma(s))\,ds\right].
\end{aligned}
\]

\(0<\lambda-h<1-\lambda\)이므로 \(0<Q_0<1\)이다. 또한 전체 \([0,1]\)에서

\[
0<\lambda-h\le\lambda+a\sigma(s)-h\le1-h<1,
\quad 0\le a(s-S(s))\le1.
\]

따라서 적분의 양성과 \(e<3\)으로

\[
0<Q_{\rm steep}<1+e<4.
\]

이 단계는 `Qsteep`의 부호를 가정하지 않고 원래 적분에서 직접 보인다. 이어서

\[
bL_{\rm hold}<Q_{\rm hold}<4+L_{\rm hold}.
\]

`Qb`의 적분은 비음수이고 \(e^{-b/2}>e^{-1/2}>1/2\), \(b>1/2\)이다. 그러므로

\[
Q_b>\frac14L_{\rm hold}=8002T>1.
\]

상한에는 \(e^{-b/2}<1\), \(e^{bS(s)}<e\), \(0\le b(1-\sigma(s))<1\)을 사용한다.

\[
Q_b<4+L_{\rm hold}+e<7+32008T.
\]

특히 `Qb`와 `Qsteep`은 모두 엄밀히 양수다.

## 3. Qp의 지수와 정규화 인자를 유지한 양쪽 경계

원래 식의 분모와 지수는 다음과 같다.

\[
Q_p=\int_1^3
\frac{e^{bs}\rho_o\sigma'((s-1)/2)}{2(1-\rho_o)}\,ds.
\]

\(t=(s-1)/2\)를 대입하면

\[
Q_p=\frac{\rho_o}{1-\rho_o}
\int_0^1e^{b(1+2t)}\sigma'(t)\,dt.
\]

따라서 \(\int_0^1\sigma'=1\)과 \(\sigma'\ge0\)에 의해

\[
\boxed{\quad
\frac{\rho_oe^b}{1-\rho_o}
\le Q_p\le
\frac{\rho_oe^{3b}}{1-\rho_o}
\quad}.
\]

이 경계는 \(e^{(1-h)s}\) 또는 \((1-\rho_o)^{-1}\)을 누락하지 않는다. \(b>0\)이므로 \(Q_p>\rho_o>0\)이고, \(b<1\), \((1-\rho_o)^{-1}<2\), \(e<3\)을 사용하면

\[
Q_p<2e^3\rho_o<54\rho_o<54/4096<1.
\]

결론적으로 요청한 약한 경계 \(\rho_o\le Q_p<1\)보다 강한 \(\rho_o<Q_p<1\)이 성립한다.

## 4. wait는 양수이며 16006T+34보다 작다

원래 대기 길이는

\[
w=\frac{\log(Q_b/Q_p)}{b}.
\]

\(Q_b>1>Q_p>0\)이므로 \(w>0\)이며 로그도 정상적인 양의 실수 입력을 갖는다. \(b>1/2\), \(Q_b<7+32008T\), \(Q_p>\rho_o\)로

\[
\begin{aligned}
w
&<2\log\frac{7+32008T}{\rho_o}\\
&=2\{8002T+\log256+\log(7+32008T)\}.
\end{aligned}
\]

\(T\ge1\)에서는 \(7+32008T\le32015T\), \(\log T\le T\)이다. 또한 \(e>8/3\)와 정확한 정수 비교

\[
8^{11}>32015\,3^{11},\qquad
8^6>256\,3^6
\]

로 \(\log32015<11\), \(\log256<6\)을 얻는다. 따라서

\[
\boxed{\quad 0<w<16006T+34.\quad}
\]

이 상한은 지수적으로 작은 \(Q_p\)의 로그 \(8002T\)를 포함한다. `wait`를 음수나 0으로 간주하여 outer 길이를 줄이지 않는다.

## 5. 원래 전체 stage 길이로 Xb<C^11을 도출한다

`terminal.end`까지의 실제 길이 합은

\[
\begin{aligned}
y_{\rm end}
&=1+T+1+60B_{\rm outer}+13/\lambda+T_f\\
&\quad+30B_{\rm outer}+1+L_{\rm hold}+1+w+3\\
&=13e^{1000T}+122009T+135+w.
\end{aligned}
\]

\(C=C_{\rm Selected}\), \(X_R=110(CP_*)^{10}\), \(X_b=X_Re^{y_{\rm end}}\)이므로

\[
\log(X_b/C^{10})
=\log110+20T+y_{\rm end}
<13e^{1000T}+138035T+174.
\]

여기서 \(\log110<5\)는 \(8^5>110\,3^5\)로 확인할 수 있다. \(T\ge1\)이면

\[
138035T+174\le138209T
<\frac{(1000T)^3}{6}<e^{1000T},
\]

왜냐하면 정확한 정수 부등식 \(1000^3>6\cdot138209\)가 성립하기 때문이다. 따라서

\[
\log(X_b/C^{10})<14e^{1000T}.
\]

profile의 \(j_0=h^4\), \(\sigma_*=j_0/2000\), \(K=P_*^2\)를 사용하면 큰 profile 상수는

\[
Q_{\rm prof}=2^{260}\frac K{\sigma_*^2}
=2^{260}\,2000^2e^{64020T}>e^{64020T}.
\]

원래 JSON의 큰 정수 계수는 정확히 \(2^{260}\)이다. 또한

\[
\log C=10\log(1+Q_{\rm prof}^{300})+Q_{\rm prof}^{200}
>e^{12804000T}>14e^{1000T}.
\]

마지막 부등식은 \(e^{12803000T}>1+12803000T>14\)로 충분하다. 그러므로

\[
\boxed{\quad X_b<C^{11},\qquad C>2.\quad}
\]

후보점 \(X=X_be^{-1/4}\)은 \(X<X_b\)이고, \(s=1,\eta=0\)에서 \(R=\sqrt{2X}\)이다. 따라서

\[
R<\sqrt2\,C^{11/2}\le C^6.
\]

이 계산에는 지수적으로 큰 profile 상수를 수치로 materialize할 필요가 없다.

## 6. 모든 선행 logA 증가량의 부호와 실제 terminal F의 상한

`Etail`은 원래 `terminal.logAStart`를 사용한 \(E_{\rm tail}=P_*e^{\log A_{\rm start}}\)이다. 말단 이전의 각 실제 endpoint 증가량은 다음과 같다. \(S(1)=1/2\)와 \(w>0\)를 사용하며, angular 보정 bump는 이 표의 logA와 별도인 compact 보정이다.

| 원래 stage | logA의 endpoint 증가량 | 부호 |
|---|---:|---:|
| initial | \(-1/5\) | 음수 |
| axialDecay | \(-T/2\) | 음수 |
| entry | \(-1/2-\lambda/2\) | 음수 |
| reservedPower | \(-(1/2+\lambda)60B_{\rm outer}\) | 음수 |
| pulse | \(-(1/2+\lambda)13/\lambda\) | 음수 |
| interpolation | \(-(1/2+\lambda)T_f-\log2\) | 음수 |
| angular | \(-(1/2+\lambda)30B_{\rm outer}\) | 음수 |
| steepen | \(-1-\lambda/2\) | 음수 |
| steepPower | \(6\log h\) | 음수 |
| flatten | \(-1-h/2\) | 음수 |
| wait | \(-(1/2+h)w\) | 음수 |

모두 음수이므로 \(0<E_{\rm tail}<P_*\)이다. 후보점은 terminal local coordinate \(y=11/4\)에 있다. 원래 heat cutoff는 이미 1이고, angular bump, B.8, C.12, I1 및 I2 correction은 이 위치에 남아 있지 않다. 이 support 사실과 complete background가 이 leading field에 정확히 일치한다는 사실은 actual-source binding의 별도 전제다.

그 위치에서 실제 heat를 유지한 식은

\[
E(X,0)=E_{\rm tail}e^{-(1/2+h)y}
\frac{f_o(y)}{1-\rho_o}H(2/X),
\qquad
f_o(y)=1-\rho_o[1-\sigma((y-1)/2)].
\]

원래 Laplace heat 적분은 \(0<H(2/X)\le1\)이고 \(0<f_o\le1\)이다. \(y>0\), \((1-\rho_o)^{-1}<2\)로

\[
0<E(X,0)<2P_*.
\]

모든 stage 길이는 양수이므로 이 후보점은 \(X>X_R\)에 있다. 따라서

\[
0<F(X,0)=\frac{E(X,0)}{\sqrt{2X}}
<\frac{2P_*}{\sqrt{220(CP_*)^{10}}}
=\frac{2}{\sqrt{220}\,C^5P_*^4}<1.
\]

\(F\)의 양성 외에 수치적인 하한은 필요하지 않다. \(H\)를 1로 치환한 것이 아니라 \(0<H\le1\)을 실제 적분의 상한에만 사용했다.

## 7. 이 문서로 닫히는 부분과 범위

위 계산은 원래 A.13의 지수 및 정규화 인자를 유지하여 다음을 독립적으로 도출한다.

\[
0<Q_{\rm steep}<4,\quad
1<Q_b<7+32008T,\quad
\rho_o<Q_p<1,\quad
0<w<16006T+34,
\]

\[
X_b<C^{11},\quad R<C^6,\quad 0<F<1
\]

마지막 두 후보점 경계에는 앞서 명시한 실제 terminal support와 source identity가 결속되어야 한다. 이에 더해 \(\alpha\), phase carrier, 초기 조건, 실제 압력 행 및 covariance 적분의 부호를 결속하는 절차는 [별도 독립 검토](ELL1_COVARIANCE_OBSTRUCTION_INDEPENDENT_REVIEW_KO.md)에 기술되어 있다.

여기서 ell=1은 원래 논문의 \(\ell\ge\ell_0\), \(q<q_{\rm big}\) 허용족 전체를 만족한다고 주장하지 않는다. nonnegative covariance weights의 부호 장애가 완성되더라도 현재 표시되는 ell=1 식의 확장에 관한 결과다. 이 문서는 원래 NS 정리의 반례, 전체 \(H\) 수치 평가, 전체 G-NUM 통과, 새로운 Lean 실행 또는 M2 전체 완료를 주장하지 않는다.
