# 실제 radial cutoff·정규화의 정의역과 매끄러움

이 결과는 PR #28 원본 SHA `ba87dc9c09567c9a486d424ffb3e63a7eb04a12d`, 최초 실행 `38500114302`의 실제 scalar witness에 연결된다. `analytic_pde_cutoff.py`는 원본 `633707`, `633724`, `633733`, outer endpoint `28826` 및 실제 wait `280`의 defining body를 검사하고 새 소스 증거를 저장한다. 원본 producer 네 파일의 SHA-256도 당시 실행의 `sourceProducerBindings`와 대조한다. 이전 PASS나 numerical oracle를 수학 증명으로 사용하지 않는다.

이로써 **실제 원본 slow chart에서** 다음을 증명했다.

- mean radial bump의 모든 차수 미분과 두 끝점의 flat join.
- bump 및 chi의 axis 주변 공통 0 영역.
- 실제 outer endpoint가 전체 원본 mean patch와 다섯 profile copy를 포함한다는 부등식.
- 원본 `rhoMass=633724`의 양수·유한성, source slow 좌표 독립성 및 정규화 분모의 비영.

전체 velocity/pressure의 모든 계수와 chart 외부 전역 extension은 여전히 남는다. 이 결과는 무조건부 N6-01/N6-02 인증으로 승격하지 않는다.

## 실제 bump의 모든 차수 flatness

원본은 `L=sqrt(2X0Imean)*exp(1/2)*sqrt(s)`, `u=10(R/L−1)`을 사용한다. node `633707`은

`b(u)=exp(−1/[u(1−u)])` (`0<u<1`), 양쪽 exterior는 `0`이다.

interior에서 매번 미분하면 `b(u)`와 유리함수의 곱이 된다. 이 유리함수의 pole은 `u=0,1`에서의 유한 차수뿐이다. 끝점 근처에서 각각 `1/[u(1−u)]≥1/u`, `1/[u(1−u)]≥1/(1−u)`이다. 모든 정수 `m≥0`에 대해 `t^(−m)exp(−1/t)→0`이므로 모든 one-sided jet은 0으로 간다. 이 극한은 `y=1/t` 및 `exp(y)≥y^(m+1)/(m+1)!`로 바로 증명한다. exterior의 모든 미분도 0이다. 따라서 실제 zero extension은 `C∞(R)`이다.

실제 `s=622820`가 원본 slow image에서 존재하고 양수이며 매끄럽다는 source chart 정리는 [analytic_initial_domain_KO.md](analytic_initial_domain_KO.md)에 따로 있다. 그 chart에서 양수 `L`을 사용한 smooth pullback도 C∞이며, guard의 interior `u(1−u)>0`에서만 지수의 분모를 평가한다. 이 bump는 source step sigma와 다른 함수이므로 sigma의 derivative를 bump의 derivative로 대체하지 않았다.

## 실제 outer wait와 endpoint의 양수 증명

원본 node를 따라 `241=Qsteep`, `243=Qhold`, `259=Qb`, `275=Qp`, `280=wait`를 확인했다. exact parameter file에서

`T=exp(1048576)+10>128`, `h=exp(−8002T)`, `lambda=exp(−1000T)`, `co=1/256`, `Tf=128`, `BOuter=1000T`

를 직접 대조했다. 따라서 `0<h<lambda<1`, `log(1/h)=8002T>2048`, `1−h>1/2`이다.

source step은 interior에서

`sigma(t)=exp(−1/t²)/(exp(−1/t²)+exp(−1/(1−t)²))`

이고 양쪽에 0/1로 flat하게 연장된다. `sigma' = sigma(1−sigma)*2(t^(−3)+(1−t)^(−3))>0`이므로 `0≤sigma≤1`과 `∫₀¹sigma'=1`이다. 원본 `239/257` 적분의 integrand는 양의 exp와 각각 `lambda+(1−lambda)sigma−h`, `(1−h)(1−sigma)`의 곱으로 실제 nonnegative이다.

`Q0=(lambda−h)/(1−lambda)>0`이므로 `Qsteep>0`이다. 따라서

`Qhold=Qsteep+(1−h)*4log(1/h)>4096`.

`Qb=exp(−(1−h)/2)*(Qhold+nonnegative integral)>2048`이다. 여기서 `exp(1/2)<2`는 `e<3<4`에서 따른다. `e<3`은 급수 `∑1/k!`를 `1+1+∑_{k≥2}2^(1−k)`와 비교하여 얻는다.

원본 `Qp`는 정확히

`∫₁³ exp((1−h)t)*(h/256)*sigma'((t−1)/2)/(2(1−h/256)) dt`

이다. interior에서 양수이므로 `Qp>0`이다. `exp((1−h)t)<e³<27`과 `∫₁³sigma'((t−1)/2)dt=2`로

`Qp < (h/256)*27/(1−h/256) < 27h/255 < h < 1`.

따라서 실제 ratio `Qb/Qp>1`, divisor `1−h>0`이고 **source wait `280=log(Qb/Qp)/(1−h)>0`**이다. 세 definite integral의 실제 body/binder/endpoint를 모두 보존한다.

새 작은 affine expander는 실제 node `319`를 independent rational coefficient로 전개하여 다음 식의 각 계수를 확인한다.

