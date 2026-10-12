# 원래 전역 압력 곱합과 Ω 원시함수의 연결

이 문서는 `actual-global-pressure-convolution.mjs`의 추가 검증을 설명한다.
기존 계수, cutoff 선택, 압력, source 표현식과 앞서 봉인한 packet은
수정하지 않는다. 최종 실행 번호와 해시는 같은 evidence 디렉터리의
`validation.json`이 생성된 뒤 그 파일을 기준으로 읽는다.

## 대상과 완료 판정의 경계

여기서 다루는 계수는 원래 `prepareActualOrderInduction`이 만드는
실제 전역 (F_n,U_n,M_n,v_n,Pi_n)이다. (v_n=V_n/X)는 원래의
축 정칙 대표식이고, (X=R^2/2)이다. heat, B8, C12, I1, I2,
실제 Ipos 연속 행렬과 모든 하위 계수가 그대로 피연산자에 남는다.

증명 대상은 양의 차수의 원래 압력식

\[
 \partial_X\Pi_n
 =\sum_{i+j=n}F_iF_j-\frac12\mathcal O_{n-1},
 \qquad \mathcal O_k=\Omega_k/X
\]

이다. `pressureDerivative`는 이 감사가 새로 정의한 도함수가 아니라,
원래 coefficient constructor가 원시함수와 별도로 생성한 식이다.
앞선 positive-primitives packet은 (n\ge2)에서

\[
 \partial_X\Pi_n=\text{original pressureDerivative}_n
\]

까지 증명했고, 전역 곱합과의 차이를 원래 AST로 보존했다. 새 모듈은
그 차이를 수동으로 0으로 바꾸지 않는다. 실제 source에 결속한 두
대표식 동일성을 적용한 다음 독립적으로 만든 전역 곱합과 유리식
검사를 수행한다. 앞선 packet의 `identified:false`와 n1 pressure의
`pass:false`는 그 당시 범위 기록으로 그대로 남는다.

전체 GN4, 전역 물리 잔차의 flat-error 정리, 모든 label의 curl 합,
수치 원시함수 평가, 새 Lean kernel 증명 또는 M3 착수를 판정하지 않는다.

## 1. Leading field의 실제 제한

전역 (F_0)를 특정 구간의 단순 대표식으로 쓸 수 있으려면, 실제
전체 source와 그 대표식이 같다는 검사가 먼저 필요하다.

첫째, natural 구간 (0\le X\le X_a)와 B26 collar

\[
 X_a\le X\le a^2=X_a\exp(t_1/16)
\]

에서 실제 전역 (F_0,U_0,v_0)의 branch를 원래 endpoint 순서에 따라
선택하고, 실제 inner system의 세 함수와 본문 동일성을 검사한다.
`actual_expression_partial`의 본문과 실제 미분을 사용하며, 원래
적분의 integrand나 누적 상수를 버리지 않는다.

둘째, Ipos에서는 원래 전체 (F_0)가 reservedPower stage의
양의 제곱근 밀도를 (\sqrt{2X})로 나눈 식임을 검증한다. 원래

\[
 y_0=T+2+60B_{\rm outer}-14,
 \quad R_b=\sqrt{2X_{0,\rm Ipos}},
 \quad p=-2-2\lambda
\]

를 유지하면 그 값은 정확히

\[
 F_0(X,\eta)=e_f(\eta)R^p
\]

이다. 실제 stage 시작 진폭과 Ipos 진폭의 지수 차이를 별도로
유리식으로 검사하고, 양의 실수에서의 log 곱 법칙을 적용한다.
`lambda=0` 치환과 (1/R)의 누락은 독립 음성 검사에서 실패한다.

구간 순서는 거대한 좌표를 부동소수점으로 계산해 비교하지 않는다.
고정 parameter 표현식, 원래 stage의 양의 길이, 실제 offset

\[
 -25,\;-20,\;-14
\]

