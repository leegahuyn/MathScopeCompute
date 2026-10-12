# 실제 공분산의 1차 slow 미분

이 추가 모듈은 `actual-pulse-sensitivity.mjs`가 생성한 원본 pulse의 1차 변분을 사용한다. 기존 M2 64개 판정이나 봉인된 원본 모듈을 변경하지 않는다.

## 실제로 구성하는 식

원본의 두 sign 각각에 대해 `theta`, `z`, `mass` 적분을 그대로 미분한다.

\[
H_j=h_{\rm Haar}\int_0^{L_s}\psi(v)^2t_r(v)t_j(v)\,dv,
\qquad j\in\{\theta,z,r\}.
\]

고정된 label에서 ordinary slow 좌표 `R`, `Z`, `T` 중 하나를 미분한다. 원본의 Haar 계수에는 angular `1/2`, 직사각형 Jacobian, longitudinal scale, transverse cutoff 질량이 모두 남는다. 실제 그래프에서 prefactor, cutoff, 양 끝점의 미분을 계산하여 고정됨을 확인한다. 일반 미분 kernel은 이 값들이 움직이는 경우의 모든 경계항도 보존한다.

\[
\partial_a(\psi^2t_rt_j)
=2\psi\psi_a t_rt_j+\psi^2((t_r)_a t_j+t_r(t_j)_a).
\]

`actual-covariance-source-target.mjs`와 같은 완성된 leading stress를 별도 sensitivity 그래프에 구성한다. 실제 `I,J,S,Cp`, 축 압력, `W`, angular/axial shear를 보존하며 `s^(-A-1/2)*T0(X,eta)`를 미분한다. 기존 builder는 다른 그래프에 append하므로 그 root ID를 직접 재사용하지 않는다.

공분산 inverse의 도함수는 다음 식이다.

\[
y=H^{-1}T,\qquad
y_a=H^{-1}(T_a-H_a y).
\]

`H_a`와 `T_a`는 보존된 몸체에서 미분한다. 호출자가 행렬 도함수, 상수 또는 invertibility 주장을 입력할 수 없다. 값 항등식, 미분한 방정식, inverse 식의 직접 미분과의 일치를 정확 유리함수 계산으로 검사한다.

## 수렴하는 절대 잔여항

증강 Volterra 계에서 `Kbar=K+Ka`, `I=||initial_augmented||`, `L=Ls`라 두고

\[
W=I e^{\overline K L},\qquad
E_N=I e^{\overline K L}\frac{(\overline K L)^{N+1}}{(N+1)!}
\]

를 사용한다. 실제 moving basis의 원본 상계 `B=||B(v)||`, `Ba=||partial_a B(v)||`에 대해 공분산 도함수의 절대오차는

\[
4h_{\rm Haar}B(B+Ba)W E_N
\int_0^L\psi(v)^2P(v)^2\,dv
\]

이하이다. 두 미분 곱 각각에 정확값과 유한값의 차이 두 항을 적용한 결과이다. 원본 envelope `P`를 적분에 보존한다. 별도로 `P(mid)=1`, 원본 `lambda-dref`의 midpoint 전후 부호와 `0<=psi<=1`에서 이 적분이 `L` 이하임을 사용한 더 거친 상계도 제공한다. 모든 원본 매개변수를 고정하면 factorial tail은 0으로 수렴하며 고정된 오차 바닥이 없다.

이 결과는 실제 source 함수와 유한 적분의 **식 및 절대 상계**이다. 전체 원본의 부동소수점 적분값을 계산했다는 의미가 아니다. `terms:0`도 정확한 극한과 같다고 표시하지 않는다.

## 지원 범위와 inverse의 조건

- 현재 source adapter는 선행 pulse adapter와 동일하게 `ellExact:"1"`, `terms:0`, ordinary 1차 slow 좌표 `R/Z/T`만 수락한다.
- `ell=1`이 원본의 인증된 `ellMinimum` 이상이라는 주장은 하지 않는다.
- inverse 미분식의 정의역은 `det(H)!=0`이다. 유리함수 항등식의 통과는 이 조건의 증명이 아니다.
- 실행한 band의 `y_plus,y_minus>0`를 인증하지 않으며 이 모듈은 inverse weight의 square root를 구성하지 않는다.
- 2차 slow 미분, 실제 전체 curl, 전역 물리 NS 잔차와 flat-error, 새로운 Lean kernel 증명은 이 모듈의 완료 범위가 아니다.

## API

```js
const prepared = prepareActualCovarianceSensitivityProgram({
  ellExact: '1', slowCoordinate: 'R', derivativeOrder: 1, terms: 0
});
assertActualCovarianceSensitivityProgram(prepared);
```

이미 인증된 pulse graph를 만든 호출자는 `attachActualCovarianceSensitivity(pulsePrepared)`로 같은 그래프에 추가할 수 있다. `actualCovarianceSensitivityCertificate(input)`는 전체 그래프의 hash와 compact receipt를 반환한다.

소형 독립 검사는 `tests/actual-covariance-sensitivity-kernel.test.mjs`에 있다. 원본 소스 검사는 `tests/actual-covariance-sensitivity-source.test.mjs`이며 큰 소스 작업과 동시에 실행하지 않는다. 이 검사는 원본을 한 번 생성하고, 새 target이 기존 target builder와 dummy 변수의 이름을 제외하고 같은 식인지 비교한다.
