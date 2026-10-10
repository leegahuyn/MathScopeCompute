# 같은 N3 전역 배경을 위한 추가 실행 경로

이 문서는 `actual-global-source*.mjs`의 구현 범위와 검증을 설명한다. 이전
`actual-background*.mjs`와 원본 M1 파일은 수정하지 않았다. 새 전역 함수는
**N4-03/04/05를 아직 PASS로 승격하지 않는다.** 실제 바깥 구간의 함수·근과
다음 차수 적분 목표를 연결하고, 전체 계산에 필요한 미분 차수를 줄인 상태다.

## 1. 새 API와 관측

```js
import {actualGlobalSourceConstruction}
  from './navier/actual-global-source.mjs';

const globalSource = actualGlobalSourceConstruction({
  eta: 0.25,
  xi: [0.5, 1, 2, 5, 9]
});
```

`eta`는 `[-1,1]`, `xi`의 각 값은 `[1/50,10]`이다. 기본 출력은 실제 바깥
pulse의 5개 좌표와 좌표당 3개 값으로 총 15개 관측을 갖는다. `xi`는
`lambda*log(X/Xp)`이며, 실제 반지름은 `Xp*exp(xi/lambda)`이다. 이 거대한
양수는 정확한 식으로 보존하고 `XBinary64:null`을 반환한다. 입력 binary64
좌표는 기약 dyadic 유리수 `xiExact`로 함께 보존한다.

| 반환 필드 | 내용 |
| --- | --- |
| `reduction` | 두 가중 적분의 정확한 환원, 축 경계항, 부분구간 경계식 |
| `outerProgram` | 실제 outer tail의 E 참조 에너지, root, U/M, η 미분, 적분 목표를 포함한 연산 그래프 |
| `outerObservations` | 실제 `U0/E0`, `M0/(X E0)`, `V0/(X E0)`의 구간 값 |
| `modulationRemainder` | 같은 원래 N을 사용하는 C.12 및 I1 변화의 정량 오차 |
| `target` | 전체 `Xv` 지지와 목표 적분의 분해 |
| `remaining`, `scope` | 실제 전역 evaluator·전체 debt·고차 귀납의 미완료 상태 |

관측의 `sourceField`는 `globalSource`부터 시작하는 상대 결과 경로다. UI에서
객체를 `result.actualSource.globalSource` 등에 넣었다면 그 접두사를 붙여야
한다. 값과 다른 점열을 동일 원본이라고 표시해서는 안 된다.

예를 들어 `eta=.25, xi=1`에서는 다음 실제 구간을 얻는다. 아래 소수는 표시용
중심값이며, API는 구간 양 끝과 원본 경로를 반환한다.

| 실제 정규화된 값 | 표시 중심값 |
| --- | ---: |
| `U0/E0` | 약 0.9999497636 |
| `M0/(X E0)` | 약 1.9998995272 |
| `V0/(X E0)` | 약 0.8823086149 |

이 값은 임의 pulse 예제의 결과가 아니다. 동일 N3의 연속 적분 receipt가 주는
전 η amplitude 구간, 원래 M convolution 및 그 오차를 함께 사용한다. 단, 이
관측값들만으로 전체 pulse 적분이나 다음 차수의 전역 수리가 끝나지는 않는다.

## 2. Ω 적분을 여섯 개의 정칙 적분으로 환원

원문의 `M_X=U`와 (4.7)에 따라

\[
 \bar U(X,\eta)=\int_0^1U(sX,\eta)\,ds,\qquad
 v=\frac{2\eta U-2D\eta\bar U-d\bar U_\eta}{L},\qquad V=Xv.
\]

따라서 축에서 `M/X`를 직접 나누지 않아도 된다. 필요한 여섯 적분은

\[
 J_{-1}=\int v,\quad J_0=\int Xv,\quad
 H_{-1}=\int Uv,\quad H_0=\int XUv,\quad
 K_{-2}=\int v^2,\quad K_{-1}=\int Xv^2
\]

이며 모두 `[0,Xv]`에서 정칙이다. (5.6)를 직접 부분적분하면

