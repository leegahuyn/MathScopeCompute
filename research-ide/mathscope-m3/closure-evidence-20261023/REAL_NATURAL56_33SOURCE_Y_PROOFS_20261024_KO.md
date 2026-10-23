# MathScope M3 · 실제 56개 Y,eta 원본 입력쌍 및 자연급수 오차의 2026-10-24 엄밀한 경계

## 원본 아카이브 / SHA-256 확인
- 첫 FiveMap (최종 A–D 완료장 아님) 원본 full graph [#39988632325](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39988632325) PASS, 4,420,257 nodes, 9,749,737 직접 AST edges, original PR30 pinned a9b3a5b317525f6d0a71e2e356b054c9d25d2e60.
- Node JSONL SHA-256 `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`; extended native registry SHA-256 `bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e`.
- 의미론적 루트 11개에 도달한 자연급수 523개가 실제로 공유하는 Y/eta source AST root 쌍 **56개**. eta는 동일한 source coordinate `eta`; Y는 56개 서로 다른 원본 노드.
- Source-native 파라미터: N3 profile `same-profile-2026-10-10.3`, expression SHA `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`.

## 원본 56개 식의 엄밀한 분해

| 원본 Y 형태 | 실제 입력쌍 | 원본 호출 노드 | Y∈[0,5] 인증 |
|---|---:|---:|---|
| 유리수 Y=4 | 1 | 15 | 증명 |
| `Lambda*(Xa*exp(s))` | 9 | 123 | 그중 `s=t1` 18개만 증명 |
| `4*exp(s)` | 12 | 92 | 지수부 상계 OPEN |
| 기타 좌표값 | 21 | 132 | 해당 좌표 실구간 OPEN |
| 기타 원본 합성식 | 13 | 161 | source guard/구간 OPEN |
| **합계** | **56** | **523** | **33개 호출 Y 상한 증명, 490개 Y 상한 OPEN** |

- N3 source `Xa=4/Lambda`, `Lambda=Q^64>0`. 따라서 정확한 항등식 `Lambda*Xa=4`. 9+12=21개의 Y는 `4exp(s)`로 대수적으로 변형된다 (215 원본 호출). 대부분 여전히 `s<=log(5/4)` 필요.
- 특수 지수부 source node `t1=CSelected^-120`에 대해서는 `Q>1`, `logCSelected>1`, `CSelected>2`이므로 `0<t1<2^-120<1/8`. `e^x <=1/(1-x)` (0<=x<1), 따라서 `0<Y=4exp(t1)<32/7<5`. 원본 18호출 인증.
- N3 정의에서 `rho=sigmaStar²/65536>0`, `Q=C*K/sigmaStar²>1`, `Lambda>0`의 **매개변수 부호와 크기**는 확보. 여기서 바로 `||(Phi,u)||_{B_rho}<=Q`가 나오지는 않는다.
- Y=4(15호출)와 4exp(t1)(18호출) 모두 radial k=0. 전자는 eta 미분 m=0..4 각 성분별 1호출, 후자는 m=0..5 각 성분별 1호출.

## 실제 33호출에 연결한 정확 유리수 조건부 꼬리 (B.14/B.15)

원본 `naturalSeriesScaledTail` 유한 N=12 공식과 실제 증명된 Y 상한을 결합함. 원본 도함수 차수마다 아래 *coefficient factor*에 `Q*rho^-m`을 곱해야 하며, 공통 복소 영역의 전체 조건이 필요하다.

- Y=4, radial k=0, eta m=4: **204/15869140625**.
- Y=4exp(t1)<32/7, radial k=0, eta m=5: **112150186033152/114217653172314453125**.
- 정확한 독립 검증 [#40003433516](https://github.com/leegahuyn/MathScopeCompute/actions/runs/40003433516) PASS (원본 Q,rho,t1 source algebra 및 fail-closed tests).
- SHA-verified 56쌍 분류 및 33개 조건부 유리수 상계 [#40003981868](https://github.com/leegahuyn/MathScopeCompute/actions/runs/40003981868) PASS, published artifact #12523785492; 56 pair/33 tail JSON 영수증을 보존.
- 관련 코드: `prove_original_n3_Q_rho_signs.py`, `prove_original_n3_t1_natural_domain.py`, `audit_original_56_Y_eta_domain.py`, `conditional_original_33Y_natural_tail.py`.

## 반드시 OPEN으로 보존

1. 490개 자연급수 호출의 source Y∈[0,5] 상계 (여기에 미증명 지수 197개, 기타 Y 293개).
2. 전체 523개에 공통인 **실제 함수 `Phi,u`의 B_rho 노름 `<=Q`**, complex analytic continuation과 56쌍 eta의 복소정의역/branch/guard 검증.
3. N=12 유한항의 **실제 원본 계수** 직접 계산과 각 항의 directed interval error; 기존 conditional tail만으로 유한항 실수값을 알 수 없다.
4. 최종 A–D 반복장 A0,A1,A2,b,p가 해당 1st-FiveMap DAG에 없음. 따라서 이 원본 전체가 아닌 단계의 523 자연급수 계산으로 최종 67제트를 인증할 수 없음.
5. 전역 3D PDE 강제형 R=f, div0, compact smooth force, cutoff+Borel sum 및 모든 미분차수/압력 재계산 증명 별개 OPEN.

**M3 62/64, M4 0/16, original final 67=0/67, RELEASE HOLD. Original PR #30 and live website unchanged.**
