# 원본 Picard0 입력의 전 차수 접합과 실제 급수 수렴

## 적용 대상과 결론

적용 대상은 고정 SHA-256
`c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60`의
`ActualSameN3OrderOneInner`, 즉 원본 `picard:0`이다. 같은 원본의
`0<=xi<=a`, `a²=Xa exp(t1/16)`에서 실제 A0,A1,forcing은 xi에 대해
C-infinity이고 eta에 대해 공통 복소 관에서 정칙이다. 따라서 원본
Picard 반복 급수는 모든 고정 유한 xi·eta 혼합 미분에 대해 더 작은
공통 관에서 정상 수렴하며, 원래 native Picard 함수가 실제 C-infinity
함수로 존재한다.

기계 조합은 `picard_regularity_composition.py`가 수행한다. 여기에는
독립 입력 증거 및 원래 F0/U0/v0 생성자의 재결속 영수증
`ACTUAL_PICARD_LEADING_BINDING.json`이 모두 필요하다. 생성자 결속이나
다른 입력 영수증이 없으면 적용 결론을 출력하지 않는다.

이 결론은 아래의 실제 입력 범위, 전 차수 자연/B.26 접합, 18개 원본
본문의 형식 미분 계보 및 nilpotent 행렬 구조를 **함께** 사용한다.
어느 한 결과의 PASS 개수만으로 결론을 내리지 않는다. 전체 g에
포함된 다른 native 함수나 전체 J의 정칙성이 이 정리에서 자동으로
따르는 것은 아니며 새 원본 의무 소거 수는 여기서도 0이다.

## 1. 실제 원시 정의역과 공통 eta 관

`ACTUAL_PICARD_DOMAIN_KO.md`의 두 독립 순회가 실제 3,679개 계수
노드와 157개 잠재 자연급수 호출을 다룬다. 유지된 207개 환경의 73개
호출은 `0<=Y<4.1`이고 eta 인자는 원본 좌표 2 그대로이다. 나머지
84개는 증명된 공집합 lazy 분기 뒤에만 있다. 변수 적분 끝점과 모든
원시 역수·로그·제곱근 검사를 포함한 8,384개 상태에 미해결 정의역이
없다. 자연급수의 인자 그래프도 검사하므로, 예를 들어 `exp(log X)`의
대수적 단순화가 원래 `log X` 검사를 숨길 수 없다.

실제 natural Banach 정리와 원본 커널 재결속이 모든 고정 미분의
정상 수렴 및 실수 `Phi>1/4`, 복소 eta 관에서 `|Phi|>63/256`을 준다.
사용하는 관은 실수 I=[-33/32,33/32]로부터 거리
`delta=rho/(1024Q)`보다 작은 관이다. 이는 실제 core 관
`sigma²/2048`에 포함된다. 원래 계수의 eta 비영 분모들도 이 관에서
정당화된다. 각 real xi에서 원래 계수는 eta에 대해 정칙이다.

모든 31개 step 인자와 모든 반경 piecewise 선택자는 eta와 독립이다.
따라서 eta를 복소화해도 반경 분기를 복소 step으로 해석할 필요가 없다.

## 2. 실제 natural 적분 보존 항등식

기호는 원본 그대로 둔다. F=gPhi(Lambda X), U=Ustar+u(Lambda X)/Lambda,
M=integral U, I=2integral XF, J=2integral XUF,
S=integral(U²-XF²), Pi=P0+integral F²이다. 또한

```
W=1-(2D eta M+d M_eta)/X,    H=D eta+dU.
```

원본 자연급수의 실제 R1/R2 방정식은 정확히 다음과 동치이다.

```
2L(XF_XX+2F_X)=(W+h(1-2etaU))F+XWF_X+HF_eta,
2L(XU_XX+U_X)=A(1-2etaU)U+HU_eta+XWU_X
                         -2etaXF²-4A eta Pi+d Pi_eta.
```

이 환원에서 실제 부호 `zeta=-L Hstar/(Hstar²+sigma²)`와
`Hstar*zeta=-L chi`를 사용한다. Hstar로 나누지 않으므로 그 영점도
포함한다. 각 보존량을 X로 미분하고 위 식과 다섯 moment의 FTC를
대입하면 미분이 0이다. 보존량의 축 극한도 0이다. 따라서 실제 원본의
적분된 source 항은

