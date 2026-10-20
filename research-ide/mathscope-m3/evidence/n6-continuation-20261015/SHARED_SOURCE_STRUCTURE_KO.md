# 원본1260개 의무를 묶는 공통 구조의 정밀화

사용자의 제안인 **증명 보존형 의존성 수술(Proof-Preserving Dependency Surgery)**을 실제 검증 구조에 적용한다. 개별 항을 독립적으로 추정하는 대신, **같은 source의 실제 함수 해석과 미분·적분·접합 연산이 서로 호환되는 구조**를 공통 증명 단위로 삼는다. 이는 아직 모든1260개를 닫은 정리가 아니라, 무엇을 실제로 증명하면 어느 원본 행에 재사용되는지를 계산하고 검증하는 방식이다. 사용자가 붙여준 원문은 `USER_SHARED_STRUCTURE_IDEA_KO.txt`로 함께 보존한다.

## 1. 공통 명제

원래 admissible chart와 고정 label을 유지하고 source DAG의 각 꼭짓점을 실제 함수로 해석한다. 다음 세 조건을 충족시킨 경우, 해당 DAG에 대한 아래의 연산 호환 명제가 성립한다.

1. 모든 실제 native kernel은 그 입력 영역에서 필요한 공동 정칙성과 실제 defining-body 도함수를 가진다. 실제 inverse·log·sqrt의 인수가 각 원래 guard 안에서 정의되고, 무한 해·급수는 필요한 차수의 국소 균등 수렴으로 정의한다.
2. source의 label/좌표 치환과 lazy guard를 그대로 유지한다. 고정 label을 먼저 미분하며 모든 지지 경계에서 원래 접합 jet이 일치한다. 참조 chart를 바꿀 때 실제 모든 normalization/Jacobian을 보존한다.
3. 같은 DAG의 실제 미분 규칙이 곱·chain rule, moving-endpoint Leibniz, Haar 평균 및 Fourier inverse와 호환됨을 각 native 경계에서 증명한다. 적분 미분에는 compact domination 또는 실제 무한 꼬리 지배가 필요하다.

그 때 source의 순서가 있는 미분 프로그램 D와 함수 해석 E에 대해

```
E(D_a1 ... D_am f) = partial_a1 ... partial_am E(f)
```

이다. 증명은 유한 DAG의 위상 순서에 대한 귀납이다. 실제 상수와 좌표에서 시작하여 각 elementary 연산의 보통 미분 법칙, 진짜 native 경계 정리, 적분의 Leibniz 정리를 적용한다. locally finite indexed 합은 각 점의 같은 근방에서 유한 합으로 제한한 뒤 flat 경계 정리로 접합한다. source의 명시적 derivative program을 그 선언만으로 승인하는 순환은 허용하지 않는다. 상대적 시간0 끝점은 원래 source의 한쪽 jet 계약을 유지하고, 열린 음의 시간 확장을 가정하지 않는다.

이 귀납 구조 자체는 기본 미적분에서 따르지만, 현재 실제 프로그램의 모든 native 계약과 모든 guard를 이미 충족했다는 결론은 아니다. 바로 그 실제 선행 조건을 별도 영수증으로 채워 나간다.

## 2. 세 종류 원본 의무에 같은 구조를 적용하는 방법

| 원본 묶음 | 공통 구조가 제공해야 할 실제 내용 | 완료 판정 |
|---|---|---|
| Guard10 | 같은 complete_gr와 Z/Y0/Y1 미분의 공동 연속성을 원래 전체 압력 J 및 shifted/Haar 인수에서 확보. 같은 compact 근방의 지배로 두 실제 적분을 미분 | 원래10개 moving-endpoint Leibniz ID 각각의 가정과 끝점 항 유지 |
| Cartesian Jet230 | 원래 실제 registry 본문, ordered directions, 물리 pullback과 native derivative의 위 호환 명제 | 원래230개 ID를 보존하고 실제 함수·영 접합이 증명된 묶음만 완료 |
| PDE1020 | 같은 완전한 속도·압력과 모든 물리 normalization으로 symbolic residual 및 coupled residual의 해석이 일치함을 증명 | 각 성분의 전체 합을 비교. 모든 자기항·교차항·압력 재계산·cutoff 도함수 유지 |

PDE의 개별 비영 monomial을 각각0으로 선언하는 구조가 아니다. 원래1020개 항의 계수와 source factor를 유지하고, 실제 정의에 따른 성분 전체의 상쇄·동등성을 증명해야 한다. 정칙성 하나만으로 PDE 동등성이나 원래 정량 W/M/S norm이 자동 증명되지 않는다.

