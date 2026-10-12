# M3 게이지 연구실 — Y5 · Y6 · Y7

이 모듈은 기존 MathScope M1의 실제 Lie 행렬·4D 장·holonomy와 M2의 Wilson 격자·Metropolis·통계 코드를 그대로 가져와 **Δ별 장족, 새 양자 격자 chain, 4D 원본에 연결된 관측, 유한·조건부 Lean 감사**를 실행한다. P7과 기존 M1/M2 소스는 수정하지 않는다.

원본 설계도의 24개 항목과 전체 합격 문구는 [original-criteria.json](original-criteria.json)에 보존했다. 최신 첨부 설계도 `20261012-061419.pdf`의 SHA-256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이다. 24개 ID·제목·문구·페이지는 저장소의 이전 원문 목록과 모두 일치한다. 항목별 완료 여부, 실행 근거와 남은 조건은 [GAUGE_PROGRESS.json](../GAUGE_PROGRESS.json)이 기준이다. 예제가 실행된 사실만으로 원래 항목 전체를 완료 처리하지 않는다.

게시 v85–v89의 실제 계산·선택·재열기·키보드·공통 scale·상태 label·proof 원문 일치와 기존 수치/Lean 증거를 검토하여 **24개 중 21개를 명시한 범위에서 완료**했다. Y6는 8개 모두 완료했다. [독립 기준별 검토](evidence/ui-criterion-assessment.json)와 [변경하지 않은 관련 UI 증거 11개](evidence/live-ui-v85-v89-gauge.json)에 그 판단을 연결했다. 검토 중 발견한 ensemble 곡선의 ESTIMATED label 누락도 실제 v89 새 chain 실행에서 수정·확인했다.

Y5-05의 독립 물리 scale-setting과 target calibration, Y5-06의 독립 진공 제거 근거·finite-T/overlap 제어, Y5-08의 고정 물리 조건에서 맞춘 a/L/T 비교는 PARTIAL이다. 유한 모형의 완료와 양자 Yang–Mills continuum 문제의 해결을 구별하며 `OPEN_CONTINUUM`을 유지한다.

## 실행 인터페이스

브라우저와 Node가 같은 구현을 사용한다.

```js
import {
  runGaugeM3, getExamples, getCapabilities,
  inspectFieldSelection, inspectLatticeSelection,
  exportGaugeSession, importGaugeSession, replayGaugeSession
} from './research-ide/mathscope-m3/gauge/index.mjs';

const result = await runGaugeM3({
  kind: 'field-family',
  mode: 'EXPLICIT_EFFECTIVE_MODEL',
  deltas: [1, 2],
  epsilon: 0.08,
  sampleCount: 5,
  extent: 2,
  slice: 0,
  observation: 'SLICE'
});

const originalPoint = inspectFieldSelection(result, 0, 62);
const bundle = await exportGaugeSession(result, {
  selectedState: 0, selectedPoint: 62
});
const replay = await replayGaugeSession(bundle);
// replay.status === 'MATCH'일 때도 새 Lean 증명이라는 뜻은 아니다.
```

`runGaugeM3`의 반환 schema는 `MathScope.M3.GaugeResult/1`이다. 아래 입력은 모두 flat JSON으로 내보내기·실제 재실행이 가능하다.