\[
 P=\int_0^{X_v}\frac{\Omega_0}{2X}\,dX
 =\frac{D\eta J_{-1}'+dH_{-1}'-2A\eta H_{-1}}{2L}
 +\frac14K_{-2}+V_X(0,\eta),
\]

\[
 F=\int_0^{X_v}\frac{\Omega_0}{2}\,dX
 =\frac{D\eta J_0'-J_0+dH_0'+2D\eta H_0}{2L}-\frac14K_{-1}.
\]

prime는 η 미분이다. 실제 모멘트 수리에서 `m3`의 전역 압력 debt는 **`-P`**,
`m5`의 전역 flux debt는 **`+F`**다. 이 두 부호를 함께 반환한다.

실제 축 데이터 `U0(0,eta)=4eta+j0`를 대입하면

\[
 V_X(0,\eta)=
 \frac{2(1/2+h)\eta(4\eta+j_0)-4(1-\eta^2)}{1-2h\eta^2}.
\]

특히 `eta=0`에서는 정확히 `-4`이다. 전 구간식의 축 항을 생략하면 결과가
틀린다. 임의 고정 부분구간 `[a,b]`에서는 다른 끝의 경계항도 필요하다.

`evaluateExactRegularOmegaJet`와 `evaluateExactOmegaReducedMoments`는 이
연산을 BigInt 유리수로 실행한다. 독립 시험에 사용되는 유한 입력에는
`sameProfileCertificate:false`가 붙는다. 이 연산기에 실제 전역 적분을
대입하기 전에는 소스 인증 결과로 쓰지 않는다.

전체 유도, 부분구간 경계식, 원래 다섯 endpoint moment만으로 Ω 적분을
결정할 수 없다는 독립 반례는
[WEIGHTED_OMEGA_REDUCTION_KO.md](WEIGHTED_OMEGA_REDUCTION_KO.md)에 있다.

## 3. 실제 바깥 axial tail 프로그램

다음 끝점을 정확히 사용한다.

\[
 X_p=X_R\exp(T+2+60B_{\rm Outer}),\qquad
 X_v=X_p\exp(13/\lambda),\qquad
 I_{1,\rm right}=X_p e^{-20}.
\]

I1 수리 뒤에는 M을 포함한 원래 모멘트가 정확히 복원된다. I2의 heat 수리는
E만 바꾸므로 이 뒤의 U/M/Ω에는 영향을 주지 않는다. 따라서 최종 실제
axial field는 `[I1Right,Xv]`에서 원래 outer U/M 식과 일치한다. Xv 이후에는
`U=M=V=Omega0=0`이다. 짧은 Ipos 또는 Imean 끝점을 Xv로 쓰지 않는다.

프로그램은 다음 의존성을 직접 전개한다.

1. A.2의 모든 E 단계, scalar Q의 integrating factor, A.13의 정확한 wait.
2. angular reset의 선형 행을 소거한 뒤 남는 작은 quadratic root.
3. 실제 M/J의 두 선형 행과 amplitude에 affine인 두 end-bump 계수.
4. 참조 prefix, angular 보정의 에너지 변화, 모든 outer 단계와 무한 power
   tail을 포함한 실제 total-S amplitude 다항식 및 그 양의 root.
5. 각 실제 U/M 분기, 보정 bump별 compact prefix, 보존된 mean 구간과 전체
   pulse의 두 weighted Ω 적분.

`totalOuterEnergy`는 **A.2 참조 prefix와 outer schedule의 amplitude 선택용
에너지**다. inner gluing 뒤 최종 `integral E0^2`와 같다고 표시하지 않는다.
B.8가 보존하는 조합은 `S=integral(U^2-E^2/2)`이며, 코드의 amplitude 식은
동일 참조의 U² prefix와 E² 에너지를 한 쌍으로 사용한다.

`I1Right`부터 Xp까지는 U=0, M=eta*mConst인 20 log-unit 구간이다. 그 구간의
실제 `m3` 기여는 `mConst^2*(exp(20)-1)/(4*Xp)`, `m5` 기여는 정확히
`-5*mConst^2`다. 이전 Imean 5-unit 대조를 이 전체 보존 구간으로 확장했다.

