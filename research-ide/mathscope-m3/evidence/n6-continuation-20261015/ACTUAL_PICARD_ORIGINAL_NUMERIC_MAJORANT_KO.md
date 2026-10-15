# 원래 Picard0의 B, C1, 해 노름 및 K를 바꾸지 않는 수치 상계 증명

이 결과는 현재 g21이 실제로 사용하는 Picard0 하나에 국한된다. 원본
상수, 주파수, collar, step, η tube 및 반복 정의를 바꾸지 않는다.
기존 정상 수렴 증명에 실제 common-collar의 유한 수치 경계를 더하여
원래 `solutionNorm`과 `Kcondition`을 정당화한다. 전체 Bnorm과 stress
cone의 양적 적용은 이 결과만으로 완료하지 않는다.

## 1. 실제 natural과 B.26 collar에 필요한 최소 미분

원래 정의 그대로 δ=rho/(1024Q), a²=(4/Lambda)exp(t1/16),
B=4096 Lambda² Q³/t1라 한다. 실제 natural Banach 증명의 계수 노름 Q는
복소 η를 미리 가정하지 않고 모든 실수 η 미분을 동시에 제어한다.
|Y|<=5에서 그 계수를 합하고 거리 rho/4까지 η Taylor 급수를 합하면

```
|dY^k deta^m f| <= Q*2^(k+m+1)*(k+m)!/(20^k*rho^m),
f=Phi,u.
```

예컨대 실수 η에서 `(4/3)^(k+m+1)` 인자가 나오며, η Taylor 합의
추가 기하급수 인자가 `(3/2)^(k+m+1)`이므로 위 식을 얻는다. 따라서
η 거리 δ의 tube에서 k=0,1,2에 대해 각각 2Q,Q/5,Q/25가 유효하다.
같은 독립 natural 증명은 실제 |g|<=1, |Ustar|<5,
|Phi|>=63/256>1/8을 준다. 모두 고정 원본의 실제 압력과 g를 사용한다.

여기서 실제 B.26 입력에 자연 항등식을 적용할 수 있다. 공통 collar는
0<=y=log(X/Xa)<=t1/16<t1이므로 원본 reference가 아직 정확히 natural이고
beta=1, blend=0이다. 자연 보존 항등식은 실제 prescribed source를
`p1=-2X Fn_X/Fn`, `ns=-2Un_X`로 만든다. 따라서 실제 본문은

```
F=Fn(Xa)*exp(int_0^y kappa(s)*Y*Phi_Y/Phi ds),
U=Un(Xa)+Lambda^-1*int_0^y kappa(s)*Y*u_Y ds.
```

κ=1−(1−t1)σ(y/t1)은 실수 y에만 적용하고 0<κ<=1이다. 복소 X나
복소 step은 사용하지 않는다. 독립적으로 증명한 원본 squared-Gaussian
step의 σ'<=32를 사용한다. 더 작은 미검증 상수 9는 필요하지 않다.

이 collar에서 4<=Y<5, X>=4/Lambda이다. r=Fn_X/Fn라 쓰면

```
|r| <= (8/5)*Lambda*Q <2*Lambda*Q,
|r_X| <= (8/25+64/25)*Lambda²*Q² <3*Lambda²*Q²,
|kappa_X| <=8*Lambda/t1.
```

C>=Q와 t1=C^-120 때문에 Q*t1<1이며 로그 F의 적분 크기는
`(Q*t1)/2` 이하이다. 그러므로 |F|<=6Q, |U|<6이다. 실제 보통 실수
X 미분을 하면

```
F_X=kappa*r*F,
F_XX=F*((kappa*r)^2+kappa_X*r+kappa*r_X),
U_X=kappa*u_Y,
U_XX=kappa_X*u_Y+kappa*Lambda*u_YY.
```

따라서 `|F_XX|<=138 Lambda² Q³/t1<2048 Lambda² Q³/t1`,
`|U_XX|< (41/25)Lambda Q/t1<2 Lambda Q/t1`이다. 자연 구간의 같은
미분은 앞선 직접 급수 경계로 더 작다. 원래 B는 전체 0<=X<=a²에서
F0/U0의 X 미분 0,1,2를 η 거리 δ의 같은 tube 위에서 모두 지배한다.
Xa의 모든 혼합 접합은 이미 source-bound natural/B.26 정리에서 증명되었다.

현재 Picard 계수와 forcing에는 F0/U0의 이 세 X 차수만 필요하다.
η 미분은 아래의 복소 여유를 사용하므로 별도의 고차 radial norm이나
전역 heat profile의 복소 η 확장을 끌어오지 않는다.

## 2. 실제 v0, Omega 및 여섯 성분 행렬

실제 v는 원래 U의 반경 평균으로 주어진다. 평균은 각 X 미분에서
수축이고 그 η 미분도 같은 평균의 미분이다. 거리 δ/2의 tube에서
Cauchy 경계를 적용한다. 실제 원래 실수 구간과 작은 tube에서는 |η|<17/16이며, 이것으로 |d|=|1−η²|<3을 얻는다. 더 느슨한 |η|<=2는 선형 η 인자에만 쓰고 |d| 상계를 그 값에서 추론하지 않는다. |D|<=1, |L^-1|<=2와 함께 쓰면

```
|dX^k v| <=2*(4+4+6)*B/delta=28B/delta  (k=0,1,2).
```