및 폭 5를 사용한다. Ipos는 C12/I1/I2의 끝보다 뒤에 있고,
reservedPower의 끝보다 앞에 있으며, heat의 변화는 아직 시작하지 않는다.

## 2. Positive cutoff tuple의 전 구간 연결

원래 inner source가 하위 positive coefficient를 읽는 공통 구간은

\[
 [0,a^2]
\]

이다. 이 구간에는 (X_{\rm keep}<X<X_{\rm cut})의 실제 kappa
활성 구간도 포함된다. raw Picard 해를 이 전체 구간에 대입하면
원래 source가 바뀐다.

새 모듈은 local (F_n,U_n)의 실제 kappa 본문을 확인하고,
Ipos 보정이 공통 구간에서 0이라는 원래 support 사실을 사용한다.
local average도 원래 literal 적분

\[
 A_n^{\rm local}(X,\eta)
 =\int_0^1 U_n^{\rm local}(tX,\eta)\,dt
\]

임을 검사한다. 앞선 실제 질량 정리 (M_{n,X}=U_n), 원래 zero
axis datum, 그리고 (s=tX)의 변수변환으로 전역 평균과 같음을
얻는다. 특히 (X_{\rm cut}<X<a^2)에서도

\[
 M_n(X)=\int_0^{X_{\rm cut}}U_n^{\rm local}(s)\,ds
\]

는 일반적으로 0이 아니다. 원래 local (v_n)에 필요한 이 누적
질량을 그대로 보존한다. 두 실제 (v_n) 본문은 같은

\[
 v_n=\frac{2\eta U_n-2\eta(D+2nh)A_n-d\partial_\eta A_n}{L}
\]

를 사용한다. 따라서 값과 모든 고정 미분 차수의 jet가 공통
구간에서 일치한다. 축에서는 원래 정칙 평균의 연속 확장을 사용한다.

## 3. Ω의 실제 대표식과 모든 압력 곱항

`buildActualOmegaCoefficientOverX`는 매번 모든 실제 (U_i,v_i)를
받아 원래 (5.6)의 동일한 유한 미분 다항식을 생성한다. 시간,
반경 점성, 모든 quadratic pair, 그리고 (k>0)의 이전 차수
축 점성 항을 보존한다. 필요한 profile 미분은 이 단계에서 2차다.

원래 Ω의 core branch는 위에서 확인한 실제 cutoff-local tuple을
사용한다. 중간 branch는 동일한 전역 tuple의 Ω다. 바깥 branch가
0인 이유는 실제 (U_i,v_i)가 moment로 닫힌 원래 zero branch에
도달하고 모든 고정 jet가 사라지기 때문이다. compact integrand만으로
그 원시함수를 0으로 만들지 않는다.

한편 원래 별도 `F0Fn`은 local support와 Ipos support에서 만든
split이다. 1절의 제한과 원래 (F_n=F_n^{\rm local}+\delta F_n)의
본문을 결속하면 전 구간에서 실제 (F_0F_n)과 같다. 이 두
동일성만을 원래 `pressureDerivative`에 적용한다.

그 뒤

\[
 2F_0F_n+\sum_{1\le i,j<n\atop i+j=n}F_iF_j
 =\sum_{0\le i,j\le n\atop i+j=n}F_iF_j
\]

를 exact BigInt rational polynomial 검사로 확인한다. n별 중간
항의 수와 실제 전체 ordered pair 목록을 기록한다. leading 항 하나나
중간 항 하나를 누락한 독립 fixture는 실패한다.

## 4. 원래 n1 Ω prefix의 FTC와 축 상수

원래 source의 (P_\Omega)는 다음 네 literal prefix를 포함한다.

\[
 J_\eta=\int_0^X v_{0,\eta},\quad
 H_\eta=\int_0^X\partial_\eta(U_0v_0),\quad
 H=\int_0^X U_0v_0,\quad K=\int_0^X v_0^2.
\]

