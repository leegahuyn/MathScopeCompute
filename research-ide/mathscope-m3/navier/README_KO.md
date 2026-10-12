# MathScope M3 · N6/N7/N8

## 결과와 원래 완료 기준

이 디렉터리는 M3의 유체역학 항목에 대한 **실행 가능한 일부 구현**이다. 실제 원문 해의 완전한 N6 반복이나 N7 전역장을 완성했다고 선언하지 않는다. 원래 24개 체크리스트 중 독립 Fourier–Galerkin 분기의 N8-01, N8-02, N8-03을 충족한다. 나머지 21개 기준의 남은 의무는 상위 `N6_PROGRESS.json`, `N7_PROGRESS.json`, `N8_PROGRESS.json`에 보존한다.

최신 첨부 `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf`의 SHA256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이다. 저장소가 앞서 사용한 `005314` 파일의 기록된 SHA256과 같다. pp62,64,66의 24개 제목과 요구사항은 공백을 제외하고 모두 일치한다. 원문 대조 기록은 `evidence/blueprint-source-review.json`에 있다.

원전은 [OpenAI Navier–Stokes PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), 166쪽, SHA256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. 새 코드는 그 PDF의 §7–10을 직접 확인한 뒤 작성했다. 아래 수식 번호는 이 판본을 가리킨다.

## 실행 API

```js
import {
  runNavierM3,
  replayNavierM3,
  NAVIER_M3_EXAMPLES,
  NAVIER_M3_PROGRESS
} from './index.mjs';

const finiteRun = await runNavierM3({
  package: 'N8',
  operation: 'galerkin',
  parameters: {
    cutoff: 2,
    viscosity: 1,
    endTime: 0.5,
    initialStep: 0.1
  }
});

const actualSourceInverse = await runNavierM3({
  package: 'N6',
  operation: 'source-mean-map'
});

const replay = await replayNavierM3(finiteRun);
```

`status`는 원래 패키지의 완료 범위이고, `executionStatus`는 해당 유한 연산의 실행 결과다. `results`의 연산 성공은 `sourceBoundaries.completeN6` 같은 전체 완료 필드를 바꾸지 않는다. 모든 결과는 입력·결과 hash, 실제 구현 파일 hash, 원래 parameter hash, M2 근거 hash와 graph namespace를 포함한다. 재실행은 결과뿐 아니라 증거 등급, 시각화 자료, 원천 정보와 완료 주장도 새로 계산한 값과 비교한다.

| 패키지 | 연산 | 실제 실행 범위 |
|---|---|---|
| N6 | `source-mean-map` | 수정하지 않은 원래 M2 mean patch와 극소 양의 λ를 사용한 다섯 profile의 고정 inverse 연결 |
| N6 | `harmonic-response` | 주어진 유한 계수 보간 모델에 대한 (7.13) projected ODE |
| N6 | `signed-covariance` | 고정 양의 두 amplitude에서 signed 2×2 inverse와 quadratic 항 |
| N6 | `temporal-inverse` | 실제 비유리 방향의 유한 auxiliary Fourier inverse와 조건부 tail |
| N6 | `five-moments` | 별도로 명시한 유한 λ,a의 다섯 방정식과 독립 radial 적분 |
| N6 | `source-moment-map` | 원래 Imean profile과 symbolic denominator 명세 |
| N6 | `order-ledger`, `harmonics`, `workbench` | 정확한 유리수 차수, 생성 주파수, 해당 유한 검증 묶음 |
| N7 | `localization`, `force-extension`, `periodization`, `workbench` | 입력 가정이 필요한 cutoff·jet tail·지지 분리 연산과 관문 |
| N8 | `galerkin`, `acceptance` | 실제 독립 주기 Fourier–Galerkin 계산 |
| N8 | `near-terminal` | 정확한 양의 τ와 source scale 좌표; 원문 속도 값은 아직 아님 |

## N6: 실제 원천과 연결한 부분

### M2 원천 보존

`source-inheritance.json`은 common source attempt6, numerical source attempt4와 최종 M2 판정을 실제 파일 byte로 검증한다. source4의 초기·후기 import manifest에 있는 250개 원천 파일도 hash로 대조한다. 이 검사는 기존 계산의 **상속과 무결성** 검사이며, 과거의 큰 계산을 다시 실행했다는 뜻이 아니다.

M2 common covariance certificate의 `n6Interface`에는 고정 배경 속도·압력, primary wave, 실제 full curl wave와 curl remainder, 전체 물리 residual, temporal cutoff force와 그것을 뺀 residual의 root가 있다. 각각을 graph hash와 함께 보존한다. 다른 expression graph의 같은 정수 root를 동일한 수학 대상으로 취급하지 않는다. 특히 M2의 배경 잔차와 temporal cutoff force에 대한 flatness를, 아직 보정하지 않은 **전체 Navier–Stokes residual**의 flatness로 옮기지 않는다.

