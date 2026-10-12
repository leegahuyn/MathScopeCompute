# 원래 terminal pulse와 potential 계수의 3차 slow jet

이 확장은 원래의 작은 \(q\) terminal source에서 \(R,Z,T\)의 모든 3차 혼합미분을 구성한다. 원래 \(h>0\), 전체 Volterra 해, 공분산 적분, target, 역행렬, 양의 제곱근과 cutoff를 보존한다. 실제 생성·검증한 원본 프로그램의 실행 기록을 별도로 연결하며, 일반 대수 검사의 성공을 원본 source 실행의 성공으로 대신하지 않는다.

여기서 potential 계수는

\[
C=\eta_\beta\,
\frac{\sqrt{\epsilon}\sqrt{y}\,\chi(\xi)\psi(v)}
     {k|n|^2}\,(n\times t)
\]

인 실수 3차원 벡터다. 원래 복소 potential은 \(iC e^{ik\Phi}\)이다. 이 문서의 60개 root는 각 부호에 대해 \(C\)의 차수 0부터 3까지의 실수 성분을 센 것이다. 복소 harmonic의 추가 곱 규칙, \(\xi,v\)의 fast 미분, 물리 좌표 합성과 원통 기저 미분까지 완료했다는 뜻은 아니다.

## 1. 원본 결속과 적용 영역

입력으로 받는 값은 고정 source profile과 표시용 적분 항 개수 0 또는 1이다. caller가 행렬, 도함수, target, 양성 가정 또는 대표점을 제공하지 않는다. 원래 [actual-admissible-terminal-covariance.mjs](../../../actual-admissible-terminal-covariance.mjs)의 private constructor가 만든 \(\ell=\ell_{\min}+8\) member를 소비한다.

적용 영역은 원래 terminal open chart,

\[
X_+<X,X_{\rm rep}<X_b,\qquad
\tfrac12<s,s_{\rm rep}<2,\qquad
|\eta|,|\eta_{\rm rep}|<1,
\]

와 같은 slow box 조건의 교집합이다. 대표점, 반올림한 carrier, band와 mesh label은 한 번 정한 뒤 고정한다. 양의 공분산 weight는 이 영역에서 source에 결속된 기존 정량 결과를 소비한다. 본문에 따로 주어진 \(\ell=1\) pulse를 새로운 band의 pulse로 부르지 않는다.

\(\eta=\pm1\)의 원래 heat에는 안쪽에서의 유한 jet을 사용할 수 있으나, 이 3차 인증은 open chart로 제한한다. \(T<0\)의 heat 연장, outer/inner flat edge, 모든 label의 합은 여기서 인증하지 않는다.

배경은 기존 canonical \(c_n\) 정의다. 별도로 강화 중인 \(a_n\) 배경과 동일하다고 간주하지 않는다. terminal annulus에서는 원래 모든 양의 차수 항의 공통 zero exterior가 결속되어 있으므로, 미지의 active coefficient를 버려서 leading field로 바꾼 것이 아니다.

## 2. 40성분 pulse 계통

원래 각 부호의 pulse는

\[
\partial_v w=M(v,a)w,\qquad w(0,a)=(1,0),
\qquad a=(R,Z,T)
\]

이다. \(M\)은 원래 moving-normal pressure, damping과 moving-basis 식을 포함한다. 새 kernel이 각 \(M_\alpha=\partial_a^\alpha M\)를 이 보존된 본문에서 직접 생성한다.

| 전체 차수 | 다중지수 개수 | pulse 실수 성분 | potential 계수 실수 성분 |
|---|---:|---:|---:|
| 0 | 1 | 2 | 3 |
| 1 | 3 | 6 | 9 |
| 2 | 6 | 12 | 18 |
| 3 | 10 | 20 | 30 |
| 합계 | 20 | 40 | 60 |

각 다중지수의 식은

\[
\partial_v w_\alpha
=\sum_{\beta\le\alpha}
 {\alpha\choose\beta} M_{\alpha-\beta}w_\beta,
\qquad
w_\alpha(0)=\partial^\alpha(1,0).
\]

특히 반복 3차는

\[
\partial_v w_{iii}
=M w_{iii}+3M_iw_{ii}+3M_{ii}w_i+M_{iii}w.
\]

