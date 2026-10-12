# 압력·응력의 임의 유한 차수 소스 상수

## 제공하는 함수와 범위

`actual-pressure-stress-all-order-tail.mjs`의 `attachActualPressureStressPhysicalSeminorms(positiveStress, input, context)`는 실제 양의 차수 전역 응력 증명 결과를 받는다. 해당 결과의 비공개 seal, 동일한 원래 그래프·압력 primitive·signed 응력 적분·양 끝점의 모든 고정 미분의 매끄러운 접합을 먼저 검사한다. 계수, 미분값, 노름, 모멘트의 0, 완료 flag를 입력받지 않는다.

`input`은 `throughOrder`, `derivativeOrder`, `maxProfileJets`, `maxJetRequests`만 선택한다. 결과는 원래 양의 `h`를 유지하는 정확한 소스 표현식이다. 모든 실제 상수는 유한 구간의 전체 FTC 적분이며 수치적분값이나 표본값이 아니다.

| 결과 | 의미 |
|---|---|
| `rows[n-1].bounds[m]` | 실제 물리 압력·두 signed 응력의 Cartesian/시간 미분 상수 |
| `normalizedPressure[n-1].bounds[m]` | 실제 정규화 압력의 Euler/`X`/`eta` 혼합 미분 상수 |
| `weightedStress[n-2].bounds[m]` | `n>=2`에서 `T_n/zeta`의 정규화 혼합 미분 상수 |
| `weightedStress[n-2].directWeightedBounds[m]` | `n>=2`에서 정규화 `T_n` 미분을 `zeta`로 나눈 별도 상수 |
| `n1Weighted.bounds[m]`, `poles[m]` | 원래 1차 열 collar를 포함한 `zeta*delta^(-pole)` 상수 |

모든 배열에는 `0`부터 요청한 미분 차수까지 들어간다. 정규화 배열에는 원래 `sourceNormalizedCutoffWeights`의 Euler cutoff 가중치가 이미 들어 있다. 어느 양의 cutoff scale에도 같은 상수가 적용되므로 공통 재귀 selector가 이 값을 그대로 추가할 수 있다.

이 모듈은 공통 cutoff를 선택하거나 무한 배경을 선언하지 않는다. 원래 선도항은 별도 증명이다. 결과의 `commonInfiniteCutoffsChosen`, `fullPhysicalResidualFlatness`, `wholeGN4Complete`, `m3MayStart`는 `false`이다.

## 물리 미분과 차수에 독립인 지수 손실

같은 원래 좌표에서 `X=(y1²+y2²)/2`를 대입한 뒤 미분한다. 고정 직사각형은 `[-sqrt(2Xb),sqrt(2Xb)]²×[-1,1]`이다. 양의 압력은 축에서 정칙하고, signed 응력은 축의 열린 근방에서 정확히 0이다. 따라서 원통좌표의 분모를 축에 넣지 않고 전체 Cartesian 미분을 구할 수 있다.

`physicalPositiveJetCalculus`는 Euler, `y1`, `y2`, `eta` 네 방향의 모든 Leibniz 이항계수 항을 생성한다. 압력의 기초 물리 손실은 `2A`, 응력은 `A+1/2`이다. 원래 `A>1/2`와 물리 미분 word의 정확한 손실을 사용하면, 각 `n>=1`과 요청된 `m`에 대해

```text
|partial_physical^I [q^(2nh) chi(c_n q) (physical Pi_n,T_n)]|
 <= B_nm q^(2nh-(2A+m)),    |I|<=m, 0<q<=1.
```

여기서 물리 prefactor의 기초 손실은 각 성분에 이미 포함되어 있다. `2A+m`은 `n`과 무관하다. `q`의 지수를 먼저 느슨하게 평가한 부등식을 다시 미분하지 않으며, 실제 word의 Euler shift를 남겨둔 뒤 계수의 크기만 majorize한다. `n`에서 생기는 인자는 정확한 `h`의 다항식 cutoff 가중치에 포함된다.

