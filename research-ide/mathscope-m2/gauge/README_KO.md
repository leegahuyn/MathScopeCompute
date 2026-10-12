# M2 Y3–Y4: 실제 Wilson 격자, 고전장 오차구간, 표본·전달 연산자 검증

이 디렉터리는 M1의 원본을 수정하지 않는 추가 모듈이다. `mathscope-m1/gauge`의 실제 군, 충실한 표현, 완전한 Lie 기저, 행렬 연산과 고전장 미분·경로 적분을 가져와 사용한다. SU(2..6), SO(3,5..8), Sp(1..3), compact G2의 기존 표현이 대상이다. 군 이름만 바꿔 낮은 차원의 대리 행렬을 반환하지 않는다.

## 공개 API

```js
import {run,validate,getExamples,getCapabilities,getChecklist} from './index.mjs';
const example=getExamples().find(x=>x.id==='m2-su2-wilson-ensemble');
const result=await run(example.request.kind,example.request.input,{
  budget:example.request.budget,
  checkCancelled(){ /* Throw a CANCELLED error when cancellation is requested. */ },
  onCheckpoint(progress){ /* Optional UI progress consumer. */ }
});
```

facade는 `runJob(request,context)`와 `validateRequest(request)`도 제공한다. JSON 결과는 실제 행렬·표본·수치표와 `visualization`을 포함한다. 큰 데이터는 사전 크기 계산으로 거부하며 원본을 임의 축소하지 않는다. 등록 예제는 14개이고, 공개 요청 종류는 다음 여덟 가지다.

| 요청 | 실제 계산 범위 |
|---|---|
| `gauge.lattice` | 14개 실제 표현의 4D Wilson 격자, links·plaquettes·실수 Q·gauge 검사 |
| `gauge.ensemble` | Haar 또는 전체 Lie 기저 Metropolis, 실제 이력과 평형 진단 |
| `gauge.sampler-reference` | SU(2) 두 proposal의 독립 한 링크 Haar/Bessel 비교 |
| `gauge.lattice-refinement` | 동일 4D 점의 plaquette/clover 곡률·밀도와 출처별 오차구간 |
| `gauge.volume-refinement` | 동일 물리 부피에서 실제 링크·모든 셀의 에너지·실수 Q 적분 |
| `gauge.small-lattice-reference` | 비영 β의 실제 2×2×2×2 OPEN 격자에 대한 독립 reference |
| `gauge.reflection-positivity` | 선택 모델의 정리 가정 대응표와 반사 인수분해 |
| `gauge.transfer-cutoff` | SU(2) 공간 cube의 완전한 weight≤5 Gauss 절단과 오차 |

## 실제 수학적 규약

**격자.** 네 방향의 사이트 수는 `(Ns,Ns,Ns,Nt)`이며, 네 간격은 `(as,as,as,at)`이다. `V=Ns³Nt`, 셀 길이는 `L=Ns as`, `T=Nt at`이다. OPEN 경계에서는 마지막 사이트의 위치 간격이 `(Ns−1)as`라는 점도 별도로 기록한다. OPEN 바깥쪽 링크는 실제로 없으며 저장 슬롯은 `null`이다. 링크의 연속 자유도 수는 `activeLinks × dim(G)`이며 사이트 수나 저장 행렬 차원과 다르다.

**방향.** `U_xy`는 y의 fibre를 x의 fibre로 운반한다. 경로의 링크들은 왼쪽부터 경로 순서대로 곱하며 역방향은 dagger이다. 빈 경로는 항등행렬이다. M1의 `D=d+A` 규약에 따라 고전장 링크는 `exp(+A_mu dx_mu)`의 순서 있는 합성이다. composite midpoint 결과를 정확한 연속 holonomy라고 부르지 않는다.

**게이지 공변성.** 링크 변화는 `U'_xy = Ω_x U_xy Ω_y⁻¹`이다. 길이가 k인 경로에 대해 다음을 귀납한다.

`(Ω_0 U_01 Ω_1⁻¹)…(Ω_(k−1) U_(k−1)k Ω_k⁻¹) = Ω_0 (U_01…U_(k−1)k) Ω_k⁻¹`.

