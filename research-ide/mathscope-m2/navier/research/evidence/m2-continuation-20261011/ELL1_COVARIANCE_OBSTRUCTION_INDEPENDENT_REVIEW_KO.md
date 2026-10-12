# ell=1 covariance 부호 장애 후보: 독립 수학 검토

## 검토 상태와 범위

이 기록은 cutoff 수치 모듈 담당자가 원래 식을 읽고 수행한 독립 검토다. 새 source 프로그램을 이 후보에서 실행한 기록은 아니다. 아래 heat/terminal target 부호, 원래 Aphi의 2×2 축약, 초기값 및 짧은 시간의 부호 보존에서 오류를 발견하지 못했다. **마지막 실제 source root와 상수의 결속이 별도로 완료되기 전에는 개별 determinant/weight 부호 인증을 바꾸지 않는다.**

특히 원문 (6.8)의 label family는 `ell≥ell0` 및 `q<qbig`를 요구한다. 현재 `ell=1`, `q=1/2` 후보는 충분히 작은 스케일의 원문 인증 family에 속하지 않는다. 이 후보가 완전히 확인되더라도 결론은 **현재 displayed ell=1 식을 이 점까지 확장했을 때의 비음수 weight 불가능성**이며 원문 정리의 반례가 아니다.

참조한 식은 원문 Appendix A.32–A.56, (6.8)과 현재 다음 파일이다.

- [`actual-continuation-exact-heat.mjs`](../../../actual-continuation-exact-heat.mjs): 원래 Laplace heat integral 및 terminal field.
- [`actual-global-source-outer.mjs`](../../../actual-global-source-outer.mjs): terminal `f_o`와 이전 보정의 위치.
- [`actual-covariance-matrix.mjs`](../../../actual-covariance-matrix.mjs): constrained Aphi와 실제 moving frame.
- [`actual-covariance-source-operator.mjs`](../../../actual-covariance-source-operator.mjs): 실제 phase/carrier/Volterra/H 인자.
- [`actual-covariance-source-target.mjs`](../../../actual-covariance-source-target.mjs): 원래 target와 두 shear 항.
- [현재 finite band exclusion 실제 실행](actual-covariance-band-admissibility-source.json): 모든 양의 차수 background cutoff가 이 finite band에서 비활성이라는 별도 근거.

## 1. 실제 heat와 terminal target의 부호

후보는 `s=1`, `eta=0`, `delta=log(Xb/X)=1/4`, 즉 terminal 좌표 `y=11/4`이다. 원래 heat cutoff는 이 구간에서 정확히 1이다. 원래 함수는

\[
H(\zeta)=\frac1{\Gamma(1+h)}\int_0^\infty e^{-v}v^h(1+\zeta v)^{-h}\,dv,
\quad \zeta=2/X,
\]

이며 `H>0`, `H'<0`이고, 이 원래 적분이 1 또는 임의의 작은 상수로 치환되지 않는다. `heatLoss`가 바로 `1−H`인 점도 코드에서 확인했다. terminal에서는

\[
F=C X^{-1-h} f_o(y)H(2/X),\qquad
f_o(y)=1-\frac{h}{256}\left(1-\sigma\left(\frac{y-1}{2}\right)\right).
\]

`y=11/4`에서 sigma의 인자는 `7/8`이고 `f_o'>0`이다. 물리 heat field `K`는 원문 A.6에 따라 `K>0`, `K_r<0`이다. 원문 A.54의 boundary term `K f_r`와 두 integral term은 모두 비음수이며 boundary term은 엄밀히 양수다. 따라서 원래 moment-restoration 가정을 유지한 **실제 terminal target Ttheta는 양수**다. `s=1`의 chart factor도 1이다.

필요한 Rayleigh 변수는

\[
\alpha=-1-XF_X/F=h-f_o'/f_o+\zeta H'(\zeta)/H(\zeta).
\]

`sigma'≤9`, `h<1`, `co=1/256`으로 `f_o'/f_o≤9h/510<h/4`이다. 또한 Gamma 평균식에서 `E[v]=1+h`이고 `(1+t)^(-h)≥1−ht`이므로, `X≥32`, `h<1/2`이면 `H≥1/2`와

\[
0\le-\zeta H'/H\le2h(1+h)\zeta\le3h/16<h/4
\]

를 얻는다. 그러므로 `h/2<alpha≤h`가 성립한다. 이 부등식은 원래 양의 h를 필요로 하며 h=0에서 얻은 결과가 아니다.

## 2. 원래 Aphi로부터 2×2 방정식 재계산

