# 원본 A.21 압력 적분과 첫 u 계수의 실제 구간 계산

이번 계산은 원본 P₀의 12개 적분 구간·양쪽 무한 prefix/tail을 보존하고, 첫 비선형 radial 계수 u₁의 η 미분을 계산한다. 최종 A–D 압력·속도장 또는 전역 에너지 인증은 아니다. 원본 radial step은 시간 cutoff와 달리 `exp(-1/y²)`를 사용한다(첨부 166쪽 논문 A.5, PDF 129쪽).

## 1. 원본 압력과 미분의 연결

전체 4,420,257 노드와 registry의 SHA, 원본 compiler 네 파일의 SHA를 대조한다. A.21은 12개 stage의 `exp(2(logAStart+delta+theta*log f))`를 적분한다. f=(1+η²)^−1이며 처음 다섯 stage의 theta=1, interpolation의 theta=1−sigma(s/Tf), 나머지는 0이다. 각 끝점·logAStart는 η와 무관하다.

Python의 별도 미분기가 고정 끝점 적분의 미분과 기본 chain/product 규칙으로 P₀(#3451)를 미분한다. 결과가 원본 #3602와 정확히 같고, η에 의존하는 적분 6개를 재생한다. source AD 함수를 호출하지 않는다. 실제 Z*의 분해와 압력의 짝함수 성질도 원본 AST에 대조한다.

## 2. Terminal wait는 유한한 양수

N3에서 0<h<lambda<1/32, outer rho=h/256<1/8192다. 원본 sigma는 단조이고 0≤sigma≤1, sigma(1−s)=1−sigma(s), integral sigma=1/2이며 integral sigma′=1이다.

Q0=(lambda−h)/(1−lambda)>0이고 Qsteep의 적분은 양수다. 원본 hold length는 −4 log h>4이므로 Qhold>4(1−h). 따라서 Qb>Qhold/2>31/16>1이다. 반면

`0<Qp<exp(3)*outer_rho/(1−outer_rho)<32/8191<1`.

그러므로 `wait=log(Qb/Qp)/(1−h)`는 유한한 양수다. 다른 11개 stage 길이도 원본 양의 N3 식이다. 이 증명은 저장된 pass 값을 가정하지 않는다. 기존 원본 support 코드의 같은 wait 관계도 source hash로 보존한다.

## 3. 거대한 T를 펼치지 않는 실제 압력 계산

K=Pstar²다. 초기 stage의 정확한 log-amplitude 끝점은 −1/5이며, 이후 각 비terminal stage는 delta(s)≤−s/2이다. Terminal stage는 delta(s)≤−s/2+log(1/(1−outer_rho))다.

초기 유한 적분을

`I0=integral_0^1 exp(s/5−(6/5)S(s)) ds`, `S(s)=integral_0^s sigma(v) dv`

로 놓고, `c0=(5+I0+exp(-2/5))/2`로 둔다. 첫 axial decay 뒤의 모든 incoming amplitude 제곱은 exp(−2/5−T) 이하이다. eta가 복소수이고 |Im eta|≤1/8이면 `Re(1+eta²)≥63/64`, |f|<2이고 log f의 정칙 branch를 고를 수 있다. theta∈[0,1]이므로 |f^(2theta)|≤4다.

남은 비terminal stage 9개, terminal 적분, 실제 무한 terminal tail 및 axial decay의 빠진 exp(−T)항을 함께 묶으면

`P0/K = -c0/(1+eta²)^2 + E(eta)`, `|E|≤24 exp(−T)<24·2^-8192`

를 같은 strip에서 얻는다. 양의 tail은 0으로 바꾸지 않았다. T=exp(1048576)+10>8192, exp(−T)<2^-8192라는 source 부등식으로 포함했다.

원본 pressure tail의 분모는 **1+2h**다. Outer kinetic-energy tail의 분모 **2h**와 다르므로 이 계산을 N7-06 전역 에너지로 확대하지 않는다.

## 4. 실제 유리수 구간 quadrature

radial sigma를 정확한 squared seed로 계산한다. 음의 지수는 작은 구간 Taylor remainder·range reduction·바깥쪽 dyadic 반올림을 사용한다. exp(−t)가 아주 작으면 exp(−t)<2^−t를 포함하는 구간으로 처리한다. 단조 sigma의 각 셀 양 끝값으로 S의 하한·상한을 누적하고, 그 구간에서 density를 다시 포함해 I0를 적분한다. S(1)=1/2는 원본 대칭성으로 정확히 사용한다.

셀을 버리거나 huge source 값을 임의로 선택하지 않는다. 셀 수를 늘리면 구간이 좁아진다. 이 mesh refinement는 **압력 적분 한 축의 검사**이며 N8-05의 원래 네 축 refinement가 아니다.

압력은 짝함수다. 따라서 홀수 η Taylor 계수는 정확히 0이다. 짝수 계수는 −c0/(1+η²)²의 계수에 Cauchy error `24·8^m·2^-8192`를 포함한다.

## 5. 실제 u₁ 계수와 미분

원본 재귀의 u₁=−Z*/(2L)에서

`u1=[A(1−2ηU*)U*+4H*+d P0_eta−4AηP0]/(2L)`.

원본 다항식 부분은

`j0(9/2+h)+(20−(1+2h)j0²)η−j0(12+16h)η²−(32+32h)η³`

이다. 압력 항은 홀함수이므로 짝수 미분은 다음과 같이 정확한 h 인자를 보존한다.

- u₁(0)/h⁴ = 9/4+h/2
- u₁″(0)/h⁴ = −12−7h+2h²
- u₁⁽⁴⁾(0)/h⁵ = −288−168h+48h²

홀수 미분 1·3·5차는 K로 정규화하고 실제 압력 계수 구간을 사용해 계산한다. K⁻¹<2^-40을 포함하며 0으로 대체하지 않는다. 원래 scale은 출력에 따로 보존한다.

## 6. 명시 구간의 유한 degree-1 쌍 norm

I′=[−2,2]이며 원본의 미지정 I와의 결속은 여전히 OPEN이다. 압력은 |Im eta|≤1/8에서 |P0|<64K이다. 4rho tube에서 Cauchy 원의 반경 1/16을 사용하면 |P0_eta|≤1024K다. source 다항식·L의 분모 여유를 합쳐

`|u1|<8192K`, `n=1 B_rho slice≤80·8192K=655360K`

를 얻는다. 앞선 Φ₁의 부분 norm과 합하면 유한 쌍 `(Phi0+Phi1Y,u1Y)`의 I′ 위 norm은

`≤819200K/sigmaStar²<Q`

다. 이는 radial n≥2, 무한 fixed point 또는 무한 tail의 norm 인증이 아니다. Cauchy/복소해석 전체를 Lean으로 형식화한 것도 아니다.

## 7. 같은 실행에 묶인 조건부 표시 데이터

실수 |eta|≤1에서

`|u1/K−c0 eta(3−eta²)/(1+eta²)^3|<2^-33`

이다. 차이는 양의 source h와 K⁻¹의 항, 그리고 pressure error를 포함한다. 실제 오차 상한 `64h+64K^-1+264·2^-8192`를 2^-33으로 포함한다. 이 구간으로 샘플 65개와 원본 압력 datum 구간을 생성한다.

3D 표시는 **Y·u₁/K의 첫 Taylor 기여**이며 전체 u·속도장·와도·Navier–Stokes 해가 아니다. `CONDITIONAL` 표시, 동일 run hash·파일 hash, CPU 렌더링, JSON/PNG 내보내기로 연결한다. 원본 n=1 계수 자체를 Bessel 비교값으로 대체하지 않는다.

**M3 62/64 · M4 0/16 · 최종 제트 0/67 · Y 33/523 · RELEASE HOLD 유지.**
