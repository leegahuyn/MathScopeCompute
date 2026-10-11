# 안쪽 공분산 제곱근 경계의 독립 검토

검토자는 `/root`이다. 실제 inner source adapter, scalar/endpoint 대수와 최종 실행 진단을 읽었다. 이전 source 결과와 같은 원래 n1 Picard 배경, 실제 H, 원래 leading 응력의 factorization을 사용하는지 확인했다.

## 수학적 검토

`y=log(X/Xa)`와 `r=y/t1`를 사용한다. 실제 activation은 `(1-kappa0)*sigma_2(r)`이다. `g_a=(1-kappa0)/(exp(-1/r^2)+exp(-1/(1-r)^2))`의 매끄러운 regular 값과 `exp(-1/r^2)`를 분리한다. 내부 특이식에 y=0을 대입하지 않는다.

복사한 activation의 인수 순서가 달라질 때에는 **인수의 유리식 동일성을 먼저 증명하고 같은 함수·미분 차수의 congruence를 적용**한다. 증명하지 않은 두 opaque 함수를 같은 atom으로 선언하지 않는다. width와 함수의 미분 차수가 바뀐 경우를 거부하는 음성 대조도 유지한다.

원래 Ka 변환은 `y^3/(2 t1^2 g_a(y))` prefactor와 완전한 `exp(-u)` improper integral을 갖는다. 모든 고정 차수 미분은 이 지수와 u의 다항식으로 지배되므로, Ka와 각 eta 미분은 y=0에서 0으로 수렴한다. 이 결과를 원래 응력 차분 대수에 대입하면 regular endpoint는 `(p1*F_natural,-2*U_natural,y/sqrt(2Xa))`이다. 축 방향 점성 계수 2를 빼면 해당 대수가 실패한다.

반면 n1 **배경 F/U는 Xa 근방에서 없어지지 않는다**. 실제 common-collar Picard 식이 H의 두 열에 남아 있고, stress의 별도 0 지지집합과 혼동하지 않는다. target에 있는 leading activation만 해석적으로 인수분해한다.

같은 원래 방향 cone은 regular 계수 b에 양의 하한을 준다. 따라서 `W=H^-1*s^(-A-1/2)*b`, `V=g_a W`의 각 성분은 안쪽 경계를 포함해 양수이다. Haar 계수와 Ls의 정확한 소거로 `|det H|>=d_star/S`를 얻는다. 여기서 `d_star>0`은 실제 source-only 식이다. 0으로 수렴하는 target을 경계에서 나누어 만든 하한이 아니다.

stable matrix의 음의 대각 항을 유지하면 propagator 상계는 S와 독립이다. 실제 source의 모든 고정 차수 매끄러움, moving-frame 분모 하한, 반복 Duhamel/역행렬/제곱근 재귀가 slow 미분의 S 다항식 경계를 준다. n1 Picard의 eta 정칙성과 방사 방향 실수 C-infinity를 구분하며 activation에 복소 방사 정칙성을 가정하지 않는다.

양의 제곱근은 `exp(-1/(2r^2))*sqrt(V)`이다. scalar 재귀는 보통 y 미분의 `t1^-j`를 유지한다. 지수의 절반을 남긴 상태에서 임의의 y 거듭제곱과 교환하므로 모든 고정 차수의 jet가 경계에서 0으로 수렴한다. 전체 식을 y<=0에서 0으로 연장하면 같은 jet들이 붙는다. eta=+-1은 T>=0 안쪽에서의 연속 jet이며 음의 시간 heat 연장을 주장하지 않는다.

## 실행 기록의 해석

최종 source attempt6은 **13/13, 내부 18개, 관측 exit0**, 84.854초, peak RSS 3,072,077,824 bytes이다. 실제 source module/kernel은 attempt4 이후 그대로이며, attempt4/5의 최종 실패는 비교 test/helper 문제로 기록돼 있다. 이전 실패 1–5를 성공으로 다시 표시하지 않는다. 작은 helper smoke 검사는 무거운 source 실행과 별도로 기록한다.

이 결과는 실제 선택된 whole-annulus band의 안쪽 경계 증명이다. 같은 최종 recursive cutoff 수열의 모든 band·label에 적용하는 공통 가족과 수치 상수의 평가를 이 결과만으로 선언하지 않는다. 새로운 Lean 실행, 전체 M2 완료, M3 시작도 별도 상태로 둔다.