완성 background가 이 점 근처에서 leading field와 같고 `G=G_R=F_Z=0`이면, `b=p/R`, `n=(n_r,b,n_z)`, `D=n_r²+b²+n_z²`에 대해

\[
n_r'=2(1+\alpha)Fb,\quad n_z=-B_s,
\quad n^T K-n'^T=(-2F(1+2\alpha)b,-2Fn_r,0).
\]

이를 코드의 `Aphi=−K+n(n^T K−n'^T)/D`에 대입하면 원래 r/theta 성분은 정확히 다음 닫힌 방정식을 만족한다.

\[
M=\frac{2F}{D}
\begin{pmatrix}
-(1+2\alpha)n_r b&b^2+n_z^2\\
\alpha(n_r^2+n_z^2)-(1+\alpha)b^2&-n_r b
\end{pmatrix}.
\]

moving frame의 `Bprime` 항은 실제 `t=B P w`의 방정식을 복원할 때 정확히 소거된다. 이 과정에서 pressure와 moving-normal 항을 버리지 않는다. scalar damping과 원래 `P(0)>0`를 분리한 진폭 `a`는 `a'=Ma`를 만족한다. 두 scalar 인자는 부호를 바꾸지 않는다.

## 3. 초기값과 시간에 따른 부호

원래 nonzero sign-preserving rounding으로 `sign(b)=sign`, `|b|≥1/(2R)`를 얻으면 초기값은

\[
a_r(0)=1,\qquad
a_\theta(0)= -\frac{B_su|b|}{2(b^2+B_s^2)}
+\frac{\sqrt\alpha\sqrt{1+u^2/4}\,B_s}{\sqrt{b^2+B_s^2}}.
\]

두 항의 양수/음수 절댓값 비율은

\[
\sqrt\alpha\sqrt{1+4/u^2}\sqrt{1+(B_s/b)^2}.
\]

가정 `alpha≤1/16`, `u≥2`, `|n_r/b|≤1/32`, `|n_z/b|≤1/128`에서 다음 정수/유리수 비교를 독립적으로 확인했다.

| 확인 | 유리수 상한 |
|---|---|
| 초기 두 항의 비율 제곱 | `16385/131072<1` |
| `M21` 분자의 양의 부분 `alpha*((nr/b)^2+(nz/b)^2)` | `17/262144<1` |
| 첫째 row norm / F | `265/128<4` |
| 둘째 row norm / F | `35/16<4` |

따라서 `a_theta(0)<0`, `|a_theta(0)|≤1/32<1`, `M21<0`, `||M||∞<4F`이다. `F≤1`, `Ls<2^-31`을 추가하면 Gronwall로

\[
|a_r(v)-1|\le e^{4FL_s}-1
\le\frac{1}{2^{29}-1}<\frac12
\]

이므로 `ar>1/2`이다. 이후 theta 방정식의 적분인자 안에는 음의 초기값과 `M21*ar<0`만 남으므로 `a_theta(v)<0`이다. 별도의 `|a_theta(0)|<1/128` 상수는 필요하지 않다.

원래 Haar factor는 양수이고, `psi²`는 양수인 plateau를 갖는다. 원래 damping과 P(0)를 복원해도 `t_r*t_theta<0`이므로 위 source 결속과 상수가 확인되면 두 sign에서 `Htheta<0`이다.

## 4. representative와 최종 결론의 정확한 범위

원문 representative는 grid center 자체가 아니라 `B_(ell,a)∩A_ell`에서 고르는 점이다. 따라서 큰 반지름이 정수 mesh center가 아니라는 이유만으로 후보를 배제할 수는 없다. 하지만 **A_ell의 q<qbig와 Γ의 ell≥ell0를 제외하고 geometric box membership만 증명한 결과를 원문 label membership으로 승격할 수 없다.**

두 열의 `Htheta<0<Ttheta`가 완전히 source에 결속되면 `Hy=T`를 만족하는 `y≥0`는 존재하지 않는다. 이로부터 determinant의 부호나 각 weight의 개별 부호는 알 수 없다. determinant가 비영이고 해가 존재한다면 적어도 한 weight가 음수라는 결론만 따라온다.

남은 검토 항목은 후보의 실제 original roots, terminal branch, 원래 `F≤1` 및 source 규모로부터의 `|nr/b|`, `|nz/b|` 상한, 정확한 representative 선택의 범위를 묶는 source 검사다. 이 독립 검토만으로 UNKNOWN certificate를 PASS 또는 개별 NEGATIVE로 변경하지 않았다.
