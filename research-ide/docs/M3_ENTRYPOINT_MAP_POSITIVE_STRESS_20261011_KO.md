# 원문 M3 진입 지도 — positive_stress 읽기 검토

2026-10-11. 이 문서는 **M2 완료 후의 구현 순서를 준비하는 읽기 전용 지도**다. M3 코드를 구현하거나 checklist·gate를 변경하지 않았다. 아래 재사용 경로는 현재 존재하는 코드이며, «새 작업»은 아직 완료되지 않은 의무다. 작은 유한 모형이나 기존 관측 화면을 새 원문 기준의 완료로 승격하지 않는다.

## 1. 원문과 작업 순서

원문 Blueprint의 M3는 P7·P8, Y5·Y6·Y7, N6·N7·N8의 **8개 package × 8개 기준 = 64개**다. 사용자의 작업 순서는 산술 P7 → P8, 게이지 Y5 → Y6 → Y7, NS N6 → N7 → N8이다. 원래 수학적 선행 조건은 다음과 같이 별도로 보존한다.

| Package | 원래 선행 조건 | Blueprint 페이지 | 첫 구현 결과물 |
|---|---|---:|---|
| P7 | P1, P4 | 33–34 | 정확한 완성 L/ζ 객체·정규화 계약과 certified analytic evaluation |
| P8 | **P1, P2, P3, P4** | 35–36 | 객체 종류·정확도·증거 등급을 분리한 비교/증거 그래프 |
| Y5 | Y2, Y4 | 45–46 | 네 Δ 모드의 실제 상태 생성 규칙과 물리 스펙트럼 계약 |
| Y6 | Y2, Y3, Y5 | 47–48 | 실제 4D 원본에 결속된 slice/marginal/mean/path 관측 |
| Y7 | Y1–Y6 | 49–50 | 원래 Lean core와 새 가정·증명·source identity 감사 |
| N6 | N5 | 61–62, 80 | Def. 9.4 상태 계약과 Prop. 9.5의 실제 초기 평균 보정 |
| N7 | N6 | 63–64 | Prop. 9.9의 실제 local field에서 출발하는 localization |
| N8 | N2, N7 | 65–66 | 원래 물리장 재구성 및 독립 Fourier/Galerkin 계산 |

P8의 선행 조건을 P7로 바꾸지 않는다. N8의 일반 Galerkin 가지는 원문상 N2 뒤 독립 개발할 수 있지만, 이번에는 사용자의 **M2 전체 우선** 지시를 따른다. 원문 기준과 기존 64 PASS 기록은 다시 세거나 바꾸지 않는다.

읽은 원본은 다음과 같다.