따라서 동일 방향에 필요한 계수 3과 혼합 다중지수의 계수 2가 유지된다. 원래 left endpoint가 정확히 0이고 datum이 상수라는 사실을 source root 및 자유좌표 검사로 확인한다. 일반 moving-left 3차 문제를 이 경우로 바꾸었다고 주장하지 않는다. 움직이는 평가 시각의 미분은 실제 ODE 우변으로 계산한다.

새 계통의 값 성분은 원래 covariance Volterra root와 private alias로 동일하게 결속된다. 원래 \(w\)를 별도 미분용 해로 바꾸거나 표시용 유한 합으로 대체하지 않는다. 복사한 객체에는 private source 권한이 없다.

## 3. 원래 도함수의 유한 FTC bound

각 실제 \(M_\alpha\) 및 \(B_\alpha\), \(|\alpha|\le3\), 의 각 성분 \(f\)에 대해

\[
U(f)(a)=\sqrt{1+f(0,a)^2}
 +\int_0^{L_s}\sqrt{1+(\partial_vf(v,a))^2}\,dv
\]

를 사용한다. 이는 \(0\le v\le L_s\)에서 \(|f(v,a)|\)를 지배한다. 실제 \(\partial_v f\) 본문도 생성한다. 이 적분을 sampling한 최대값이나 숫자로 바꾸지 않는다.

행렬의 induced infinity norm은 행별 \(U(f)\) 합의 최대값으로 제어한다. 40성분 행렬에는 실제 binomial 배수가 있으므로

\[
K_{\rm aug}
=\max_{|\alpha|\le3}
\sum_{\beta\le\alpha}{\alpha\choose\beta}
 K_{\alpha-\beta}
\]

를 사용한다. 차수가 높아져도 기존 2성분 행렬 norm을 그대로 적용하지 않는다.

원래 source 식은 open chart의 보호된 양의 분모를 보존한 smooth 식이며, 각 \(M_\alpha\)와 \(\partial_v M_\alpha\)는 slow 좌표와 \(v\)에 관해 국소적으로 연속이다. 따라서 compact slow 근방에서 이 FTC 식은 유한하고 국소적으로 유계다. 원래 \(L_s\)는 선택된 slow 좌표와 독립이다. 이 국소 유계성이 미분한 ordered Volterra 급수의 국소 균등수렴을 정당화한다. 모든 band와 label에 공통인 수치 \(C^4\) 또는 Gaussian/flat 상수를 제공하는 것은 아니다.

### 본문 공유와 메모리

첫 실제 실행에서는 계산 캐시 복제로 Node heap 한도에 걸렸다. 이 실패는 그대로 보존한다.

수정한 구현은 node, intern lookup, 함수 정의, source parameter, Volterra 정의와 private seal을 유지하면서 재생성 가능한 AD·치환·의존성 memoization만 비운다. 이 작업은 source 수식을 변경하지 않으며, source assertion과 hash는 그대로 검사한다.

또한 \(f(0)\)와 적분용 dummy 변수에의 치환은 본문이 완전히 지정된 shared call로 표현한다. 각 share의 value와 \(v\) 도함수가 실제 \(f,\partial_v f\) root로 materialize되는 것을 검사한다. 이는 원래 식의 반복 복사를 줄이는 표현 방식이며, 미분 oracle·미지의 norm·수치 적분을 도입하지 않는다. 작은 검사는 unfolded FTC와 shared FTC의 실제 본문·끝점 치환·time 도함수까지 대조한다.

## 4. 수렴식과 표시용 첫 적분항

증강 계통의 ordered 적분을 \(\mathcal V\), 증강 datum norm을 \(I_{\rm aug}\)라 하면 표시용 \(N\)항 식은

\[
W_N=\sum_{n=0}^N\mathcal V^n g_{\rm aug}.
\]

각 40개 성분에 공통인 잔여항은

\[
E_N=I_{\rm aug}\exp(K_{\rm aug}L_s)
\frac{(K_{\rm aug}L_s)^{N+1}}{(N+1)!}.
\]

이는 비가환 행렬의 시간 순서를 유지한 적분식이다. \(N=1\)은 첫 실제 ordered 적분항을 추가한 표시식이며, 원래 exact 해는 그 무한 극한이다. 표시식과 tail은 별개의 root이고, \(N=0\)도 별도 tail을 유지한다. 표시용 1항 자체가 정밀 수치값 또는 exact 해는 아니다.

원래 \(t=B(Pw)\)에서 \(P\)가 고정 slow 좌표에 독립임을 실제로 검사하므로