```
source.p1 = -2X F_X/F,     source.ns = -2U_X
```

이다. 첫 식의 X 인자를 생략하면 틀리며 음성 대조가 이를 탐지한다.
`actual_natural_b26_identity.py`의 여섯 정확한 대수 검사는 유한 차수
미분 표본으로 무한 차수를 추측하는 검사가 아니다. 정상 수렴과 FTC가
이미 주어진 실제 함수의 전 차수 항등식이다. 별도의 독립 검산에서도
두 보존 미분식과 원본 R1/R2 환원이 동일하게 얻어진다.

## 3. B.26와 자연해의 모든 혼합 미분 일치

y=log(X/Xa)라 하자. 원래 reference는 y<t1에서 실제 natural F/U 및
같은 다섯 moment와 문자 그대로 일치한다. Xb=100, Xa<4이므로
`log(Xb/Xa)>log25>1`; 따라서 공통 collar `0<=y<=t1/16`에서 beta=1,
blend=0이다. 실제 kappa는

```
kappa(y)=1-(1-kappa0) step(y/t1).
```

원본 평탄 step 때문에 kappa-1의 모든 미분은 y=0에서 0이다. 앞의
source 항등식을 실제 B.26 본문에 대입하면 정확히

```
log(F_B26/F_nat)=integral_0^y (kappa-1) d_s log F_nat ds,
U_B26-U_nat=integral_0^y (kappa-1) d_s U_nat ds.
```

초기값은 같은 gPhi(4), U_nat(4)이므로 적분 상수도 0이다. 실제
Fnat=gPhi는 공통 관에서 비영이다. 오른쪽은 모든 y·eta 혼합 차수로
0에 평탄하다. 지수함수를 취하고 Xa>0에서 X 좌표로 바꾸어도 전 차수
평탄성은 보존된다. 즉 실제 F/U의 모든 X·eta 경계 jet이 일치한다.

또한 두 실제 M은 X=Xa에서 같은 natural moment를 갖고, X 미분의
차이는 U_B26-U_nat이다. 그러므로 M과 평균 M/X의 차이도 평탄하다.
실제 v0는 이 평균·U·eta 미분의 유한 대수 조합이며 L은 비영이므로
v0의 차이도 모든 차수로 평탄하다.

이 적용은 원본 파일 주석을 근거로 하지 않는다. 클라우드
38714876244의 `ACTUAL_NATURAL_B26_BINDING.json`은 원래 producer의
source.p1/ns, 다섯 core moment, reference 왼쪽 본문, 음의 zeta,
kappa/beta/blend와 B.26 중간 적분 본문을 재결속하였다. 해당 파일의
SHA-256은
`a16fdf4842ae07925106706f1f4a1a3046ef6b1e091a10f01560a749863c4256`이다.

## 4. 실제 18개 접합의 형식 미분 계보

실제 공통 반경과 만나는 piecewise 경계 36개 중 오른쪽 18개는
안쪽·바깥쪽 본문 ID가 동일하다. 다른 18개는 모두 X=Xa의 왼쪽 경계다.
`picard_interface_lineage.py`는 실제 sourceLeading F0/U0/v0의 두 본문을
가져와 원본 compiler와 같은 정확한 덧셈·곱·역수·chain rule·적분
Leibniz rule로 미분한다. 자연급수의 두 인자와 두 미분 차수를 모두
보존한다. 고정 적분 끝점의 속도가 0이면 그 끝점의 불필요한 본문
평가를 생성하지 않는다. 서로 다른 혼합 미분 순서도 각각 보존한다.

18개 실제 본문 쌍 모두가 이렇게 얻은 유한 미분과 구조적으로 정확히
일치한다. 근사 허용오차나 미분 표본은 없다. 이 유한 계보 검사의
역할은 전 차수 평탄성 정리를 **어떤 실제 함수의 미분에 적용하는지**
결속하는 것이다. 전 차수 평탄성 자체는 앞 절의 해석적 증명에서 온다.

## 5. 계수의 공동 정칙성과 정상 수렴

