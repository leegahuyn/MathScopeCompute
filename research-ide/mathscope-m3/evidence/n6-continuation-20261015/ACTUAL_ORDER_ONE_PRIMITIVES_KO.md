# 실제 1차 압력 원시함수의 상수와 전 차수 접합

이 증명은 원본 `ActualFinalOrderOnePressure`의 본문 50558을 대상으로 한다.
`actual_order_one_primitive_probe.mjs`는 원본 생성자를 그대로 실행하여
F1/U1/v1/M1/평균/Pi1의 여섯 본문 ID, 원래 Picard0와 I1 정의, 완전한
선행 stream 이력 및 실제 다섯 moment 방정식을 재결속한다.
`actual_order_one_primitives.py`는 아래의 정확한 미분 항등식을 별도로
검산한다. 전체 선행 U0/M0/v0의 매끄러움이 조합되기 전에는 결과를
**그 선행 해석 정리에 조건부인 실제 원시함수 결론**으로 표시한다.
원본 Guard/Jet/PDE 소거 수는 여전히 0이다.

## 사용자가 제공한 논문과의 직접 대응

직접 읽은 `navier-stokes.pdf`는 166쪽이며 SHA-256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다.
이는 실제 고정 source의 `sourcePaperSHA256`과 같다. 이 절의 쪽수는
PDF 쪽수이며 인쇄 쪽수와 일치한다.

* 26쪽 (4.7): 선행 질량의 실제 원시함수와 발산 영 조건.
* 46쪽 (5.2), (5.5), (5.6): 양의 차수 평균, 압력 방정식 및 Omega.
* 47–49쪽 Lemma 5.1: 실제 내부 Picard 해의 축 정칙성과 parity.
* 51쪽 (5.15): 같은 축 상수를 가진 진짜 전방 원시함수.
* 52쪽 (5.16), Lemma 5.2 Step 3: 유한 크기 moment의 연속 행렬 해와
  외부의 압력 영점 접합.

여기서는 논문의 명제를 완료 표지로 가져오지 않는다. 원본 코드의
원시함수가 그 식의 같은 적분·상수·분모인지 확인하고 미분한다.

## 1. 실제 선행 질량이 주는 연속 방정식

U=U0, M=M0, v=V0/X라 쓰고 A+D=1을 유지한다. 원본은 X>0에서

```
v=(2ηU−2DηM/X−dMη/X)/L.
```

이다. 실제 M_X=U를 대입하여 미분하면 정확히

```
C := L(v+XvX)+dUη−2AηU−2ηXUX = 0.                 (1)
```

이는 PDF 26쪽 (4.7)의 미분형이다. `attachActualLeadingStreamPrimitive`
라는 원본의 독립 감사는 자연 평균, B.26 전체 이력, B.34·복원 구간,
B.8 첫 실제 방정식, C.12의 원래 N log X와 양의 로그 Jacobian,
I1 첫 실제 방정식, 외부 pulse의 두 실제 affine moment를 검산한다.
새 probe는 이 감사를 실제 Pi1과 **동일한 그래프**에 실행한다.
적분의 support가 compact라는 이유로 원시함수를 0으로 두지 않는다.

## 2. 원본에 저장된 완전한 Omega 원시함수

J(X)=int_0^X v, H(X)=int_0^X Uv, K(X)=int_0^X v²라 하자. 원본에
실제로 저장된 압력용 prefix는 다음 식이다.

```
P(X) = [Dη Jη+d Hη−2Aη H]/(2L)+K/4
     + Xv/(2L)−ηXUv/L+Xv²/2−v−XvX+v_axis.       (2)
```

세 원시 이력과 boundary의 모든 항이 필요하다. 원본 (5.6)을 V0=Xv로
나누어 쓰면

```
Omega0/X = [Dηvη+v+XvX]/L + v(v/2+XvX)
           +U[dvη−2η(v+XvX)]/L−2(2vX+XvXX).
```

FTC, 곱 미분, 고정 η에서의 X 미분을 생략 없이 적용한 결과는