`L=1-2h eta²`의 역수는 전체 닫힌 `eta` 구간에서 유계이다. 원래 `0<h<2^-4096`이면 해당 구간의 모든 점을 중심으로 하는 반지름 `1/2` 복소 원판에서 `|L|>1/2`이다. Cauchy 부등식은 모든 유한 `j`에 대해 `|partial_eta^j(1/L)|<=2 j! 2^j`를 주며, 구현은 더 큰 `2 j! 8^j`를 사용한다. `h=0`으로 치환하는 단계는 없다.

## 전체 FTC 상수

`d`차원 직사각형의 각 꼭짓점 기준 FTC 전개는 모든 부분집합 `S`에 대한 mixed derivative face 적분의 합이다. 구현은 빈 집합을 포함한 `2^d`개 face를 전부 남긴다. 각 절댓값은 실제 해당 미분의 `sqrt(1+derivative²)`로 상계하고, 적분 상한을 전체 직사각형 끝점으로 확장한다.

따라서 결과 상수에는 물리/profile 자유 좌표가 남지 않는다. 어떤 실제 함수가 매끄러운지는 일반 FTC 도우미가 임의로 인증하지 않는다. 동일한 원래 압력의 전역 primitive와 새 양의 차수 응력 증명이 축·안쪽·바깥쪽 접합을 먼저 제공한다.

정규화 압력의 FTC 구간은 `[0,Xplus]×[-1,1]`이다. 원래 0 연장이 그보다 큰 고정 방사 구간도 덮는다. `n>=2`의 응력은 원래 compact interior support `[Xminus,Xplus]`를 사용한다. 그 직사각형 전체에서 원래 `zeta`는 양수이므로 `T_n/zeta`의 모든 고정 미분과 `(partial^I T_n)/zeta`를 각각 실제 미분하여 적분 상수를 만든다. 두 배열은 서로 대체하지 않는다.

## 1차 응력: 원래 열 함수와 끝점의 임의 유한 미분

기존 `actual-order-one-weighted-stress.mjs`의 `derivativeOrder:0` 결과는 원래 소스, complete heat, terminal smooth coefficient `B`, signed backward primitive 및 원래 `zeta`를 인증하는 seed packet으로 사용한다. 새 모듈이 요구한 미분이 그 packet의 요청 차수를 넘으면, 그 미분을 packet이 이미 증명했다고 간주하지 않는다. 새 재귀가 동일한 `B`, 실제 응력, 실제 열 함수의 모든 요청된 미분과 FTC 상수를 생성한다.

terminal 좌표는 `delta=log(Xb/X)`, `0<=delta<=1/4`이며 `Xedge=Xb exp(-1/4)`이다. 원래 backward 식은

```text
T1theta(Xb exp(-delta),eta)
 = Xb exp(delta) Integral_0^delta exp(-4/u²) u^(-6) B(u,eta) du.
```

`B`에는 원래 열 factor의 완전한 improper integral이 포함된다. 꼬리를 자르지 않는다. 1차의 전체 응력 적분이 0임은 새 양의 차수 전역 응력 증명의 실제 (5.19)–(5.21) 결속을 사용한다.

`actual-pressure-stress-all-order-tail-kernel.mjs`는 다음 세 재귀/부등식을 임의 유한 차수에 제공한다.

1. `E=exp(-4/delta²)`에 대하여 `partial_delta(E Q)=E(Q'+8 delta^-3 Q)`이다. `Q=delta^-6`에서 시작하여 모든 Laurent 계수를 정확한 정수로 생성한다. `j`차의 최대 pole은 `6+3j`, 최고 계수는 `8^j`이다.
2. `partial_delta(E delta^-3)=E delta^-6(8-3delta²)`이고 `8-3delta²>=125/16`이다. 따라서 backward 적분에서 세 거듭제곱을 얻고, 원래 `16/125` 상수를 유지한다.
3. `partial_X^r=(-1)^r X^-r sum_j c(r,j) partial_delta^j`이며, unsigned Stirling 계수는 `c(r+1,j)=c(r,j-1)+r c(r,j)`로 모두 생성한다.