| `kind` | 실제 계산 | 핵심 출력 |
| --- | --- | --- |
| `field-family` | Δ 모드별 실제 4D 장, 곡률, 불변 밀도와 관측 | `states[].points`, `probe`, `sampleHash`, `displaySamples`, `loop`, `flow`, `spectral` |
| `finite-spectrum` | 명시 유한 지수합·상관행렬·GEVP·유효질량 | `samples[].correlationMatrix`, `gevp`, `effectiveMass` |
| `finite-transfer` | BigInt 유리수로 전체 유한 진공·비진공 공간의 ratio 검사 | `source`, `excited`, `gap`, `checks`, `scope` |
| `ensemble-family` | Δ별 독립 cold/hot Wilson chain·연결 상관함수·오차 | `calibration[].replicas`, `correlator`, `targetComparison`, `limitComparison` |
| `lattice-observation` | 실제 저장된 links의 시간 절단·적분·평균·표본평균 | `states[].points`, `source.records`, `inspectLatticeSelection` |
| `wilson-flow` | 비정상 finite Wilson gradient flow·step refinement·gauge covariance | original/flowed `states`, `flow.history`, `flow.error` |
| `proof-audit` | 정확 source hash 대조·가정 registry·투영 반례·열린 의무 | `audit`, `assumptions`, `projectionCounterexample`, `continuumObligations` |

`getExamples()`는 실행 가능한 13개 입력을 제공한다. [runtime-audit.json](evidence/runtime-audit.json)은 그 입력들을 실제 실행하고, 원본 선택·session replay·긴 chain의 원자료 재계산까지 검사한 source-bound 기록이다. [examples](evidence/examples/)에는 당시의 완전한 수치 결과가 있다.

## Y5: Δ의 네 가지 뜻

| 모드 | Δ를 바꾸면 변하는 것 | 보존되는 것 |
| --- | --- | --- |
| `DECLARED_LOWER_BOUND` | 별도 quantum model에 대한 사용자의 gap 가정 revision | 실제 장·A/F·물리 관측 sample·original source hash |
| `UNITS_RESCALING` | 표시 좌표·밀도 단위·표시 revision | 같은 물리장과 물리 좌표의 실제 샘플 |
| `EXPLICIT_EFFECTIVE_MODEL` | 선택한 ℓ=ℏc/Δ, ρ=κℓ 규칙에 따라 실제 장·곡률·관측 | 명시한 유효모형의 규칙과 가정 ID |
| `EMPIRICAL_ENSEMBLE_ESTIMATE` | calibration row의 β·a·L·T와 새 chain에서 얻은 측정 | 입력 target와 추정 질량의 구별 |

양수가 아닌 Δ, 누락 단위, 지원하지 않는 입력, 장 모드에 ensemble 자료를 섞는 요청을 거부한다. 가정 모드는 최상위 `original.sourceHash`와 각 상태의 `sampleHash`까지 유지하고 `assumptionRevisionHash`를 바꾼다. 표시 단위 모드는 원래 `points`를 유지하고 `displaySamples`에 변환한 숫자·좌표와 한 표시 길이가 몇 원래 길이 단위인지 저장한다. `ell`은 유효모형에서만 물리적 구성 규칙으로 사용하며, 다른 모드의 단순 역에너지 길이는 별도 `declaredInverseEnergyLength`이다.

### 실제 유효 장과 스펙트럼

`A = ιA_BPST(ρ) + (ε/ℓ) Σ c φ((x−x₀)/ℓ)T`를 기존의 전체 Lie 기저에서 만든다. `F=dA+[A,A]`는 실제 행렬로 계산한다. SU(3) defining 및 compact G2의 실제 7×7 원본 예제가 있다. ε≠0에서는 Yang–Mills residual도 계산하며 off-shell 가능성을 숨기지 않는다.

기본 유한 스펙트럼은 `Ej=Δ+εj`, `εj≥0`, `wj≥0`이다. 명시한 자연단위에서

\[
C_\Delta(t)=\sum_j w_j e^{-(\Delta+\epsilon_j)t}
\le e^{-\Delta t}\sum_jw_j,\qquad t\ge0.
\]

각 항에서 `exp(−εj t)≤1`이라는 조건이 필요한 이유를 보존한다. ε=0인 최저 모드의 양의 weight가 없으면 관측 channel이 Δ를 보는 것으로 간주하지 않는다. 장족과 이 스펙트럼의 연결은 `assumptionId`가 있는 유효모형 정의이다. 이를 Yang–Mills 재구성 정리로 해석하지 않는다.