```
P_X−Omega0/(2X) = v*C/(2L).                      (3)
```

SymPy 검사는 (3)과 (1)을 독립 indeterminate 함수 U,v,M에 대해
정확히 0으로 환원한다. 이는 유한 미분 값의 수치 표본 검사가 아니다.
원본의 실제 stream이 (1)을 만족하면 P_X=Omega0/(2X)이다.

축 상수도 별도 조건이다. 원본 Ustar=4η+j이고

```
v_axis=(2Aη Ustar−4d)/L.
```

자연 평균의 축 값은 Ustar이고 그 η 미분은 4이므로 이 값은 실제
v(0,η)와 같다. (2)의 세 적분은 축에서 0이고 나머지 X 인자는 0으로
가며, −v+v_axis도 0이다. 따라서 P(0)=0이다. probe는 실제 저장된
축 상수를 원래 식에 결속하고 η=0에서 −4임도 정확히 확인한다.
축 상수를 없애도 (3)의 미분은 같을 수 있으므로 이를 미분 항등식만으로
승인하지 않는다.

U와 v가 끝나는 원래 Xv를 지나면 (2)의 boundary는 0이다. 세 적분의
끝점을 Xv로 바꾼 나머지는 원본 `pressureOmega`의 문자 그대로 같은
완전 이력이다. 그러므로 실제 `closedPressurePrefix`의 마지막 분기
`pressureOmega`는 원시함수의 올바른 상수이며 0으로 대체할 수 없다.

## 3. 원본 Pi1의 세 분기

원본은 Xkeep 전까지 실제 Picard even-profile의 성분 3을 사용한다.
그 압력 행은 정확히

```
Pi_xi=4xi F0 F1−xi*(Omega0/X),  X=xi².
```

이다. 따라서 Pi_X=2F0F1−Omega0/(2X)이고 축 값은 0이다. 같은
Picard U/K 행은 `xi*K_xi=−2K−xi*U_xi`여서
`d_X[X(U+K)]=U`를 준다. 원본의 실제 zero datum과 parity 정리가
이 식을 축까지 연속 확장한다.

중간 분기는 실제 2F0*잘린F1의 원시함수, **세 개 모두의** 실제 연속
방사형 bump 원시함수, 그리고 −P를 더한 식이다. probe는 alpha 이름이
다른 적분까지 실제 본문과 비교한다. R=sqrt(2X), u=R/Rbase에서
du/dX=1/(Rbase*R)를 유지한다. 따라서 각 압력 bump를 미분하면
원본에 저장된 F0pos*dF 항이 나온다. Rbase>0,u>0에서의 보통 실수
로그 항등식 R^p=Rbase^p*u^p를 사용하며 λ는 양의 원본 그대로이다.

Xkeep의 양쪽은 같은 축 값 0에서 같은 실제 core 밀도를 적분한다.
여기서 a²=Xa*exp(t1/16)이고 loopILeft=Xa*exp(t1/8)이므로 실제
전역 선행 U/v는 이 공통 collar에서 내부 natural/B.26 값과 같다.
Ipos의 far bump는 이 collar에서 0이다. 따라서 원시 상수도 같고
모든 혼합 경계 jet이 일치한다. Xcut과 각 bump 끝점에서는 flat cutoff와
같은 완전 연속 적분이 부분 적분의 끝값이므로 모든 차수로 접합한다.

Xplus 전에 실제 U0/v0와 양의 차수 F1/U1의 support는 이미 끝난다.
그러므로 압력 밀도도 그 앞의 열린 collar에서 0이다. 실제 세 번째
moment 방정식은

```
(localPressureTotal−pressureOmega)
 +2*ef*Rbase^(-2−2λ)*sum_j beta_j*Emat[1][j] = 0.
```

이다. probe는 원본 cofactor 연속 역행렬과 원본 incoming moments로
이 정확한 식 및 다섯 moment 모두를 실행한다. 따라서 마지막 압력
분기 0의 **값**이 증명되고, 열린 collar의 미분도 모두 0이다. 단순한
compact-integrand 추론이나 미지의 압력 상수를 0으로 두는 규칙이 아니다.