원시 정의역과 각 구간의 매끄러움, 36개 실제 경계의 전 차수 일치를
합치면 실제 A0,A1,forcing은 xi에 대해 C-infinity이다. 모든 eta
미분도 같은 관의 더 작은 폐부분에서 공동 연속이다. 이 관에서의
복소 정칙성과 각 고정 xi 미분은 적분·합성·비영 역수의 표준 미분
규칙으로 보존된다. 반경 [0,a]와 더 작은 폐 eta 관이 compact이므로
임의의 고정 유한 xi 미분 차수에 대해 하나의 유한 공동 상계가 있다.
이 상계의 엄청난 수치값을 물질화할 필요는 없다.

실제 singular diagonal c=(0,0,2,0,3,1)의 원래 inverse는

```
(Gf)_i(xi)=xi integral_0^1 t^(c_i) f_i(t xi)dt.
```

A1과 모든 eta 미분은 첫 네 성분에서 마지막 두 성분으로만 사상하고
마지막 두 성분을 죽인다. 따라서 `T1=G A1 partial_eta`에 대해
T1²=0이다. 길이 k인 살아 있는 T0/T1 word의 eta 미분 수는
q<=ceil(k/2)이다. 양의 eta 여유 Delta를 q개 미분에 균등 분배한
Cauchy estimate와 ordered radial integral로

```
||T^k Gf|| <= 2^k C^(k+1) a^(k+1)/(k+1)! * max(1,q/Delta)^q
```

를 얻는다. q가 k의 절반 이하이므로 결국
`(constant/sqrt(k+1))^(k+1)` 꼴로 감소한다. 모든 고정 eta 미분은 더
작은 관에서 Cauchy estimate로 처리한다. xi의 p차 미분은 원래
rescaled compact integral에서 미분한다. k>=p인 항에 추가되는 인자는
k의 고정 다항식 및 고정 a^(-p), C_p^k 정도이며 같은 subfactorial
감소가 이긴다. k<p인 유한 항도 원래 compact integral에서 매끄럽다.
따라서 모든 고정 혼합 차수에서 정상 수렴한다.

합은 실제 native 반복과 같은 원래 partial sum의 극한이다. 별도
대체 함수를 정의하지 않는다. ξ>0에서 FTC로 원래 singular ODE를
만족한다. ξ=0에서 각 성분의 값은 0이고 G의 적분 표현이 축에서
나눗셈을 피하므로 계수 c_i/ξ를 직접 평가하지 않아도 정칙성이 유지된다.

## 6. 반사 대칭과 even-profile에 관한 분리된 적용

원래 행렬·forcing의 정확한 반사 parity를 별도로 확인하면
`w0,w1,w2,w3`는 even, `w4,w5`는 odd이다. 초기값 0과 원래 G 연산이
그 parity를 보존하므로 유일한 급수 극한도 같은 parity를 가진다.
이 source parity 결속은 `actual_picard_parity.py`의 독립 gate이다.

원래 공통 반경의 even C-infinity f에 대해 h(X)=f(sqrt X)는
0<=X<=a²에서 C-infinity이다.
원래 source가 쓰는 축 나눗셈 없는 항등식은

```
d_X^k h(X)
 =2^(-k) integral_[0,1]^k product_j t_j^(2(k-1-j))
     f^(2k)(sqrt(X)*product_j t_j) dt.
```

이는 f'(0)=0으로 k=1을 FTC로 얻은 뒤 반복하면 증명된다. 각 고정
혼합 미분의 연속성은 compact 적분과 앞의 정상 수렴으로 따른다.
따라서 parity gate까지 결속되면 원래 native even-profile도 정당화된다.

## 7. 전체 원본 목표와의 경계

이 정리는 실제 Picard0라는 하나의 source subkernel을 완성한다.
원본 g 전체는 그 밖의 B.34/B.8·loop·time/pressure/moment 등의
함수와 전체 구간 J에서의 정의역·양성·비영 분모를 함께 요구한다.
그 요구를 Picard 정리의 결론으로 대체하지 않는다. 따라서 여기서
원본 Guard/Jet/PDE 1,260개의 새 소거를 선언하지 않는다.