순수 BPST에서 Δ를 1→2로 바꾼 실제 중심 density는 16배, 무한 x4 marginal은 8배가 되고, 4D 고전 작용은 그대로이다. 이는 ρ→ρ/2와 4D Jacobian에 따른 고전 scaling이다. Quantum Hamiltonian의 unitary dilation 관계와 domain 일치 가정은 별도이다.

`convertLatticeMass`는 `Δphysical=(ℏc/atPhysical)(atΔ)`를 계산한다. source ID/hash·길이/에너지 단위·target로부터 독립인 scale을 요구한다. `ensemble-family`의 외부 실측 scale을 다른 β에 그대로 재사용하면 거부한다. 기본 실행은 `ell0`로 정한 유한 모형 단위이며 물리 scale-setting의 실측 완료를 뜻하지 않는다.

### 새 Wilson chain과 실제 관측

생산 adapter는 **연속 SU(2) defining links**를 사용한다. SU(2) 부분군 chain을 SU(3) 또는 G2 전체 ensemble로 이름만 바꾸지 않는다. 각 target row에서 cold와 Haar-hot 두 chain을 새로 생성하며, 기존 M2 action cache를 실제 full plaquette action과 대조한다. 로컬 proposal 또는 전체 Haar proposal에 대한 Metropolis 판정을 수행하고 다음을 저장한다.

- PRNG seed, β·격자·경계·업데이트 수·acceptance와 전체 sweep history.
- 각 보존 configuration의 hash·작용·plaquette·반올림하지 않은 topology estimate.
- 각 시간 절단의 두 gauge-invariant 연산자: 공간 평균 plaquette trace와 그 trace 제곱의 공간 평균.
- 마지막 configuration의 실제 link 행렬, 별도 gauge-invariance 검사, source/model/sample hash.
- replica별 autocorrelation·ESS·split R-hat·topology mobility와 circular moving-block bootstrap.

연결 상관함수는 모든 보존 configuration과 주기 시간 원점을 사용하여 계산한다. 두 채널의 평균을 bootstrap마다 다시 계산한다. 평균 제거가 전체 진공 projector인지는 **명시한 unique-vacuum 가정**에 조건부이다. 일반적인 퇴화 진공 projector나 continuum 진공 정리를 새로 얻었다고 표시하지 않는다.

주기 시간에는 cosh estimator와 finite-T 해석을 사용한다. `C≤0`, 역 cosh의 argument<1, singular GEVP는 각각 숫자 대신 `null`과 원인을 반환한다. `abs`, 임의 clipping, ridge 정규화로 통과시키지 않는다. GEVP는 관측량 기저와 잔차·condition number를 남기며 전체 spectrum의 인증과 분리한다.

### 실행된 긴 chain의 결과

[ensemble-production-attempt2.json](evidence/ensemble-production-attempt2.json)은 `2³×8`, `as=at=0.5 ell0`, 주기 경계에서 각 β마다 cold/hot 각각 burn-in 256과 보존 1,536개를 사용한 실제 실행이다. `FULL_BASIS_LIE_METROPOLIS`, step size 1.5, bootstrap 128회·bin 32, 명시 seed를 사용했다. 이 실행의 당시 모든 코드와 보호된 의존 source hash는 [source-production2/manifest.json](evidence/source-production2/manifest.json)에 있다.

| target Δ | β | 두 replica의 channel ESS | 첫 양의 lag의 cosh 질량 (`ell0⁻¹`) | 조건부 bootstrap 95% 구간 |
| ---: | ---: | --- | ---: | --- |
| 1 | 1.5 | 244.38, 207.92 | 7.01241 | [6.11888, 9.46751] |
| 2 | 2.2 | 81.14, 89.24 | 5.67835 | [4.92883, 7.02758] |