길이 1은 정의이고, 다음 링크를 곱하면 결합법칙과 `Ω_k⁻¹Ω_k=1`로 중간 항이 소거된다. 이것은 M1의 `GroupLaw.adjacent_transport_covariance`와 동일한 단계를 반복한 것이다. 닫힌 경로에서는 기준점의 conjugation만 남고 character는 불변이다. M1의 기존 Lean source/audit를 명시적으로 참조한다. 이 구현·브라우저 실행에서 새로운 Lean kernel 검사를 수행했다고 표시하지 않는다.

**Wilson 작용과 정규화.** 각 plaquette는

`U_mu(x) U_nu(x+mu) U_mu(x+nu)† U_nu(x)†`

이며, 작용은 `Σ_p β_p [1−ReTr_R(U_p)/d_R]`이다. M1의 실제 기본 불변형이 `B_G(X,Y)=−c ReTr_R(XY)`이면 `β=2 d_R c/g0²`이다. `xi=as/at`에 대해 공간 plaquette 계수는 `β/xi`, 시간 plaquette 계수는 `β xi`이다. 이것은 작은 간격 전개의 bare 정규화이며 renormalized physical scale를 결정하지 않는다. 표현을 바꾸면 c, d_R, coupling 의미와 모델 hash가 함께 바뀐다.

unitary 표현의 고유값은 절댓값이 1이므로 `−1≤Reχ_R(U)/d_R≤1`이다. 따라서 `0≤S≤2Σ_p β_p`. 정규화된 Haar 곱측도에 대해 `exp(−2Σβ_p)≤Z≤1`이다. 낮은 하한의 Float64 underflow는 로그 값과 함께 명시하고 0을 양의 정확 하한이라고 기록하지 않는다. 이 유한 확률측도 논증은 연속 R4 양자장 존재와 구분한다.

**곡률과 위상.** `(U_p−U_p†)/(2 area)`는 일반 G에서 자동으로 Lie algebra에 속하지 않는다. 따라서 M1의 완전한 실제 기저와 불변 내적을 이용해 Lie algebra에 정사영한다. forward plaquette 추정은 기준점에서 일반적으로 O(a), symmetric clover는 매끄러운 장의 내부 또는 주기 격자에서 O(a²)이다. 서로 독립적인 analytic `dA+[A,A]`와 BPST refinement를 비교하는 수치 검사가 있다. Q는 반올림하지 않은 추정값이다. OPEN 경계의 불완전한 stencil과 완료 사이트 수를 기록하며 임의 정수 위상 인증을 출력하지 않는다.

## 고전장 적분과 오차의 분리

`transport-certificates.mjs`는 각 군의 정확한 유리수 행렬 자료와 해당 장 규칙에서 별도로 도함수 상계를 만든다. EMBEDDED_BPST, FULL_BASIS_TRIAL, BPST_PLUS_PERTURBATION의 실제 Gaussian-polynomial/Fourier 모드를 사용한다. 이 bounds의 group/data hash가 결과에 포함된다. 다른 군의 차원이나 BPST의 공식을 이름만 바꿔 재사용하지 않는다.

길이 L의 좌표 방향 경로를 N분할할 때 midpoint의 적분 오차 상계는 `L³/N²·(M₂/24+M₀M₁/6)`이다. `M_k`는 이 경로를 포함하는 출처 창에서 A의 k차 도함수 행렬 norm 상계다. trapezoid 비교에는 `L³M₂/(8N²)`의 추가 generator 차이를 기록한다. source 평가, 28항 Taylor exponential 꼬리, scaling/squaring, 각 행렬 곱·합의 반올림, 실제 M1 저장 결과와 별도 audited 계산의 차이를 모두 더한다. 실제 고전장 링크 전부가 인증 개수에 포함되며, 몇 개의 대표 잔차만 전체 인증인 것처럼 표시하지 않는다.