모든 실제 `B` 미분의 FTC 상수와 전체 Leibniz 합을 넣고 이 변환을 적용하면, `|I|<=m`에 대해

```text
|D^I [q^(2h) chi(c1 q) T1]|
 <= n1Weighted.bounds[m] q^(2h) zeta delta_global^(-(3+3m)).
```

`delta_global=min(1,log(X/Xa),log(Xb/X))`이다. terminal에서는 원래 엄격한 support 순서 때문에 `delta_global=delta`이고, 안쪽의 고정 직사각형 `[Xminus,Xedge]×[-1,1]`에서는 실제 `(partial^I T1)/zeta`를 별도로 적분한다. 이 두 구간과 원래 0 연장이 열린 활성 환대 전체를 덮는다. 1차 `T1/zeta`의 임의 미분이 끝점에서 유계라는 더 강한 주장을 하지 않는다.

## 유한 자원과 수학적 차수

고정 숫자 16의 수학적 미분 차수 제한은 없다. Gaussian Laurent 재귀, Stirling 재귀, cutoff Euler 다항식, 소스 AD, 모든 FTC face는 각 유한 요청에 대해 유한한 알고리즘이다. 실제 실행의 그래프 node 수, 사전에 선택된 source materializer 미분 capacity, profile jet 수, jet query 수는 그대로 검사한다. 요청을 표현할 수 없으면 `RESOURCE_LIMIT`으로 실패하며, 미분을 생략하거나 0으로 넣지 않는다.

기본 source derivative capacity는 128이다. 더 높은 유한 요청에는 원래 생성기에서 충분한 `maxDerivativeOrder`를 선택한 새 source graph가 필요하다. 이미 인증된 graph의 정의나 budget을 나중에 바꾸지 않는다. 유한 차수 실행은 그 유한 요청의 증거이고, 임의 유한 차수의 정당화는 원래 소스 재귀와 위 명시적 미분 재귀에 의한다.

검증 명령은 `tests/run-pressure-stress-all-order-tail-validation.py`이다. 각 attempt의 완전한 소스·테스트·runner snapshot, 실제 종료 코드, 시간·메모리 및 실행 전후 모든 import 해시는 `research/evidence/pressure-stress-all-order-tail-20261011`에 저장한다. 일반 커널 검사는 별도 exponential Bell 미분 계산으로 0–20차 Gaussian 계수를, 직접 `X^23` 미분으로 0–20차 Stirling 변환을 확인하며, 부족한 work budget과 가짜 source 증명을 거부한다.

원문 연결은 제공된 PDF의 (5.17), (5.22), (5.26), (5.37), (5.40), (5.43), (5.46)이다. 무한합의 공통 cutoff 선택과 물리 잔차 평탄성은 이 실제 상수를 소비하는 후속 모듈의 별도 정리이다.

## 관측된 실행 결과

| 실행 | 결과 | 시간 | 자식 프로세스 최대 RSS |
|---|---:|---:|---:|
| 커널 attempt 1 | 5/5, exit 0 | 0.249초 | 54,177,792 bytes |
| 실제 소스 attempt 1, `n=1,2`, `m=1` | 6/6, exit 0 | 41.513초 | 2,174,418,944 bytes |

두 실행 모두 원래 의존 파일 72개가 변경되지 않았고 timeout은 발생하지 않았다. 실제 소스 검사는 동일한 압력·응력 roots, 전체 FTC face, 고차 quotient/direct 가중 미분, 같은 `zeta`, 완전한 1차 열 함수와 backward primitive, 실제 Euler/방사/매개변수 미분, 명시적 자원 실패, 비공개 seal의 변조 거부와 append 이후 certificate 안정성을 포함한다. 최종 해시 및 범위는 같은 evidence 디렉터리의 `validation.json`에 있다.