- Blueprint: `/workspace/scratch/cf975e3da716/upload/MathScope_Research_IDE_Blueprint_v1_KO(1)(20261011-070612).pdf`, 99쪽, SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.
- 현재 Handoff: `/workspace/scratch/cf975e3da716/upload/MathScope_M1_M2_Handoff_2026-10-11_KO(3).pdf`, 18쪽, SHA-256 `e5a3ff18db7c804ca972cf7105068b9f8c9ff49d4e5a3535184ac88fd5872cc5`. 18쪽이 인용하는 과거 15쪽 handoff hash를 이 현재 파일의 hash로 사용하지 않는다.
- NS 원문: `/workspace/scratch/cf975e3da716/tmp/physical_bridge_audit/navier-stokes.pdf`, 166쪽, SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`; 같은 디렉터리의 `navier-stokes.txt`에서 §8–§10과 원래 식 번호를 대조한다.

이하 `M0`, `M1`, `M2`는 저장소의 `research-ide/mathscope-m0`, `research-ide/mathscope-m1`, `research-ide/mathscope-m2`를 뜻한다.

## 2. 산술 P7 → P8

### P7: 실제 analytic number theory와 주장 범위

원래 여덟 의무는 다음과 같다. [Blueprint pp.33–34]

1. ζ·ξ와 elliptic 완성 함수 `Λ(E,s)=N_E^(s/2)(2π)^(-s)Γ(s)L(E,s)`의 정규화, 최소 모형·Tate/bad factor·conductor·root number, trivial zero/pole를 기록한다. 좋은 소수만 있는 `L^S`는 완전한 `L`과 구별한다.
2. 해석적 연속과 complex ball을 실제로 계산하고 반올림·급수·꼬리 오차를 분리한다. Euler 곱만 쓰는 영역은 ζ의 `Re(s)>1`, 좋은 elliptic L의 `Re(s)>3/2`다. critical strip의 유한 곱을 certified analytic 값으로 취급하지 않는다.
3. multiplicity를 포함한 전체 strip 영점 수 `N(T)`와 Hardy Z의 임계선 영점 고립을 각각 계산한다. 끝점 배제와 독립적인 영점 수 검증을 거쳐야 `RH_VERIFIED_TO_T`이며, 회귀값은 `N(20)=1`, `N(30)=3`이다.
4. 선택한 explicit formula의 상수·가정·유한 오차를 산출한다. 반정수 `x=10.5`의 prime 쪽은 `ψ(x)=log(2520)`이고 `ψ`/`ψ₀`의 끝점 규칙을 보존한다. `O(...)` 표기나 표본 차이를 오차 상계 대신 쓰지 않는다.
5. 연구 operator/domain, spectrum–zero 대응, 정규화 determinant/trace/duality/positivity의 가정 ID를 명시한다. 누락 영점·trivial factor·지수적 determinant 정규화·중복도 결함을 반례로 검출한다. 유한 압축 모형은 전역 RH operator가 아니다.
6. analytic rank는 정확한 root number parity·modular-symbol zero와 비영 derivative ball로 판단한다. `w=-1`의 `Λ(1)=0`은 정확한 대칭으로, rank 1은 `0∉Λ′(1)`로 결속한다. 0을 포함하는 작은 구간은 정확한 0 증명이 아니다.
7. arithmetic rank는 유리점·높이·regulator의 독립 하계와 descent/Selmer 상계로 감싼다. torsion·saturation·Tamagawa·period·Sha의 known/conditional/unknown, Manin 관련 가정을 보존한다. 상하계가 일치할 때만 rank를 확정한다.
8. 유한 높이 영점 인증, 특정 곡선 rank equality, refined leading term, 보편 RH/BSD를 별도 주장으로 저장한다. 누락 계수·소수·영점도 검출하며 유한체 Weil RH를 고전 RH의 공리로 가져오지 않는다.

### P8: 비교 그래프·Lean·연구 모형

원래 여덟 의무는 다음과 같다. [Blueprint pp.35–36]

1. `CW_TOY`, `DERIVED_MODEL`, `PRISMATIC_VIA_COMPARISON`, `NATIVE_PRISMATIC`의 객체 종류와 exact/ball/approx 및 Lean/external/hypothesis 증거 등급을 서로 독립적으로 표시한다.
2. degree/basis/valuation, Hodge/Newton, prime/degree/Frobenius weight와 refinement tower를 원래 행렬·사상에 연결한다. 카메라·LOD는 수학적 객체를 변경하지 않는다.
3. base change·tensor·twist·completion·inversion·fixed point·quasi-isomorphism 화살표를 type과 모든 가정에 결속한다. 가정 제거 뒤에는 관련 화살표를 다시 검사한다.
4. `d²=0`, unit contraction, chain homotopy, point count/trace, bounded residue, finite Euler의 작은 Lean backlog를 statement/type/lemma/certificate별로 구현한다. 컴파일하지 않은 파일은 형식 증명 완료가 아니다.
5. axiom ID와 실제 `#print axioms`를 대조한다. 가정 제거·변경 시 영향을 받은 결과를 재검증하며 목표 자체를 공리로 쓴 결과는 `conditional_on_target`으로 남긴다.
6. bad prime, Frobenius 계수, truncation bound, zero box, rank upper bound 변조를 각각 검출한다. 원래 input/hash/precision/comparison으로 세션을 재생한다.
7. finite operator compression과 determinant quotient·trace moments·FE duality·multiplicity의 연구 모형을 만든다. 같은 그림이어도 characteristic polynomial·trace·rank가 다른 반례를 구별하고 미증명 bridge는 open으로 둔다.
8. P1–3/P4/P5–6/P7/P8의 독립 검토 packet을 scope와 함께 보관한다. 실행 기능의 release와 millennium 문제의 수학적 해결을 별도 판단한다.