각 적분은 원래 expression graph에서 endpoint density로 찾아낸다.
피연산자 순서로 이름을 추측하지 않는다. 실제 fixed lower endpoint,
bound variable와 본문에 대한 free-coordinate 검사, 원래 AD 미분,
literal-zero reduction, 실제 endpoint density 동일성을 모두 기록한다.

원래 경계항을 그대로 쓰면

\[
 P_\Omega=
 \frac{D\eta J_\eta+dH_\eta-2A\eta H}{2L}+\frac K4
 +\frac{Xv_0}{2L}-\frac{\eta XU_0v_0}{L}
 +\frac{Xv_0^2}{2}-v_0-Xv_{0,X}+v_0(0).
\]

실제 source의 AD를 네 FTC와 연결하여

\[
 \partial_XP_\Omega-\frac12\mathcal O_0
 =\frac{v_0}{2L}
 \big[L(v_0+Xv_{0,X})+dU_{0,\eta}
       -2A\eta U_0-2\eta XU_{0,X}\big]
\]

를 실행 검사한다. 대괄호가 0인 근거는 별도의 실제
`actual-leading-stream-primitive.mjs`의 private source proof다.
같은 전역 (M_0,U_0,v_0)에 대해 (M_{0,X}=U_0)와 원래 stream
재구성이 이미 결속되어 있다. source상의 대괄호 AST는 원래대로
남으며 사용자가 보낸 `true`나 잔차를 0으로 정한 정의를 사용하지 않는다.

축에서는 확인된 실제 natural branch를 (X=0)에 대입하여

\[
 v_0(0,\eta)=\frac{2A\eta U_*-4d}{L}
            =\text{actualGlobalAxisVX}
\]

를 별도로 검사한다. 모든 prefix의 두 endpoint가 일치하고,
X가 곱해진 경계항은 정칙성으로 사라진다. 따라서 원래

\[
 P_\Omega(0)=0
\]

이며 0으로 나누는 표현식을 평가하지 않는다.

## 5. Xv whole history와 Pi1의 모든 join

위 네 prefix의 상한을 원래 (X_v)로 바꾼 완전한 적분을,
원래 `weightedOmega`의 네 대응 적분과 각각 대조한다. 실제 전역

\[
 P_\Omega(X_v)=\text{original pressureOmega}
\]

는 이 전 구간 적분과 실제 (v_0,v_{0,X}=0) 경계값에서 나온다.
따라서 원래 constant closure는 같은 값과 모든 고정 derivative jet를
갖는다. 원래 적분값을 수치 표본이나 0으로 바꾸지 않는다.

이후 Pi1의 본문을 원래 local pressure prefix, 실제 angular bump
세 개의 부분 적분, 그리고 방금 확인한 closed (P_\Omega)와
대조한다. 각 bump는

\[
 R=\sqrt{2X},\quad u=R/R_b,\quad dX=R\,dR
\]

의 Jacobian을 포함하며, 완전한 적분은 원래 연속 행렬
`Emat[1][j]`와 같다. 원래 세 번째 moment의 상수는

\[
 \mathrm{incoming}_2=\mathrm{localMoment}_2-\mathrm{pressureOmega}.
\]

따라서 원래 beta solution의 완전한 보정과 더하면 정확히 0이다.
마지막 constant의 모양과 그 moment cancellation을 따로 검사한다.

검토하는 join은 axis, Xkeep, Xcut, 세 bump의 endpoint, Xv,
Xplus다. Xkeep에서는 같은 도함수와 zero axis datum으로 실제
Picard pressure와 원래 전역 primitive가 같아진다. 그 뒤의 join은
실제 complete integral의 동일성과 원래 flat cutoff를 사용한다.
Xplus에서는 모든 density가 앞서 끝나고 세 번째 moment가 남은
상수를 0으로 만들어 원래 zero branch와 일치한다.

## API와 범위

