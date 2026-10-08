# MathScope v0.3.1 데이터·수학 계약 참조

이 문서는 원본 Master Checklist p34의 문서 16개 항목을 현재 구현에 연결한다. 실행 순서는 [사용 안내](STAGE8_USER_GUIDE.md), 승인 조건은 [릴리스 요구사항](STAGE8_RELEASE_REQUIREMENTS.md), Lean 원본·재현 절차는 [formal 안내](../formal/README.md)를 따른다. 문서의 존재나 개별 예제 성공은 릴리스 동결 승인이 아니다. 개발판은 [v0.3.1.html](https://project29770.websitepublisher.ai/v0.3.1.html)이며 안정판 `index.html`은 별도다.

기준은 2026-10-08 실제 검증한 frontend v35 / `ac30af83`과 Compute `235b73dfc730ab4ee4e4c9862138fd839079a213`의 adapter 코드다. FailureRecord 및 server-job 계약은 아래에 구분한다. 실제 배포·브라우저 검사, CPU 지표와 사용자 보고의 범위는 [최신 릴리스 증거](STAGE8_RELEASE_REQUIREMENTS.md#current-evidence)를 따른다. 아래 JSON 예제에서 “필드 발췌”라고 표시한 것은 설명용 부분 객체이며 완성된 실행 결과나 서명된 영수증이 아니다. 실제 실행의 ID·revision·hash·환경·시각은 결과에서 가져온다.

## 문서 16개 항목의 위치

| 원본 항목 | 이 문서의 위치 | 함께 볼 실제 구현·안내 |
|---|---|---|
| Getting Started | [시작](#getting-started) | [사용 안내](STAGE8_USER_GUIDE.md) |
| Mathematical Contract | [수학 계약](#mathematical-contract) | [서비스 계약](../README.md#architecture) |
| ObjectSpec | [객체](#objectspec) | frontend Foundation `validateObjectSpec`; [Golden builder](../app/adapters/golden_elliptic.py) |
| RepresentationSpec | [표현](#representationspec) | frontend `validateRepresentationSpec`, `guard3DRepresentation` |
| OperatorSpec | [연산자](#operatorspec) | frontend Stage 2/3; [Golden builder](../app/adapters/golden_elliptic.py) |
| PDESpec | [PDE](#pdespec) | frontend Stage 2/3; [Golden 입력·builder](../app/adapters/golden_elliptic.py) |
| SpectrumSpec | [스펙트럼](#spectrumspec) | [유한 스펙트럼 adapter](../app/adapters/spectrum_laplacian.py) |
| KTheorySpec | [K-theory 데이터](#ktheoryspec) | [Stage 6 adapter](../app/adapters/index_elliptic.py) |
| EvidenceRecord | [증거](#evidencerecord) | [서버 모델](../app/models.py); frontend Foundation |
| status glossary | [상태 용어](#status-glossary) | [사용 안내](STAGE8_USER_GUIDE.md) |
| solver guide | [계산 실행](#solver-guide) | [capabilities 구현](../app/main.py); [adapter 목록](../README.md#api) |
| proof guide | [증명](#proof-guide) | [formal 안내](../formal/README.md), [고정 manifest](../formal/golden-manifest.json) |
| projection/fidelity guide | [투영·충실도](#projection-fidelity) | [3D 계약](STAGE8_HARDENING.md#3d-representative-law) |
| K-theory disclaimer | [K-theory 범위](#ktheory-boundary) | [Stage 6 출력](../app/adapters/index_elliptic.py) |
| AI boundary | [AI 권한](#ai-boundary) | frontend Stage 5 `orchestrate`, `copilotCanPromote` |
| reproducibility | [재현성](#reproducibility) | [수치 replay](../app/golden.py), [환경](../app/provenance.py), [formal replay](../formal/replay.py) |

<a id="getting-started"></a>
## 시작과 ResearchSession

1. 개발판 Stage 1에서 세션을 만들고 ID·`sessionRevision`을 기록한다. `Save session`은 브라우저의 localStorage에 저장한다. 기기 간 동기화나 서버 계정 저장소를 뜻하지 않는다.
2. Stage 2/3의 작은 참조 계산을 실행하여 원본 객체, representation, claim, evidence의 차이를 확인한다.
3. Stage 8에서 `Run Golden A → B → C → D`를 실행한다. 같은 세션·revision에 연결된 후보해, 연산자, 유한 스펙트럼, mesh, stress, symbol/index 출력을 읽는다.
4. 별도 검증이 필요하면 정확한 증명 범위를 검토한 뒤 고정 Lean verifier를 실행한다. 수치 실행 버튼은 증명 버튼이 아니다.
5. `.mathscope` 내보내기, 같은 파일 가져오기, 수치 replay, 필요한 고정 증명의 새 replay를 각각 수행한다. 세부 클릭 절차와 키보드·접근성 절차는 [사용 안내](STAGE8_USER_GUIDE.md)를 따른다.

세션 schema 값은 `MathScopeResearchSession/0.3.1-foundation.1`이다. 공통 필드는 `id`, `title`, `goals`, `activeObjectRef`, `environmentRef`, `createdAt`, `updatedAt`, `sessionRevision`, `archivedAt`이다. 데이터 collection은 `objects`, `representations`, `functionSpaces`, `differentialSystems`, `optimizations`, `operators`, `pdes`, `spectra`, `geometries`, `topologies`, `entropies`, `symmetries`, `kclasses`, `claims`, `evidence`, `assumptions`, `revisions`, `checkpoints`이다. Golden 실행 후에는 `researchRuns`, `replayJobs`가 추가된다.

각 typed node의 `revision`과 세션의 `sessionRevision`은 구분한다. Golden node는 `sessionId`, `sessionRevision`, `revision`, `stage`, `upstreamRevisions`, `evidenceRefs`를 함께 가지며, builder는 세션·revision 혼합, 중복 ID, 해소되지 않은 참조를 거부한다. 개별 참조 계산의 ID가 Golden ID와 같다고 가정하면 안 된다.

**검증 범위:** Foundation의 전체 세션 검사는 collection 배열, ObjectSpec, RepresentationSpec, EvidenceRecord의 기본 필드와 active-object 참조를 확인한다. 모든 collection에 동일한 완전 JSON Schema를 적용하는 구현은 아니다. Stage 2/3와 Golden의 PDE·Operator·Spectrum 필드 형식도 서로 다르다. 다른 module의 객체를 이름만 바꾸어 상호 교환하거나, Foundation schema PASS를 모든 수학적 가정의 검증으로 해석하지 않는다.

<a id="mathematical-contract"></a>
## 수학 계약

결론을 읽을 때는 원본 객체, 표현 방법, 계산 범위, 가정, evidence 등급, 최신성을 각각 확인한다.

| 구분 | 유지해야 하는 경계 |
|---|---|
| 객체 / 그림 | 3D 좌표는 원본 객체의 표현이다. 차원·위상·metric·injectivity의 손실을 별도로 기록한다. |
| 계산 / 정리 | 작은 residual이나 참조 예제 통과가 존재·유일성·오차 보증·일반 정리를 만들지 않는다. |
| 유한 / 무한 | 유한 행렬의 고윳값은 truncation과 basis가 있는 계산이다. 무한 연산자의 전체 spectrum 분류로 승격하지 않는다. |
| 선형화 / 비선형 | `DF(u*)`의 spectrum·index는 선택한 후보에서의 선형화 정보다. 비선형 해의 전역 안정성이나 해의 개수를 결정하지 않는다. |
| topology / 시각 유사성 | 유한 complex의 Betti 수·persistence 일치가 continuum의 homeomorphism을 증명하지 않는다. |
| 형식 증명 / 진단 | LSP·editor 오류 없음, AI 생성 코드, 다른 명제의 PASS는 현재 명제의 최종 검증이 아니다. |
| hash / 진위 | SHA·CRC는 내용 연결과 손상을 검사한다. 작성자 서명이나 신뢰할 수 있는 증명 영수증을 대신하지 않는다. |

가정 누락, 미지원 backend, timeout, 취소, 입력 변경은 실패·미완료 상태로 남겨야 한다. 과거 성공을 현재 입력의 성공으로 재사용하지 않는다. `null`, `UNKNOWN`, `NOT EVALUATED`는 0 또는 부정 명제와 다르다.

<a id="objectspec"></a>
## ObjectSpec

`session.objects[]`는 수학적 원본의 식별자와 구조를 보관한다. Foundation 필수 검사 대상은 `id`, `type`, `baseField`, 수치로 읽을 수 있는 `intrinsicDim`·`ambientDim`, 배열 `structures`·`assumptions`, `revision`, `provenance`, 존재하는 `hash`다. 이 검사는 hash 내용이나 수학적 구조의 참임을 자체 증명하지 않는다.

| 필드 | 의미·실제 예 |
|---|---|
| `type` | Stage 1 `Manifold`, Stage 2 `ScalarField`, Golden `ObjectSpec` 등 module별 종류 |
| `intrinsicDim`, `ambientDim` | Golden flat torus는 2, 4. display 차원은 RepresentationSpec에 따로 있음 |
| `structures` | Golden manifold의 `smooth`, `compact`, `closed`, `flat Riemannian`처럼 명시된 구조 |
| `domainRef`, `sourceObjectRef` | module별 domain 또는 원본 참조. 모든 ObjectSpec에 필수인 필드는 아님 |
| `revision`, `parentRevision` | node revision과 이전 revision. 일부 builder는 parent 대신 공통 revision graph를 사용 |
| `assumptions`, `provenance`, `hash` | 적용 가정, 생성 adapter/입력 출처, 실제 계산 또는 초기 `pending` 값 |

Golden manifold의 의미 필드 발췌:

```json
{"type":"ObjectSpec","label":"Flat unit torus T2","baseField":"R","intrinsicDim":2,"ambientDim":4,"structures":["smooth","compact","closed","flat Riemannian"]}
```

이는 유클리드 3D 그림의 donut metric을 PDE의 metric으로 사용한다는 뜻이 아니다. 계산 원본은 `(R/Z)^2`의 `dx²+dy²`이고, 4D product embedding과 3D display는 별도다.

<a id="representationspec"></a>
## RepresentationSpec

`session.representations[]`는 `sourceObjectRef`로 세션의 객체를 가리킨다. Foundation은 `id`, 해당 source 참조, 허용된 `method`, 수치 `displayDim`, `mapDefinition`, `parameters`, `sampling`, `injectivityStatus`, `ambiguityRef`, `fidelityVector`, `provenance`, `revision`을 검사한다. 기본 schema가 허용하더라도 3D renderer는 **숫자 `displayDim === 3`**을 추가로 요구한다. 원본의 intrinsic/ambient 차원이 3일 필요는 없다.

허용 method는 `projection`, `slice`, `embedding`, `stereographic`, `pca-like`, `spectral-reduction`, `user-defined`, `sampled-finite`다. 이름만으로 injectivity나 metric 보존이 입증되지 않는다. `lostDimensions`, `discardedCoordinates`, `inverseStatus`, `freshness`, `stale`은 해석과 최신성에 사용되는 추가 필드다.

Stage 1의 실제 초기 표현은 `(x1,x2,x3,x4) -> (x1,x2,x3)`, `NON_INJECTIVE`, 소실 좌표 `x4`, `NO_GLOBAL_INVERSE`를 기록한다. Golden 표현은 다음 내용을 가진다.

```json
{"method":"embedding","displayDim":3,"parameters":{"majorRadius":2,"minorRadius":0.65},"sampling":{"gridN":16,"periodic":true},"injectivityStatus":"EMBEDDING_OF_ABSTRACT_TORUS_NOT_ISOMETRY"}
```

Golden의 `mesh.vertices`는 source 좌표 `x`,`y`,`source4D`, display 좌표 `display3D`, `candidateValue`, `eigenmodeValue`를 함께 보관한다. `mesh.triangles`는 정점 index 3개 배열이다. `fieldChannels`는 후보해와 고유모드의 source·operator·spectrum 연결을 분리한다.

Stage 5/6/7의 화면 metadata인 `Research3DRepresentationSpec`은 module view 계약이다. 이것을 세션의 모든 RepresentationSpec과 같은 형식이라고 가정하지 않는다.

<a id="operatorspec"></a>
## OperatorSpec

**Stage 2/3 형식:** `id`, `T`, `domain`, `adjointDomain`, `codomain`, `baseField`, `linear`, `bounded`, `denselyDefined`, `closed`, `closable`, `symmetric`, `selfAdjoint`, `normal`, `unitary`, `compact`, `compactResolvent`, `adjointRef`, `norm`, `spectrumRef`, `resolventRef`, `revision`, `theoremAssumptions`를 사용한다. Stage 3는 `closureStatus`, `finiteRepresentationRef`도 기록한다.

`bounded:false`이면 domain이 필요하다. `symmetric:true`만으로 self-adjoint를 채우지 않으며 adjoint domain 상태를 명시한다. `finiteRepresentationRef`가 operator 자체의 `id`와 같으면 guard가 거부한다. 참조 모델의 `selfAdjoint:true` 등은 그 model의 명시적 가정에 속하며 임의 사용자 operator를 검사한 결과가 아니다.

**Golden 형식:** `expression`, `potential`, `domain`, `sourceMetric`, `boundary`, `matrixSymmetryResidual`, `finiteSize`, `continuumSelfAdjointness`, `compactResolvent`, `linearizedAt`를 사용한다. `linearizedAt`은 동일 실행의 후보 객체를 참조한다. Stage 2/3의 `T` 필드 형식과 동일하지 않다.

기본 Golden에서 `λ=1`, `u*=1`이므로 `potential=-2`, `expression="-Delta+(lambda-3*candidateValue^2)"`, `domain="H^2(T^2) -> L^2(T^2)"`이다. `matrixSymmetryResidual`은 유한 행렬 검사이며 continuum self-adjointness 문구는 외부 해석적 구조의 가정이다.

<a id="pdespec"></a>
## PDESpec

**Stage 2/3 형식:** `id`, `equation`, `classification`, `manifoldOrDomainRef`, `functionSpaceRef`, `coefficients`, `parameters`, `boundaryConditions`, `initialData`, `nonlinear`, `linearizationRule`, `objectiveRef`, `solverPlan`, `evidencePolicy`, `revision`, `theoremAssumptions`를 사용한다. Stage 2의 필수 필드 검사는 `initialData`, `linearizationRule`, `objectiveRef`, `theoremAssumptions`의 존재까지 요구하는 완전 schema는 아니다.

**Golden 형식:** `expression`, `parameters`, `candidateRef`, `residual`, `boundaryConditions`, `initialConditions`, `solverPlan`과 공통 node provenance를 사용한다. 식은 `-Delta(u)+lambda*u-u^3=0`. `boundaryConditions.exteriorBoundaryPresent=false`이며 주기 좌표 식별은 exterior boundary condition과 다르다. stationary elliptic 문제이므로 `initialConditions.applicable=false`다.

실행 가능한 기본 요청:

```json
{
  "adapter":"golden.elliptic-torus.v1",
  "inputSpec":{"sessionId":"example-golden-session","revision":1,"lambda":1,"candidateValue":1,"gridN":16,"refinements":[8,16,32],"seed":0},
  "environment":{"client":"documented example"}
}
```

`POST /v1/run`의 입력이다. 예시 session ID는 설명용이며 실제 브라우저 세션에 결과를 확정할 때는 현재 ID와 새 revision을 사용한다. `sessionId`는 `[A-Za-z0-9_.:-]` 1–128자, `revision`은 정수 1–1,000,000, `gridN`은 8/16/32, `refinements`는 8/16/32/64 중 오름차순 중복 없는 최소 2개다. `lambda`와 `candidateValue`는 유한한 [-4,4], `seed`는 0만 허용된다. 알 수 없는 Golden 입력 필드는 거부한다.

Golden은 주어진 상수 후보의 residual을 검사하며 일반 비선형 해를 탐색하지 않는다. `solverPlan`은 periodic five-point finite differences, complete finite Fourier diagonalization, GUDHI lower-star filtration, binary64, 후보 residual 허용치 `1e-10`, 선택 고유모드 residual 허용치 `1e-8`을 기록한다. 허용 parameter 범위에 든 모든 후보가 gate를 통과하는 것은 아니다.

<a id="spectrumspec"></a>
## SpectrumSpec

**Stage 2/3 형식:** `operatorRef`, `mode:"finiteApprox"`, `pointSpectrum`, `continuousSpectrum`, `residualSpectrum`, `resolvent`, `pseudospectrum`, `spectralRadius`, `truncationN`, `basis`, `projection`, `convergenceSeries`, `pollutionRisk`, `exactInfinite:false`, `revision`. Stage 3는 `eigenvalueConvergence`, `eigenvectorConvergence`, `projectionError`도 기록한다. 여기서 `truncationN=n*n`은 행렬 크기이며 mesh 한 변의 `n`과 다르다.

`pointSpectrum`의 수치는 유한 근사값이다. `continuousSpectrum`·`residualSpectrum`의 `NOT CLASSIFIED FROM FINITE MATRIX`와 같은 상태를 빈 spectrum이라고 바꾸지 않는다. `spectralRadius`가 일부 반환 고윳값에서 산출되었는지 전체 유한 spectrum인지 해당 adapter를 확인한다.

**Golden 형식:** `operatorRef`와 `data` 아래의 `potential`, `lowModes`, `allFiniteEigenvalues`, `refinement`, `finiteKernelDimension`, `finiteCokernelDimension`, `nearestZeroDistance`, `selectedEigenvalue`, `selectedEigenmodeResidual`, `finiteApprox:true`, `infiniteSpectrumCertified:false`를 사용한다. `lowModes`는 정렬된 첫 16개다. refinement는 `(kx,ky)=(1,0)` 모드를 추적하며 다른 parameter에서 양수가 아닐 수 있다는 caveat도 포함한다.

`finiteKernelDimension`은 `|eigenvalue| <= 1e-10`의 유한 수치 판정이다. continuum `IndexSpec.kernelDimension`과 자동으로 합치지 않는다. spectral-flow 출력도 같은 finite grid의 `L(t)=L+tI`이며 `infiniteFredholmFamilyProved:false`, `nonlinearSolutionContinuation:false`를 유지한다.

<a id="ktheoryspec"></a>
## KTheorySpec

Stage 6 `index.elliptic-reference.v1`은 `DifferentialOperatorSpec → PrincipalSymbolSpec → EllipticityResult → KTheorySpec → IndexSpec → BoundaryAnalysisSpec`를 반환한다. nonlinear model에서는 `NonlinearIndexBridgeSpec`, 별도로 `FormalizationCoverageSpec`도 반환한다.

| KTheorySpec 필드 | 실제 의미 |
|---|---|
| `id`, `type`, `operatorRef`, `principalSymbolRef` | 선택된 operator와 symbol의 연결 |
| `ellipticityStatus` | `THEOREM-BACKED ELLIPTIC`, `NUMERICALLY CONSISTENT`, `FAIL`, `UNRESOLVED NEAR TOLERANCE` 등 선택 mode의 판정 |
| `symbolClassRef`, `classStatus` | 적격한 elliptic symbol의 class 참조 metadata; 불확정/비타원이면 unavailable |
| `compactSupportSemantics` | 영단면 밖에서 가역인 symbol과 `T*M`의 compactly supported K-theory 관계를 기술 |
| `representative` | `kind:"sampled principal-symbol field"`, `unitCotangentSamples`, `determinantPhaseSamples` |
| `invariantData` | `quadraticFormSignature.positive/negative/nearZero` |
| `theoremAssumptions` | smooth bundles와 `xi != 0`의 symbol invertibility 가정 |
| `displayWarning`, `visualizationIsKClass` | `DISPLAY IS NOT THE K-CLASS ITSELF`, `false` |
| `evidenceRefs` | 이 adapter 출력에서는 빈 배열일 수 있음. 존재하지 않는 증거를 임의로 채우지 않음 |

Golden의 `kclasses[]`에는 이름 그대로의 `KTheorySpec` 대신 `PrincipalSymbolSpec`, `IndexSpec`, `BoundarySpec`가 들어간다. Golden symbol의 `data.kClass`는 `status:"STRUCTURAL METADATA"`, trivial complex line, `base:"T*(T^2)"`, scalar principal-symbol representative, `visualizationIsKClass:false`를 기록한다. collection 이름을 전 요소의 단일 type으로 해석하지 않는다.

<a id="evidencerecord"></a>
## EvidenceRecord

서버의 공통 필드는 [Pydantic 모델](../app/models.py)에 정의되어 있다.

| 필드 | 계약 |
|---|---|
| `id`, `claimRef` | 증거 identity와 지지/검사 대상 claim |
| `grade`, `scope`, `method` | 등급, 유효 범위, 실제 계산/검증 방법 |
| `inputsHash`, `environmentHash`, `adapterVersion` | 입력, 환경, adapter 구현의 연결 |
| `residuals`, `errorBounds` | residual/진단과 인증된 오차 보증은 다른 필드. `null`이면 보증 없음 |
| `assumptions`, `upstreamRevisions` | 전제와 의존 revision 목록 |
| `generatedAt`, `stale` | 생성 시각과 최신성 |

서버가 허용하는 grade는 `NUMERICAL INDICATOR`, `CERTIFIED NUMERICAL`, `UNKNOWN`, `FAILED`다. 이 compute service는 `FORMAL PASS`·`THEOREM-BACKED`를 발급하지 못한다. 출력 metadata 안에 외부 theorem mapping이 있어도 서버 evidence grade는 별개다.

Frontend Foundation의 허용 grade는 `FORMAL PASS`, `THEOREM-BACKED`, `CERTIFIED NUMERICAL`, `NUMERICAL INDICATOR`, `EMPIRICAL CORRESPONDENCE`, `RESEARCH HYPOTHESIS`, `UNKNOWN`, `STALE`다. 따라서 서버 `FAILED`를 그대로 일반 성공 evidence로 import할 수 있다고 가정하지 않는다. 실패·진단과 등급 변환 경로를 확인해야 한다. Foundation은 `freshness`, `supportsCurrent`를 추가로 사용하며, 유효한 형식만으로 현재 지지 권한을 주지 않는다.

고정 Golden formal 증거는 추가로 `dependencyLockHash`, `toolchain`, `deployCommit`, `proofHash`, `proofPackage`를 가진다. `proofPackage.schema`는 `MathScopeGoldenProofBundle/1`, `source`는 실제 Lean 원본, `metadata`는 검증 결과다. Foundation의 generic promotion은 formal/theorem 승격을 거부한다. audited verifier의 새 in-memory receipt를 검증하는 전용 경로만 formal 증거를 확정한다.

증거의 `grade`와 `freshness`는 별도다. 예를 들어 가져온 기록은 `grade:"FORMAL PASS"`라는 과거 결과를 보존하면서 `freshness:"HISTORICAL FORMAL"`, `supportsCurrent:false`가 된다. 페이지 reload도 serialized formal/theorem 기록을 재검증 대상으로 바꾼다. 과거 proof hash를 복사해서 현재 권한을 회복할 수 없다.

### FailureRecord 추가 계약

실패 보존은 `session.failureRecords[]`의 별도 기록이다. `schema:"MathScopeFailureRecord/1"`, `type:"FailureRecord"`, `id`, `kind`, `label`, `status:"RECORDED_FAILURE"`, `mathematicalGrade:"UNKNOWN"`, `canSupportClaim:false`, `canPromoteEvidence:false`를 가진다. 실패를 기록했다는 사실이 실패와 관련된 수학적 명제를 증명하지 않는다.

`cause`는 `code`,`message`; `inputSpec`은 재현 입력; `inputRedactions`는 credential 등 제거 내역이다. `sourceSessionId`, `sourceSessionRevision`, `recordedSessionRevision`, `createdAt`, `scope`와 `provenance.stage/operation/adapter/jobId/inputsHash/executionScope/cancellationConfirmed/details`를 보존한다. 입력 JSON은 64 KiB로 제한되며 credential 키를 제거한다. 원본 수학 입력을 인증 정보로 바꾸거나 숨기지 않는다.

kind는 `SOLVER_DIVERGED`, `MESH_INVALID`, `THEOREM_ASSUMPTIONS_MISSING`, `OPERATOR_DOMAIN_INCOMPLETE`, `SPECTRAL_POLLUTION_SUSPECTED`, `FORMAL_DEPENDENCY_MISSING`, `PROJECTION_NONINJECTIVE`, `TOPOLOGY_COMPUTATION_INCOMPLETE`, `KTHEORY_BACKEND_UNAVAILABLE`, `BOUNDARY_ANALYSIS_INCONCLUSIVE`와 운영 상태 `TIMEOUT`, `CANCELLED`, `EXECUTION_ERROR`다. Foundation의 `recordFailure(kind,details)`, `captureFailure(error,details)`, `validateFailureRecord`, `runFailureSelfTests`, `failureKinds`가 해당 계약을 사용한다.

기록은 append-only이고 세션 revision을 증가시키지만 claim/evidence를 자동 생성하지 않는다. 가져오기 후 새 세션 ID가 생겨도 failure record의 원본 ID/revision 출처는 유지한다. `failures/all.json`은 `schema:"MathScopeFailureLog/1"`, `records`, `mathematicalAuthority:false`를 담고 session의 failure 배열과 정확히 일치해야 한다. 계약 self-test는 10종류의 기록·직렬화·무승격을 검사하며 실제 10종 backend 장애를 모두 재현했다는 뜻은 아니다. 구현·배포·실패 경로의 실제 실행은 각각 별도 증거로 확인한다.

<a id="status-glossary"></a>
## 상태 용어

| 값 / 축 | 읽는 방법 |
|---|---|
| `completed` / `failed` | adapter 실행 상태. `completed`만으로 수학적 claim이 참인 것은 아님 |
| `NUMERICAL INDICATOR` | 기록된 입력·유한 범위·정밀도의 관측 결과 |
| `CERTIFIED NUMERICAL` | 별도로 검증된 오차 보증이 실제로 있는 범위에서만 사용 |
| `EMPIRICAL CORRESPONDENCE` | 관측된 대응/상관. 동일성 정리 아님 |
| `RESEARCH HYPOTHESIS` / `OPEN` | 조사할 주장 또는 미증명 target |
| `SUPPORTED` | 해당 기록이 명시한 범위의 지지. 일반적으로 `PROVED`와 동의어 아님 |
| `THEOREM-BACKED` | 명시된 정리·가정 적용 범위. generic 숫자 출력의 승격 대상 아님 |
| `FORMAL PASS` / `PROVED` | 특정 감사된 명제·source·환경·receipt와 결합된 결과 |
| `UNKNOWN` / `NOT EVALUATED` / `null` | 판정 자료 없음. 0, 거짓, 부존재와 다름 |
| `CURRENT`, `supportsCurrent:true` | 현 입력의 증거로 연결됨. 증거 등급 자체는 별도 |
| `STALE` / `REVIEW` / `REVALIDATION REQUIRED` | 의존 입력 변경 등으로 현재 결론에 사용 불가 |
| `HISTORICAL` / `HISTORICAL FORMAL` | 과거 기록을 보존했으며 새 환경 검증 필요 |
| `DEPENDENCY MISSING` / `PARTIAL` / `EXTERNAL` | 필요한 구현·가정·증명 dependency가 미완료 또는 외부 근거 |
| release `PASS` / `HOLD` / `FAIL` | [요구사항 표](STAGE8_RELEASE_REQUIREMENTS.md)의 검사 결과. 개별 module grade와 다른 축 |

색상이나 PASS 문자열 하나만 읽지 말고 `scope`, `assumptions`, 최신성, coverage를 함께 읽는다.

<a id="solver-guide"></a>
## 계산 실행과 실패 해석

`GET /v1/capabilities`에서 현재 서비스의 adapter와 지원 범위를 확인한다. 일반 동기 API는 `POST /v1/run`이며 `RunRequest`는 `adapter`, `inputSpec`, 선택 `environment`다. `AdapterResult`는 `adapter`, `adapterVersion`, `status`, `outputRepresentations`, `evidenceRecords`, `diagnostics`, `residuals`, `errorBounds`, `provenanceEdges`, `reproducibilityHash`, `environment`를 반환한다. 실행 경로에 따라 `jobId`, `startedAt`, `completedAt`, `elapsedMs`, `logs`가 추가된다.

새 bounded server-job API는 Golden·복소 ζ의 `POST /v1/jobs`와 `kind:"run"`, Golden replay의 `kind:"replay"`를 지원한다. 조회는 `GET /v1/jobs/{jobId}`, 취소는 `POST /v1/jobs/{jobId}/cancel`이며 해당 작업의 opaque bearer token이 필요하다. token은 수학 결과나 proof가 아니며 세션·ZIP·공개 로그에 저장하지 않는다. 지원 adapter, process isolation, payload/runtime/동시 실행 제한은 [job 구현](../app/jobs.py)과 현재 capabilities를 확인한다. 임의 코드 실행이나 내구성 있는 작업 큐가 아니다.

취소 응답의 `executionScope:"SERVER_WORKER"`, `cancellationConfirmed:true`, `workerStopped:true`는 분리 process의 종료를 확인한 상태다. 서버 재시작 시 메모리의 job registry가 소실될 수 있으며 네트워크 단절·job 만료·조회 실패만으로 종료 확인을 추정하지 않는다. 취소된 결과는 확정하지 않고, 완료된 후 취소가 접수된 결과도 취소 경로에서 폐기한다. worker telemetry가 있으면 `cpuUserSeconds`, `cpuSystemSeconds`, `cpuTotalSeconds`, `peakRSSBytes`, `workerExecutionMs`, `measurementSource`를 기록한다. process startup/import를 포함한 CPU time은 브라우저 CPU 사용률이 아니다. 강제 종료 전 마지막 metrics를 못 받으면 측정값을 추정하지 않는다.

| 작업 | 현재 실제 범위 |
|---|---|
| Poisson / spectrum | 유한 격자의 manufactured Dirichlet 참조, SciPy/ARPACK 유한 스펙트럼 |
| ODE / optimization | sampled IVP, Poisson source-amplitude의 유한 1-parameter 최적화 |
| resolvent | 유한 행렬의 resolvent norm sample |
| topology | GUDHI/Ripser의 지정 complex·filtration·field·sampling |
| Golden | flat torus의 상수 후보 검증, finite Fourier/mesh/topology와 같은 실행의 A–D 연결 |
| 복소 ζ | `mpmath.zeta` analytic continuation의 bounded grid, pole mask, precision cross-check |
| index / advanced | 명시된 구조·참조 model과 semantic guard. 일반 CAS/FEM/K-theory engine 아님 |

브라우저 local/reference 결과와 cloud 결과는 실행 provenance에서 구분한다. cloud 실패 후 fallback이 있으면 그 이유와 변경된 방법을 남긴다. cloud와 같은 adapter·환경·hash를 가진 것으로 표시하지 않는다.

복소 ζ 입력은 실수 범위 [-3,4], 허수 범위 [-60,60] 내의 비어 있지 않은 구간, 각 축 4–45 sample 및 총 1,600 이하, precision 20–50 dps를 요구한다. 두 정밀도의 차이는 sensitivity 관측이며 엄밀한 error bound가 아니다. `zeroCertification: NONE`과 Riemann ζ / spectral ζ 구분을 유지한다.

실패를 재현하려면 요청 입력, 세션/revision, adapter, 실제 오류, 시각, method와 가능한 job/log 정보를 보존한다. `solver diverged`, `mesh invalid`, `theorem assumptions missing`, `operator domain incomplete`, `spectral pollution suspected`, `formal dependency missing`, `projection noninjective`, `topology computation incomplete`, `K-theory backend unavailable`, `boundary analysis inconclusive`를 성공으로 바꾸지 않는다. 실패 기록을 만드는 경로와 과거 성공 기록을 보존하는 경로는 실제 배포의 별도 gate로 검사한다.

중단 버튼의 성공은 그 경로가 확인한 범위만 의미한다. browser wait abort, worker termination, 서버 process 종료 확인은 서로 다르므로 UI·job 응답에서 실제 확인 결과를 읽는다. 취소 후 늦게 도착한 결과를 새 세션/revision에 확정해서는 안 된다.

<a id="proof-guide"></a>
## 증명 실행과 coverage

고정 명제 `C-014`와 `GOLDEN-NONLINEAR-ALGEBRA-001`을 구분한다. C-014는 `Σ(i=1..4) xᵢ²=1` 및 `x₄=c`에서 `x₁²+x₂²+x₃²=1-c²`를 얻는 exact algebraic slice다. 이것은 Golden PDE의 증거가 아니다.

Golden의 실제 [manifest](../formal/golden-manifest.json)와 [Lean source](../formal/GoldenAlgebra.lean)는 다음 세 개의 정확한 대수 명제를 대상으로 한다.

1. commutative ring에서 `D(u+tv)=D(u)+tD(v)`를 가정한 `F(u+tv)`의 다항식 전개.
2. `D(1)=0`을 가정한 `λ=1`, `u=1`의 대수 잔차 0.
3. 해당 지점에서 일차항이 `-D(v)-2v`로 환원됨.

고정 toolchain은 manifest와 `lean-toolchain`을 읽고, 로컬에서는 저장소에서 `python formal/replay.py --output golden-local-receipt.json`을 실행한다. source hash, 실제 Lean runtime commit, 환경 lock, fresh compile, 세 theorem의 axiom audit를 검사한다. 허용 axiom은 `propext`, `Classical.choice`, `Quot.sound`; `sorryAx`는 거부한다. timeout·missing compiler·source mismatch는 formal evidence가 아니다.

cloud의 `/v1/verify/golden`은 고정 claim ID·source hash·semantic-review flag를 받는다. 임의 Lean source를 실행하는 API가 아니다. 로컬 JSON receipt나 가져온 proof package는 cloud attestation이 아니며, 재검증 전 historical이다. 같은 환경에서 새 proof replay는 새 run ID/시각과 같은 proof hash를 기대한다.

Golden formal scope에는 torus Laplacian의 구체화, Fréchet 미분의 해석적 정의/domain/regularity, PDE 존재·유일성, spectrum, topology, index, nonlinear stability가 포함되지 않는다. Stage 6의 full Atiyah–Singer와 boundary-index theory는 현재 coverage에 `PARTIAL/EXTERNAL` 또는 미형식화로 남는다. 제한된 exact proof가 성공하면 그 범위만 체크한다.

<a id="projection-fidelity"></a>
## 투영·충실도 읽기

먼저 원본과 map, 목표 보존량, sampling, inverse/injectivity 상태를 확인한다. fidelity는 단일 점수가 아니라 성분별 값과 미평가 상태다. `topology:null`을 “손실 없음”으로 바꾸지 않는다.

Golden은 같은 finite triangulation의 source/display complex를 GUDHI로 각각 구성한다. `sourceBetti`, `displayBetti`, `persistence`, `finiteComplexEqual`, coefficient field 2를 보존한다. `continuumHomeomorphismProved:false`가 남는다. `displayToSourceEdgeLengthRatioMin/Max`는 유한 edge metric distortion이며 `displayIsometry:false`다. scalar 값의 동일성과 metric 보존은 별개다.

S³의 좌표 투영은 일반적으로 비단사이므로 충돌 witness와 소실 `x4`를 함께 읽는다. lift 후보 하나를 그렸다고 inverse uniqueness가 생기지 않는다. 연구 그래프의 3D 배치는 node 관계의 화면 배치이며 topology theorem이 아니다.

ζ 그림의 축은 `Re(s)`, `Im(s)`, `log(1+|ζ(s)|)`이고 phase는 색이다. pole mask를 이어 붙이는 면을 만들지 않는다. clipping과 LOD는 표시 정책으로 기록하며 원본 수치나 evidence grade를 바꾸지 않는다. 알려진 영점 높이 표시와 새 영점 인증도 분리한다.

<a id="ktheory-boundary"></a>
## K-theory·index 범위

현재 Stage 6는 제한된 scalar quadratic principal-symbol/reference adapter다. `theorem`, `symbolic`, `sampled`는 결과의 근거 방식을 설명하며, mode 이름만으로 Lean이 실행되지 않는다. 수치 eigenvalue가 tolerance 근처이면 `UNRESOLVED NEAR TOLERANCE`를 유지한다. 유한 방향 sample의 양수성만으로 모든 `ξ≠0`에서의 ellipticity를 증명하지 않는다.

K-class representative 그림, determinant phase sample, quadratic-form signature는 추상 K-class 그 자체가 아니다. 전문 K-theory backend나 완전한 pseudodifferential calculus를 제공한다고 해석하지 않는다.

`analyticIndex`, `topologicalIndex`, `kernelDimension`, `cokernelDimension`, `invertible`, `solvability`는 별도 필드다. connected closed Laplace 참조에서는 kernel/cokernel 1, index 0, invertible false가 가능하다. lower-order potential 또는 nonlinear 후보가 바뀌면 계산하지 않은 kernel/cokernel은 `null`로 남는다. `indexZeroImpliesInvertible:false`, `indexAloneDeterminesSolvability:false`를 지킨다.

boundary가 있으면 closed-manifold 정리 연결을 그대로 사용하지 않는다. 국소 obstruction은 “모든 boundary condition 불가능”이 아니며 APS/global 조건은 별도 분석이다. Golden은 exterior boundary가 없는 closed torus fixture이므로 일반 boundary 문제의 해결 증거가 아니다.

<a id="ai-boundary"></a>
## AI·Copilot 권한

현재 Stage 5 `orchestrate`는 프롬프트 키워드에 따라 최대 6개 workflow 제안을 만드는 로컬 규칙 기반 prototype이다. 실제 외부 AI model을 호출한 증거로 소개하지 않는다. `Apply as workflow step`은 graph/stress/proof 화면 열기 또는 draft claim 생성으로 연결된다.

draft는 `scope:"COPILOT DRAFT / RESEARCH HYPOTHESIS"`, `status:"RESEARCH HYPOTHESIS"`, `sourceAuthority:"AI-ORCHESTRATION-PROTOTYPE"`로 저장한다. `copilotCanPromote`는 `FORMAL PASS`, `THEOREM-BACKED`, `PROVED`를 허용하지 않는다. 외부 provider를 나중에 연결하더라도 제안 텍스트나 생성 코드가 verifier receipt를 발급해서는 안 된다.

자동화/WebMCP 도구가 실행을 조정할 수 있다는 사실과 수학적 판단 권한은 별개다. claim·가정·source·환경을 변경한 경우 revision과 downstream 최신성 정책을 적용하며, 새 검증 전의 과거 formal 기록을 현재 증거로 사용하지 않는다.

<a id="reproducibility"></a>
## 재현성·ZIP·revision

`.mathscope`는 `MathScopeBundleZIP/0.3.1` ZIP이다. 기본 파일은 `manifest.json`, `session.json`, `environment.lock`, collection별 `objects/all.json`, `representations/all.json`, `operators/all.json`, `pde/all.json`, `spectra/all.json`, `geometry/all.json`, `topology/all.json`, `ktheory/all.json`, `claims/all.json`, `evidence/all.json`, `symmetry/all.json`, `function-spaces/all.json`, `entropy/all.json`과 view/log/coverage metadata다. 세션의 나머지 collection도 `session.json`에 남으며, 모두가 별도 sidecar를 갖는 것은 아니다.

Golden 실행에는 `numerics/jobs.json`, `numerics/golden-runs.json`, `numerics/data.json`, `environment/numerics.lock`, `revisions/all.json`, `provenance/golden.json`이 추가된다. proof package가 있으면 `lean/GoldenAlgebra.lean`, `lean/lean-toolchain`, `lean/golden-proof.json`과 coverage가 들어간다. source가 없는 과거 formal 기록은 coverage의 별도 목록으로 남고 재실행 가능하다고 주장하지 않는다.

import는 ZIP 구조·CRC, manifest 각 파일의 byte 수·SHA-256, 선언되지 않은 파일, session identity/revision, 환경 schema를 검사한다. Golden sidecar는 세션 안의 replay/provenance와 일치해야 한다. formal source는 실제 byte hash·source·toolchain·metadata 일치를 검사한다. 허용된 schema migration이 없거나 필요한 실행 입력이 없는 옛 번들은 자동 재현 성공이 아니다. frontend v35의 import 크기 제한은 12 MiB다. 이는 localStorage 자동저장의 별도 4.5MiB 안전 상한과 다르다. 큰 replay 세션은 자동저장 실패를 숨기지 않고 ZIP 내보내기로 보관·복구한다.

새 세션으로 가져온 후에는 다음 검사가 각각 필요하다.

| 검사 | 실제 비교 내용 |
|---|---|
| bundle integrity | ZIP·manifest·source·sidecar 일치. 진위 서명 아님 |
| source provenance | `sourceSessionId`, `sourceRevision`, 모든 node/revision/evidence 연결 |
| 환경 | Python/platform/NumPy/SciPy/mpmath/GUDHI/ripser와 request environment fingerprint |
| 수치 replay | 저장한 `inputSpec`을 실제 실행; exact numerical hash와 recursive abs/rel `1e-10` 비교를 따로 보고 |
| proof replay | 고정 source를 fresh Lean process로 컴파일; 실제 환경·lock·axioms·proof hash·새 receipt 검사 |
| 현재성 | target session/revision이 실행 시작 때와 일치하는지, downstream 결과가 stale인지 확인 |

수치 replay record schema는 `MathScopeNumericalReplay/1`이며 `adapter`, `adapterVersion`, `sourceSessionId`, `sourceRevision`, `inputSpec`, `requestEnvironment`, `environmentFingerprint`, `expectedInputsHash`, `expectedEnvironmentHash`, `expectedNumericalHash`, `numericalSnapshot`, `sourceNodes`, `recordHash`를 가진다. 현재 executable replay는 Golden adapter의 기록만 지원한다. `unreplayableEvidence`에 표시된 다른 기록은 보존됐지만 이 경로에서 재계산된 것이 아니다.

서버의 canonical Golden JSON hash는 finite binary64·safe integer 정규화와 Python sorted compact UTF-8 JSON을 사용한다. browser가 임의 순서로 stringify한 문자열 hash와 같다고 가정하지 않는다. numerical snapshot에서 세션 identity/revision/time을 분리하므로 새 세션의 같은 계산을 비교할 수 있다. replay의 `pass`는 정확한 환경 일치·허용 오차 내 수치 일치·Golden integration gate를 요구하고, `exactMatch`도 별도 보고한다. `formalPass`는 항상 false다.

revision graph는 typed 참조와 `dependsOn`, `upstreamRevisions`, `sourceRevisionRefs` 등의 의존 연결을 따라 변경을 전파한다. object/assumption, mesh/solver tolerance, Lean environment 변경은 관련 증거를 stale/review로 바꾼다. 같은 ID와 같은 오래된 evidence 내용으로 객체를 덮어써도 재계산 권한이 생기지 않는다. 누락된 의존 정보는 보수적으로 review 대상이 될 수 있다.

재현 보고서에는 frontend version/hash, backend LIVE commit, 세션/revision, adapter/input/output/environment hash, 파일명·byte 수, 실행 시각과 실패 기록을 함께 남긴다. 성능 측정은 장치·브라우저·viewport·DPR·LOD·데이터 크기를 함께 기록한다. FPS, 렌더 명령 제출 시간, worker elapsed time, process CPU time과 CPU 사용률을 서로 바꾸어 쓰지 않는다.

## 문서의 검증 한계

이 참조는 16개 문서 항목의 내용을 제공한다. 전체 schema의 자동 변환·검증, 모든 adapter의 executable replay, 모든 failure 경로의 영속화, native Chrome/Edge·휴대전화·스크린리더 검사, 모든 고급 수학 기능의 구현/형식화를 증명하지 않는다. 이런 항목은 구현 및 실제 실행 증거로 따로 검사하고 [릴리스 요구사항](STAGE8_RELEASE_REQUIREMENTS.md)에 정확한 범위와 미완료 사유를 남긴다.