`enclosures.mjs`의 기본 연산은 각 단계에서 IEEE-754 이웃 수로 구간을 바깥쪽으로 확장한다. exponential과 modified Bessel은 양의 급수와 명시적 꼬리, π는 Machin 식으로 감싼다. 입력 source·exact area·Gram inverse·matrix density까지 연결한다. 새 Lean kernel 증명이라는 표시는 하지 않는다. 경로가 출처 창을 벗어나거나 필요한 중간 상계가 예산을 넘으면 해당 요청을 거부한다.

국소 refinement는 **동일한 4D 점**에서 `as`와 `at`를 함께 줄인다. 독립 `dA+[A,A]`와 BPST 닫힌 밀도를 대조한다. symmetric clover fixture는 약 2차의 수치 수렴을 보이지만, 실제 표시되는 보수적 일반 상계는 1차라는 사실을 유지한다. discretization 항은 해상도를 높이면 0으로 가고 고정 Float64 반올림 항은 별도로 남는다. 아주 작은 격자 간격에서 무한히 정확해진다고 주장하지 않는다.

전체 부피는 별도 `gauge.volume-refinement`에서 계산한다. 기본 상자 `[-.5,.5]³×[-.375,.375]`를 고정하고, 방향별 셀 수 1, 2, 3에서 **1, 16, 81개 셀**을 모두 적분한다. 실제 원본 링크도 전부 보존한다. 3분할처럼 이진수로 정확히 표현되지 않는 간격은 상자 길이/n의 구간을 따로 유지하고, 저장 좌표와 경로의 변형 오차를 추가한다. summed curvature/density bound, Riemann quadrature bound, 좌표·matrix·합산 반올림을 각각 기록한다.

연속 참조는 링크 곱을 사용하지 않고 닫힌 BPST 밀도 `q=C/(ρ²+r²)^4`를 20⁴개 midpoint로 독립 적분한다. `|∂jj q|≤8C/ρ¹⁰`에서 얻은 tensor quadrature remainder가 연속 적분을 감싼다. 기본 Q 참조는 대략 `[0.17820837,0.18091555]`; 격자 Q는 `0.01465730 → 0.13195933 → 0.15828350`이다. 에너지는 `4.31064417 → 11.71712766 → 13.11113498`, 참조는 대략 `[14.07076909,14.28451909]`다. 각 오차구간이 서로 겹치지 않으면서 감소하는 것을 완료 조건으로 사용한다. 불충분한 reference resolution은 PARTIAL로 남는다.

이것은 같은 **유한 물리 상자**에서 매끄러운 고전장의 에너지와 실수 위상량을 근사한 결과다. R⁴ 전체의 정수 bundle invariant나 양자장 continuum construction은 별도 주장이다. BPST 출처 창 밖의 양의 밀도 꼬리는 포함된 공의 정확한 질량식에서 별도 상계로만 제공한다.

## 샘플러가 목표 측도를 유지하는 이유

`SU2_HAAR_METROPOLIS`는 정규분포 네 개를 단위 3구면으로 정규화하여 실제 SU(2) Haar 행렬을 만든다. 전체 SU(2) 그룹이 아닌 큰 군의 SU(2) 부분군에 이것을 적용하고 큰 군 전체 sampler라고 표시하는 요청은 거부한다.

`FULL_BASIS_LIE_METROPOLIS`는 선택한 군의 모든 compact-basis 방향에 대칭인 실수 계수를 생성하고 `Q=exp(X)`, `U'=QU`를 사용한다. `X`와 `−X`의 법칙이 같아서 `Q`와 `Q⁻¹`의 법칙도 같다. exponential 좌표의 Lebesgue density를 Haar density라고 가정하지 않는다. inversion-symmetric proposal measure와 Haar 불변성만으로 양방향 proposal이 대칭임을 얻는다.

수락률은 전체 영향을 받는 plaquette의 차이 `ΔS=S(U')−S(U)`로부터 `min(1,exp(−ΔS))`이다. 상세균형의 핵심 항은

`exp(−S(U)) min(1, exp(−(S(V)−S(U)))) = min(exp(−S(U)),exp(−S(V)))`