그래프의 모든 적분은 integrand·변수·양 끝점을 가진다. root는 명시적 선형
소거와 제곱근이며 별도의 이름만 있는 oracle leaf가 없다. η 미분은 product,
chain, Leibniz 규칙으로 전개한다. 현재 binary64 진단기는 원래 거대한
파라미터의 전역 함수값을 계산했다고 반환하지 않는다. 범위를 벗어나면
`EXACT_SOURCE_SCALE_NOT_REPRESENTABLE` 또는 `RESOURCE_LIMIT`로 끝난다.
그 진단기의 Simpson refinement 차이는 인증 오차가 아니다.

## 4. 원래 C.12와 I1 수리를 생략하지 않는 오차 처리

같은 실제 source의 `R`, `N=1+ceil(R^50)`을 유지한다. 검증된 C.12 계약은
원래 변화와 I1 복구를 합친 U/M의 factorial `C_eta^2` 차이를 `R^22/N`로
제어한다. 변화는 J 밖에서 정확히 0이며, `1/R<=X<=R`는 J에서만 사용한다.
전체 Xv가 R보다 작다는 추가 가정은 하지 않는다.

위의 derivative-free 환원에 이 차이를 대입하면 전 η에서

\[
 |P_{final}-P_{preC12}|,\ |F_{final}-F_{preC12}|
 <R^{30}/N<R^{-20}\le2^{-260}.
\]

이 결과 덕분에 두 Ω **값**을 계산하기 위해 거대한 N개 phase를 직접 모두
샘플할 필요가 없다. 위상을 평균으로 바꾼 것과도 다르다. 실제 동일 N의
변화 전체를 명시적인 나머지로 유지한다.

그러나 η 미분 m차의 debt에는 source와 C.12/I1의 `m+2`차 η 경계가 필요하다.
현재 값 경계를 그 미분 경계로 승격하지 않는다. 또한 작은 velocity 변화의
반지름 미분은 O(1)일 수 있으므로 이 결과를 N5의 shear/phase/growth 인증에
적용하지 않는다.

## 5. 남은 실제 작업

전역 N4-04 완료에는 같은 실제 nonlinear axis의 전체 η evaluator를 B.22,
B.26, B.34와 실제 B.8 root까지 이어, pre-C12 U와 누적 평균을 전 구간에서
평가해야 한다. 이어 여섯 정칙 적분과 outer pulse 적분을 둘러싸고, 원래 두
Ipos inverse block에 완전한 debt를 넣어야 한다. 다음 차수 귀납에는 위에서
구분한 η 미분의 전체 family도 필요하다.

이는 source recipe나 사용자 파라미터가 없어서 생긴 문제가 아니다. 이미
선정된 같은 source를 실행하는 함수·적분 어댑터가 아직 완전히 연결되지
않았다는 의미다. 새 arbitrary-η core 경로가 추가되더라도 B.26 실제 collar
및 B.8/global integral 단계와 각각의 scope를 확인해야 한다.

## 6. 재현과 증거

저장소 루트에서 실행한다.

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-global-source.test.mjs
python research-ide/mathscope-m2/navier/tests/actual-global-source-independent.py
```

현재 전용 Node 시험 **14/14 PASS**, 별도 Python Fraction 검산 **184/184 PASS**다.
Python은 원래 (5.6)의 Ω를 직접 만든 뒤 적분하여 JS 환원과 비교한다. 전
구간 9개, 고정 부분구간 9개, regular jet 27개, 실제 pulse 좌표 25개와 경계항
생략 대조 18개를 포함한다. 실제 amplitude receipt의 SHA와 dyadic endpoints도
검사한다. 전역 actual moment 수치 완료, 새 Lean 실행, 실브라우저 배포 인증을
이 시험에서 주장하지 않는다.

핵심 원본은 `ONE_PROFILE_SPECIFICATION.md`의 같은 profile,
`OUTER_DERIVATION.md` §§2–7,
`actual-main-pulse-integral.json`, `C12_FREQUENCY_CONTRACT.md` §§1–4다.
정확한 경로와 SHA는 런타임 반환값 및
`tests/actual-global-source-manifest.json`에 보존한다.
