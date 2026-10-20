# 원본 Picard0 경계의 실제 소비 경로와 재사용 조건

원래 Picard0의 (B,C_1,\mathrm{solutionNorm},K)는 새 상수로 교체하지
않고 증명되었다. 이 문서는 그 **같은 함수에 대한 증명**을 후속 실제
본문으로 전달하는 범위를 적는다. AST 경로가 있다는 사실과 경로 위의
모든 함수가 실제 호출 정의역에서 정의된다는 사실을 구별한다.
원본 Guard/Jet/PDE 행의 PASS는 별도의 실제 행 증명에서만 가져온다.

## 1. 이미 확정된 출발점

원본 native `picard:0`, 이름 `ActualSameN3OrderOneInner`, 전체 정의 SHA256은
`c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60`이다.
실제 여섯 성분은 F1, U1, Avg(U1)-U1, Pi1, xi 미분 F1/U1이며 대각은
`[0,0,2,0,3,1]`이다. sourceLeading의 실제 노드는
F0=25601, U0=25638, v0=25637, Omega0/X=26393이다. 실제 A0/A1/forcing과
이 네 본문은 원래 생산자에 다시 연결되었다. 자연/B.26 접합, 축 짝홀성,
모든 고정 혼합 차수의 정상 수렴은 별도 합성 정리의 결론이다.

수치 정리 `ACTUAL_PICARD_ORIGINAL_NUMERIC_MAJORANT_KO.md`는 그대로

```
delta=rho/(1024Q), a²=(4/Lambda)exp(t1/16),
B=4096 Lambda² Q³/t1, C1=262144 B²/delta²,
sourceStrip=delta/4, solutionStrip=loss=delta/8,
solutionNorm=exp(9 C1² a²/(2 loss)),
Kcondition=ceil(72 C1² a²/loss)
```

을 증명한다. 해의 값은 solutionStrip에서 제어하고, 표시된 m차 η 꼬리는
더 작은 tube와 Cauchy 반경 delta/16을 사용한다. 원본 Kprecision도
요청된 m,bits에 따라 그대로 적용한다. 유한 근사치를 해로 선언하지 않는다.
실수 X 구간은 `0<=X<=a²`이다. squared-Gaussian activation은 X에서 C∞이고
복소 X 해석적이라고 가정하지 않는다.

## 2. 실수 factorial 경계에서 공통 복소 tube를 얻는 정확한 조건

실수 구간 I와 모든 실수 X가 속한 고정 compact에서
`|partial_eta^m f(X,eta)|<=M m! r^(-m)`가 **모든 m에 동시에** 성립하면,
Taylor 정리의 실수 나머지는 `M(|h|/r)^(m+1)` 이하이다. 따라서 각 실제
실수 중심의 Taylor 급수는 원래 함수와 일치하고, 같은 중심에서 복소 원판
반경 r에 수렴한다. 겹치는 원판은 실수 부분에서 일치하므로 identity
theorem에 의해 하나의 tube로 붙는다. 이 주장은 factorial 경계를 Cauchy
정리에서 가져온 뒤 다시 해석성을 결론내리는 순환 논증을 사용하지 않는다.

반경 r이 m이나 X에 따라 0으로 줄어들면 이 결론은 나오지 않는다.
각 m에 대한 임의의 유한 상계만으로도 나오지 않는다. X 미분을 교환하려면
각 고정 k에 대해 같은 tube에서 `partial_X^k f`의 정상 수렴/균등 지배가
필요하다. 원래 natural Banach 정리는 혼합 지수 전체의 양적 경계를 먼저
증명하므로 이 출발 조건을 제공한다. 실제 reciprocal에는 추가로
`|Phi|>=63/256`인 실제 공통 tube를 사용한다. 실수에서 Phi>0라는 결론만으로
임의로 큰 복소 tube의 무영점을 주장하지 않는다.

B.26의 η 적분은 실수 radial 경로와 같은 공통 tube에서 수행한다.
κ의 모든 실제 η 의존성이 없다는 source 증명, 자연/B.26의 모든 혼합
접합, 실제 Phi 무영점이 있으므로 Picard 계수는 같은 tube에서 해석적이다.
후속 함수를 합성할 때도 실제 η 인자가 그 tube에 들어간다는 증명은 남는다.