두 행은 유한 channel 통계 진단을 통과했으나 **target를 맞춘 결과가 아니며 plateau도 아니다**. 더 긴 lag에서는 음의 C나 불가능 cosh 입력이 실제로 나타나고 그대로 남는다. β=2.2의 두 번째 lag 질량 4.11684에도 충분한 유효 bootstrap 표본이 없어 구간을 부여하지 않았다. 이전 짧은/더 낮은 ESS 실행도 삭제하지 않고 [ensemble-family-run.json](evidence/ensemble-family-run.json), [ensemble-production-run.json](evidence/ensemble-production-run.json), [source-attempt1/manifest.json](evidence/source-attempt1/manifest.json)에 보존했다.

통계 오차, operator overlap, finite T, finite L, lattice spacing, 표현 cutoff를 독립 항목으로 내보낸다. 물리량을 맞춘 a/L/T sweep과 scale 설정이 없으므로 외삽 fit은 `null`이다. 양의 spectral 가정 아래의 방향은 `gap_global ≤ E_channel ≤ zero-temperature log-effective mass`이며, 양의 channel 질량은 전체 gap의 양의 하한이 아니다.

## Y6: 관측에서 원본으로 돌아가기

`SLICE`는 실제 4D 좌표 `[x1,x2,x3,c]`를 저장한다. 선택하면 그 좌표에서 A/F를 다시 계산한다. `MARGINAL`과 `AVERAGE`는 한 점 대신 원래 적분 domain을 반환한다. `INFINITE_BPST_MARGINAL`은 순수 BPST에서만 허용한다. 일반 perturbation에 BPST tail을 재사용하지 않는다.

finite marginal은 actual curvature density의 Simpson 수치 적분이고, BPST의 원시함수 recurrence로 계산한 finite/infinite 참조와 비교한다. tail은 양의 양 끝점 바깥에서 `(a²+t²)^−4 ≤ |t|^−8`를 적분한 식을 따로 남긴다. 화면의 refinement 차이나 Float64로 평가한 tail은 directed interval 인증이 아니다.

이산 `lattice-observation`은 실제 저장된 링크에서 clover F와 invariant density를 다시 계산하여 `at Σq`, `(1/Nt)Σq`, `(1/Nsample)Σconfig q`를 서로 다른 연산자·축·단위로 제공한다. 표본평균은 같은 group/action/spacing/boundary model만 결합하며 다른 β를 평균에 섞으면 거부한다. 위 긴 Wilson chain의 마지막 cold/hot 실제 링크도 원래 hash를 대조한 뒤 시간 marginal과 표본평균으로 계산했다. [lattice-chain-marginal-mean.json](evidence/lattice-chain-marginal-mean.json)에 그 4D source와 전체 source-member 목록이 있다.

`await inspectLatticeSelection(result,stateIndex,pointIndex)`는 기여한 모든 시간·configuration·site의 계수, 저장 gauge ID, 실제 link와 clover F를 반환한다. 일반 표본평균을 평형 ensemble로 이름만 바꾸지 않는다. open boundary에서 clover stencil이 불완전하면 0으로 채우지 않고 생략 원인 또는 관측 불가능 오류를 반환한다.

기본 화면은 gauge-invariant density를 사용한다. A/F 성분은 gauge ID가 있는 진단이다. 실제 비상수 gauge transformation 후 기본 불변량과 성분 변화량을 함께 검사한다. 화살표나 색 모양에서 양자 gap을 추론하지 않는다.

Flow time은 별도 observation revision이다. 연속 BPST 필드 패널에서는 정확 stationary self-dual 해를 제공하고, 별도 `wilson-flow`는 실제 비정상 SU2/SU3/G2 유한 Wilson link의 gradient flow를 계산한다. 원본 density/source는 덮어쓰지 않는다. 실제 x4 이동이 있는 4D loop의 holonomy와 x4=0으로 평탄화한 경로의 holonomy도 각각 계산하며 두 값을 동일시하지 않는다.

