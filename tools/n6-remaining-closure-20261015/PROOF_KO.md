# N6 잔여 1,266개 후속 검증 — 6개 Guard의 범위 내 직접 소거

2026-10-15 · 기준 commit `2cc5469ae4cbb30ca999d44201fc419479ea7c56`

## 0. 판정의 정확한 범위

이번 작업 장부는 Guard 16→10, Cartesian Jet 230 유지, PDE 항 1,020 유지, 합계 1,266→1,260이다. 원래 선언된 admissible band 및 **양의 반지름 annular chart**에서 5개 좌표 조건과 1개 정확한 끝점 치환을 닫는다. 축 R=0에서의 전역 연장, 임의의 부호를 갖는 R, 전체 함수의 정칙성이나 전역 PDE를 증명한 것으로 해석하지 않는다. 원래 universal requirements는 모두 그대로 보존한다.

GitHub에 기록되어 있는 마지막 장부는 여전히 1,266이다. 이번 실행 환경에서 GitHub 읽기/검사 도구는 사용했지만 쓰기/커밋 도구는 제공되지 않았으며, 새 커밋 또는 새 GitHub Actions 실행은 없다. 파일 패키지와 추가 전용 patch에 새 작업 장부를 보존한다. 기존 producer, main, 공개 UI, parallel Picard branch 및 과거 장부를 변경하지 않았다.

## 1. 입력과 재실행

원본 전체 3,892,594-node gzip를 다시 인증하고, Stage3의 indexed 4,050행과 native 188행, bump 결합, Stage4의 22개 Guard 소거를 다시 실행했다. 재생성된 Stage4 장부가 기존 바이트와 같은지 확인한 뒤 이번 검사에 사용했다.

| 대상 | SHA-256 |
|---|---|
| 전체 source node stream | `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f` |
| 전체 gzip | `42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3` |
| Cartesian scalarProgram | `aa2da2a3ee1a12ffd9fc24d471271fc62f6b8723d75813a91eabb68713adc0a8` |
| 원래 Stage4 장부 | `8ac413724219323a8c422d011a3bdb3b38e0d9cd74dee8c308475e9b3bd2456b` |
| 기존 Stage4 실행 코드 | `339af4ca93008a0e79571fb20e816dd236ddc4417c236ed88b05b6cbbd67373b` |
| 기존 Stage3 실행 코드 | `388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f` |

해시는 사용한 입력의 동일성을 확인할 뿐 수학적 명제의 참을 대신하지 않는다. 수학적 근거는 아래 해석 및 정확한 대입 증명이고, 구현은 그 증명을 실제 원본 피연산자에 결합한다.

## 2. 원래 admissible band에서 N−2>0

원본 `actual-common-admissible-family.mjs`와 `global-source-index.mjs:originalBandWindowExpressions`는

```
ellMinimum=ceil(max(8, Sminimum, frequencyMinimum)),
ell0=ellMinimum+6,
window.lower=max(ell0, previous-threshold) 또는 ell0,
N은 window.lower<=N<=window.upper를 만족하는 정수.
```

로 band를 정의한다. 이번에 확인한 원본 node는

```
617431=max(8,...), 617432=ceil(617431),
617433=6+617432, 622785=max(617433,...),
622791=N, 635046=N-2.
```

따라서 허용된 원래 band마다 N>=14이며 N−2>=12>0이다. 유한한 N 몇 개를 샘플링하거나 부동소수점으로 거대한 N을 계산하지 않는다. 원본 band 조건을 제거한 임의의 N에 대한 주장도 아니다. N은 고정한 매개변수이므로 ceiling이나 색상 label을 공간좌표에 따라 미분하지 않는다.

이에 따라 scalar31에 대한 C-005(log 인자의 양성)를 닫는다. N=2로 바꾸거나 원래 하한의 max 피연산자를 빼면 거부된다.

## 3. 원래 양의 반지름 chart의 좌표 조건

원본 `source-global-band.mjs`의 slowPointDomain은 s∈[1/2,2], X∈[Xa/2,2Xb], |eta|<=1이다. 원본 cylindrical-radius 좌표는 양의 sheet

```
R=sqrt(2*s*X),  X=R^2/(2*s),  Xa=4/Lambda>0.
```

를 사용한다. 따라서

```
R^2>=Xa/2=2/Lambda>0,
R>0,
Q=exp(-N*log 2)>0,
physicalR=sqrt(Q)*R>0.
```

R²>0만으로 R>0을 추론한 것이 아니다. **원래 cylindrical 반지름의 양의 sheet가 전제**다. 축을 포함한 전체 Cartesian zero extension의 정칙성은 원래 별도 universal obligation으로 남긴다.

원본 scalar55는 physicalR, scalar2는 R이다. scalar44는 실제 양의 exponential 두 개의 곱이다. 해당 exponential의 고정 band 색상 인자는 log(N−2) 등을 쓰지만, 2절의 양성과 고정 band의 유한성으로 정의된다. 매우 큰 정확한 지수식이 float에서 overflow/underflow한다는 이유로 0이나 infinity로 바꾸지 않는다.

