# 원래 양의 선택·미분 스케일 수치 구간의 독립 검토

검토자: `/root/sensitivity_kernel`  
검토일: 2026-10-11 UTC  
방식: 읽기 검토, 원래 producer와 식 대조, 현재 파일의 실행 manifest SHA 대조. 실제 family/물리점 생성기를 새로 실행하지 않았다.

## 1. 결론과 증거의 구분

새 generic 기하 kernel과 같은 private 물리점에 붙이는 adapter의 수학식에서 구체적 오류를 찾지 못했다. 원래 selector의 상계를 원래 selector의 값과 동일시하지 않고, 원래 floor 상관을 먼저 처리하며, 완전한 양의 source 인자를 보존한다. 아래 §6의 **독립 child seal 누락은 남아 있다.** 현 통합 parent는 child가 추가한 모든 node까지 전체 prefix로 봉인하므로 그 parent 경로에서만 이 누락이 보완됨을 확인했다.

`positive-scale-kernel.json`은 27/27 경량 검사, 관측 종료 코드 0, 0.7273163795471191초를 기록한다. 11개 manifest 항목의 현재 SHA가 모두 일치했다. 여기에 physical 42개 방향·성분의 원래 유한 통제식을 직접 계산한 비교가 포함된다. 이는 새 adapter의 실제 private source 실행 결과가 아니다.

`conditional-scale-shape-smoke.json`은 실제 저장된 270행의 서로 다른 recipe 156개와 기본 스케일을 포함한 192개 보고가 PASS이고 errors가 빈 배열임을 기록한다. 그러나 **이 검사는 `ell=ellMinimum+12`, `sigmaIntegral=1/3`을 가정한 산술 형태 검사**다. 그 파일도 `sourceAuthenticated:false`, `originalEllNumericallyEnclosedHere:false`를 명시한다. 원래 첫 selector가 그 가정값과 같다는 증거로 사용하지 않는다. 실제 held source의 attachment는 이 문서 작성 시점에 별도 실행 중이다.

| 고정 코드 | SHA-256 |
|---|---|
| actual-positive-geometric-scale-kernel.mjs | `19186b57fd40ec5461af6e51c7b6e1eb2827567ed31210770d0ae727a7807c07` |
| actual-common-positive-scale-enclosure.mjs | `976ea24af119800e55fc348257ff180a7ab70d0dfdad80ad6dc6f345a758be20` |
| actual-numerical-exponential-arithmetic.mjs | `30262671984e587f659de63e96a7bb9ab0132b4ec029772d25362ed3b7444a94` |
| actual-closed-parameter-arithmetic.mjs | `738988121f7d526e74d029776ab2774ba1c35b7f082d2872ade70fcaace9a198` |
| actual-selection-arithmetic-enclosure-kernel.mjs | `247f8515b4db41106f4f96cdae72eb48ac9b661c64cef824876b434d867d2fca` |
| actual-original-a13-numerical-enclosure.mjs | `3a0e21b958e073dbbe904b2bac10689c310a10681bd3b3adbfc31d4632493fe2` |

실행 receipt SHA는 `d8cd08354a1cb39af6b9b81106f912c17fa59725366599784f5becbef9f553db`, 로그 SHA는 `661c07c3859a803cde173ac98ef8f3b98f7d597f5757b43779109a176f962f85`다. 조건부 shape receipt SHA는 `9b448036d55b91c02fb05ae6ddb65bd5733053de755730c8d102adbddfa7cbc9`다.

## 2. 원래 첫 selector와 A.13

원래 `commonRecursiveSelector`의 첫 행은 historical 항, log 2, `(ellMinimum+10) log 2`, 여덟 실제 requiredLog의 max다. `ellMinimum>=8`이므로 작은 band 항이 log 2를 지배한다. 여덟 실제 requiredLog 각각의 별도 상계를 max에 넣으면 원래 log scale의 상계를 얻는다. 원래 `ellA=ceil((log 4+log b1)/log 2)`와 ellMinimum의 정수성으로 `ellA>=ellMinimum+12`다. 새 lower/upper 구성은 이 부등식과 일치하며 원래 b1을 다시 선택하지 않는다.

A.13 audit는 원래 세 적분의 피적분함수, 독립 적분 변수, 두 끝점, sigma primitive와 Qb/Qp/wait의 전체 식을 결속한다. `h`를 새로 계산한 같은 양의 pinned profile 구간과 비교한다. 원래 sigma의 대칭과 단조성으로 다음 구간이 정당하다.