### 바로 재사용할 산술 경로

| 현재 코드 | 재사용 범위 | 새로 필요한 연결 |
|---|---|---|
| `M1/arithmetic/primes.mjs`: `segmentedPrimes`, `verifyPrimeSegments`, prime certificate, `logIntegerInterval`, `primeStatistics` | 정확한 소수 자료와 prime-side 합/로그 구간 | complex analytic continuation, zero counter, explicit-formula remainder |
| `M1/arithmetic/local-factors.mjs`: `integerModel`, `classifyReduction`, `countElliptic`, `localFactorBundle` | 현재 지원하는 모형·유한체 local factor | 일반 최소 모형/Tate 알고리즘, 전체 bad factors·conductor·root number |
| `M2/arithmetic/projective.mjs`, `mw-frobenius.mjs`, `unramified-frobenius.mjs` | 실제 유한 Frobenius·semilinear product·trace/charpoly·precision tail | P7의 analytic L와 rank backend, P8의 동일 source 비교 인터페이스 |
| `M2/arithmetic/geometric-comparisons.mjs`: `projectiveComparison`, `eulerTailCertificate`, `ellipticGlobalIdentity` | 정확한 좋은 소수 `L^S`의 유한 factor identity와 명시 tail | 기존 elliptic **global zeta** tail은 `σ>2`다. P7의 좋은 **L**에 대한 `σ>3/2` 계약과 완성 L을 별도로 구현해야 한다. |
| `M1/arithmetic/complex.mjs`; `M2/observatory/complex-basis.mjs`; `M2/visualization/observation-panels.mjs` | cochain complex·retraction·basis change·행렬의 source 추적 | `complex.mjs`는 **복소수 ball 라이브러리가 아니라 cochain complex**다. 새 analytic ball과 혼동하지 않는다. |
| `M2/arithmetic/q-comparisons.mjs`, `perfectoid-comparisons.mjs`, `qpd-nerve.mjs` | 현재 증명 범위의 비교 사상·기저·finite tower | P8의 전체 typed comparison graph와 원문 가정 ledger |

조사한 산술 실행 모듈에는 P7 전체 analytic continuation/zero-count/descent/Selmer backend가 아직 없다. 기존 BSD reference/adaptor는 특정 외부 정리의 사용 조건을 검사하는 경로이며 새 rank 계산기를 대신하지 않는다.

## 3. 게이지 Y5 → Y6 → Y7

### Y5: Δ가 바꾸는 대상과 gap의 의미

원래 여덟 의무는 다음과 같다. [Blueprint pp.45–46]

1. declared lower bound, units/rescaling, explicit effective model, empirical ensemble estimate의 네 모드를 고정한다. 가정 모드에서 원래 장/표본은 그대로이며 assumption revision만 바뀐다.
2. 실제 4D 장은 `ℓ=1/Δ`, `ρ=κℓ`와 명시한 embedded BPST+perturbation으로 재생성한다. 고정 좌표에서 A/F/길이 스케일이 변하는지를 원본으로 대조한다.
3. 유한 spectral model의 `E_j=Δ+ε_j`, `w_j≥0`, `ε₀=0,w₀>0`와 `C(t)=Σw_j exp(-E_j t)`를 실제로 계산한다. 고전 장에서 이 스펙트럼을 유도하는 bridge는 별도 가정이다.
4. `Δ_phys=(ℏc/a_t)(a_tΔ)` 단위와 고전 dilation을 구별한다. 4D action scaling을 확인하고 quantum scaling에는 명시한 Hamiltonian conjugacy 가정이 필요하다.
5. Δ가 Gibbs 규칙을 바꾸면 새 chain 또는 검증한 reweight를 계산한다. β/a/L/T calibration과 독립 scale setting을 보관하며 목표 Δ와 관측 channel mass를 구분한다.
6. 진공 성분을 제거한 gauge-invariant correlator와 finite-T cosh 처리를 한다. 비양수 값을 절댓값·clipping으로 숨기지 않는다. `gap_global ≤ E_channel ≤ m_eff` 방향을 보존한다.
7. positive self-adjoint transfer operator의 `E_n=-a_t^(-1)log(λ_n/λ₀)`와 GEVP/overlap 오차를 추적한다. 전체 비진공 공간의 `λ_n/λ₀≤r<1` 제어가 있어야 certified global gap이다.
8. 통계·operator overlap·T·L·a·representation cutoff 오차를 분리하고 fixed-physics 극한을 준비한다. 유한 channel gap을 continuum gap으로 승격하지 않는다.