### 원래 mean patch의 고정 inverse

`source-mean-map.mjs`는 기존 M2의 다음 함수를 직접 import해 실행한다.

- `validateParameterGraph`
- `actualMeanPatchDefinitions`
- `evaluateActualMeanPatchJet`
- `boundActualMeanPatchJets`

고정된 원래 매개변수는 `T=exp(1048576)+10`, `lambda=exp(-1000*T)`, `h=exp(-8002*T)`이다. λ,h는 양의 정확한 expression으로 남는다. `[0,2^-1000]`은 양의 원래 값의 외포 구간이다. 구간의 0 끝점을 값으로 치환하지 않는다.

원래 Imean 배경으로부터 (8.24)의 `Gq=0`, `Vq=a(eta)*x^(-1-2*lambda)`를 연결한다. 여기서

`a = Kmean*(2*X0Imean)^(1/2+lambda)/(1+eta^2)`

이고 `|eta|<=1`에서 엄밀히 양의 공통 하한을 갖는다. `x0=sqrt(2*X0Imean)*exp(1/2)`, `d=1/5`를 선택하고, support가 `x0<x<1.1*x0`인 양의 bump를 `exp(j/5)`만큼 확대한 profile을 사용한다. 세 azimuthal support와 두 axial support, 그 사이를 포함하는 axial potential의 전체 지지는 원래 `0<log(X/X0Imean)<5` 안에 들어간다.

다섯 power moment는 무작위 점표본 대신 각 구간에서 bump·power의 하한과 상한을 적분해 외포 구간으로 계산한다. 모든 moment의 하한이 양수다. `(8.25)`의 angular block은 양의 실제 moment와 source scale을 분리한 Vandermonde inverse로 실행하며, 그 원소들의 구간과 행별 inverse norm 상계를 반환한다.

axial block은 원래 λ가 극도로 작아 보통 부동소수점에서 두 열이 같아 보인다. 코드는 `delta=1-exp(-2*d*lambda)`를 부동소수점 뺄셈으로 계산하지 않는다. 대신

`delta=lambda*theta`, `theta=(1-exp(-2*d*lambda))/lambda`

로 두고 `2*d-2*d*d*lambda <= theta <= 2*d`를 사용한다. λ를 곱한 axial coefficient를 유한 구간으로 계산하고, 원래 coefficient를 복원하는 정확한 `1/lambda` 인자를 명시한다. 이 방식은 조건 불량을 없애거나 λ와 무관한 상수를 주장하지 않는다. 원래 theorem이 허용하는 **고정 λ에 의존하는 상수**를 보존한다.

이로써 실제 원래 배경에서 사용할 **고정된 다섯 moment inverse**의 지원집합·양성·가역성 연결을 확보했다. 현재 full-curl state의 `gr,P,Jtheta,Jz`를 계산하고 그 값에 inverse를 적용한 것은 아니다. 따라서 N6-06 전체는 PARTIAL이다. `five-moments`의 기본 λ=.2 계산은 이 원래 매개변수를 대신하지 않는 별도 유한 계산이다.

### 다른 보정 연산

`harmonic-response`는 moving normal에 직교하는 amplitude를 진화시키고, 같은 normal의 도함수를 사용해 (7.13)의 pressure amplitude를 복원한다. 현재 입력은 명시적인 piecewise-linear 계수 모델이다. 원래의 smooth coefficient·공간 jet과 cutoff full curl을 아직 연결하지 않았다.

`signed-covariance`는 `delta a=H^-1(Sigma/epsilon)/(2a)`를 사용하고 a를 고정한다. signed target을 허용하며 새 increment의 covariance square와 기존 wave·curl과의 교차항을 별도로 남긴다. 이 유한 2×2 예제의 H를 원래 M2 H라고 부르지 않는다.

`temporal-inverse`는 원래 `vt=(sqrt(2)-1,1)`에 대해 `(k2-k1)^2-2*k1^2`가 0이 아닌 정수임을 이용해 divisor를 계산한다. 유한 real Fourier polynomial의 cancellation을 검증한다. 일반 smooth source의 tail에는 실제 `C^(m+4)` 도함수 상계가 필요하며, 입력된 상계가 검증되지 않았으면 조건부로 표시한다. axial potential의 radial cutoff remainder와 압력 재구성은 후속 의무다.

원래 N6가 다음에 필요로 하는 첫 단계는 **수정하지 않은 실제 primary full curl을 시작점으로 각 평균을 위상 대입 전에 취한 후 `gr`와 압력을 만들고, 그 동일한 state에 temporal·moment 보정을 적용하는 것**이다. 현재 source certificate만으로 Haar 평균이나 반경 전체 적분을 계산했다고 간주할 수 없다. 실제 네 단계 반복, all-order class 상수, 최종 shrinking cutoff sum과 Lemma5.4 tail 비교도 미완료다.