로 대칭이다. 갱신 링크는 매번 균일하게, 복원을 허용하여 선택한다. 한 sweep은 activeLinks회 random-scan 갱신이다. 보정되지 않은 추정 작용이나 부분군의 가짜 자유도를 사용하지 않는다. 누적 unitarity·group membership drift가 한계를 넘으면 실패하고 몰래 reunitarize하지 않는다.

각 replica의 실제 수락률·warmup·작용·plaquette·Polyakov loop·위상 추정 이력을 남긴다. 냉각 시작과 Haar hot 시작은 SU(2)에서 제공한다. 다른 G의 지수함수 기반 무질서 초기값은 Haar hot start라고 부르지 않는다. 고정 seed 재현만으로 분포 검증을 승인하지 않는다.

## 통계와 독립 검증

관측량별로 positive paired autocorrelation sum과 monotonic truncation을 이용해 `tau_int≥1/2`를 계산하고 `ESS=N/(2 tau_int)`를 기록한다. window, bin 크기, replica별 설정과 batch-mean 오차 확인을 함께 남긴다. 작은 ESS, 상수/정체 series, 충분하지 않은 window에는 신뢰구간을 생성하지 않는다. 충분한 경우에도 구간은 평형을 전제로 한 근사 Gaussian 구간이다. 구간별 평균과 replica 차이, split-Rhat를 정해 둔 진단 임계값으로 비교한다. action, plaquette, 가능한 Polyakov, 실수 topology history를 각각 검사하며 real-Q mobility는 별도 진단이다. 2,048개의 상수 표본과 시작점별로 분리된 chain, 아주 작은 proposal로 정체된 실제 chain은 모두 승인되지 않는다. 실수 Q가 움직인다는 진단을 정확한 정수 위상 sector 사이의 mixing 정리로 바꾸지 않는다.

독립 한 링크 검사는 정확한 SU(2) Haar 각도 밀도 `(2/pi)sin²(theta)dtheta`를 직접 적분한다. 이 각도 quadrature는 행렬 Monte Carlo 갱신을 사용하지 않는다. 테스트는 별도의 Bessel power series로 평균·2차 모멘트·Z까지 대조한다. β=0의 전체 작은 격자에서는 product Haar가 정확한 목표이며 elementary plaquette 평균 0을 확인한다. 비영 β의 2×2×2×2 OPEN 격자는 별도의 quaternion 곱으로 product-Haar configuration을 생성하고 `exp(−S)` importance weight를 사용한다. Metropolis dense-matrix 경로를 호출하지 않는다. 24 plaquette의 평균은 product Haar에서 분산 `1/(4Np)`를 가지므로 Bernstein/Hoeffding와 union bound로 사전에 정한 reference 구간을 만든다. cold/hot 두 결과가 이 구간과 상관보정 오차를 만족하는지 검사한다. 확률적 구간은 이상적인 독립 Haar 표본 모형을 전제로 하며, 고정 PRNG가 수학적 독립성의 증명이라는 주장은 하지 않는다. 이 small-case 검증을 다른 모든 군의 정량적 검증으로 확대하지 않는다.

`tests/gauge.test.mjs`는 방향·빈/역 경로, 비가환 순서 오류, 중심 holonomy, 14개 실제 군의 게이지 불변성, G2 위상/에너지 공변성, 잘못된 입력과 예산, LOD/hash 불변성, 실제 수락률, Haar 모멘트, 독립 Bessel oracle, beta=0 전체 격자, AR(1) 통계 상관시간, refinement 차수와 취소를 검사한다. `tests/independent.py`는 JS 행렬 코드를 가져오지 않고 Python complex 산술로 raw source 링크의 plaquette와 작용을 재계산한다. inverse 누락 mutation도 거부한다.

```sh
node --test research-ide/mathscope-m2/gauge/tests/gauge.test.mjs
node research-ide/mathscope-m2/gauge/tests/generate-evidence.mjs
python research-ide/mathscope-m2/gauge/tests/independent.py
```

## 시각화·revision·완료 범위