`log(Xb/XR)=T+Tf+90BOuter+13/lambda+4log(1/h)+7+wait`.

이 식은 source의 terminal endpoint이며, Xb를 다른 단순한 patch endpoint로 바꾸지 않았다.

## 고정 원본 radial 적분 구간이 전체 지원을 포함

source parameter 식으로 `Q>1`, `Lambda=Q⁶⁴>1`, 따라서 `0<Xa<4`이다. `Pstar>1`, `CSelected>1`, `XR=110(CSelected Pstar)¹⁰>110`이다. 원본

`X0Imean=XR exp(T+60BOuter−6)>110>4>Xa`

이고

`log[Xb/(X0Imean e)] = Tf+30BOuter+13/lambda+4log(1/h)+12+wait >12`.

따라서 `Xb/(X0Imean e)>e¹²>13>121/100`이며 더 강하게 `Xb/X0Imean>e¹³>e⁵`이다.

모든 `s∈[1/2,2]`에서 bump support `(L,11L/10)`의 아래끝은 `sqrt(X0Imean e)>sqrt(Xa)`보다 크고, 위끝은 `2sqrt(Xb)`보다 작다. 따라서 실제 원본 적분 envelope `[sqrtXa,2sqrtXb]`가 bump를 잘라내지 않는다.

원본 세 copy `634278/634467/634497`은 `j=0,1,2`, 지원 `(L exp(j/5),(11/10)L exp(j/5))`이다. axial 두 coefficient는 이 중 처음 두 profile을 사용한다. 모든 copy의 위끝 제곱은

`R² < 4*(121/100)*X0Imean e*exp(4/5) < 4Xb`

이다. `2log(11/10)+4/5<1<12`로 마지막 부등식을 얻는다. 모든 아래끝 제곱은 `X0Imean e>Xa`보다 크다. 이 결과는 실제 다섯 profile의 full integral을 source의 finite primitive envelope에 연결한다. profile 자체의 support/다섯 weighted moment 증명은 initial source 보고서에 따로 있으며, 이 source 연결을 coefficient 전체 smoothness 증명으로 해석하지 않는다.

더 일반적으로 원본 mean patch `X0Imean≤X≤e⁵X0Imean` 전체가 같은 envelope 안에 있다. `R²=2sX`, `1/2≤s≤2`를 이용하면 `sqrtX0Imean≤R≤2sqrt(e⁵X0Imean)<2sqrtXb`이다.

## 실제 rhoMass의 양수 하계와 좌표 독립성

node `633724`는 실제 integrand `L⁻¹b(10(r/L−1))`, binder `633709`, 고정 endpoints `633710/633712`를 갖는다. 위 whole-support containment로, 정확한 change of variables `u=10(r/L−1)`를 적용하면

`rhoMass = (1/10)∫₀¹ exp(−1/[u(1−u)])du`.

따라서 이 실제 원본 적분은 `s,Z,T,R`에 독립적이다. 모든 slow parameter derivative는 0이다. `[1/3,2/3]`에서 `u(1−u)≥2/9`, 전체 `[0,1]`에서 `u(1−u)≤1/4`이므로

`exp(−9/2)/30 ≤ rhoMass ≤ exp(−4)/10`.

특히 이 원본 정규화 분모는 positive finite이다. normalized rho도 C∞이며, 실제 `rhoMass=633724`를 단순히 수치 1로 바꾸지 않는다.

`s≥1/2`로 모든 rho/chi는 `0≤R≤sqrt(X0Imean e)`에서 identically zero이다. 따라서 rho/chi 및 그것들의 모든 jet은 axis에서 smooth하게 0으로 이어진다. 모든 162행 indexed angular/residual 정의의 첫 radial guard도 실제 `Xa<X=R²/(2s)<Xb`인 것을 대조했다. 이 guard는 원본 chart 안에서 axis와 분리된다.

## 남는 전역 조건

원본 bracket root를 모든 독립 좌표 `(Z,T)`에서 정의할 수는 없다. exact `Z=0,T=3`에서 `F(s)=s−3≤−1` (`s∈[1/2,2]`)이므로 bracket root가 없다. 이 점은 원본 chart 밖이다. 따라서 이는 허용 domain의 실패나 Navier–Stokes 반례가 아니라, bounded chart의 정리를 모든 좌표의 함수 정의로 확대할 수 없다는 명확한 경계이다.

원본 X guard 자체가 `s`를 먼저 사용하므로, 이 guard만으로 chart 밖의 `s`를 정의할 수 없다. 전역 source의 compatible chart extension/flat gluing과 모든 계수 함수의 매끄러움은 별도로 필요하다. background, Fourier inverse, natural/quadratic/Picard/Volterra 및 모든 실제 nonzero-angular jet이 이 보고서로 완성되는 것은 아니다. 기존 Cartesian 미계산 jet 393개와 PDE 비교 분자 169/197/654는 유지된다.

실행은 `analytic_pde_cutoff.py --artifacts ARTIFACT_ROOT --output OUTPUT_DIR`이다. 기존 파일을 덮어쓰지 않고 실제 source witness, analytic ledger, 입력·출력 hash receipt 또는 실패 artifact를 남긴다. 큰 parameter를 부동소수점으로 평가하지 않는다. initial source 담당자가 위 실제 wait/containment 부등식을 독립 검토했다.