새 finite flow는 `τ=t_flow/as²`, `dV/dτ=−g0² grad_B(S_W)(V)V`를 명시한다. 전체 Lie 기저의 analytic link derivative에 기존의 정확 Gram inverse를 적용하므로 기저가 orthonormal이라고 가정하지 않는다. Lie exponential Euler의 n·2n step을 독립 실행하고, 전체 Wilson action의 중앙차분과 force를 비교하며, site gauge transform과 전체 flow trajectory가 교환하는지 검사한다. 이 검사는 수치 진단이고 step 차이는 rigorous global error bound가 아니다. action이 증가하는 step이나 group/covariance 기준을 벗어난 결과는 거부한다.

[wilson-flow-su2.json](evidence/wilson-flow-su2.json), [wilson-flow-g2.json](evidence/wilson-flow-g2.json)은 source 보존·실제 action 감소·step refinement·gauge covariance 실행 결과를 담는다. G2는 실제 7×7 links와 14개 force 방향을 사용한다. 완성한 finite flow를 continuum flow 또는 spectral-gap 인증으로 표시하지 않는다.

서로 x4 중심이 +1/2, −1/2인 실제 4D BPST 장은 x4=0에서 같은 전체 3D scalar density slice를 가지지만 x4=1의 density는 다르다. 이 반례는 그림만으로 4D 원본과 spectrum을 복원할 수 없음을 보여 준다. Lean의 별도 point-projection 비단사 정리와 BPST Real 해석식의 증명 범위를 구분한다.

세션 import는 해시가 맞아도 `IMPORTED_UNVERIFIED_REPLAY_REQUIRED`이다. replay는 입력을 다시 계산하여 전체 결과 hash를 비교한다. 변조 뒤 다시 hash를 붙인 false data도 실제 재계산과 일치하지 않으면 `MISMATCH`이다. Camera 변경은 presentation이고, 장·경계·G·유효 Δ·proof source 변경은 관련 수학 증거를 stale로 만든다. 화면의 키보드·색 독립 표식·수치 table·실제 선택 동작과 새 source로 바뀐 과거 기록의 권한 거부는 게시 브라우저 감사에서 확인했다.

## Y7: 실제 kernel 결과와 조건부 의무

### 새로 실행한 유한 Lean suite

[verify_lean.py](verify_lean.py)는 공식 Lean 4.34.1 `5045d0056413266e57c625dcd7c365b10e377c52`와 변경하지 않은 portable frontend driver를 사용했다. 기존 M0의 driver source와 공식 shared library를 사용했으며 kernel/runtime/guard를 수정하지 않았다. [lean-audit.json](evidence/lean-audit.json)에 library·driver·각 source·명령·종료 코드·log hash가 있다.

총 18개 프로세스에서 8개 양성 소스가 exit 0, 10개 음성 소스가 exit 1로 기대대로 판정되었다. 보호된 M1의 실제 SU3/G2 exact 데이터, bracket·transport·conditional 정리를 새로 컴파일했다. 잘못된 Jacobi·embedding index·Wilson path·projection·weight·진공·ratio·time·가정 제거를 실제 거부했다. 첫 실행의 잘못된 작업 디렉터리 오류도 별도 log로 남기고, 올바른 소스 root에서 다시 수행한 결과만 사용했다.

새 [FiniteSpectral.lean](lean/FiniteSpectral.lean)은 비음수 정수 weight와 정확 유리수 geometric transfer의 모든 자연수 시간 합, 전체 유한 진공, 올바른 spectrum 포함 방향, 제한 domain reconstruction을 검사한다. 사용자 YM axiom을 추가하지 않는다. 이 파일의 일반 유한합 정리는 Lean 표준 `propext`, `Quot.sound`에 의존할 수 있으며 사용자 gap axiom과 구별한다. Real.exp/log 정리는 아래의 별도 Mathlib 실행으로 검증했다.