## 3. 실제 하위 함수에서 글로벌 느린장까지

고정 원본 expression 레지스트리의 정확한 본문은 다음과 같다.

| 정의 | 본문 노드 | 실제 역할 |
|---|---:|---|
| expression:5 | 29290 | ActualFinalOrderOneF |
| expression:6 | 29289 | ActualFinalOrderOneU |
| expression:7 | 29440 | ActualFinalOrderOneVOverX |
| expression:8 | 29334 | ActualFinalOrderOneStream |
| expression:9 | 29336 | ActualFinalOrderOneAverage |
| expression:10 | 50558 | ActualFinalOrderOnePressure |
| expression:688 | 622901 | M3GlobalBandSlow_F |
| expression:689 | 622911 | M3GlobalBandSlow_G |
| expression:690 | 622921 | M3GlobalBandSlow_b |
| expression:691 | 622931 | M3GlobalBandSlow_pressure |

예를 들어 실제 Picard native 호출 28834/28835는 각각
`actual_background_even_profile[0,0,4756,2,0,0]`와
`[0,1,4756,2,0,0]`이다. pressure의 실제 호출 50557은 성분3을 쓴다.
average/stream에는 29314/29331 등의 실제 rescaled radial 인자가 들어간다.
따라서 각 lazy guard 및 적분 binder가 인자를 `0<=X<=a²`에 넣는지 확인한
뒤 동일 Picard0 정리를 재사용할 수 있다. 축에서는 native even-profile의
적분형을 사용하므로 sqrt X의 고계 미분을 직접 나누지 않는다.

완성된 order-one 함수는 Picard 부분만으로 정의되지 않는다. 원래 cutoff,
Ipos 연속 모멘트 행렬의 역수, 전체 source moments와 원래 보정 bump가 있다.
이 부분의 실제 별도 정리들을 합성한 뒤 위 expression5..10의 전역 C∞를
얻는다. Picard0의 수치 경계만으로 Ipos 행렬의 비특이성이 나오지는 않는다.
느린장 688..691은 완성된 leading 함수와 order-one 함수에 원래 chart 인자와
cutoff weight를 넣는다. 따라서 그때는 chart 실제 정의역, 양의 s, 라벨의
고정, cutoff의 평탄 접합까지 함께 전달해야 한다.

## 4. 다른 Picard는 같은 수치식의 다른 적용이다

`actual-residual-order-induction-source.mjs`의 `innerNorm`(줄24 이후)과
`sourceSystem`(줄101 이후)은 양의 각 차수 n에서 actual/auxiliary 두 계를
만든다. auxiliary 반경은 `(6+2^(-(n-1)))/Lambda`이며
strip=`delta/(8*256^n)`, sourceStrip=4 strip, loss=strip이다. lower-order
forcing은 모든 필요한 이전 함수와 ordinary X 미분을 포함한다. actual
작은 core의 X 미분은 **별도 auxiliary 해**의 복소 X Cauchy 경계를 쓰고,
실제 collar는 ODE와 실제 cutoff 곱의 미분을 쓴다.

원본 square-zero A1 mask와 ordered-integral 정상 수렴 논법은 이 계들에도
적용 가능한 재사용 정리이다. 그러나 Picard0의 숫자 B/C1을 다른 차수에
그대로 대입하지 않는다. 각 계의 실제 forcing 노름, 이전 차수의 공통
tube, auxiliary 복소 X 정의역, 자기 C 및 Kcondition을 귀납적으로 증명해야
한다. 고정 N6 원본에서 어떤 계가 실제 레지스트리에 도달하는지는 새
consumer graph가 원본 정의 키로 기록한다. 등록되지 않은 계를 출현 횟수로
추정하지 않는다.

## 5. 적분·역수·Volterra·Fourier가 추가로 요구하는 조건

보통 적분에서는 실제 적분 경로 전체와 파라미터의 한 공통 근방에 같은
본문이 정의되어야 한다. 그 compact에서 각 고정 미분의 균등 지배를 얻으면
미분을 적분 안으로 옮길 수 있다. 움직이는 양 끝점의 Leibniz 항과 cutoff
미분을 모두 보존한다. 한 점에서의 유한 경계만으로 전체 압력 J를 덮었다고
말하지 않는다.

