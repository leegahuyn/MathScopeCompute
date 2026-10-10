# M2 Y3–Y4: 실제 유한 Wilson 격자와 표본 진단

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

요청 종류는 `gauge.lattice`, `gauge.ensemble`, `gauge.sampler-reference`, `gauge.lattice-refinement`이다. facade는 `runJob(request,context)`와 `validateRequest(request)`도 제공한다. JSON 결과는 실제 행렬·표본·수치표와 `visualization`을 포함한다. 큰 데이터는 사전 크기 계산으로 거부하며 원본을 임의 축소하지 않는다.

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

## 샘플러가 목표 측도를 유지하는 이유

`SU2_HAAR_METROPOLIS`는 정규분포 네 개를 단위 3구면으로 정규화하여 실제 SU(2) Haar 행렬을 만든다. 전체 SU(2) 그룹이 아닌 큰 군의 SU(2) 부분군에 이것을 적용하고 큰 군 전체 sampler라고 표시하는 요청은 거부한다.

`FULL_BASIS_LIE_METROPOLIS`는 선택한 군의 모든 compact-basis 방향에 대칭인 실수 계수를 생성하고 `Q=exp(X)`, `U'=QU`를 사용한다. `X`와 `−X`의 법칙이 같아서 `Q`와 `Q⁻¹`의 법칙도 같다. exponential 좌표의 Lebesgue density를 Haar density라고 가정하지 않는다. inversion-symmetric proposal measure와 Haar 불변성만으로 양방향 proposal이 대칭임을 얻는다.

수락률은 전체 영향을 받는 plaquette의 차이 `ΔS=S(U')−S(U)`로부터 `min(1,exp(−ΔS))`이다. 상세균형의 핵심 항은

`exp(−S(U)) min(1, exp(−(S(V)−S(U)))) = min(exp(−S(U)),exp(−S(V)))`

로 대칭이다. 갱신 링크는 매번 균일하게, 복원을 허용하여 선택한다. 한 sweep은 activeLinks회 random-scan 갱신이다. 보정되지 않은 추정 작용이나 부분군의 가짜 자유도를 사용하지 않는다. 누적 unitarity·group membership drift가 한계를 넘으면 실패하고 몰래 reunitarize하지 않는다.

각 replica의 실제 수락률·warmup·작용·plaquette·Polyakov loop·위상 추정 이력을 남긴다. 냉각 시작과 Haar hot 시작은 SU(2)에서 제공한다. 다른 G의 지수함수 기반 무질서 초기값은 Haar hot start라고 부르지 않는다. 고정 seed 재현만으로 분포 검증을 승인하지 않는다.

## 통계와 독립 검증

관측량별로 positive paired autocorrelation sum과 monotonic truncation을 이용해 `tau_int≥1/2`를 계산하고 `ESS=N/(2 tau_int)`를 기록한다. window, bin 크기, replica별 설정과 batch-mean 오차 확인을 함께 남긴다. 작은 ESS, 상수/정체 series, 충분하지 않은 window에는 신뢰구간을 생성하지 않는다. 충분한 경우에도 구간은 평형을 전제로 한 근사 Gaussian 구간이다. 구간별 평균과 replica 차이를 정해 둔 진단 임계값으로 비교한다.

독립 한 링크 검사는 정확한 SU(2) Haar 각도 밀도 `(2/pi)sin²(theta)dtheta`를 직접 적분한다. 이 각도 quadrature는 행렬 Monte Carlo 갱신을 사용하지 않는다. 테스트는 별도의 Bessel power series로 평균·2차 모멘트·Z까지 대조한다. β=0의 전체 작은 격자에서는 product Haar가 정확한 목표이며 elementary plaquette 평균 0을 확인한다. 비영 β의 일반 다중 링크 격자 및 모든 다른 군에 대한 장시간 외부 reference 검증은 아직 완료하지 않았다.

`tests/gauge.test.mjs`는 방향·빈/역 경로, 비가환 순서 오류, 중심 holonomy, 15개 실제 군의 게이지 불변성, G2 위상/에너지 공변성, 잘못된 입력과 예산, LOD/hash 불변성, 실제 수락률, Haar 모멘트, 독립 Bessel oracle, beta=0 전체 격자, AR(1) 통계 상관시간, refinement 차수와 취소를 검사한다. `tests/independent.py`는 JS 행렬 코드를 가져오지 않고 Python complex 산술로 raw source 링크의 plaquette와 작용을 재계산한다. inverse 누락 mutation도 거부한다.

```sh
node --test research-ide/mathscope-m2/gauge/tests/gauge.test.mjs
node research-ide/mathscope-m2/gauge/tests/generate-evidence.mjs
python research-ide/mathscope-m2/gauge/tests/independent.py
```

## 시각화·revision·완료 범위

`modelHash`는 군·표현·작용·간격·부피·경계를 묶는다. 실제 링크와 modelHash로 `sourceHash`를 만들고, ensemble manifest는 seed·algorithm revision·초기값·sample list·flow=null·최종 raw 링크를 묶는다. 선택한 x4 단면과 LOD stride는 `observationHash`에만 반영된다. 전체 원본 링크·Monte Carlo 이력·action은 LOD 변화로 바뀌지 않는다.

한 점은 실제 `measurements.sites[sourceIndex]`의 값에 연결되며, 공간 좌표·Euclidean x4·알고리즘 sweep 축을 구별한다. scalar 단면으로 gauge connection을 복원하는 버튼은 없다. ensemble 출력은 실제 마지막 원본 격자 단면과 두 replica의 실제 이력 곡선을 제공한다. source link와 단면에 없는 정보는 명시적으로 보존하거나 손실로 기록한다.

기본 96표본 예시는 실제 계산을 수행하지만, 특정 seed에서 ESS가 작으면 PARTIAL이다. 코드 실행 완료를 정량 연구 완료로 바꾸지 않는다. Y3-06/07의 일반 오차 증명, Y4-03/04의 일반 sampler·평형·위상 mixing 검증, Y4-06 reflection positivity의 출처 가정 대응, Y4-07 전달 연산자의 cutoff와 오차는 별도로 남아 있다. 상세 상태는 `getChecklist()`에 있는 원래 Y3/Y4 식별자별로 유지한다.

## 참고 근거

- 사용자 Blueprint pp.41–44, SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.
- David Tong, [Gauge Theory Chapter 4](https://davidtong.org/pdfs/teaching/gauge-theory/gauge4.pdf), §4.2.1–4.2.2.
- Ulli Wolff, [Monte Carlo errors with less errors](https://arxiv.org/abs/hep-lat/0306017), Monte Carlo 상관 오차에 관한 참고 문헌. 이 코드의 구체적 추정 규칙은 위에 독립 명시했다.
- Martin Lüscher, [Construction of a selfadjoint, strictly positive transfer matrix for Euclidean lattice gauge theories](https://doi.org/10.1007/BF01614090). 현재 모델의 정리 적용 가정 대조가 미완이므로 reference-only 상태다.