### 기존 Core10과 Mathlib 원본 보존

실제 기존 사이트에서 추출한 Core·Mathlib·scenario 소스를 [legacy](legacy/)에 byte 그대로 저장했다. Core hash `c4316c0c6b8d3ba1461b675a377728b8baf2096b6f0ea6938fa9653eb1326639`를 새 kernel으로 다시 검사해 10개 axiom-free 일반 보조정리와 사용자 존재 공리에 의존하는 corollary를 구분했다. 이전 Mathlib scaffold와 scenario는 **원래 성공 receipt의 hash가 일치하는 inherited evidence**이다. 이를 새 컴파일로 보고하지 않는다.

### 새 Real exp/log kernel 검증

Mathlib pin은 `d13f23b723b8a846827a245b89c10fc7d3f11612`이다. [RealSpectralBridge.lean](lean/RealSpectralBridge.lean), [verify_real_lean.py](verify_real_lean.py)는 [실제 성공한 CI 실행 38215697672](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38215697672)에서 별도로 컴파일되었다. [real-lean-release.json](evidence/real-lean-release.json)은 변경하지 않은 원본 audit, 다운로드한 archive의 SHA, 실제 컴파일 source와 3,439개 import closure의 hash, compiler log 재검사를 묶는다. 처음 두 번의 fixture 컴파일 실패도 보존했으며 성공한 세 번째 실행만 `KERNEL_CHECKED_REAL_FINITE_SCOPES`의 근거다.

8개 theorem은 실수 시간의 양의 weighted exponential sum, log ratio 하한, 양의 gap, 보수적 `(1-r)/at` 하한, 전체 비진공 transfer enclosure와 그 지수 감쇠합 연결을 포함한다. `modelId`, `cutoff`, 전체 유한 dimension, 정확한 전체 vacuum, 모든 비진공 ratio 조건은 certificate의 type과 결론에 남는다. 실제 4-state fixture는 고유값 8·4·2·1, ground 8, `at=1`, `r=1/2`에 대해 해당 유한 모형의 하한 `-log(1/2)`를 증명한다. 사용자 gap axiom과 `sorry`는 없고 표준 Lean 공리만 사용한다. 9개 필수 가정에 대해 양성 consumer는 컴파일되고 해당 binder를 제거한 음성 consumer는 실제 거부되었다.

이는 명시한 완전한 유한 diagonal 모형의 증거다. 임의의 Wilson 수치 eigenvalue나 새로 편집한 JSON에는 그 입력을 정확히 묶는 새로운 proof consumer가 필요하다. 브라우저는 저장된 source와 receipt의 일치를 검사하며 Lean을 새로 실행했다고 표시하지 않는다. Float64의 `-Math.log(r)/at` 값은 여전히 표시용 추정이다.

[package_lean.py](package_lean.py)는 현재 source, 양성·음성 source, raw compiler log, CI archive, import closure를 원래 receipt의 SHA와 대조한 뒤 45개 source를 패키징한다. 하나라도 바뀌면 새 kernel 실행을 요구하며 중단한다. 이 절차는 기존 유한 suite와 새 Real CI의 검증 범위를 별도로 유지한다.

게시 단계에서 Python source 안의 문자 escape가 실제 Unicode 문자로 바뀌어 source SHA가 불일치한 사례를 확인했다. 원본과 receipt를 유지하면서 payload를 UTF-8 base64로 전달하고, 브라우저에서 복호화한 정확한 원문을 기존 SHA 검사에 넣도록 고쳤다. [source-transport-audit.json](evidence/source-transport-audit.json)은 실제 불일치 hash의 재현과 45개 원문 hash 일치를, [package-guard-audit.json](evidence/package-guard-audit.json)은 source·log·closure 변조를 계속 거부하는 검사를 기록한다.

### 고정 의미의 가정과 열린 continuum 의무