보통 inverse, log, positive sqrt는 각각 실제 분모≠0, 인자>0, 인자>0가
필요하다. 고정 compact에서 엄격한 양성을 증명했다면 연속성으로 공통
근방과 양의 최소값을 얻는다. implicit quadratic/monotone root에는 실제
branch와 Jacobian 무영점이 필요하다. Picard0가 C∞라는 사실은 이 양성을
대신하지 않는다. covariance Volterra 자체는 실제 smooth matrix를 고정
compact에서 제어하면 ordered-integral의 factorial 분모로 모든 고정
미분이 정상 수렴한다. 그러나 뒤의 covariance 정규화/Gram inverse/양의
가중치 sqrt는 별도의 실제 mass, determinant와 target cone 정리를 요구한다.

원본 Fourier inverse는 inverseDefinitions:0/1, 실제 입력 본문 각각
643868/643883이며 torus 좌표는 635044/635045이다. 연산자는
`(sqrt(2)-1) partial_y0+partial_y1`이다. k≠0에서
`d_k=(k1-k0)+sqrt(2)k0`, 정수 norm `(k1-k0)^2-2 k0^2`는 0이 아니므로
`|d_k^-1|<=(2+sqrt(2))|k|_infinity`이다. 이는 source-exact 무영점이고
Picard 정칙성과 독립적이다. k=0은 Haar 평균으로 따로 보존한다.

전체 source가 smooth periodic이고 각 slow parameter 미분까지 균등하면,
출력 torus 미분 m에 입력 m+4회 적분 부분법을 적용한다. 모드 상계는
`C_(m+4)(2+sqrt(2))/(2pi)^5 |k|_infinity^-3`이고, 2차원 shell은 정확히
8n개이므로 전체 꼬리는
`8(2+sqrt(2))C_(m+4)/((2pi)^5 K)` 이하이다. 출현한 유한 Fourier 합을
전체 inverse라고 선언하지 않는다. 이 논법을 실제 입력 643868/643883에
적용하려면 전체 indexed cover, torus copies와 평탄 라벨 접합의 정칙성이
먼저 필요하다. Picard0 한 계의 해 노름으로 그 입력 상계를 대체하지 않는다.

## 6. complete_gr, 원본 1,260행과 PDE

원래 최종 g는 expressionDefinitions:21,
`GlobalInitializationAfterFiveMoments_complete_gr`, 본문3614891이다.
그 이전 actual temporal g/haar g는 정의13/14, 본문3613993/3614329이고,
압력 P는 정의23, 본문3615054이다. 원래 전체 J에 대한 joint C1와 모든
실제 native 호출 정의역이 있어야 Guard의 compactness/Leibniz 정리를
적용할 수 있다. Picard0 경계는 이 조건 중 하위 한 항을 충족한다.

새 `actual_picard_consumer_graph.py`는 고정 원본 10 Guard, 230 Jet,
1020 PDE의 **모든 원래 ID**를 보존한다. ordinary AST의 진짜 operand와
레지스트리의 body, indexed rows의 localBody/실제 values/coefficient/maps/
guards, 실제 root 방정식, covariance matrix, Picard A0/A1/forcing만
명시적 규칙으로 따라간다. proof 문자열, 차수, component 번호, diagonal,
라벨 메타데이터 속 정수를 node ID로 검색하지 않는다. 알 수 없는
레지스트리 필드나 schema는 실패한다. 최소 경로에는 원래 node와 해시,
definition field를 보존한다. value-body 경로와 단지 quantitative/domain
contract 경로를 구별한다. 모든 lazy branch를 보존하므로 활성성 증명은
별도 남는다. formal body의 좌표를 실제 argument tuple에 대입하여 정의역을
전달했다는 결론도 자동으로 내리지 않는다.

PDE에서는 같은 ordered derivative와 native AD의 실제 미분 일치, 완전한
local residual, mean 및 disjoint tensor 조립을 검증해야 한다. 최종 점검은
전체 성분의 `R_direct-R_assembled`를 원래 경계항·제곱항·힘과 함께
재결합하는 것이다. 개별 monomial을 0이라고 선언하지 않는다.
따라서 consumer 경로와 출현 빈도는 연구 우선순위를 정하는 증거이며,
그 자체가 1,260행의 소거 증거는 아니다.