```js
const p = prepareActualGlobalPressureConvolution({
  sourceProfile, order: 2, maxNodes: 2_000_000,
  maxDerivativeOrder: 128
}, context);
assertActualGlobalPressureConvolution(p);
const certificate = await actualGlobalPressureConvolutionCertificate(p);
```

이미 같은 source를 생성했다면
`attachActualGlobalPressureConvolution(primitives, stream, context)`를
사용한다. 두 입력의 private seal, 원래 constructor 객체의 동일성,
공통 copied source prefix와 함수 본문을 대조한다. M0 감사와
induction 감사가 별도 append-only graph에서 만든 새 node ID는
서로 교환하지 않는다.

알고리즘은 임의의 유한 generated prefix에 같은 coefficient 재귀를
적용한다. 실제 실행한 차수와 유한 자원 예산은 evidence에 별도로
기록한다. 모든 n을 숫자로 생성했다는 주장은 없다. 이 모듈은
기존 selector나 runtime source를 바꾸지 않는다.

양의 실수 log와 반경 연산은 그 원래 구간 (X>0)에서 사용한다.
축의 식은 natural/even 정칙 대표식과 연속 극한으로 따로 처리한다.
원래 (L>0), Ipos 연속 행렬의 가역성 등은 기존 private source
구성의 조건이다. 공분산 가중치의 양성을 가정하지 않는다.

## 남는 실제 수학 의무

이 packet으로 전역 압력 계수의 radial identity가 결속되더라도,
angular/axial stress의 전체 conservative moment와 모든 접합을
각각 실제 재귀에 연결해야 한다. 그 뒤 실제 강화 cutoff가 적용된
무한 배경, 모든 고정 미분 차수의 물리 잔차, flat-error 경계와
전체 primary-wave sum을 결합해야 한다. 이 의무들은 여기의
PASS와 합쳐서 완료된 것으로 표시하지 않는다.

## 실제 실행과 보존된 실패 기록

최종 kernel attempt 6은 5/5 PASS, 관측 exit 0이다. 최종 실제
source attempt 4는 원래 constructor를 한 번 실행해 n1/n2를 만들었고,
9/9 PASS, 관측 exit 0이다. 13.084초, peak RSS 1,367,908,352 bytes,
Node heap 예산 3072 MiB, timeout 150초였다. 원래 35개 import는
실행 전후 SHA가 같았다.

고정 compiler graph는 121,160개 node, canonical 4,818,267 bytes이며
SHA-256은 다음과 같다.

```
f83156b902489fc544e9ad1f9badde1fe9da4453aad4b1b9b9b389fd70e93a64
```

scope를 위조하거나 private proof를 복제해 입력하면 거부하는 검사,
추가 node가 생겨도 이미 발급한 graph SHA가 바뀌지 않는 검사도
포함된다. 정밀 수치 적분, 전체 무한 계수 생성 또는 Lean 실행을
이 테스트 수에 포함하지 않는다.

source attempt 1은 가져온 heat Xtail과 같은 식의 다른 결합 순서를
유리식 leaf로 비교한 보조 검사 때문에 실패했다. 실제 식을 바꾸지
않고 정확한 본문 재결합 비교를 사용한 attempt 2가 제한 4/4를,
attempt 3이 실제 전역 곱합 6/6을 통과했다. 이 두 중간 PASS는
당시 n1 Ω/압력 원시함수가 미완료였다는 scope를 그대로 보존한다.

kernel attempt 2–4의 실패는 “literal 적분을 통과하지 않는 rewrite”
음성 fixture가 원래 compiler에서 상수·다항식 적분으로 먼저 계산된
것을 literal 적분이라고 기대한 테스트 구성 오류였다. 최종 fixture는
실제 `definite_integral` operation을 먼저 확인하고 그 본문 보존을
검사한다. 각 실패의 TAP, resource receipt와 당시 source snapshot을
삭제하거나 덮어쓰지 않았다.