## 4. 조합 범위와 남은 해석 전제

실제 Picard0 정상 수렴·parity 영수증, 위 실제 본문 결속과 대수 계산,
실제 전역 선행 U0/M0/v0의 C∞ 및 모든 원래 접합, 원래 양의 λ/Kpos와
연속 Ipos 행렬의 비특이성을 함께 쓰면 원본 여섯 order-one profile은
X>=0, η∈[-1,1]에서 모든 고정 혼합 미분을 갖는다. η 끝점은 안쪽
미분이고 축은 한쪽 미분이다. 어떤 고차 미분의 작은 수치 상계를
가정하지 않는다. moment 입력은 유한하기만 하면 된다.

전역 선행 영수증을 생략하면 이 전제는 명시적 조건으로 남는다.
`--leading ACTUAL_COMPLETED_LEADING_DOMAINS.json`을 주면 조합기는 그
영수증이 이 probe의 정확한 `stream-binding` SHA-256을 소비했는지,
실제 U/M/V/v/Xv root들이 같은지, 안쪽 η 영역의 C∞와 한쪽 끝점 jets 및
실제 support를 증명했는지 검사한 뒤 여섯 profile의 전 차수 접합을
조합한다. source probe는 그 영수증을 입력으로 받지 않으므로 순환이 없다.
또한
원본 F0pos와 완전 leading F0의 Ipos 일치, 전체 물리 압력 방정식,
전체 J와 covariance/Volterra 및 모든 원본 Jet/PDE의 검사는 이 결과와
별도로 남는다. 특히 이 결과의 PASS를 원본 의무 소거로 세지 않는다.

## 5. 실제 Ipos 연속 행렬의 독립 비특이성

새 probe는 Umat 네 적분과 Emat 아홉 적분, 실제 다섯 bump support,
Rbase와 ef의 양의 원본 식을 재구성한다. 이 13개 연속 적분을 근삿값이나
행렬 주석으로 대체하지 않는다. 각 bump는 원래 폭 1/2048의 sigma-prime
정규화이고 양의 단위 질량을 가진다. 중심 3/2,2,5/2,3,7/2와 반폭
1/4096 때문에 support들은 (1,4) 안에서 엄격히 순서가 정해진다.

실제 Umat의 두 점 열은 `(x,x*w_lambda(x))`이고
`w_lambda(x)=int_0^log(x) exp(-2lambda*s) ds`이다. 두 점의 determinant는
`x1*x2*(w_lambda(x2)-w_lambda(x1))`이다. 그 미분
`w_lambda_prime=x^(-1-2lambda)>0` 때문에 두 support에서 항상 양수다.

Emat의 세 점 열은 `(x²,x^(-2-2lambda),x^(-2lambda))`이다. 각 열에서
양수 `x^(-2-2lambda)`를 빼고 t=x²로 두면 `(t^(2+lambda),1,t)`이다.
실제 λ>0에서 두 번째 미분은 `(1+lambda)*(2+lambda)*t^lambda>0`이다.
따라서 세 순서점의 Vandermonde와 양의 두 번째 divided difference가
고정된 0 아닌 부호를 준다. determinant의 다중선형성으로 이 식들을
양의 bump 측도의 곱에 대해 적분하면 **실제 연속 행렬**의 determinant도
같은 엄격한 부호를 갖는다. λ를 0으로 두거나 부동소수점으로 평가하지 않는다.

원래 ef는 양의 Pstar, 양의 exp, 1/(1+η²), 양의 Rbase의 실수 거듭제곱의
곱이다. 따라서 실제 α/β는 유한하고 매끄러운 모든 moment 입력에 대해
같은 연속 역행렬로 존재한다. 이 부분은 debt의 크기나 λ의 수치 하한을
요구하지 않으며 Lemma 5.2 Step 2의 실제 원본 적용을 제공한다.