## N7: 전역장과 force

`localization.mjs`는 qstar 안에 들어가는 cutoff 규모, `curl(cA)`의 `grad(c) cross A` 항, 전체 PDE residual로 정의하는 force, `div f`를 포함한 pressure 관계를 보존한다. 실제 최종 N6의 A,B,p가 없으므로 원래 전역장이나 그 force를 계산한 상태는 아니다.

finite force-jet bound를 입력하면 증가하는 bj를 선택하여 요청된 유한 differentiated cutoff 조건을 만족시키는 schedule을 만든다. 그 입력을 원래 terminal jet의 인증값으로 인정하지 않으며, 유한 jet만으로 C-infinity나 t=1의 velocity 연장을 주장하지 않는다.

주기화는 모든 축의 지지가 분리되고, same forcing/data·periodic pressure가 유지될 때에만 허용한다. 겹치는 translate는 비선형 교차항을 만들므로 거절한다. 원래 source compact K의 에너지, terminal force의 모든 차수, 실제 Xin 경로의 e0와 remainder는 아직 구현되지 않았다.

## N8: 독립 Fourier–Galerkin 계산

`galerkin.mjs`는 `[-K,K]^3`의 모든 정수 wavevector를 보유하는 2π 주기 모델이다. Leray projection은 k=0을 따로 취급한다. 실제 convolution은 모든 retained `p+q=k` 쌍을 합한다. 별도 radix-2 3D FFT는 retained products가 alias되지 않도록 `n>3K` grid를 사용한다. Nyquist 또는 부족한 padding 규약을 허용하지 않는다.

압력은 forcing의 longitudinal component도 포함해 복원한다. diffusion에는 Crank–Nicolson, convection에는 explicit Heun을 사용한다. 큰 한 step과 작은 두 step의 차이, Fourier l1 기반 CFL, 에너지 balance defect가 모두 승인 조건이다. overflow·최대 step 수·최소 dt 등 예산을 넘으면 마지막으로 해결한 시점과 이유를 보고한다.

실제 관측 자료는 final Fourier field에서 직접 평가한 81개 위치·속도와 accepted-step 에너지 곡선이다. domain은 고정된 주기 상자이며 vector scale은 1이다. core energy나 각속도, particle trajectory로 다른 이름을 붙이지 않는다. 현재 81개 표본은 순간 벡터이며 유체 입자 적분이 아니다.

`positiveTau`는 십진 mantissa와 exponent를 먼저 처리한다. `1e-1000`처럼 Number로 변환하면 0이 되는 입력도 정확한 양의 값과 logτ를 유지한다. 실제 source-admissible qbig 확인과 원문 속도 재구성이 아직 없으므로 이 좌표 계약만으로 near-terminal approximation을 인증하지 않는다.

## 검증과 재현

```bash
python research-ide/mathscope-m3/navier/tests/build-source-inheritance.py
node research-ide/mathscope-m3/navier/tests/run.mjs
python research-ide/mathscope-m3/navier/tests/independent_numpy.py
```

첫 명령은 기존 M2의 원천 hash를 검증하고 현재 구현 pin을 생성한다. 구현을 고쳤다면 실행·번들 전에 다시 실행한다. 두 번째는 36개 선택 검사와 11개 예제 재실행을 저장한다. 세 번째는 NumPy의 독립 FFT로 JS 결과를 비교한다. 최신 첨부 PDF에 접근할 수 있을 때 `tests/build-progress.py`는 원래 criterion 대조와 진행표를 재생성한다.

| 검사 | 관측 |
|---|---:|
| JS direct convolution 대 JS padded FFT | 정규화 오차 약 1.668×10^-16 |
| high-mode aliasing negative control | 정규화 불일치 약 0.939, 검출됨 |
| Taylor–Green 시간반분 설계차수 | 2.0047, 2.0012 |
| 유한 projected ODE 대 정확한 endpoint | 오차 약 9.24×10^-11 |
| 별도 유한 다섯 radial 적분 | 정규화 오차 약 3.84×10^-15 |
| NumPy 대 JS direct / FFT | 약 1.35×10^-16 / 1.79×10^-16 |
| NumPy finite convection energy cancellation | 약 3.47×10^-18 |

이 값들은 선택된 유한 입력의 산술·알고리즘 검증이다. 전역 PDE의 오차 enclosure, 원문의 all-order 해석적 명제, 또는 새 Lean 증명을 대신하지 않는다. `evidence/acceptance.json`, `evidence/independent-numpy.json`과 개별 예제 JSON에 정확한 입력·측정값·재실행 결과가 있다.

P7과 M2의 코드·근거 파일은 수정하지 않는다.
