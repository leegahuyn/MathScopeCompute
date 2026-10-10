# 실제 공분산 가중치가 들어간 국소 전체 curl

`actual-full-curl.mjs`는 같은 원래 source의 두 부호, phase, 실제 Volterra 해, 공분산 적분과 전체 leading target을 사용한다. 적용 범위는 하나의 고정 band·slow box와 열린 양의 가중치 영역이다. 이 식의 생성만으로 표시한 `ell=1`의 양성이나 모든 label의 전역 조립을 인증하지 않는다.

## 원래 파동과 전체 미분

원래 실제 파동의 진폭을

\[
a=\sqrt\varepsilon\,\sqrt y\,\chi(\xi)\psi(v)t,
\qquad y=H^{-1}T,
\qquad t=P B w
\]

로 보존한다. 두 부호 각각의 `H`와 원래 pressure·두 shear 항을 포함한 `T`를 미분하며

\[
y_i=H^{-1}(T_i-H_i y),\qquad
(\sqrt y)_i=\frac{y_i}{2\sqrt y}
\]

를 연결한다. 후자는 `y>0`에서만 사용한다. `sqrt(epsilon)`는 frozen slow scalar이지만 물리적 진폭과 공분산 정규화에 필요하므로 제거하지 않는다.

공분산 행렬 `H`와 구분하여 scalar phase speed를 `S_phi=pF+p_zG`로 쓰면, 원래 위상에서 직접 계산한 normal은

\[
n=(x_0-v\partial_R S_\phi,\ p/R,\ p_z-\varepsilon v\partial_Z S_\phi)
\]

이고, `n=(D_r phase, (partial_theta phase)/R, D_z phase)`가 같은 retained body인지 검사한다. 진폭과 potential coefficient의 theta 독립성도 확인한다. 원래 moving frame의 `n·B=0`은 `n_tan^2`로 분모를 없앤 두 열의 항등식과, 실제 `nt=sqrt(n_theta^2+n_z^2)>0` 정의로 확인한다. 삼중곱 검사는 leading curl이 원래 tangent amplitude와 일치함을 보존한다.

\[
C=\frac{n\times a}{k|n|^2},\qquad
A=iC e^{ik\,phase},
\]

\[
\operatorname{curl} A=
\left[-k\,n\times C
+i\begin{pmatrix}
-D_zC_\theta\\
D_zC_r-D_rC_z\\
D_rC_\theta+C_\theta/R
\end{pmatrix}\right]e^{ik\,phase}.
\]

위 식은 정규화된 evaluated curl이다. 아래 물리 배율을 적용하여 실제 field의 curl과 연결한다. 평가한 연산자는 원래 source geometry에서

\[
D_r=\partial_R+M_i d_r R^{d_r-1}\partial_\xi,
\qquad D_z=\varepsilon\partial_Z
\]

를 사용한다. `d_r=2(1+h)rho_g-h/100000`와 원래 palette의 `M_i`를 보존한다. 원래 auxiliary basis의 직교성으로 `D_r v=D_z v=0`이지만 transverse cutoff의 `chi_xi` 항은 남는다. 원통 기저의 `C_theta/R`도 남는다. 물리적 potential과 velocity 배율은 각각 `Q^(1/2-A)`와 `Q^(-A)`이다.

## 발산 검사와 Lean의 역할

직접 미분한 복소 발산식의 실수·허수 부분을 모두 그래프에 남긴다. 별도로 다음 원래 body 항등식을 확인한다.

- frozen carrier의 R/Z 미분은 0이다.
- `D_r n_theta=-n_theta/R`, `D_z n_theta=0`이다.
- `D_r n_z=D_z n_r`, `D_z(1/R)=0`이다.
- 실제 potential coefficient의 `D_r D_z C_theta=D_z D_r C_theta`이다.

이 조건은 새 Lean의 `MathScope.M2.Navier.full_cylindrical_curl_divergence`가 요구하는 명시적 대수 전제다. Lean은 그 보편 대수 정리를 실제로 검사했다. 실제 source의 해석학적 정의역을 Lean 객체로 모두 인스턴스화한 증명은 이 adapter에 포함되지 않는다. 따라서 UI의 조건부 발산값 `[0,0]` 옆에 `domainMembershipCertified:false`를 표시한다.

원래 자동 미분 표현에는 고정된 rounded carrier를 미분한 `smooth_piecewise(...,0,0,0)`가 남을 수 있다. 세 branch가 정확히 같은 식이면 그 piecewise 함수와 해당 식은 모든 점에서 같다. 새 identity checker는 이 항등식만 새 식에 적용하고 적용한 원래 root·세 branch·결과를 기록한다. 원래 그래프는 수정하지 않으며, 어느 한 branch라도 다르면 지우지 않는다. 수치적으로 작다는 이유로 0을 넣지 않는다.

## 실행과 검증

```js
await actualFullCurlCertificate({ellExact: '1', terms: 0});
```

공개 M2 요청 종류는 `ns.actual-full-curl`이다. `EXACT_CONSTRUCTIVE`를 사용하며, 수치 precision bits를 요청하면 해당 수치 기능이 미지원임을 명시적으로 반환한다.

독립 연산 검사는 작은 다항식 계수에서 정확한 복소 발산, 원통 항 생략 음성 대조, transverse chain 생략 대조, 별도의 Cartesian 유한차분, frozen carrier의 정확한 zero branch와 활성 branch를 확인한다. 실제 source 검사는 원래 두 파동과 sqrt(epsilon), 공분산·target·제곱근 미분, phase·frame·혼합 미분 전제, private seal, 재구성 가능한 compiler hash를 확인한다.

실행 결과는 `evidence/differential-extension-20261011/`에 보관한다. 첫 실제 source 실행에서는 원래 zero piecewise 표현을 opaque indeterminate로 취급한 identity checker가 phase mixed-gradient를 거부했다. 그 실패 기록을 보존하고, 정확히 같은 branch만 축약하는 검증 규칙과 활성 branch 음성 대조를 추가했다. 최종 성공 여부는 최종 `full-curl-source.tap`과 release 검증 기록을 따른다.

## 남은 M2 연결

엄밀한 수치 도함수 구간, 사용하려는 member의 양의 covariance 영역, 모든 slow partition·auxiliary map·label의 전역 결합, 실제 background/stress의 물리적 잔차·flat-error 및 다음 보정 단계의 오차 계약은 별도 완료 조건이다. 특히 `u=curl A`에 대한 점성 잔차의 `Delta u`는 potential의 공간 3차 미분 또는 이에 동등한 실제 source 재작성과 오차 정리를 요구한다. 이번 2차 slow jet과 국소 curl만으로 이 요구를 대신하지 않는다.

원문과의 정확한 순서는 [M2_COMPLETION_GATE_KO.md](M2_COMPLETION_GATE_KO.md)에 기록한다. 그 추가 M2 관문이 닫히기 전에는 M3를 시작했다고 표시하지 않는다.