\[
t_\alpha=P\sum_{\beta\le\alpha}{\alpha\choose\beta}
B_\beta w_{\alpha-\beta}.
\]

각 성분의 tail은

\[
P\sum_{\beta\le\alpha}{\alpha\choose\beta}
\|B_\beta\|_\infty\,E_N
\]

이다. 이 식의 \(B\) 미분은 실제 moving frame의 미분이며 생략되지 않는다.

## 5. 전체 covariance·target·inverse·sqrt chain

각 원래 행렬 성분은

\[
H_{j,\sigma}
=h_{\rm Haar}\int_0^{L_s}\psi^2 t_r^\sigma t_j^\sigma\,dv.
\]

고정 끝점과 prefactor의 slow 독립성을 검사하고, 각 20개 다중지수에 대해 \(\partial^\alpha(\psi^2t_rt_j)\)의 전체 곱 규칙을 적분 안에 유지한다. 4개 행렬 성분에 대해 모두 80개 root가 해당 원래 적분과 결속된다.

원래 target \(T\), \(y=H^{-1}T\)를 그대로 두고

\[
H y_\alpha=T_\alpha
-\sum_{0<\beta\le\alpha}{\alpha\choose\beta}
H_\beta y_{\alpha-\beta}
\]

를 확인한다. 20개 다중지수와 두 성분에서 총 40개 식이다. 검사는 determinant의 공통 분모를 필요한 최대 차수로 한 번만 통분하고, 원래 determinant 본문을 exact polynomial로 전개한다. 분모를 새로운 독립 상수로 놓고 임의의 관계를 가정하지 않는다. 실제 source의 비영 determinant 영역은 별도의 authentic 양성 결과에 결속된다.

\(\sigma=\sqrt y>0\)의 각 nonzero 다중지수에는

\[
2\sigma\sigma_\alpha
=y_\alpha-
\sum_{0<\beta<\alpha}{\alpha\choose\beta}
\sigma_\beta\sigma_{\alpha-\beta}
\]

를 쓴다. 합에서 두 끝점 \(\beta=0,\alpha\)를 제외하며, 같은 mixed/repeated 다중지수의 중복은 binomial 계수로 계산한다. 두 weight에 대해 38개 nonzero jet 식을 검사한다.

대수 검사를 위한 share도 각 원래 \(H,T,y\)의 20개 도함수 본문으로 직접 materialize된다. generic algebra가 독자적으로 source 양성을 부여하지 않는다.

실행 당시 generic `retainedCommonDenominatorIdentity`에 기록된 `sourceFunctionsMaterializedToTheirBodies:true`는 이 helper 혼자서 analytic body를 전개했다는 뜻으로 해석해서는 안 된다. 이 helper는 이미 결속된 share를 대수적 원자로 취급해 공통 분모와 polynomial identity를 검사한다. 실제 본문 결속은 caller가 별도로 수행한 `retainedThirdBodyBinding`의 20개 `materialization === direct AD` 검사에 의존한다. 실제 source adapter에서 이 검사가 모두 통과했다. 이 책임 구분은 실행 당시 코드와 SHA를 보존한 메타데이터 해석 정정이며, 새로운 실행 결과나 추가 source 권한을 주장하지 않는다.

## 6. 원래 cutoff와 potential 계수

고정 mesh label은 원래 대표점의 slow 좌표 \(C_{\rm rep}\)에서

\[
a_j=\left\lfloor\ell^6 C_{{\rm rep},j}+\tfrac12\right\rfloor
\]

로 한 번 정한다. 원래 정규화된 band bump와 3개 mesh bump를 모두 포함한다. 원래 numerator의 support에서 대표점과 관찰점의 거리는 \(5\sqrt3/(4S^3)<4/S^3\)이므로 인증된 같은 box 조건과 일치한다. label을 이동시키면서 미분하지 않는다.

보존한 \(\sqrt\epsilon,\sqrt y,\chi,\psi,|n|^{-2},n\times t,\eta_\beta\)의 실제 본문으로 모든 \(C_\alpha\)를 생성한다. 원래 \(t\)의 곱 순서는 유지하고, 재배열된 곱 규칙은 별도 exact equality로 확인한다. \((\Phi_R,R^{-1}\Phi_\theta,\epsilon\Phi_Z)=n\)도 같은 그래프에서 확인한다.