C-008(log physicalR), C-009(physicalR의 역원), C-010(scalar44의 역원), C-011(R의 역원)을 같은 허용영역에서 닫는다.

## 4. C-059: complete_gr의 정확한 끝점 pullback

원래 남은 명제는 scalar1528의

```
substitute(scalar247, scalar232, scalar2)
```

이다. source node와 연결하면

```
scalar247 -> source3615202,
scalar232 -> rho=source3615151,
scalar2 -> R=source622802.
```

같은 원본 함수 g의 정의는

```
expressionDefinitions[21], body=3614891,
parameters=[N,R,Z,T,Y0,Y1].
```

이다. 이동된 source3615202와 원래 source3615048는 모두 이 동일한 함수의 0차 호출이다. 이동된 두 위상은

```
Y0 + Psi(rho)-Psi(R),
Y1 + v1*(Psi(rho)-Psi(R)).
```

이며, rho=R을 **동시 대입**하면 정확히 [N,R,Z,T,Y0,Y1]가 복원된다. 독립 정확 유리수/곱/합 정규화에서 source3615157 및3615159가 각각 0이 되는 것을 확인했다. exp/log의 값은 근사하지 않고 같은 원본 피연산자 구조로 비교했다.

### 숨은 binder 의존성 검사

g의 실제 정의 본체에서 136,186개 source node와 84개 native 정의의 추이적 의존 관계를 검사했다. 식 본체뿐 아니라 매개변수/끝점/정의 payload 및 JSON 문자열로 보존된 원본 정의를 포함했다. 전체 정의에서 새 적분 변수 source3615151의 참조가 없었다. 알려지지 않은 연산은 무조건 실패하며, 임의의 읽기 예산을 넘어가도 미해결을 0으로 바꾸지 않는다.

이 검사는 보수적인 의존성 상위집합이다. 수치 metadata까지 source 참조 후보로 읽으므로 일부 불필요한 노드를 더 읽을 수 있다. 따라서 이 수를 g에 꼭 필요한 최소 연산 개수로 해석해서는 안 된다. 그런 상위집합에서도 금지된 binder 참조가 없다는 것이 결론이다.

### 미정의 항의 상쇄를 금지

같은 log 식 두 개가 상쇄된다는 사실만으로 log(0)−log(0)=0을 허용하지 않는다. 정규화 전에 필요한 정의역 조건 9개를 수집하여 다음 실제 원본 사실로 따로 검사했다.

```
1<sqrt(2)<2, 4-sqrt(2)>2, 4+sqrt(2)>4,
log(4+sqrt(2))>0,
N−2>=12, Q>0, R>0, rho=R>0.
```

그러므로 끝점에서 외부 위상식은 실제로 정의된다. g 자신은 같은 native 함수와 같은 6개 인자를 갖는다. 따라서 이 치환은 **같은 정의역을 갖는 동일 함수 호출**이다. 이 항등식은 g의 전체 해석적 존재/매끄러움이나 적분 가능성을 새로 증명하지 않는다.

C-059의 정확한 치환 의무만 닫고 g의 정칙성 의무를 남긴다.

## 5. 남은 10개 Guard를 닫기에 충분한 하나의 정칙성 명제

남은 10개는 scalar249/254의 적분에 대해 R, Y0, Y1, theta, Z로 각각 미분하는 요청이다. 실제 integrand scalar248은

```
H(R,rho,Z,T,Y)=g(rho,Z,T,Y+v*(Psi(rho)-Psi(R)))-b(rho,Z,T)*P(Z,T),
v=(1,v1),
P(Z,T)=integral_L^U integral_[0,1]^2 g(rho,Z,T,y)dy drho.
```

여기서 b는 앞서 증명한 정규화 bump이다. 원본 Haar 두 적분, P의 방사형 적분, 그 본체/매개변수/끝점을 source3615048–3615055에 대조했다. Psi와 v는 고정 N에서 Z,T,Y에 의존하지 않는 원본 위상식임도 검사했다. 같은 136,186개 노드의 보수적 의존 관계에서 source622806(theta)의 숨은 참조가 없다는 점도 별도로 확인했다.

**충분한 추가 명제**는 다음과 같다. 각 허용 고정 N과 해당 입력점의 근방에서, 실제 g 및 g_Z, g_Y0, g_Y1이 하나의 닫힌 방사형 구간과 slow/phase 변수의 compact 근방에서 함께 연속이면 된다. 이 compact 근방은 이동된 위상 인자 및 P가 사용하는 [0,1]² 인자를 모두 포함해야 한다.

이 10개에 한해서는 모든 band에 동일한 거대한 수치 상수, g의 모든 차수 도함수, g_R 또는 g_T까지 요구하지 않아도 된다. 이것은 필요한 전제를 더 정확히 좁힌 것이며, 해당 전제를 이미 증명했다는 뜻은 아니다.

### 공통 적분 지배 상계의 유도

J=[L,U], 길이를 ell이라고 하자. 위 추가 명제가 성립한다면 compactness로 M0, MZ, MY0, MY1을 각각 해당 함수의 상계로 잡을 수 있다. 이미 증명된 bump의 상계를 B0,BZ, 위상 도함수의 국소 상계를 Cpsi라 놓으면