### Y6: 4D 원본에 결속된 3D 관측

원래 여덟 의무는 다음과 같다. [Blueprint pp.47–48]

1. A/F/links/ensemble의 원본, 표시 representation, evidence를 분리하고 선택한 mark를 실제 4D 값으로 역추적한다.
2. `x₄=c` slice를 analytic BPST와 대조한다. 보간 영상과 실제 source slice를 방법·오차와 함께 구별한다.
3. `a_t Σq`, `Σq/N_t`, ensemble mean의 measure/단위를 구분하고 BPST 무한 적분 및 finite-window tail을 대조한다.
4. plaquette·Wilson·density·correlator를 gauge-invariant 기본 관측으로 사용한다. A/F gauge-fixed 진단은 gauge ID와 변환 검사를 붙인다.
5. gradient flow time을 별도 좌표로 보관한다. 투영된 loop에도 실제 4D 경로와 x₄ 구간을 남기며 서로 다른 holonomy를 화면 위치로 동일시하지 않는다.
6. Δ 비교에서 좌표·단위·카메라·색 범위를 공유하고 별도 normalization은 명시한다. assumed/effective/estimated 모드를 모든 패널에 유지한다.
7. observable/domain/projection/claim에 fibre-constant 또는 reconstruction 증명을 붙인다. 같은 3D 화면을 만드는 서로 다른 4D 반례를 보존한다.
8. source/model/proof revision을 독립 관리하고 실제 수학 입력 변경만 관련 증거를 stale로 만든다. 표·키보드·색 접근성과 재생 시 source/가정을 복구한다.

### Y7: 실제 Lean 실행과 가정 감사

원래 여덟 의무는 다음과 같다. [Blueprint pp.49–50]

1. 원래 core 증명과 YM user axiom의 경계를 고정하고 mathlib 표준 공리와 사용자 가정을 구별한다. source hash/toolchain/실제 audit를 보존한다.
2. Y1 bracket·Y2 embedding·Y3 oriented path/Wilson의 정확한 입력을 Lean kernel에 연결한다. 잘못된 Jacobi/path/embedding 변조를 검출한다.
3. 유한 spectral certificate의 weights, `a_t>0`, `r<1`, 전체 비진공 공간과 cutoff 범위를 증명한다. 근사 eigenvalue를 증명으로 취급하지 않는다.
4. G/단위/Δ의 quantifier와 user/paper/heuristic 가정 출처를 명시하고 모순을 검출한다. 임의 명제를 모두 허용하는 공리 묶음으로 목표를 증명하지 않는다.
5. fibre descent·reconstruction domain·spectral inclusion에 따라 조건부 결론을 증명하고 모든 의존 가정을 출력한다.
6. OS 관측량·Schwinger regularity·Euclidean invariance·reflection positivity·clustering·vacuum을 별도 의무로 둔다. 외부 정리 매핑을 적고 gauge-potential positivity나 continuum 존재를 임의로 주장하지 않는다.
7. fixed-physics continuum/infinite-volume/nontriviality/QFT axioms/uniform gap의 독립 의무를 필요한 bound가 나오기 전까지 open으로 유지한다.
8. Lean/mathlib pin, no-sorry/axiom 감사, 음성 대조, source/data hash 및 replay를 보관한다. 바뀐 Lean source는 새 kernel 실행 전까지 미검증이다.