원래 frozen carrier의 옛 AD에 남을 수 있는 모든 가지가 동일한 분기식은 동일성 검사에서만 정리한다. 예를 들어 세 가지가 모두 0인 식은 정확히 0이다. 원래 node를 수정하지 않으며, 사용한 branch equality를 기록한다. 이 정리 없이 실패하는 작은 원래-class fixture와 잘못된 \(\epsilon\) factor를 거부하는 대조를 포함한다.

## 7. 실행 기록과 남는 범위

검증은 generic kernel, authentic direct source 실행, 향후 worker/browser 실행을 구분한다. 이 추가 모듈은 기존 게시된 worker/bundle을 수정하지 않는다.

첫 source 실행의 V8 OOM은 [실패 runtime 기록](actual-terminal-potential-third-jets-source-attempt1-process-runtime.json)과 원래 log에 보존했다. 두 번째 실행은 cache 중복을 해결한 뒤 마지막 potential/phase 동일성 검사에서 종료 코드 1로 실패했으며, [별도 JSON](actual-terminal-potential-third-jets-source-attempt2.json)과 log에 보존했다. 중간 단계 생성 완료를 전체 source PASS로 부르지 않는다.

최종 [source attempt3](actual-terminal-potential-third-jets-source-attempt3.json)는 11개 runner 검사와 내부 13개 source 검사를 모두 통과했고, 프로세스 종료 코드 0을 직접 관측했다. 실행 시간은 43,001.87623 ms, peak RSS는 1,905,721,344 bytes였다. 선택한 같은 원본 프로그램에서 `terms:1` 표시식과 별도 잔여항을 생성했고, `terms:0`도 재생성 없이 같은 인증된 graph에서 확인했다. 둘 다 exact integral 표현이며 수치 quadrature 값은 아니다.

| 검증 층 | 실제 결과 | 범위 |
|---|---|---|
| 일반 kernel·대수 회귀 | [19/19 PASS, exit 0](third-jet-kernel-pre-source3-runtime.json) | 비가환 순서, 반복 계수, 실제 analytic fixture, omission 음성대조, moving endpoint, share materialization, cache 불변성 |
| Authentic direct source | [11/11 PASS, exit 0](actual-terminal-potential-third-jets-source-attempt3.json) | 원래 작은 \(q\) terminal member, 두 40성분 pulse, covariance 80개·inverse 40개·sqrt 38개 식, 부호별 \(C\) 60개 root |
| 독립 수학 읽기 검토 | [별도 검토](INDEPENDENT_TERMINAL_THIRD_JET_REVIEW_KO.md) | 식·범위·실행 기록·68개 import SHA를 대조; 새 Lean 증명 또는 추가 source 실행 아님 |
| Worker·browser | 실행 안 함 | 기존 공개 runtime/bundle은 이 모듈을 포함하지 않음 |

성공 graph는 363,295 nodes, canonical 15,756,568 bytes다. SHA256은 `e96bcba6819970cf60fc32613a753a70775ea7f44592ecdcf8c0129cc8c7f688`이다. 입력 SHA256은 `cc2537ef8f432302ecd5f40228f3392031ed2347a1380962e67573691247c621`, 당시 literal import 68개 manifest SHA256은 `54af4455efca90829554fcd457b6f938d7fa2c0a4f981ac73dd6912737bdffcd`이다. 모든 import 파일은 실행 후와 packet 고정 시점에 같은 bytes임을 확인했다. 재생성 가능한 캐시를 제거한 뒤에도 원래 source prefix 234,335개 node의 SHA256 `8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a`를 보존했다.

성공 기록, 앞선 두 실패, generic TAP/runtime, 실행한 모듈·검사 파일 및 이 문서의 SHA는 [고정 packet](terminal-third-jets-packet.json)에 함께 연결한다. 개발 중 실패를 설계된 음성대조 또는 성공한 source 실행으로 바꾸어 세지 않는다.

남는 범위는 복소 harmonic의 완전한 3차 product chain, \(\xi,v\)와 물리 좌표의 합성, 원통 기저를 포함한 속도 2차 미분, pressure의 필요한 공간·시간 도함수, 전체 NS residual, 모든 label의 수렴과 공통 flat-error bound이다. 이 결과만으로 전체 G-NUM, G-N5, 새 Lean kernel 증명 또는 M3 시작 gate를 통과시키지 않는다.