```
|P|<=ell*M0, |P_Z|<=ell*MZ,
|H_R|<=Cpsi*(MY0+|v1|MY1),
|H_Yj|<=MYj, H_theta=0,
|H_Z|<=MZ+BZ*ell*M0+B0*ell*MZ.
```

모든 우변은 rho에 대해 하나의 유한 구간에서 적분 가능한 상수다. 먼저 g의 연속성/지배 조건으로 P의 미분 교환을 얻고, 이를 사용해 H의 미분 교환을 얻는다. P의 미분을 가정해서 자신을 증명하는 순환이 없다. 유한구간이라는 사실만으로 임의의 함수에 대해 미분 교환을 선언하지 않는다.

### PDE 전개에 사용할 조건부 pressure 항등식

D=partial_R+Psi'(R)(partial_Y0+v1 partial_Y1)라 쓰면 위 정칙성 전제 아래

```
D H=0,
D integral_L^R H drho=H(R,R,Z,T,Y),
D integral_L^U H drho=0.
```

원본 pressure correction은 scalar257의

```
p_corr=integral_L^R H drho-chi(R)*integral_L^U H drho
```

이므로

```
D p_corr=g(R,Z,T,Y)-b(R,Z,T)P(Z,T)-chi'(R)*integral_L^U H drho.
```

마지막 cutoff remainder를 버리지 않았다. 이 항은 일반적으로 0이 아니며 독립 기호검사가 항을 생략하는 식을 거부한다.

SymPy로 임의 기호 함수 g/Psi/b/P의 곱·연쇄법칙을 독립 검산했다. 그러나 원본 g가 위 추가 정칙성 명제를 만족한다는 증명은 아직 없다. `CONDITIONAL_PRESSURE_LEMMA.json`은 이를 명시적으로 false로 남긴다. 따라서 10개 Guard 및 PDE 항은 이 조건부 항등식만으로 소거하지 않는다.

## 6. Jet 230개 및 PDE 1,020개

230개 원래 순서 있는 미분 요청을 모두 다시 검사했다.

- 190개: 원래 인자 tuple이 identity이고 고차 partial 인덱스를 적을 수 있다. 필요한 C^k 존재와 혼합미분 교환을 가정할 때 133개 동일 target class로 묶인다.
- 36개: 먼저 요구된 미분이 미증명인 상태에서 나중에 없는 방향을 미분한다. 마지막 방향이 없다는 이유로 전체 미분을 0으로 만들지 않는다.
- 4개: complete_gr의 비자명한 pullback 미분이다.

**133은 남은 Jet 수가 아니다.** 정칙성을 가정한 경우의 후보 target class 개수일 뿐이며, 원래 Jet 230개의 ID/순서와 OPEN 상태를 그대로 유지한다.

원본 PDE 세 성분의 169/197/654개 항은 파일 전체 바이트, 정확 유리수 계수, source factor 및 연산 종류를 다시 검사했다. 단순 동류항 재수집에서 추가 상쇄는 없었다. coupled indexed residual을 임의로 직접 미분식과 같다고 정의하지 않았다. 새 독립 전체 Cartesian PDE 평가 또는 PDE의 비영 반례를 얻은 것도 아니다.

## 7. 실행 수준과 보존

새 실행은 현재 assistant 계산 환경에서 완료되었고 49개 unittest가 통과했다. 실제 원본 변경, 숨은 binder, 인자 교환, 정의역 누락, 잘못된 상쇄, pressure cutoff 누락, Jet/PDE 장부 변조를 거부하는 테스트를 포함한다. 전용 GitHub Actions에서 이 새 코드를 실행한 기록은 없다. 기존 run 성공을 새 코드의 성공으로 재사용하지 않는다.

`OBLIGATION_MATRIX_CONTINUATION.json`은 원래 16개 Guard를 새 소거6/잔여10으로 정확히 분할한다. Jet230/PDE1020과 originalUniversalRequirements는 남긴다. N6-01 OPEN / N6-02 PARTIAL / M3 56/64다.

## 원본 근거

기준 commit 이하의 다음 파일을 직접 확인하고, source export의 원본 graph와 대조했다.

- `research-ide/mathscope-m3/navier/global-source-index.mjs`, `originalBandWindowExpressions`: https://github.com/leegahuyn/MathScopeCompute/blob/2cc5469ae4cbb30ca999d44201fc419479ea7c56/research-ide/mathscope-m3/navier/global-source-index.mjs
- `research-ide/mathscope-m3/navier/source-global-band.mjs` 및 `source-global-current.mjs`.
- `research-ide/mathscope-m2/navier/actual-common-band-physical-curl.mjs`.
- `research-ide/mathscope-m2/navier/actual-residual-order-induction-expressions.mjs`.
- 표준 매개변수 적분 정리의 전제 확인: https://leanprover-community.github.io/mathlib4_docs/Mathlib/Analysis/Calculus/ParametricIntegral.html . 이 문서 조회는 Lean 실행이 아니다.