| 적분 | 닫힌 상계에 사용하는 포함 구간 |
|---|---|
| steep integral | `[1/4,3]` |
| flatten integral | `[1/4,3/2]` |
| complete terminal Qp | `[rho,54 rho]`, `rho=h/256>0` |

마지막 식의 변수 치환에는 `rho/(1-rho)`와 `exp((1-h)(1+2t))`가 모두 남는다. 적분을 0 또는 h=0의 극한으로 대체하지 않는다. 이 넓은 포함 구간을 높은 원래값 상대 정확도로 설명해서도 안 된다.

## 3. palette·주파수·기하 인자

원래 식은 `ci=Tg^floor(a)*Q^(1+h)`, `a=((1+h)ell log 2-2 log ell)/log Tg`다. floor를 독립적인 구간으로 넓힌 뒤 지수끼리 곱하지 않고, 먼저 정확히 `floor(a)-a`를 사용하면

\[
\frac1{T_g S}<c_i\le\frac1S,\qquad
2r_0S\le L_s<2r_0T_gS
\]

를 얻는다. `S=ell^2`, `r0=2^-34`, `Tg=4+sqrt(2)` 및 원래 Haar `J=(Dgeom/2)ci*transverseMass`를 대조했다. 모든 방향의 물리 Q 인자도 원래 body와 맞다.

`k=ceil(epsilon^-1/2)`와 `0<epsilon<1`에서 `1<=epsilon*k^2<4`다. 따라서 Bs의 양의 두 끝점은 원래 k에 관한 부등식에서 얻는다. k를 1 또는 반올림 전 값으로 바꾸는 것이 아니다. 특히 `Bs*u`를 먼저 정리하여 `sqrt(lambda0/(12u))`와 `sqrt(lambda0/u)`로 덮는 확대는 `1+u^-2<2`와 `4*2^(3/2)<12`로 정당하다.

새점의 `profileRadius=sqrt(2Xsharp)`와 `Rsharp=sqrt(Tsharp)*profileRadius`를 원래 chart와 대조했다. T 구간 `[15/16,17/16]`은 coarse라고 별도 표시한다. 원래 bump 입력은 mesh offset의 절댓값이 9/16보다 작으므로 최소 3/8이고, `sigma(3/8)>exp(-5)/2>1/512`다. 세 translate의 제곱합의 제곱근은 2보다 작다. band factor는 1이므로 `eta_beta>2^-30`이 성립한다. 이 원래값을 정밀 평가했다고 주장하지 않는다.

## 4. 공통 양의 인자를 먼저 결합하는 계산

원래 mass와 weighted amplitude 정규화는

\[
m=\frac{r_0^2}{(gL_s)^{1/2}},\qquad
A_0=\frac{\tau^{1/2}g^{1/4}L_s^{1/4}}{r_0}
\]

다. 이에 따라 weighted first slow의 g/L 지수는 `(3/4,3/4)`, second slow는 `(5/4,5/4)`, v는 `(3/4,-1/4)`, vv는 `(5/4,-3/4)`, mixed slow-v는 `(5/4,1/4)`가 된다. H의 n차 정규화는 `D*r0^2*(gLs)^(n-1/2)`, y는 `tau/r0^2*(gLs)^(n+1/2)`다. 소스의 정확한 recipe와 이 지수들을 대조했다.

physical 행에서는 원래 `Bs=sqrt(2F gamma)*u^(-3/2)/((k sqrt(epsilon))*(1+u^-2)^(3/4))`와 `Ac=gamma*u*sqrt(1+u^-2)`를 쓴다. 원래 pTilde 정의로부터

\[
\Omega_t=\frac{R B_s u}{2L_s(1+\gamma^2)},\qquad
\Omega_\theta=\frac{B_su}{2L_sF(1+\gamma^2)}
\]

다. n개의 k와 n개의 Bs 안의 k를 소거한 뒤 남는 Q 지수의 절댓값은

\[
\frac{1+n_{\rm spatial}+2n_t}{2}
+h\frac{1+n+2n_t}{2}.
\]

여기서 spatial은 r, z, theta를 센다. k를 포함한 원래 source root는 그대로 남으며 수치 상계를 계산하는 등식에서만 공통 인자를 결합한다. 실제 rounded carrier가 미분계수에서 삭제된 것도 아니다.