### 바로 재사용할 게이지 경로

| 현재 코드 | 재사용 범위 | 새로 필요한 연결 |
|---|---|---|
| `M1/gauge/family.mjs`: `createStateFamily`, `finiteSpectralModel`; `fields.mjs` | Δ의 가정/단위/고전 생성 의미, 실제 BPST+perturbed A/F, 유한 spectral 예 | 물리 correlator·진공 제거·GEVP·gap certificate; 현재 finite spectral 수치는 float64이며 양자 이론 구성은 아님 |
| `M2/observatory/index.mjs`: `observation.delta-family`, `observation.gauge-4d`, `verifyCorrelatorFamily` | 네 Δ 모드, 실제 새 β=Δ ensemble, slice/finite marginal/conditional mean/4D Wilson 경로 | β=Δ는 명시한 유한 모형 규칙이다. 현재 ensemble correlator는 **Monte Carlo sweep lag의 Wilson-action 자기상관**으로, 물리 시간의 gap 측정이 아님 |
| `M1/gauge/observations.mjs`, `holonomy.mjs`; `M2/gauge/refinement.mjs`, `transport-certificates.mjs`, `volume.mjs` | 실제 slice/holonomy, finite-window·quadrature·transport·density 오차 | Y6 gradient flow, 전체 새 observable/역추적 및 Y5 물리 scale setting |
| `M2/gauge/lattice.mjs`, `ensemble.mjs`, `statistics.mjs` | 실제 links/Gibbs chains, autocorrelation·ESS·replica·topology 진단 | finite-T gauge-invariant physical correlator·진공 projection·calibration·fixed-physics refinement |
| `M2/gauge/transfer.mjs`: `cubeSpinBasis`, `runTransfer`; `enclosures.mjs`, `reflection.mjs` | 원래 SU(2) cube의 vacuum+6 faces spin cutoff, `M P_G K P_G M`의 유한 압축·양성·tail·Haar 오차 | 단순 matrix spectrum을 전체 continuum gap으로 바꾸지 않는다. 전체 비진공 공간 bound와 별도 limit 증명이 필요 |
| `M0/lean/MathScope/M0/Analytic.lean`, `Comparison.lean`, `Conditional.lean` | `GapAt`, `smaller_positive_gap`, inclusion 방향을 보존하는 `gap_transfer`, 격리된 user-axiom 예 | 실제 YM Hamiltonian·OS·spectral backend와 정리 인스턴스 |
| `M1/gauge/lean/MathScope/M1/Gauge/{SU3,G2,Transport,Conditional}.lean` | 실제 bracket/embedding/path fixtures, `projection_collision`, `property_descends_with_fibre_certificate`, `reconstruction_on_selected_slice` | 새 입력의 실제 kernel 실행. `finiteExcitedSupport`의 기존 gap 정리는 **Nat 단위의 유한 에너지 모형**이며 real spectrum/continuum 정리가 아님 |

## 4. NS N6 → N7 → N8

### N6: 먼저 닫아야 할 정확한 정리 사슬

`Def.9.4 → Prop.9.5 → Prop.9.6 → Lem.9.7 → Lem.9.8 → Prop.9.9` 순서를 유지한다. [NS §9.3–§9.5; Blueprint pp.61–62, 80]

