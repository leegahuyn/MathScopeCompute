# 실제 N3의 weighted Ω 적분: 정확한 환원과 실행 의존관계

작성일: 2026-10-10. 독립 source/proof 검토: `/root/m2_gauge`.

이 문서는 같은 accepted N3를 유지한다. 두 전역 Ω 적분을 기존 다섯
모멘트의 값만으로 삭제할 수는 없지만, **방사 미분을 포함하지 않는
적분으로 정확히 바꿀 수 있다.** 이 환원에 기존 실제 C.12 오차 경계를
적용하면, 고정된 원래 주파수의 모든 주기를 샘플링하지 않고도
최종 변조/첫 복구의 영향을 인증된 작은 포괄 오차로 유지할 수 있다.

새 전역 해, 새 사용자 입력, 작은 대체 주파수, 평균화된 대체 N3를
도입하지 않는다. 기존 원문 기준과 PASS/PARTIAL 판정은 수정하지 않았다.
이 문서는 새 수학적 환원과 독립 유리수 검사의 근거이며, 전체 실제
premodulation 함수의 수치 평가가 이미 끝났다는 실행 영수증은 아니다.

## 1. 고정된 정의와 원전

원전은 공급된 [166쪽 논문](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)의
(4.2), (4.7), (4.15), (5.6), (5.10)–(5.16)이다. 아래의 환원은 이 식에서
직접 유도한다. 원전의 전역 정리 전체를 여기서 새로 검증하는 것은 아니다.

\[
 A=\tfrac12+h,\quad D=\tfrac12-h,\quad A+D=1,\quad
 d=1-\eta^2,\quad L=1-2h\eta^2,
\]
\[
 M(X,\eta)=\int_0^X U(x,\eta)\,dx,\qquad
 V=\frac{2\eta XU-2D\eta M-dM_\eta}{L}.
\]

따라서 정확히

\[
 LV_X=2A\eta U-dU_\eta+2\eta XU_X. \tag{1}
\]

아래에서 \(U,V,M\)은 leading coefficient \(U_0,V_0,M_0\)이고,
프라임 기호가 적분 함수에 붙을 때는 **\(\eta\) 미분**이다.

\[
 T_0V=\frac{D\eta V_\eta+XV_X}{L},\qquad
 Z_0V=\frac{dV_\eta-2\eta XV_X}{L},
\]
\[
 \Omega=T_0V+V\left(V_X-\frac{V}{2X}\right)
       +UZ_0V-2XV_{XX}. \tag{2}
\]

평가하려는 두 양은

\[
 \mathcal P=\int\frac{\Omega}{2X}\,dX,\qquad
 \mathcal F=\int\frac{\Omega}{2}\,dX. \tag{3}
\]

N4의 actual pressure debt에는 \(-\mathcal P\), flux debt에는
\(+\mathcal F\)가 들어간다. 이 부호와 Ω 안의 항을 바꾸면 안 된다.

참고 source 파일 SHA-256:

| 파일 | SHA-256 |
| --- | --- |
| 원전 PDF | `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f` |
| `mathscope-m1/navier/followup-20261010-symbolic-gluing/ONE_PROFILE_SPECIFICATION.md` | `38d8a88220094cf2e6b2571f214f38361783669b646c0c08eb206eb2b9100bdd` |
| 같은 폴더의 `C12_FREQUENCY_CONTRACT.md` | `1740353222f1a5ca727c2c8a2c7063bba8a990f9a4393754256d5c82f49f7a16` |
| `mathscope-m1/navier/followup-20261010-same-datum-axis/GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md` | `f27e8d640e9b8e49805c0128c987f043d5667c298b2029dd061b820ae9e3117b` |
| `mathscope-m2/navier/source-profile-data.mjs` | `df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a` |

## 2. 고정된 유한 구간에서의 정확한 환원

먼저 \([a,b]\), \(0<a<b\)가 \(\eta\)와 무관하다고 하자. 원문의
누적 모멘트 \(I,J,S\)와 혼동하지 않도록 다음 보조 적분에는 장식 문자를 쓴다.

\[
 \mathcal J_p=\int_a^b X^pV\,dX,\qquad
 \mathcal H_p=\int_a^b X^pUV\,dX,\qquad
 \mathcal K_p=\int_a^b X^pV^2\,dX.
\]

정확한 결과는