사용자 가정은 의미 type·G·model ID·unit·Δ·정확 quantifier·출처·SHA·revision을 가진다. registry는 임의 Prop를 참으로 만드는 공리를 받지 않고, 의미와 quantifier의 불일치, 알려진 양의 energy와 gap 가정의 충돌, 누락되거나 순환하는 의존 ID를 거부한다. 사용자 statement 문자열은 고정 type의 의미를 바꾸는 권한이 없다.

Projection 이후의 명제에는 fibre constancy 또는 명시 domain의 reconstruction, 그리고 올바른 전체 spectrum 포함 가정이 필요하다. 사용자가 certificate 모양의 JSON을 입력해도 그 자체는 가정이며 새 theorem이 아니다.

Schwinger observable algebra, regularity, Euclidean symmetry, reflection positivity, clustering, full vacuum, reconstruction theorem 적용을 독립 의무로 관리한다. 일정 물리량에서의 continuum limit, 무한 L/T, nontriviality, QFT axioms, uniform positive full-spectrum gap도 서로 분리한다. 유한 성공과 사용자의 존재 공리는 이 의무들을 닫지 않는다. 결과의 `continuumGap`은 `OPEN_CONTINUUM`, `clayProblemSolved`는 `false`다.

## 재실행 명령

저장소 root에서 실행한다.

```bash
node --test --test-reporter=tap research-ide/mathscope-m3/gauge/tests/*.test.mjs
node research-ide/mathscope-m3/gauge/verify_runtime.mjs
```

공식 toolchain 경로와 변경하지 않은 driver를 주어 유한 Lean suite를 다시 실행할 수 있다.

```bash
python research-ide/mathscope-m3/gauge/verify_lean.py \
  --toolchain /absolute/path/to/lean-4.34.1-linux \
  --driver /absolute/path/to/lean-embed-check
python research-ide/mathscope-m3/gauge/package_lean.py
```

[tests.tap](evidence/tests.tap)은 기본 runtime 19개 회귀검사의 실제 결과이다. 추가 lattice/flow 7개 회귀검사 결과는 [lattice-flow-tests.tap](evidence/lattice-flow-tests.tap)에 있다. 이 검사는 모드/단위, 실제 장/곡률 변화, 원본 선택, gauge invariance, 합/평균, invalid C/cosh, GEVP singularity, 전체 진공, 명시적인 음성 입력, source stale와 실제 새 chain replay를 다룬다. `runtime-audit.json`은 공개 예제 13개와 source manifest를 별도로 기록한다. 긴 chain의 source snapshot은 현재 구현과 혼동하지 않도록 각 실행 결과에 독립적으로 연결된다.

## 설계도에서 이어받은 주요 문헌

- [Vandoren–van Nieuwenhuizen, Lectures on instantons](https://arxiv.org/abs/0802.1862): BPST·곡률·고전 scaling의 배경. 여기서 사용한 finite marginal 원시함수와 tail 식은 소스에 명시되어 있다.
- [David Tong, Lattice Gauge Theory](https://davidtong.org/pdfs/teaching/gauge-theory/gauge4.pdf): Wilson 모형, Haar links와 격자 observable의 배경.
- [Lüscher, positive transfer matrix](https://doi.org/10.1007/BF01614090): 특정 격자 모델 가정에 대한 외부 정리. continuum 재구성 완료로 가져오지 않는다.
- [Wolff, Monte Carlo errors with less errors](https://arxiv.org/abs/hep-lat/0306017): autocorrelation-aware 오차 분석의 배경.
- [Blossier et al., generalized eigenvalue method](https://arxiv.org/abs/0902.1265): GEVP와 excited-state contamination의 배경.
- [Lüscher, Wilson flow](https://arxiv.org/abs/1006.4518): flow time과 gauge-invariant flowed observables의 배경. 현재 일반 flow solver의 실행 근거로 대신하지 않는다.
