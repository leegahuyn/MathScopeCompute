# 현재 n1 노름의 원래 natural auxiliary 정당화

현재 g21은 native Picard0만 캡처하지만 원래 n1 계수의 양적 norm recipe는
별도로 생성한 natural auxiliary의 solutionNorm도 사용한다. 그 숫자식을
그냥 양의 metadata로 승인할 수는 없다. 여기서는 원래 n1 auxiliary 하나의
상계를 증명한다. n2의 진짜 해나 n2 norm의 정직함을 증명했다고 주장하지
않으며, 원래 Bnorm을 다른 유한 상수로 교체하지 않는다.

원래 `actual-residual-order-induction-source.mjs:innerNorm`의 n1 auxiliary는
반경7/Lambda, previousStrip=delta/8, sourceStrip=delta/512,
strip=loss=delta/2048을 그대로 사용한다. 모든 미분은 보통 미분이다.

실제 Banach 계수 노름Q에서 |Y|<=8, eta distance<=rho/4이면 양의 합은

```
sum_(n,m>=0) binom(n+m,n)*(2/5)^n*(1/4)^m =20/7<3
```

이다. 실제 |Phi|,|u|<=3Q이고 |Ustar|<5이다. 실제 g의 기존 원시함수
경계로 `|g|<=exp(128Lambda/sigmaStar²)/CSelected=:gBound`이다.
따라서 원래 `naturalBase=64Q(1+gBound)`가 실제 natural F/U를 지배한다.
|Y|<=7의 각 점에서 반경1의 Y Cauchy 원은 |Y|<=8 안에 있다.
Lambda>=1이므로 X 보통 미분0,1,2를 원래

```
H=max(1,naturalBase*max(1,2Lambda²))
```

가 동시에 지배한다. 복소 X에서 B26 activation을 사용하지 않는다.
공통 η tube에서 |eta|<17/16, |d|<3, |L^-1|<=2, |(L^-1)_eta|<1이다.
natural 입력의 큰 rho/4 여유 안에서 반경 previousStrip/4를 쓸 수 있다.
원래 `V=128H/previousStrip`는 U와 그 실제 radial average로 만든 v의
X 차수0..2를 지배한다. 실제 평균의 X 미분은 factor1/(r+1)인 수축이다.
그 뒤 sourceStrip 안에서 첫 두 η Cauchy 비용은 원래
`e1=16/previousStrip`, `e2=2e1²`보다 작다.

원래 `E=4+2h`라 놓으면 실제 Z_b의 세 비용은 그대로

```
Z(H)  =H*(5E+5+6e1),
ZX(H) =H*(5E+10+6e1),
ZE(H) =H*(16E+64+(5E+69)e1+6e2).
```

이다. 예를 들어 Z_eta를 직접 미분한 계수는 |eta|<17/16과 위 L 경계로
`(49/8)(E+1)+((17/4)E+53/4)e1+6e2` 이하이므로 표시된 ZE보다 작다.
outer Z를 한 번 더 적용하면 `ZZ=5E*Z+5*ZX+6*ZE`가 충분하다.
시간 연산자는 `time(V)=2V(E+2e1+1)`로 지배된다. 실제 Omega0/X의
네 블록은 빠짐없이

```
omega=time(V)+6V+(3/2)V²+H*Z(V),
pKnown=omega/2, Htheta=Hz=ZZ(H)
```

로 지배된다. 원래 부호가 양/음으로 바뀌어도 절댓값 majorant의 네
항을 삭제하지 않는다. forcing의 여섯 비용은 원래
`[0,0,0,2pKnown,2Htheta,2Hz+16pKnown]`이다.

실제 six-by-six 행렬에서 |X|,|xi|<1, |Hf|<=2H, |Hu|<=H를 직접 쓰면
각 A0/A1의 induced infinity norm은
`M=512(1+E)(1+H+V+Z(H))` 이하이다. 예를 들어 A0의 row4는
`80EH+8H+4E+3V+2+2Z(H)` 이하이며 나머지 행도 같은 M보다 작다.
따라서 원래 `Caux=2*(M+sum(forcingBounds))`는 word count를 흡수한다.

동일한 singular diagonal [0,0,2,0,3,1], 같은 zero-axis datum,
같은 A1 square-zero mask가 있으므로 이미 독립 증명한 ordered-integral
추정에 `a7²=7/Lambda`, `loss=delta/2048`, `C1=Caux`를 대입한다.
원래 식 그대로

```
solutionNorm=exp(9*Caux²*a7²/(2loss)),
Kcondition=ceil(72*Caux²*a7²/loss)
```

가 유효하다. 모든 정수 K>=Kcondition에서 value tail은4^-K/3이다.
복소 ξ 적분은 ξ의 radial 선분으로 하며 ordered volume은 |ξ|^n/n!이다.

probe는 실제 모든 A0/A1/forcing ancestor의 ξ 반사를 재귀적으로
확인한다. 유일한 native 경계는 실제 natural kernel이며 그 Y/η 인자는
ξ에 대해 짝수이다. 해의 parity는 [even,even,even,even,odd,odd]이다.
따라서 첫 네 성분은 analytic-X 함수이다. 원본의 실제 natural core와
zero-axis datum가 같으므로 0<=X<=Xa에서 actual Picard0와 유일성으로
일치한다. 이것은 X>Xa의 B26 활성 부분을 auxiliary로 바꾸는 정리가 아니다.
0<=X<=1/Lambda에서 X Cauchy 반경1/Lambda와 η 반경 strip/2를 쓰면
원래 raw-core 비용 `r!*m!*Lambda^r*(2/strip)^m*solutionNorm`을 얻는다.

fresh probe는 원본 생성자를 order1까지만 실행하고 순수 상수 DAG만
내보낸다. checker는 위 모든 scalar 식, strip, radius, 여섯 forcing,
원래 norm/K 식을 각각 비교한다. 실제 natural 증명·kernel 영수증과
수치 Picard 영수증의 동일 hash chain도 필요하다. 현재 n1 global 보통
jet recurrence, 원래 Bnorm 지배와 covariance 적용은 다음 별도 단계이다.
원본 Guard/Jet/PDE 새 소거 수는0이다.