| 원문 단계 | 구현해야 할 실제 대상 | 다음 단계에 넘길 조건 |
|---|---|---|
| Def.9.4 | 완전한 `(β,v,γ,w,p_m,p_w)`·support·유한 harmonics·압력 재구성·실제 `R=G+F` | `σ_j=1/5+j/10`, `B_j=1/2+σ_j`, `C*_j=1+σ_j`; (9.9)의 누적 class와 두 정확한 모멘트 (9.10) |
| Prop.9.5 | 고정 base+primary **full curls**에서 temporal mean (8.20), 그 다음 five-equation (8.25); 매번 pressure (8.12) 전후 재구성 | `j=0`, `B₀=0.7`, `C*₀=1.2`; 초기화는 primary covariance만 확인했다고 성립하지 않음 |
| Prop.9.6 | 지원된 비영 harmonics inverse → signed stress correction → zero-auxiliary-mean temporal inverse → 현재 세 defects의 five-equation repair | 모든 substep에 새 complete velocity를 사용하고 pressure를 갱신. 실제 residual·자기이차항·(7.41)/(9.13)의 세 remainder를 보존하여 각 차수 +0.1 |
| Lem.9.7 | 고정 base/primary/inverses에 대한 **한 `q_big>0`**와 모든 finite stage의 미분 의존 DAG | j나 미분 차수마다 정의역을 새로 줄이지 않음. 정해진 finite output derivative가 요구하는 input derivative 수만 유한 증가 |
| Lem.9.8 | 실제 auxiliary phase 대입 후 Cartesian derivative와 harmonic range ledger | `g_j=hj/10→∞`, 충분한 `ell_m=2A+(m+1)(1+3h/2)`, j 독립 `K_m`; (9.17)–(9.18)의 log powers/flat remainder |
| Prop.9.9 | 실제 `A_j,B_j,p_j`에 χ(a_j q)를 곱하고 **그 뒤** curl; (9.21)의 local field | 하나의 고정 finite state와 비교하는 Lem.5.4 tail로 (9.20)을 증명. stage별 flat residual을 무조건 직접 합산하지 않음. 축·η 끝점·외부 heat·inner swirl 모두 보존 |

N6의 여덟 원문 acceptance 항목은 이 사슬을 다음과 같이 검사한다.

1. Prop.9.5의 실제 j=0 초기화, 시간 평균 뒤 5모멘트 보정, pressure 전후 갱신, (9.9)–(9.10).
2. `R(u+δu,p+δp)=R(u,p)+L_uδu+div(δu⊗δu)`의 직접 PDE와 분해 결과 일치. 기존 flat term과 새 이차항을 모두 보존.
3. (7.13)의 지원된 비영 harmonic inverse, source-supported potential에 cutoff 뒤 curl, 모든 ordered `m+m′` 및 최대 harmonic/생략 tail 기록.
4. 고정 양의 `a_±`로 `δa=H_cov^(-1)(Σ/ε)/(2a)`를 사용하고 `B(W₀,LΣ)=Σ` 및 (7.41)의 세 remainder를 유지. 새 target마다 primary a를 다시 선택하지 않음.
5. (8.19)의 `k≠0` Fourier multiplier `1/(2π i v_t·k)`, zero mode 0, Diophantine bound, 추가 네 미분/Fourier tail 및 (8.14)/(8.20)의 실제 axial potential/remainder.
6. (8.25)의 두 conserved moments와 `P,Jθ,Jz`를 현재 actual tuple에서 계산하고 (8.12) 압력, (8.26)–(8.27)의 nonlinear defects 및 작은 λ conditioning을 유지.
7. 모든 finite j에 같은 q_big과 위 차수·미분 손실을 사용. 표본 residual이 작아지는 현상을 귀납 증명 대신 쓰지 않음.
8. (9.21) potential-level summation과 finite-stage 비교로 (9.20); active indices와 전체 tail 없이는 finite approximation으로만 반환.

### N7: actual local field의 전역화

원래 여덟 의무는 다음과 같다. [Blueprint pp.63–64; NS §10]

1. `q≤C₀(τ+|z|^(1/D))`와 원래 spatial/time cutoff를 사용하여 `q<q*/2`, smooth `(r²,z)`, 초기 0, 고정 compact K, singularity 근처 cutoff 1을 결속한다.
2. `curl(cA)=c curl A+∇c×A`와 전체 pressure를 사용해 실제 `f=R(u,p)`를 직접 계산한다. 모든 localization commutator와 `div u=0`을 독립 대조한다.
3. force는 divergence free일 필요가 없다. `-Δp=∂i∂j(u_i u_j)-div f`를 유지하고 불필요한 Leray projection으로 support/pressure를 바꾸지 않는다.
4. (10.6)–(10.10)의 모든 spatial/time terminal force jets `F_j`와 `∂x^αF_j(0)=0`를 증명한다. 유한 jet 수치와 모든 차수 endpoint regularity를 구분한다.
5. **force만** `t>1`로 (10.11)–(10.12)의 `Σχ₀(b_jσ)σ^jF_j/j!`로 연장한다. 모든 derivative diagonal cutoff, t≤2 support 및 terminal jets 일치를 유지한다.
6. 전체 K에서 energy/work/dissipation와 (10.13)을 확인하고 refinement 오차를 기록한다. core energy를 전체 에너지로 취급하지 않는다.
7. `x_τ=(sqrt(2X_in τ),0,0)`에서 `τ^A u_θ=e₀+O(τ^(2h))`, 실제 양의 e₀ 및 remainder로 growth를 결속한다.
8. 같은 force/data의 Lem.10.5, viscosity (10.22), shrink 후 disjoint periodization의 Cor.10.6을 구현한다. nonlinear support overlap을 허용하지 않는다.