`modelHash`는 군·표현·작용·간격·부피·경계를 묶는다. 실제 링크와 modelHash로 `sourceHash`를 만들고, ensemble manifest는 seed·algorithm revision·초기값·sample list·flow=null·최종 raw 링크를 묶는다. 선택한 x4 단면과 LOD stride는 `observationHash`에만 반영된다. 전체 원본 링크·Monte Carlo 이력·action은 LOD 변화로 바뀌지 않는다.

한 점은 실제 `measurements.sites[sourceIndex]`의 값에 연결되며, 공간 좌표·Euclidean x4·알고리즘 sweep 축을 구별한다. scalar 단면으로 gauge connection을 복원하는 버튼은 없다. ensemble 출력은 실제 마지막 원본 격자 단면과 두 replica의 실제 이력 곡선을 제공한다. source link와 단면에 없는 정보는 명시적으로 보존하거나 손실로 기록한다.

기본 96표본 예시는 실제 계산을 수행하지만, 특정 seed에서 ESS가 작으면 PARTIAL이다. 코드 실행 완료를 정량 연구 완료로 바꾸지 않는다. 원문 Y3/Y4 16개 기준의 명시된 유한 모델 완료 조건은 `IMPLEMENTED_FINITE_SCOPE`로 연결했다. 원문을 그대로 보존한 대응표는 `evidence/criterion-completion.json`이다. 이 기준 상태는 모든 사용자 입력을 성공으로 표시하겠다는 뜻이 아니다. 과소해상도·작은 ESS·잘못된 정리 가정·미지원 절단은 실제 실행 상태에서 계속 PARTIAL 또는 UNSUPPORTED로 남는다. 일반 quantum continuum, 무한 부피, 양자 mass gap, 모든 모형의 균일 평형 또는 정수 위상 mixing은 완료 주장에 포함하지 않는다.

## Reflection positivity와 실제 전달 연산자 절단

`reflection.mjs`는 compact faithful representation, normalized Haar, local Wilson action, nonnegative coefficients, reflection-symmetric boundary, positive-time gauge-invariant observable algebra의 여섯 가정을 기록한다. SU(N), isotropic, periodic 조건에는 Lüscher 1977의 정리를 직접 적용한다. 일반 compact G, anisotropy, OPEN 조건에는 정리의 증명 방식을 확장한 별도 유도를 보이며, 이를 원문이 그대로 말한 내용인 것처럼 인용하지 않는다. negative β, arbitrary measure, gauge-variant algebra, 새 개선·비국소 항은 자동 승인되지 않는다.

전체 함수 대수에 대한 이유는 character 계수의 비음수성, Haar Gauss projector, `T=M P_G K P_G M`의 인수분해다. `M=exp(−S_spatial/2)`, `P_G`는 정규 Haar gauge 평균이며, K의 character Fourier 계수가 비음수다. 양의 숫자 행렬 몇 개를 이 정리의 증명으로 사용하지 않는다. β>0의 strict positivity는 injectivity를 뜻하며 균일 spectral gap을 뜻하지 않는다.

`transfer.mjs`의 대상은 SU(2)의 OPEN 2×2×2 공간 cube다. 12 edge와 8개의 trivalent vertex에 대해 총 `Σ_edges 2j≤5`인 6,188개 assignment를 전부 확인한다. Gauss parity·triangle 조건을 통과하는 7개 상태는 vacuum과 6개 fundamental face character다. 이는 이 선언된 전체 weight cutoff의 완전한 정규직교 physical basis이며, 임의 graph나 per-link cutoff를 같은 기저로 바꾸지 않는다.

무한차원 `P_G L²(SU(2)^12,dHaar)` 위의 T와 `T₅=M P₅ K P₅ M`를 구별한다. 계산하는 7×7 행렬은 `X*X=Λ^(1/2) G Λ^(1/2)`의 Gram companion이다. 여기서 `Xe_i=√λ_i Mφ_i`, 따라서 `T₅=XX*`; 두 연산자는 같은 비영 spectrum을 갖는다. `Mφ_i`가 그대로 정규직교라고 가정하지 않는다.