`m=n_t+n_theta`, `d_theta`를 성분이 theta이면 1, 아니면 0이라 하면 남는 유한 인자는

\[
2^{n/2-m}(1+u^{-2})^{-3n/4+d_\theta/2}
(1+\gamma^2)^{-m}
\]

다. n=1,2와 원래 `u>1`, `0<gamma<1`에서 코드의 `[2^(-n-2m),2^(n+d_theta-m)]`는 안전한 확대다. u, gamma, F, R의 나머지 quarter-power 지수도 독립 재계산과 일치한다.

초안에서 half-integer 계수를 `q('1.5')`로 넣는 실행 오류를 찾아 보고했다. 현재 고정 파일은 정확한 `q('3/2')` 형식으로 만들며, 시간·각도·혼합·공간 Hessian을 모두 포함한 42개 유한 통제 비교가 이 수정 뒤 통과한 기록을 읽었다.

## 5. 같은 source의 행 및 정확도의 의미

adapter는 target, upperProof, bodies, family와 p 객체가 같은 실행의 같은 private 물리점인지 확인한다. 원래 dyadic/palette/Haar 정의, 원래 소스 target의 모든 root, 여덟 requiredLog, 270개의 positiveExactScale recipe를 원래 G에 결속한다. H의 네 성분은 theta 행 두 열 다음 z 행 두 열의 순서이며, 양성 weights, sqrt weights, determinant의 양의 스케일과도 일치한다.

출력 끝점에는 수치 유리수와 exp/neg만 허용한다. `reportInterval`이 실제로 검사하는 정확도는 각 행에 적힌 **반복 로그 좌표의 폭**이다. 이것을 원래값의 상대 오차나 절대 폭으로 바꾸어 읽어서는 안 된다. 특히 T와 eta_beta는 별도 coarse 양의 구간이다. 이들이 들어간 매우 큰 스케일도 요청한 반복 로그 좌표의 폭을 만족하는지 따로 검사한다.

228행 중 slow R이 들어간 행의 원래 body 값은 `Rsharp^r * ordinaryDerivative(atPoint)`인 `normalizedDirectionDerivative`다. physical 42행은 `physicalValue`다. 양의 스케일을 곱해 복원되는 quantity는 이 원래 행의 정의를 따라야 하며, Rsharp 인자를 추가로 나누지 않은 값을 보통 R 편미분이라고 표시하면 안 된다.

## 6. 독립 child seal 누락과 통합 parent의 보완

최종 standalone adapter의 `ownedRoots`는 namedRoots와 270 normalizer root만 수집한다. 그런데 absolute determinant 보고를 위해 추가하는 `G.mul(scaledDeterminant,Ac,u,massScale^2)`는 새 root가 될 수 있고 그 목록에서 빠진다. 작은 `ActualSourceExpressions` 검사에서도 이 재구성은 기존 determinant와 같은 ID로 단순화되지 않고 새 node가 생겼다. 따라서 **standalone child assertion만으로 이 추가 node의 변경까지 검출한다고 주장할 수 없다.** 이 누락은 작성자와 parent에 전달했으며 실행 중인 고정 파일은 수정하지 않았다.

통합 `actual-physical-center-full-jet-enclosure.mjs`의 SHA는 `d14130ddbf8273cc43da1f8897da0b9c052f0cb0076e29bcbfe9bd034ea5110f`다. 이 파일을 직접 읽어 positive scale attachment가 끝난 뒤 전체 `G.nodes`를 canonical snapshot으로 저장하고, certificate/assert에서 그 전체 prefix를 다시 비교함을 확인했다. 따라서 이 **통합 parent 경로는 새 determinant node도 포함한다.** standalone child의 한계를 통합 parent의 전체 봉인과 구분해 사용해야 한다.

이 문서는 source 실행의 성공을 앞당겨 선언하지 않는다. 실제 원래 selector 구간, 실제 270개 normalizer 결과, 최종 graph SHA와 종료 코드는 현재 진행 중인 별도 실행의 결과로 확인해야 한다. 전체 label의 수치 평가, unscaled 상대 오차, 전역 잔차 수치값, 새 전체 Lean instance 또는 M2/M3 전환을 이 검토만으로 승인하지 않는다.