따라서 N7 내부 진입점은 `Prop.10.1 → Lem.10.2 → Lem.10.3 → Lem.10.4/10.5 → Thm.1.1 → Cor.10.6`이다. N6 이전의 uncorrected M2 field를 여기에 바로 넣을 수 없다.

### N8: 실제장 재구성·독립 Galerkin·관측

원래 여덟 의무는 다음과 같다. [Blueprint pp.65–66]

1. 주기 2π Fourier에서 `k·û=0`, reality, k=0 mean과 Leray P_k를 유지한다. 압력에는 div f가 들어가며 전공간과 주기 문제를 구분한다.
2. 모든 ordered `p+q=k` direct convolution과 3/2 padded FFT를 retained/Nyquist 규칙까지 맞춘다. 무작위 solenoidal 자료를 10^-11 기준으로 대조하고 aliasing 음성 대조를 둔다.
3. IF/IMEX diffusion, CFL·embedded error·accepted-step energy를 기록한다. Taylor–Green 시간 반감으로 차수를 확인하고 dt와 무관한 spatial defect를 분리한다.
4. `s=-log τ`와 정확한 양의 내부 τ를 보존한다. 화면의 t가 1로 반올림되어도 τ를 0으로 바꾸지 않는다. 10^-2, 10^-4, 10^-8, 10^-12 및 precision-lower-bound를 대조한다.
5. grid/Fourier/coefficient-order/precision을 각각 refine하고 core·axial·pulse·active-order 스케일과 tails를 계산한다. 마지막으로 해상된 τ와 계산 예산을 명시한다.
6. physical bounds와 normalized view, streamline/pathline/speed/angular velocity, core/global energy를 구분한다. run hash·sample coordinates·units·color/vector scale을 기록한다.
7. source/numerical/analytic/Lean 링크를 별도로 유지한다. 배열은 PDE 공리가 아니며 certified approximation에는 enclosure와 domain이 필요하다.
8. source commit·constants·basis/domain/time/quadrature/truncation/precision/tail/residual/energy/camera/build log를 재생하고 다른 환경의 선택 실행을 tolerance와 함께 대조한다.

### 바로 재사용할 NS 경로와 정확한 결속 경계