정규화된 kinetic eigenvalue는 `κ_j=I_(2j+1)(β_t)/I_1(β_t)`다. 양의 Bessel 급수에서 `κ_j≤q^(2j)`, `q=min(1,β_t exp(β_t²/12)/4)`를 얻는다. 누락 상태의 weight가 최소 6이므로 `‖T−T₅‖≤q⁶`이다. Gram 적분은 독립 product-Haar cubature로 계산하고 49 entry의 동시 Hoeffding 구간과 arithmetic allowance를 따로 더한다. 기본 β=.5, 4,096 draws에서는 전체 operator error upper가 약 .05122로 요청한 .1보다 작다. 큰 β나 더 작은 허용오차에서 이 bound가 쓸모없으면 PARTIAL이다.

양의 Gram 합과 exact invariant basis는 positivity와 Gauss symmetry를 보존한다. Euclidean 전달 연산자는 unitary가 아니며, 계산된 양의 companion의 `H=−log(T_hat)/at`에 대한 finite real-time evolution을 따로 검사한다. 이 유한 행렬은 continuum QFT나 mass-gap 해결을 출력하지 않는다.

## 재현 가능한 검증 자료

`tests/certification.test.mjs`는 source별 적분·행렬 오차, 14개 표현, 고정 부피 수렴, 독립 비영 β 비교, stalled chain, 잘못된 정리 가정, 누락 spin basis, 음의 행렬, 과소해상도·예산·취소를 검사한다. `tests/independent-certification.py`는 JS 수치 구현을 가져오지 않고 80자리 Decimal과 NumPy로 exponential, Bessel, exact BPST 직선 primitive, Fourier/Gaussian source, Gauss basis, Gram spectrum, 원본 4D action, 고정 부피의 모든 cell 에너지·Q를 다시 계산한다. 연속 상자 적분은 별도 16/24점 tensor Gauss–Legendre oracle로 검증한다. 잘못된 exponential·transport·volume element 대조군도 저장한다.

```sh
node --test research-ide/mathscope-m2/gauge/tests/gauge.test.mjs research-ide/mathscope-m2/gauge/tests/certification.test.mjs research-ide/mathscope-m2/gauge/tests/visualization.test.mjs
node research-ide/mathscope-m2/gauge/tests/generate-certification-evidence.mjs
python research-ide/mathscope-m2/gauge/tests/independent-certification.py
node research-ide/mathscope-m2/gauge/tests/generate-evidence.mjs
python research-ide/mathscope-m2/gauge/tests/independent.py
node --test research-ide/mathscope-m2/gauge/tests/worker.test.mjs
```

Worker 검사는 실제 배포용 Worker bytes를 독립 thread에서 실행하여 모든 등록 예제의 전체 mathematical hash를 로컬 모듈 결과와 비교한다. 카메라·LOD뿐 아니라 알고리즘 index, 물리 좌표, spectral index와 logical assumption 축의 구분을 검사한다. 최신 개수·해시·결과는 `evidence` 파일에 기록된다.

## 참고 근거

- 사용자 Blueprint pp.41–44, SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.
- David Tong, [Gauge Theory Chapter 4](https://davidtong.org/pdfs/teaching/gauge-theory/gauge4.pdf), §4.2.1–4.2.2.
- Ulli Wolff, [Monte Carlo errors with less errors](https://arxiv.org/abs/hep-lat/0306017), Monte Carlo 상관 오차에 관한 참고 문헌. 이 코드의 구체적 추정 규칙은 위에 독립 명시했다.
- Martin Lüscher, [Construction of a selfadjoint, strictly positive transfer matrix for Euclidean lattice gauge theories](https://doi.org/10.1007/BF01614090). [원문 PDF](https://bib-pubdb1.desy.de/record/396349/files/7611148.pdf), §II A–C, Propositions 1–2와 equations (17), (20)–(23), (28)–(30)의 가정 대응표를 사용한다.

- NIST [DLMF 10.25.2](https://dlmf.nist.gov/10.25.E2), modified Bessel 양의 급수와 [10.32.2](https://dlmf.nist.gov/10.32.E2)의 Haar radial integral.