\[
 \boxed{
 \mathcal P_{[a,b]}=
 \frac{D\eta\mathcal J_{-1}'+d\mathcal H_{-1}'
              -2A\eta\mathcal H_{-1}}{2L}
 +\frac14\mathcal K_{-2}
 +\left[\frac{V}{2L}-\frac{\eta UV}{L}
              +\frac{V^2}{2X}-V_X\right]_a^b .} \tag{4}
\]

\[
 \boxed{
 \mathcal F_{[a,b]}=
 \frac{D\eta\mathcal J_0'-\mathcal J_0+d\mathcal H_0'
                 +2D\eta\mathcal H_0}{2L}
 -\frac14\mathcal K_{-1}
 +\left[\frac{XV}{2L}-\frac{\eta XUV}{L}
              +\frac{V^2}{2}-XV_X+V\right]_a^b .} \tag{5}
\]

따라서 outer tail 등 일부 구간만 잘라 계산할 때는 그 양 끝 경계항을
반드시 포함한다. 적분 끝점이 \(\eta\)에 의존한다면 이 식을 그대로
사용할 수 없고, \(\mathcal J_p',\mathcal H_p'\)에 Leibniz 경계항을
추가해야 한다. 현재 source의 고정 joining/support 끝점에는 이 문제가 없다.

### 유도

식 (1)을 사용하여, \(p=-1,0\) 각각에 대해

\[
 \begin{aligned}
 \int_a^b X^p UZ_0V\,dX
 &=\frac dL\mathcal H_p'
   +\frac{2\eta(p+D)}L\mathcal H_p
   +\int_a^b X^pVV_X\,dX
   -\frac{2\eta}L[X^{p+1}UV]_a^b.
 \end{aligned} \tag{6}
\]

이는 \(U_\eta V\) 항을 버리는 계산이 아니다. \(-dU_\eta+2\eta XU_X
=LV_X-2A\eta U\)를 대입하여 두 번째 \(VV_X\)를 얻는다.
원래 식 (2)의 \(VV_X\)와 합친 뒤 부분적분하면

\[
 \int_a^b X^p\left(2VV_X-\frac{V^2}{2X}\right)dX
 =[X^pV^2]_a^b-(p+\tfrac12)\mathcal K_{p-1}. \tag{7}
\]

시간 미분 부분은