거리 δ/4에서는 |v_eta|<=112B/delta²이다. 축에서 M/X를 직접 나누지
않고 원래 평균을 사용한다. 원본 Omega0/X의 네 묶음을 각각 지배하면
양의 계수합은

```
2*(2*112+56) +28*(14+28)
 +2*(3*112+4*56)+2*(2*28+28) =3024 <4096.
```

따라서 |Omega0/X|<=4096B²/delta²이다. 실제 Z_b f에 대해 같은 tube에서
|Z_b f|<=36B/delta, |dX Z_b f|<=44B/delta이고, δ/4 tube에서는
|deta Z_b f|<=144B/delta²이다. 두 번째 Z의 지수도 그대로 유지하면

```
|Z_(b-D) Z_b f| <=2*(12*36+3*144+4*44)*B/delta²
                  =2080B/delta² <4096B/delta².
```

U의 지수 c도 이 상계에 포함된다. 따라서 원본 forcing의 최대 성분은
`(2*4096+8*4096)B²/delta²=40960B²/delta²` 이하이고 원래 65536보다 작다.

원래 λ1=2h를 유지하면 |beta|,|gamma|,|A−λ1|,|D+λ1|<=1이고
pressureExponent=-1이다. 원본 A0의 가장 큰 두 행의 항별 합은
각각 250B/delta, 210B/delta 이하이고 A1은 68B/delta,56B/delta 이하이다.
따라서 원래 512B/delta는 두 행렬의 induced infinity norm을 지배한다.
여기서 λ1=2h와 외부 Ipos의 λ=exp(-1000T)를 혼동하지 않는다.

## 3. 같은 C1, 같은 ordered-integral 극한

C1=2^18 B²/delta²는 forcing 상계의 두 배보다 크고 각 행렬 상계의 두
배보다 크다. 실제 반복 T=T0+T1에서 길이 k의 word는 최대 2^k개다.
이 계수는 `(2*matrixBound)^k*forcingBound` 안에서 C1^(k+1)에 흡수된다.
별도의 2^k를 다시 C1 위에 곱하지 않는다.

원래 A1의 모든 η 미분은 첫 네 좌표에서 마지막 두 좌표로만 사상하고
그 마지막 두 좌표를 죽인다. 따라서 연속된 T1 둘은 정확히 0이고,
살아 있는 word의 η 미분 개수 q는 ceil(k/2) 이하이다. singular diagonal은
(0,0,2,0,3,1)로 음이 아니므로 rescaled G 적분의 추가 t 거듭제곱은
모두 절댓값 1 이하이다. 순서 적분의 부피는 a^(k+1)/(k+1)!이다.

거리 δ/4에서 δ/8까지의 원래 여유 Delta=delta/8을 q번에 균등 분배하면,
A=C1*a, n=k+1에 대한 실제 항의 경계는 정확히

```
t_n <= A^n/n! *max(1,q/Delta)^q,   q<=floor(n/2).
```

각 Cauchy 미분은 해당 word가 계산되는 더 작은 η tube에서 수행한다.
radial activation의 복소 해석성을 가정하지 않는다.

짝수 n=2r에서 `(2r)!>=r!*r^r`, 홀수에서도 그보다 큰 분모를 사용하면
전체 합은 `(1+A)*exp(A²/Delta)` 이하이다. 실제 원본에서는
`A²>=2^86*Lambda^7*Q^12>1`이고 0<Delta<1이므로

```
(1+A)*exp(A²/Delta) <=exp(2A²/Delta)
                        <=exp(9A²/(2Delta)).
```

이는 원래 `solutionNorm.commonCollar`보다 강하다. 유한 iterate를 해로
취급하지 않고 같은 원래 ordered-integral 급수의 합을 지배한다.

## 4. 원래 Kcondition과 표시된 η 꼬리

n>=2에서 n!>(n/3)^n 및 q<=n/2를 사용하면

```
t_n < [3A/sqrt(2*n*Delta)]^n.
```

원래 K>=ceil(72A²/Delta)에서 n=k+1, k>=K이면 대괄호는 1/4 이하다.
따라서 같은 실제 remainder는 `sum_(k>=K)4^(-k-1)=4^(-K)/3` 이하이다.
원래 m차 η Cauchy 인자 m!*(16/delta)^m도 유지한다.
`log2(m!)<=m²`, `log2(16/delta)<=4+2/delta`이므로 원래
`Kprecision=ceil((bits+m²+4m+2m/delta)/2)`가 정확한 2^-bits 목표를 준다.

새 checker는 fresh cache에서 이 B/C1/a/loss/K/solutionNorm/error의
실제 primitive AST를 읽어 고정 native 정의와 비교한다. 값의 거대한
지수나 정수 K를 십진수로 물질화하지 않는다. 독립 natural 증명, 실제
Picard 정칙성·접합, 실제 step32 영수증을 모두 소비한 경우에만
`numericC1KCertifiedTailBoundsProvedHere=true`를 출력한다.

## 5. Bnorm 적용과 남은 범위

이 결과는 기존 Picard 정리의 의도적인 수치 노름 미승인 범위를
Picard0에 한하여 제거한다. 전역 leading 고차 norm, 양의 차수의 글로벌
보통 미분 recurrence, 원래 Bnorm의 전체 계보, 원래 band가 ell0 이상이라는
호출 정의역, target stress cone까지 한꺼번에 승인하지 않는다. 특히
finite C∞와 원래 주어진 숫자식이 실제 상계라는 명제는 서로 다르다.
현재 원본 Guard/Jet/PDE 새 소거 수는 0이다.