## 3. 실제 계산

`shared_structure_frontier.py`는 인증된 원본 cache에서 다음을 계산한다.

- 원본 Guard10, Jet230, PDE1020의 ID를 빠짐없이 한 번씩 보존한다.
- 실제 ordered jet target과 각 PDE 항의 계수·factor·기존 hash를 유지한다.
- compact excerpt에 없던 source node를 같은 원본 cache에서 읽는다. 정확한 ordinary operands와 native 인자만 따라가고 metadata 숫자를 node ID로 해석하지 않는다.
- 각 원본 행이 도달하는 **직접 native 경계**를 계산하여 같은 경계 집합을 갖는 행을 묶고, 각 실제 registry가 몇 행에 관계되는지 센다.

이 계산은 native 본문까지의 전체 의미 의존성이나 모든 선행 조건이 충족되었음을 대신하지 않는다. 따라서 결과의 `totalAffected`는 완료 수가 아니다. 원래1260개 누락·중복·상태 변경을 거부하는 adverse controls를 포함한다. 최종 소거는 실제 정리와 원본 행 검사를 함께 통과했을 때만 기록한다.

원문의 dominator/강연결성분/가중 덮개 제안은 다음 단계다. 직접 호출 빈도만으로 병목 해소 수를 대신하지 않는다. 먼저 native 본문의 가정과 원본 행으로의 실제 적용 간선을 검증하고, 그 증명 그래프에서 공통 선행 조건과 독립 병목을 계산한다. 원문의19개 함수족 수치도 가설로 보존하고, 현재 잔여230개의 실제 등록 대상 수와 별도로 계산한다.

## 4. 논문과 융합한 PDE 수술의 독립 검산

논문의 Proposition9.6과 같은 보정 순서 및 전체 압력 재계산을 유지한다. 먼저 symbolic residual의 차이 E를 증명된 항등식과 경계항 및 미해결 항으로 분해하고, 원본과의 동등성을 독립 검산한다. 실제 물리적 외력이나 비영 residual을0으로 만들지 않는다.

`shared_pde_increment_identity.py`는 보통 물리 좌표에서 같은 매끄러운 함수와 같은 점성 계수에 대해 정확히

```
R(u+w,p+pi)-R(u,p)-L_u(w,pi)-div(w tensor w) = -w*div(w)
```

를 세 성분 모두 독립 전개한다. 따라서 `C=div(w)`가 실제 full curl의 항등식으로0임이 증명되면 이 부분이 하나의 검증된 국소 치환이 된다. 마지막 이차항은 남긴다. 선형화에는 시간 미분, 두 방향의 교차 이류, 압력 및 전체 Laplacian이 모두 있다. 같은 외력 f를 양쪽 residual에서 뺀 경우에도 그 f를 제거하거나0으로 선언하지 않는다.

또한 `curl(chi*A)=chi*curl(A)+grad(chi) cross A`를 검산한다. grad(chi) 항을 생략하면 발산 영 조건도 일반적으로 깨지는 실제 다항식 adverse control을 포함한다. 이 도구는 현재 native field의 정칙성이나 그 potential의 실제 source 동일성을 대신하지 않으므로 원본 PDE 소거 수는0이다.

## 5. 현재 실제로 확보한 토대와 공통 병목

run38723563894에서 같은 실제 선행장, I2 무한 열 보정, 원래 여섯1차 함수와 압력 원시 상수·접합, 실제 대표점 frame을 포함한29개 scoped gate가 모두 통과했다. 다음 토대는 같은 source의 실제 호출 영역, 공분산 H의 비특이성과 양의 weight, 전체 Volterra 계수/AD 연결, Fourier 입력의 smooth periodicity와 changing-label flat 접합이다.

특히 실제 source의 Bnorm·ell0·qStar는 정량 명제다. 함수가 C∞이고 그 norm이 유한하다는 이유만으로 원래 명시적 Bnorm보다 작다고 주장할 수 없다. 원래 pulse amplitude bracket과 Picard C1/K 상수를 그대로 검증하여 이 공통 병목을 좁힌다. 원본 상수나 지지 구간을 변경하여 의무를 없애는 방식은 사용하지 않는다.

현재 원본 기본 장부는 Guard10 / Jet230 / PDE1020 =1260이며 이 공통 구조 문서를 작성한 것만으로 바뀌지 않는다. 독립적으로 실제 증명된 행 묶음이 있으면 별도 후속 장부에 그 정확한 ID와 증거를 기록한다. 모든 미증명은 OPEN으로 유지한다.
