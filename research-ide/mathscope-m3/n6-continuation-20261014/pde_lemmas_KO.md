# 전체 PDE 잔차 후속 분석: 원본 항의 의미, 정확한 축소와 남은 조건

기준은 PR #28 HEAD `ba87dc9c09567c9a486d424ffb3e63a7eb04a12d` 및 [최초 클라우드 실행 38500114302](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38500114302)의 `mean-proof-residual-38500114302`이다. 이 추가 계산은 성공한 producer와 3,892,594개 노드 계산을 다시 실행하지 않는다. `pde_input_manifest.json`으로 기존 8개 입력 파일의 전체 바이트, 길이와 SHA-256을 고정하고, 원본 graph SHA-256 `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f` 및 모든 사용한 source witness를 검사한다. 입력 불일치가 발견되면 새 계산을 실패시키고 실패 artifact를 남긴다.

## 175/203/690항의 정확한 의미

각 성분의 `175/203/690`은 원본 direct 보존형 잔차와 assembled 잔차의 **차이**를 분모를 보존한 유리식으로 전개했을 때 남은 분자 모노미얼이다. 독립 Cartesian PDE를 실제 함수에서 평가한 잔차의 항수로 해석하면 안 된다.

| 성분 | direct 원본 root | assembled 원본 root | 기존 분자 항 | 정확한 상수 관계 후 |
|---|---:|---:|---:|---:|
| 0 | 3825257 | 3825348 | 175 | 169 |
| 1 | 3825259 | 3825349 | 203 | 197 |
| 2 | 3825261 | 3825350 | 690 | 654 |
| 합계 | | | 1068 | 1020 |

속도 `3825006/3825007/3825008`, 압력 `3825009`, 기존 flat residual와 full stress-divergence tail은 보존된다. 새 quotient의 분자는 세 성분 모두 0이 아니다. 그러나 이러한 형식 다항식의 비일치는 함수적 PDE 반례를 증명하지 않는다. 다른 불투명 source jet 사이의 실제 정의 관계를 아직 적용하지 않았기 때문이다.

## 추가한 유일한 정확한 분자 관계

원본 node `3622`는 `sqrt_positive(24)`, node `24`는 정확한 유리수 `2`이다. 양의 제곱근이 정의되어 있고 `(sqrt(2))²=2`이므로 node `3622`의 지수 `2k+r`를 `2^k` 및 지수 `r∈{0,1}`로 바꿀 수 있다. 이 과정은 부동소수점 근사나 별도 분기 가정을 쓰지 않는다. 상수의 정의역 `2>0`도 이미 충족한다.

모든 입력 항과 축소 후 항, 적용 전 지수, 원래 항 번호 및 정확한 상쇄 목록을 `pde_component_0/1/2.json`에 남긴다. 다른 source sqrt node는 이름이 같아도 이 관계로 합치지 않는다. 1068개 입력 항 중 source sqrt의 지수가 2 이상인 항은 6/6/36개이며, 이 관계를 적용하고 정확히 합치면 각각 169/197/654항이 남는다. 따라서 48개 감소는 새 전체 PDE 인증이 아니라, 실제 정의된 상수 관계에 의한 정확한 다항식 단순화이다.

## 삼각함수·미분·cutoff·implicit·natural series 분류

각 항을 두 범위로 분류한다. `directFactorCategories`는 그 모노미얼에 실제로 나타난 원본 atom을 분류한다. `definingClosureLabels`는 그 atom이 의존하는 실제 함수 본문의 도달성을 분류한다. 두 범위 모두 여러 label을 가질 수 있다. 합계가 항수보다 커질 수 있으며, label은 특정 결함의 원인이나 독립적인 PDE 오차를 뜻하지 않는다.

| 원본 outer 항에 직접 포함 | 성분 0 | 성분 1 | 성분 2 |
|---|---:|---:|---:|
| 실제 미분 jet | 166 | 195 | 678 |
| 실제 indexed cover | 175 | 203 | 690 |
| Fourier inverse | 2 | 24 | 2 |
| implicit root | 0 | 0 | 345 |
| 직접 sine/cosine atom | 0 | 0 | 0 |

기존 closure label에 삼각함수가 모든 항에 나타났지만, outer 분자에는 sine/cosine atom이 하나도 없다. 실제 삼각함수는 indexed 또는 expression 정의 내부에 존재한다. 따라서 이 outer 다항식 단계에서 `sin²θ+cos²θ=1`을 적용해 더 소거할 항은 없다. 적용 가능한 동일 phase가 없는 곳에서 임의 source jet을 삼각함수 값으로 바꾸면 안 된다.

`completeDefiningClosureSyntaxCategories`는 전체 사용된 source witness 중 실제 cutoff/join, trig, implicit, natural series, finite integral, discrete selector, Picard 및 Volterra 연산자 ID를 모두 분리한다. `opaqueDefiningClosureCategories`는 그중 실제 불투명 frontier의 ID만 기록한다. cutoff와 trig가 primitive 연산자라서 opaque 목록에서 제외된 사실을 존재하지 않는다는 뜻으로 해석하지 않는다.

각 항의 직접 미분 jet은 literal multi-index, registry key, 실제 정의 이름과 source ID를 보존한다. 특히 velocity/pressure의 원본 `fieldDefinitions:6/7/8/9` 및 assembled residual의 `definitions:1:0/1/2`에는 각각 실제 162행이 있다. 행의 수와 SHA-256, 실제 `requiredSourcePremises`를 `completeIndexedCoverDefinitions`에 기록한다. 다음 조건은 남는다.