\[
 \int_a^b X^pT_0V\,dX
 =\frac{D\eta\mathcal J_p'-(p+1)\mathcal J_p}{L}
  +[X^{p+1}V/L]_a^b. \tag{8}
\]

방사 점성 부분은 \(p=-1\)에서 \(-2[V_X]_a^b\),
\(p=0\)에서 \(-2[XV_X-V]_a^b\)이다. 이 결과들을 합치고 2로 나누면
(4), (5)가 나온다. 이 유도에는 샘플 격자나 근사 미분이 없다.

## 3. 전역 적분과 실제 축 경계항

actual source에는 \(V=Xv\)인 매끄러운 축 확장이 있고, 모든 axial
support 이후에는 \(U=M=V=0\)이다. \(X_v\)를 그 지지 바깥의 고정
끝점으로 잡으면 \(V_X(X_v)=0\)도 성립한다. 따라서

\[
 \boxed{
 \mathcal P=
 \frac{D\eta\mathcal J_{-1}'+d\mathcal H_{-1}'
             -2A\eta\mathcal H_{-1}}{2L}
 +\frac14\mathcal K_{-2}+V_X(0,\eta),} \tag{9}
\]

\[
 \boxed{
 \mathcal F=
 \frac{D\eta\mathcal J_0'-\mathcal J_0+d\mathcal H_0'
             +2D\eta\mathcal H_0}{2L}
 -\frac14\mathcal K_{-1}.} \tag{10}
\]

축에서 \(V=0\)이라는 사실은 \(V_X(0)=0\)을 뜻하지 않는다.
실제 accepted datum은 \(U(0,\eta)=4\eta+j_0\)이므로

\[
 \boxed{V_X(0,\eta)=
 \frac{2A\eta(4\eta+j_0)-4(1-\eta^2)}{L},
 \qquad V_X(0,0)=-4.} \tag{11}
\]

따라서 actual \(\mathcal P(0)\)에는 정확히 \(-4\)의 축 경계 기여가 있다.
\(\mathcal P\) 자체가 \(-4\)라는 주장은 아니다. 나머지 적분은 남는다.

축 구간에서 수치 나눗셈을 피하려면 \(v=V/X\)를 사용한다.
예를 들어 \(\mathcal J_{-1}=\int v\),
\(\mathcal H_{-1}=\int Uv\), \(\mathcal K_{-2}=\int v^2\)이다.
나머지 세 적분도 각각 \(Xv, XUv, Xv^2\)의 적분이므로 모두 축에서 정칙이다.

## 4. 기존 다섯 endpoint 모멘트만으로는 결정되지 않는다

원문 (4.15)의 다섯 양은

\[
 \int U,\quad \int H,\quad \int UH,\quad
 \int(U^2-E^2/2),\quad \int E^2/(2X),\qquad H=\sqrt{2X}E.
\]

다음은 이들 endpoint 값과 축/외부 경계가 같아도 (9), (10)이 달라질 수
있다는 매끄러운 실패 대조이다. 저장된 N3를 이 함수로 대체하지 않는다.

0이 아닌 \(\phi\in C_c^\infty(0,1)\)를 잡고

\[
 U_a(X,\eta)=\phi''(X-a),\qquad M_a(X,\eta)=\phi'(X-a)
\]

로 둔다. 이 perturbation은 \(\eta\)와 무관하다. 비교하는 두 평행이동
구간을 포함하는 곳에서 공통 \(E=c\sqrt{2X}\), \(c>0\)로 두고,
그 밖에서도 두 E를 동일하게 한다. 공통 E는 축에서 정칙이고, 바깥에서
충분히 빠르게 감쇠하는 매끄러운 양의 함수로 연장할 수 있다.

각 평행이동에 대해 \(\int U_a=0\), \(\int XU_a=0\),
\(\int U_a^2=\int(\phi'')^2\)가 성립한다. 따라서 위의 다섯 모멘트는
모두 같다. 특히 \(H=2cX\)이므로 \(\int HU_a=0\)이다.
필요하면 축 부근의 공통 profile을 추가하고 그 누적 M을 perturbation
전에 0으로 복구하여 공통 축 datum도 유지할 수 있다.

그런데 \(\eta=0\)에서는 \(V=0\)이어도
\(V_\eta=2(XU-DM)\)이므로

\[
 \Omega(X,0)=2U(XU-DM).
\]

따라서

\[
 \mathcal F_a=\int XU_a^2\,dX,
 \qquad
 \mathcal F_b-\mathcal F_a=(b-a)\int(\phi'')^2>0\quad(b>a), \tag{12}
\]

\[
 \mathcal P_a=\int(\phi'')^2
 -\frac D2\int_0^1\frac{\phi'(t)^2}{(a+t)^2}\,dt,
 \qquad
 \frac{d\mathcal P_a}{da}
 =D\int_0^1\frac{\phi'(t)^2}{(a+t)^3}\,dt>0. \tag{13}
\]

그러므로 다섯 모멘트가 외부 leading pressure/velocity/stress를 보존한다는
Lemma 4.4를, 내부 \(\Omega_0\) 적분도 같다는 명제로 확장할 수 없다.
N4의 새로운 pressure/flux debt는 다음 차수에서 실제로 계산하거나 정확히
포괄해야 한다. 이는 원문의 moment lemma와 모순되지 않는다.

같은 실패는 실제 Imean의 power-law E를 공통으로 유지하는 대조에서도
나타난다. \(w\in C_c^\infty(1,2)\)에 대해

\[
 m(x)=x^2w'(x)+(1-\lambda)xw(x),\qquad u(x)=m'(x)
\]

로 두면 \(\int u=\int x^{-\lambda}u=0\)이다. Imean 안에 완전히 포함되는
두 지지 구간에서 \(\delta U_a(X)=\tau a^{-1/2}u(X/a)\)를 비교하면
E, 원래 축 datum, 외부 U를 공통으로 유지하면서 다섯 endpoint 모멘트가 두 대조
사이에서 같다. 이때 H는 η-only 인자 곱하기 \(X^{-\lambda}\)이고,
\(\int\delta U_a^2\)는 a와 무관하다. 기존 Imean에서는 U=0, V=-mConst이므로
η=0에서 flux 차이는

\[
 \Delta\mathcal F_b-\Delta\mathcal F_a
 =\tau^2(b-a)\int_1^2 x\,u(x)^2\,dx\ne0.
\]

이것도 moment-only shortcut의 실패 대조이며, pinned N3를 수정하는 제안이 아니다.

## 5. 실제 C.12 주기 샘플링을 피하는 정량 경계

이 절에서 \(\mathcal R\)은 원문의 반지름 \(R=\sqrt{2X}\)가 아니라
accepted `C12EnvelopeR`이다. 같은 source의 값은

\[
 S=C^{100000},\qquad \mathcal R=e^{S^{256}},\qquad
 N_{\mathrm{rad}}=1+\lceil\mathcal R^{50}\rceil.
\]

이 주파수는 고정된 원래 정수로 유지한다. premodulation profile과
C.12 **및 I1 복구까지 모두 수행한** 최종 profile을 비교한다.
`C12_FREQUENCY_CONTRACT.md` §§1–4와 accepted source binding은 다음을 준다.

\[
 \mathcal R\ge8192,\quad
 J=[x_-,x_+],\quad \mathcal R^{-1}\le x_-\le x_+\le\mathcal R,
\]
\[
 |U|_3,|M|_3\le\mathcal R,\quad
 |\Delta U|_2,|\Delta M|_2\le\epsilon:=\mathcal R^{22}/N_{\mathrm{rad}}<1.
 \tag{14}
\]

여기서 \(|f|_k=\sum_{j=0}^k\sup|\partial_\eta^j f|/j!\)이다.
2차 ordinary derivative에는 \(2\epsilon\)를 사용해야 한다.
실제 source 끝점은
\(x_-=(4/\Lambda)e^{t_1/16}\), \(x_+=16X_{0,I1}\)이다.
이 절에서는 긴 outer tail의 끝점 \(X_v\le\mathcal R\)를 가정하지 않는다.

I1 복구 이후에는 첫 모멘트 M도 정확히 복구되어 있다. 따라서
\(\Delta U,\Delta M,\Delta V\)와 그 \(\eta\) 미분은 J 밖에서 0이다.
경계 근방의 field도 같으므로 (4), (5)의 경계항 차이는 0이다.
I1 복구를 빼고 modulation만 비교하면 이 전역 지지 주장을 사용할 수 없다.

### 값과 미분의 직접 상계

\(0<h\le1/100\), \(|\eta|\le1\)에서 \(L^{-1}<2\),
\(|(L^{-1})_\eta|<1\)이다. 식 (1) 전의 V 공식과 그 한 번의 η 미분으로

\[
 |V|,|V_\eta|\le32\mathcal R^2
 \quad\hbox{(before와 after 모두)},
\]
\[
 |\Delta V|,|\Delta V_\eta|\le32\mathcal R\epsilon,
\]
\[
 |\Delta(UV)|,|\Delta(UV)_\eta|\le128\mathcal R^2\epsilon,
 \quad |\Delta(V^2)|\le2048\mathcal R^3\epsilon. \tag{15}
\]

예를 들어 V의 분자를 W라고 하면 after profile에서
\(|W|\le4\mathcal R^2+4\mathcal R\le5\mathcal R^2\),
\(|W_\eta|\le8\mathcal R^2+12\mathcal R\le9\mathcal R^2\)이다.
분자 차이는 각각 \(3\mathcal R\epsilon\),
\(5\mathcal R\epsilon\)로 상계된다. 이는 \(U_X\)나 \(N_{\mathrm{rad}}\)
개의 위상 구간을 평가하지 않는다.

J의 길이 \(\le\mathcal R\)와 \(X^{-1}\le\mathcal R\)를 넣으면

\[
 |\Delta\mathcal P|
 \le(16\mathcal R^3+384\mathcal R^4+512\mathcal R^6)\epsilon
 <\mathcal R^7\epsilon,
\]
\[
 |\Delta\mathcal F|
 \le(48\mathcal R^2+256\mathcal R^3+512\mathcal R^5)\epsilon
 <\mathcal R^6\epsilon. \tag{16}
\]

따라서 두 양에 공통으로 안전한 경계는

\[
 \boxed{|\Delta\mathcal P|,|\Delta\mathcal F|
 <\mathcal R^{30}/N_{\mathrm{rad}}
 <\mathcal R^{-20}\le2^{-260}.} \tag{17}
\]

실제 pre-C12 적분에 (17)의 대칭 오차 구간을 더하면 **최종 같은 N3의
실제 적분**을 포괄한다. 이는 주기 평균으로 바꾸는 연산이 아니며, 두
적분이 정확히 pre-C12 값과 같다는 주장도 아니다. 원래 N을 변경하지 않는다.

### 경계의 제한

- (17)은 적분 **값**에 대해 전 \(\eta\)에서 균일한 결과이다.
  \(\partial_\eta^m(\mathcal P,\mathcal F)\)에는 U/M의 \(m+2\) jets와
  그 차수의 C.12/I1 perturbation 경계가 추가로 필요하다.
- 현재 Cη² 결과를 모든 η 미분이나 다음 차수 source 인증으로 확대하지 않는다.
- 이 환원은 Ω에 특별히 적용된다. C.12의 field 변화가 작더라도 방사
  shear 변화는 O(1)일 수 있으므로, N5 위상/편극/공분산에 pre-C12 field를
  대입하는 근거가 되지 않는다.
- source R의 실제 binding이 없는 일반 oracle 입력은 (17)을 얻지 못한다.

## 6. 실제 interval producer에 필요한 입력

실행 가능한 producer는 최소한 다음 연쇄를 갖춰야 한다.

1. 같은 A.21 압력과 Bρ tail에 결속된 actual nonlinear core를 평가하고,
   B.22/B.26/B.34 continuation을 source cutoff와 함께 포괄한다.
2. actual incoming integral로 B.8의 같은 연속 root를 선택하고, 필요한
   η jets와 root/적분 오차를 보존한다. 예시 입력의 root나 임의 debt를 쓰지 않는다.
3. pre-C12 U와 prefix M을 η 2차까지 포괄한다. (9), (10)을 사용하면
   weighted Ω 값에는 전역 U_X/U_XX 평가가 필요 없다.
4. 원점에서는 v=V/X의 정칙 식을 사용한다. 나머지 고정 radial 구간은
   실제 interval quadrature 또는 source derivative가 뒷받침하는 적분
   포괄로 계산한다. η 미분을 유한차분으로 바꾸지 않는다.
5. pre-C12 결과에 (17)을 더한다. 이것으로 값의 인증된 범위를 얻어도,
   N4의 cutoff inner \(F_1,U_1\) 적분과 correction 계수까지 자동 완료되지는 않는다.

원문의 함수 정의 자체가 없다는 문제와, 그 정의를 실행하는 임의 η의
source-bound producer가 아직 없다는 문제를 구별해야 한다. 기존
`controlled-continuation.mjs`, `source-inner-gluing.mjs`,
`source-radial-modulation-bounded-cache.mjs`의 illustrative finite 입력을
actual accepted source evaluator로 표시할 수 없다.

## 7. 독립 exact 검사

외부 symbolic algebra 패키지 없이 Python `fractions.Fraction` 다항식으로
M, U, V, Vη, VX, VXX를 구성하여 원래 식 (2)를 직접 적분했다. 별도로
(9), (10)의 보조 적분과 경계항을 조립했다. 모든 비교는 정확히 0이었다.

검사 함수는
\(M=X(1-X)^5(1+\eta X+\eta^2X^2)\), \(U=M_X\), \(0\le X\le1\)이다.
1 바깥으로 0 연장할 때 필요한 미분과 경계항은 정칙하다. 실제 N3 입력의
수치 평가라는 주장이 아니라 환원 연산자의 독립 대조이다.

| p | h | η | 직접 \(\int_0^1 X^p\Omega\,dX\) | 환원식과 차이 | 축 항 누락 시 차이 |
| --- | --- | --- | --- | --- | --- |
| −1 | 1/10 | 1/3 | 3007783105/3453401952 | 0 | 9/11 |
| 0 | 1/10 | 1/3 | 554532947/17267009760 | 0 | 0 |
| −1 | 1/20 | 0 | 1577/25740 | 0 | 0 |
| 0 | 1/20 | 0 | 148/9009 | 0 | 0 |
| −1 | 1/50 | −2/5 | −5497648974913/7191676321830 | 0 | −520/621 |
| 0 | 1/50 | −2/5 | −5957923861/2397225440610 | 0 | 0 |

표는 2P, 2F이므로 축 항 누락의 차이도 \(2V_X(0)\)이다.

같은 세 (h,η)와 p=-1,0을 고정된 부분구간 [1/4,3/4]에서도 직접 적분했다.
(4), (5)의 경계항을 포함한 6개 비교가 모두 exact equality를 보였고,
경계항을 누락한 6개 대조는 모두 실패했다. 총 12개 직접 Ω/환원 비교이다.

또한 (15), (16)의 9개 정수 흡수를 \(\mathcal R=8192\)에서 exact integer
연산으로 검사했다. 각 식을 가장 큰 우변의 거듭제곱으로 나눈 좌변은
R에 대해 감소하므로 이 검사는 모든 \(\mathcal R\ge8192\)를 포괄한다.

평행이동 대조의 재현 가능한 유리수 예로
\(\phi(t)=t^6(1-t)^6\) on [0,1]을 사용하면

\[
 \int\phi''=\int t\phi''=0,\qquad
 \int(\phi'')^2=10/323323,
\]
\[
 \mathcal F_{a=2}=25/323323,\quad
 \mathcal F_{a=3}=5/46189,\quad
 \Delta\mathcal F=10/323323>0.
\]

이 다항식의 0 연장은 Ω identity 검사를 위한 충분한 유한 정칙성을 갖는다.
§4의 완전 C∞ 반례는 별도의 C∞ bump를 사용하며 같은 증명을 따른다.

## 8. 남은 원문 여섯 항목의 구체적 의존관계

| 원문 항목 | 이번 환원 뒤에도 필요한 실제 계산/증명 |
| --- | --- |
| N4-03 | 원래 공통 collar와 η strip의 actual six-component Picard partial sum/오차 포괄. 후속 차수는 앞 차수의 전역 모멘트 복구 후에만 생성. 작은 양의 관측 반경을 늘리는 것으로 전체 collar를 대신하지 않음. |
| N4-04 | pre-C12 U/M 및 weighted Ω 함수의 실제 포괄, cutoff된 actual inner F1/U1의 다섯 적분, 정확한 source bump inverse와 전체 복구. η 함수/필요 미분을 재구성하여 다음 source에 전달. C.12 주기 전수 샘플링은 §5로 피할 수 있음. |
| N4-05 | 실제 복구된 계수열과 stress를 R+div(T)에 대입하고 C(N,m), K(m)를 산출. 배경 차수 변화, 정밀도 변화, 격자 변화의 독립 추적. 큰 상수의 기호 이름만 출력하는 것으로 잔차 검증을 대신하지 않음. |
| N5-04 | Imean 밖까지 포함하는 실제 slow box별 background/shear, 고정 label의 phase와 projected frame, nonzero denominator와 lower bounds. §5의 작은 field 오차는 shear의 작은 오차를 뜻하지 않음. |
| N5-05 | 원문의 양의 왼쪽 datum으로 실제 projected ODE/energy/constraint를 검증하고 midpoint 및 양 끝 Gaussian 조건을 평가. reference log envelope만으로 실제 amplitude 적분 완료를 표시하지 않음. |
| N5-06 | 실제 T0,*와 두 실제 amplitude family의 Hcov 적분 및 오차, Haar Jacobian과 angular 1/2, 양의 역계수와 determinant lower bound, 한 번씩의 전역 slow-box 합산. |

이들 의존관계는 새 사용자 파라미터의 부재가 아니다. 같은 원문 recipe의
실제 실행 및 정량 포괄이 남아 있는 것이다. 이번 환원은 그중 Ω 적분의
고주파 방사 미분/주기 샘플링 부담을 제거하지만, 여섯 원문 완료기준을
국소 관측이나 정의식 출력으로 축소하지 않는다.

## 9. 새 outer-tail compiler의 읽기 검토

`actual-global-source-outer.mjs` 초안에 대해 원문식의 정규화/부호/지지를
별도로 읽기 검토했다. initial/entry/interpolation의 r integrating factor,
pressure-neutral angular quadratic의 작은 root, steep/hold/flatten 이후
A.13 wait, pulse M/J 두 행의 XR/P/f 지수, 에너지의 양의 amplitude root,
20 log-unit mean 구간과 t=log(X/Xp)의 Ω 변환에서 누락 항을 찾지 못했다.

설명상 구별할 양이 있다. `totalOuterEnergy`는 amplitude를 선택하는
literal A.2 reference의 ideal prefix와 outer E-energy이다. 실제 inner gluing
이후의 전체 E² 적분 자체로 부르면 안 된다. B.8가 보존하는 것은
S=∫(U²−E²/2)이며 U²와 E²의 적분은 각각 바뀔 수 있다. compiler의
amplitude 식은 두 ideal prefix를 함께 사용하므로 이 점에서 일관된다.
이 구별을 구현 담당자에게 직접 전달했다.

이 검토는 함수식 compiler의 검사이다. complete actual global U의
실행이나 outer-tail interval quadrature 완료를 인증한 것이 아니다.