| 현재 코드/entrypoint | 넘길 실제 값 | 추가 구현 의무 |
|---|---|---|
| `M2/navier/actual-common-admissible-family.mjs`: `prepareActualCommonAdmissibleFamily`, `family.constructBand()` | 동일 b_n, full leading+positive profiles, all-band norms·원래 Γ | 새 N6 상태에서도 same-family/source identity를 유지 |
| `actual-common-band-physical-curl.mjs`: `attachActualCommonBandPhysicalCurl` | full physical wave/pressure·모든 cutoff curl·실제 NS residual | N6의 새로운 source가 들어간 inhomogeneous inverse와 mean operators |
| `actual-common-global-covariance.mjs`: `attachActualCommonGlobalCovariance`, `constructSignedLocalTarget` | `.n6Interface`의 current background/full wave/primary/curl remainder/fullPhysicalResidual/flatTemporalForce 및 theta+Haar 평균 frame | 임의 target의 M_alpha 소속은 자동 인증되지 않음. 실제 현재 평균 잔차에서 Σ를 만들고 supported stress를 검증한 뒤 signed map에 연결 |
| `actual-physical-residual-algebra.mjs`: `exactPhysicalMomentumSplit`, `exactCovarianceResidualExpansion`, `exactSignedCovarianceInverse` | ordered transport, 이전 correction과의 cross, 새 square, linear inverse defect를 보존한 정확 대수 | 실제 입력의 함수 공간/적분/지원·private source 인증은 adapter에서 추가 |
| `actual-background-residual-flatness.mjs`, `actual-common-band-background-residual.mjs` | 같은 b_n의 모든 fixed m background bound와 실제 `E_B=R(background)+div(stress)` | E_B는 N6의 additive flat source. M2 전체 uncorrected NS residual을 0/flat으로 바꾸지 않음 |
| `actual-common-global-wave-bounds.mjs`, `actual-global-wave-bound-kernel.mjs`, `source-support.mjs` | all-label Gaussian cutoff force, 원래 palette·common-torus/support, 양의 무한 tail | 새 inhomogeneous source의 W_alpha bounds·새 harmonic ledger, zero-mean Fourier inverse·five-equation repair |
| `actual-physical-jet-kernel.mjs`, `actual-physical-full-curl.mjs`, `actual-common-physical-jet-kernel.mjs` | 원래 Cartesian/slow/auxiliary 연쇄법칙·cutoff 미분·full curl | N7의 새로운 localization derivatives와 N8의 실제 물리 sampler |
| `M2/observatory/index.mjs`: `observation.blowup-pair`; `visualization/observation-panels.mjs` | 같은 τ/프로파일의 physical–similarity 관측, 공통 카메라·값 추적 | 현재 branch는 **기존 M1 유한 candidate**다. 실제 N6/N7 무한합·source를 재구성하는 sampler나 독립 Galerkin solver로 대체/추가해야 함 |

현재 live M2 navier 모듈을 검색했을 때 (8.19)/(8.20)의 완전한 새 zero-auxiliary-mean inverse, (8.25)의 actual correction operator, §9의 전체 finite-state cycle, N7 force extension 및 N8 독립 Galerkin backend는 발견되지 않았다. 기존 positive-order background의 모멘트 행렬은 N4용이며, 이름이나 행 수가 비슷하다고 N6의 현재 `(P,Jθ,Jz)` correction으로 동일시하면 안 된다.

## 5. 새 결과를 기존 실행/증거 구조에 연결하는 지점

`M2/core/registry.mjs`의 kind/precision 입력 계약 → `core/engine.mjs`의 worker job → 새 source-bound result → `visualization/m2-views.mjs`의 표/관측 → `core/session-binding.mjs`의 `buildM2SessionBundle`/`commitM2SessionBundle` → `core/replay-import.mjs`의 새 환경 재계산을 재사용할 수 있다. 같은 패키지와 원문 기준 ID를 먼저 매핑한 뒤 새로운 kind를 추가한다.

`M1/core/theorem-adapters.mjs`의 `checkPinnedAudit`, `checkTheoremAdapter`와 `core/analytic-contracts.mjs`는 외부 정리·원래 가정·범위 검사의 출발점이다. 객체/assumption/claim 및 provenance는 `M0/contracts.mjs`의 구조를 사용한다. 시각화의 source/model/sample/observation hash와 표시 revision을 별도로 유지하는 기존 구현은 P8와 Y6에서 재사용한다.

각 원문 acceptance 기록에는 Handoff p.12의 기준대로 **taskId, 원문 기준, input revision, source commit/hash, run ID, artifact hash, 환경/명령/실제 exit, domain/norm/가정, 음성 대조, 남은 범위**를 넣는다. 도구 없이 작성한 새 Lean 파일은 새 kernel 실행 증거가 될 수 없으며, 과거에 검증된 변경 없는 kernel packet은 그 원래 범위로 유지한다.

이 읽기 지도에 의해 새로 닫힌 M2/M3 gate는 없다. M2의 실제 해석학·수치·실행 의무가 해소된 이후 위 entrypoint에서 원래 순서의 작업을 시작한다.