- 실제 모든 고정 label의 coordinate map과 미분 계수, local body.
- nearest-copy와 changing-label의 flat join 및 omitted label 소멸.
- 비선형 항의 서로 다른 label 곱에 대한 실제 지지집합 관계.
- pressure와 Fourier inverse의 같은 함수 정의 및 모든 필요한 mixed jet.
- cutoff의 guard 내부에서 모든 분모와 미분이 정의되는지, join에서 실제 flat extension이 성립하는지.
- 전체 closure의 natural/quadratic/Picard/Volterra 함수와 필요한 미분의 존재성.

## 분모의 증명과 조건을 분리

원래 factored 분모와 cancellation 이전의 `originalSourceDenominatorOperands`를 둘 다 보존한다. 유리식 단순화가 nested source 함수 안의 원래 pole을 제거했다고 주장하지 않는다.

1. `623015=log(4+sqrt(2))`: `sqrt(2)>0`이므로 `4+sqrt(2)>1`, 따라서 실제 상수 log는 양수이다. 이 상수의 비영은 증명되었다.
2. `623024`와 `635062`는 정확한 exp node이다. 유한하고 정의된 argument에는 exp가 0이 아니므로 비영 관계는 성립한다. 실제 source argument의 전체 정의역은 별도 조건이다.
3. `622802=R`: `R²`가 모든 성분에 남는다. 실제 global field의 support 및 axis extension까지 포함한 active radial domain에서 `R≠0`임은 이 replay에서 증명하지 못했다.
4. 성분 2의 추가 분모는 `H=s−2hZ²exp(2h log s)`이다. 원본 node `622820` 및 실제 implicit body `622819`를 구성하는 모든 scalar node를 직접 대조했다. 실제 body는 `F(s)=s−Z²exp(2h log s)−T`이므로 `H=sF_s(s)`이다.

마지막 분모에는 다음 **조건부** 하계를 증명할 수 있다. source exponent `D`의 실제 scalar node `22=19+21`, `19=1/2`, `21=−h`도 대조하여 `D=1/2−h`를 확인했다. producer `actual-covariance-source-operator.mjs:47`의 정의 및 `source-global-band.mjs`가 상속하는 `D`와 일치한다. `0<h<1/16`, `s,s0∈[1/2,2]`, `Z=s0^(1/2−h)η`, `|η|≤1`이면,

`Z²≤2^(1−2h)≤2`이고 `s^(2h−1)≤2^(1−2h)≤2`이다. 따라서

`F_s(s)=1−2hZ²s^(2h−1)≥1−8h>1/2`, `H=sF_s(s)>1/4`.

이는 실제 양수 argument에서 exp/log 미분 규칙 및 정확한 유리수 부등식으로 얻는다. 독립 mean/analytic 담당자가 이 부등식도 확인했다. 하지만 actual root가 이 bracket/image에 있고, 모든 source operand의 사용 지점이 이 chart에 해당한다는 source domain 증명은 남는다. registry의 `endpointProof` 문자열이나 `sourceAuthenticated` 비트는 그 조건을 충족하는 증거로 사용하지 않는다. 특히 cutoff의 inactive branch를 평가하거나 전체 공간에서 root를 정의하는 일을 이 하계만으로 정당화하지 않는다.

## 독립 Cartesian 계산의 남은 frontier

최초 실행의 독립 primitive Cartesian program은 2698개 scalar node를 만들었지만 실제 leaf의 미분 요청 **393개**를 계산하지 못했다. 새 `pde_cartesian_jet_frontier.json`은 이 요청을 모두 보존하고 실제 base source ID/registry 이름, 미분 방향, 요청 차수 및 원본 uncomputed base scalar node로 다시 분류한다. 일부는 ceiling 등 discrete selector이거나 opaque substitution으로부터 파생된다. 미분 값을 임의로 0으로 대체하지 않는다. 원본 program의 조건부 domain 가정 94개도 모두 유지한다.

Cartesian rotation의 일반적인 calculus나 `sin²+cos²=1` 관계가 알려져 있다는 사실은 이 393개의 source jet을 계산하지 않는다. 실제 좌표 map과 locally fixed label, C² 함수 조건이 증명되기 전에는 mixed partial을 교환해서 요청을 합치지도 않는다.

## 실행과 확인 범위

```sh
python research-ide/mathscope-m3/n6-continuation-20261014/test_pde_replay.py
python research-ide/mathscope-m3/n6-continuation-20261014/pde_replay.py --artifacts ARTIFACT_ROOT --output FRESH_OUTPUT_DIR
```

`ARTIFACT_ROOT`는 `mean-proof-residual-38500114302`를 포함하는 원본 클라우드 artifact 디렉터리이다. 입력 130MB, 성분별 2000항, 경과 120초 제한을 둔다. 기존 출력 파일은 덮어쓰지 않는다. 실행 receipt는 실제 읽은 입력 pin, 구현 SHA-256 및 출력 SHA-256을 보존한다. 작은 부정 검사는 잘못된 radicand, 다른 sqrt source atom, exact rational cancellation, 잘못된 중복 factor, 길이가 같은 위조 cloud receipt를 확인한다. 이 검사 통과는 source PDE 증명으로 계산하지 않는다.

최종 상태는 `EXACT_CONSTANT_REDUCTION_WITH_FULL_ANALYTIC_AND_CARTESIAN_FRONTIER_OPEN`이다. N6-01/N6-02의 무조건부 상태, 원본 56/64, producer, main 및 공개 사이트는 변경하지 않는다.
