# Stage 8 릴리스 요구사항과 증거 매핑

> **2026-10-09 후속 검토:** 아래 2026-10-08 기록 이후 빈 제타 격자의 성공 처리,
> FORMAL manifest 범위 무결성, 동일 개정 replay ID 재사용을 추가로 재현했다.
> 수정·회귀 검사와 정확한 적용 범위는 [후속 검토 기록](POST_RELEASE_REVIEW_2026_10_09.md)을 따른다.
> 과거 동결 기록을 이 경계 사례가 이미 통과했다는 근거로 사용하지 않는다.

**기술 검증 완료. 최종 동결 판정은 최신 체크리스트·release manifest를 따른다.** 2026-10-08의 개발판 v35와 Compute `235b73df`에 대해 아래 제한된 검사 범위의 기술 blocker가 해소되었고, 남은 실제 Edge 키보드·휴대전화 스크린리더 항목은 사용자 확인으로 기록했다. UI의 개별 `PASS`, CI, 사용자 보고와 최종 동결은 서로 다른 증거다. 아래 최신 증거 절이 과거 표의 당시 상태를 대체한다. 원본 약 62%는 과거 체크포인트 값이며 가중치가 정의되지 않아 새 비율을 계산하지 않는다.

<a id="current-evidence"></a>
## 최신 증거 — 2026-10-08 최종 기술 감사 기준

**이 절은 아래 역사적 체크포인트 표의 현재 상태를 대체한다.** 표의 원본 gate와 검사 요구는 유지하며, 과거 실패·대기 기록은 삭제하지 않는다. 실제 실행을 검증한 기준 commit은 `235b73dfc730ab4ee4e4c9862138fd839079a213`이다. 이 문서 정리 이후의 commit은 별도 control-plane LIVE SHA와 변경 파일을 확인한다. 문서만 바뀐 후속 commit을 기준 실행의 새 재측정으로 쓰지 않는다. 기계 판독용 근거는 [검증 기준 기록](STAGE8_VERIFIED_BASELINE.json)에 있다.

| 항목 | 확인된 최신 근거와 정확한 범위 |
|---|---|
| 개발판 / 안정판 | 개발판 v35 / `ac30af83`. 안정판 `index.html` page31 / `e1b6f09f` 동일 확인. 개발판 작업에서 안정판은 수정하지 않음. |
| Compute 배포·CI | `235b73dfc730ab4ee4e4c9862138fd839079a213`, Render `dep-db3nqa3l550s73ao48cg` LIVE, trigger `new_commit`, 완료 `2026-10-08T11:24:56.876155Z`. PR7 head CI `37769469570`, main CI `37769705586` 성공. 전체 pytest 93개 통과, 기존 Starlette/httpx 경고 1개. 수동 배포로 자동 배포를 대체하지 않음. |
| Lean 배포·실제 검증 | `3c20466e37f669688e102901250f7d56e15b0331`, `dep-db3ld0e7bikc73c5d3g0` LIVE. 고정 source·환경·lock·fresh compile·axiom audit·동일 proof hash replay·C-014 regression을 포함한 실제 cloud 27/27 PASS. |
| Golden 한 세션 A→D | flat unit torus, λ=1/u=1, 같은 operator·mesh·spectrum·stress·symbol/index reference의 수치 gate 6/6. numerical hash `35305ba191d4633ba8bc09e206785c571b69d0d2a12d45593194f28e32f29bd3`. |
| 실제 proof 포함 ZIP 재현 | 원본 `rs-muzgdn76-lcxvlx` 수치 r3 / proof r5 → 실제 다운로드·같은 파일 업로드 → 새 `rs-muzgj1m9-gi60zl` historical 상태 → 수치 replay r6 → fresh proof r7. `environmentCompatible`, `exactMatch`, `numericallyEquivalent` 모두 true. proof replay 13,884ms, 새 evidence ID와 동일 source/environment/proof hash. 검증 기록 `final-golden-proof-first.json`, `final-golden-proof-imported.json`, `final-golden-proof-replayed.json`. |
| 증명의 범위 | `GOLDEN-NONLINEAR-ALGEBRA-001`의 정확한 commutative-ring 다항식 전개, `D(1)=0` 가정의 상수1 잔차·일차항만 검증. source SHA `d27a3c8baa37889217d546a9020ea54552e850888590739062300821406ce593`. full PDE·해석적 Fréchet·spectrum/topology/index 정리로 승격하지 않음. |
| 선택적 revision 전파 | 의존 graph 기반 incremental invalidation의 오프라인 26/26 PASS. 실제 Foundation 18/18 및 selected-source/3D guard 확인. 오프라인 검사를 모든 사용자 경로의 실제 브라우저 검사와 동일시하지 않음. |
| 실제 FPS / 큰 graph | 내장 브라우저 실제 viewport591×524 / DPR2, ζ180frames 60.01fps(p95 16.9ms), 반복59.69fps(p95 17ms). 합성 독립 객체1,001개 graph의 17페이지·검색·마지막 Inspector 확인; 3D는120개 표시/881개 생략. 전체1,001개 동시3D·간선밀집 graph·GPU완료·브라우저 CPU사용률·모든 기기의 FPS 보증이 아님. |
| 점진적 표시 / LOD | v35 실제 브라우저의 합성201×201 입력40,401점/80,000삼각형: row batch8, 부분 갱신 포함77회 yield/update, progressive 처리674ms, 전체 검사3,704.4ms, 180frames 60.01fps(p95 17ms). 실제 ζ875점은 full/compact·mask 보존을 확인. 부분 geometry를 수학적 evidence로 쓰지 않음. |
| Native 사용자 보고 | `USER_REPORTED`: Chrome 회전·확대·+/−, FPS 측정 기능·Narrator 읽기; Edge와 실제 휴대전화의 회전·확대·배치 확인. 마지막 질문은 Edge Tab으로 버튼·3D 이동 및 방향키·Home 조작, 휴대전화 VoiceOver 또는 TalkBack의 버튼 이름·결과 상태 읽기였으며 답변은 **“두 항목 모두 확인했고 정상입니다”**. browser/device 버전, native FPS 수치, 어떤 모바일 스크린리더였는지와 묻지 않은 오류·표 경로는 미제공. 자동 측정 또는 모든 접근성 경로 인증으로 바꾸지 않음. |
| 실제 서버 취소 / 실패 보존 | 실제 API의 ζ1,600점 작업이 `executing`, `workerStopped:false`인 것을 관측한 뒤 `terminate-and-join`, exit `-15`, `cancellationConfirmed:true`, `workerStopped:true` 확인. 후속2회 poll에 result 없음. v35 브라우저 Golden 실행·replay 취소에서도 기존 성공 증거가 보존되고 취소 결과는 확정되지 않음. typed FailureRecord는 claim 지원 권한 없이 ZIP에 보존. 최종 proof ZIP의 모든 JSON sidecar에서 token/Authorization 키0개 확인. |
| 실제 서버 CPU / 메모리 | API Golden run/replay와 브라우저 replay/ζ 완료 작업의 CPU total1.249941–2.879673초, child peakRSS175,624,192–179,949,568B. POSIX `resource.getrusage(RUSAGE_SELF)` 실제 worker 지표이며 브라우저 CPU사용률이 아님. Render 30초 간격 service memory 관측 최대258,981,890B / limit536,870,900B; 관측 사이의 실제 peak나 모든 workload의 상한을 보증하지 않음. |
| 문서16항목 / 저장 범위 | [데이터·수학 계약 참조](STAGE8_CONTRACT_REFERENCE.md)에 실제 Object/Representation/Operator/PDE/Spectrum/KTheory/Evidence 필드·variant와 경계·재현법을 정리하고 공개 문서 경로를 검사. localStorage의4.5MiB 안전 상한을 넘은 큰 replay 세션은 자동저장 성공으로 표시하지 않음. 실제3,937,786B `.mathscope` ZIP으로 내보내기·복구를 검증했으며, 영속 저장 보증 대신 ZIP 백업을 권장. |

수치 replay의 `formalPass`는 false다. 실제 proof replay는 별도 verifier 경로로 얻은 결과다. 이전 `29f91be8`의 21/27, `4a67d6a`의 20/27 및 90초 timeout 이력, idle 이후 첫 브라우저 proof 요청의 abort 실패를 유지하며 새 성공으로 삭제하지 않는다.

**최종 감사:** 위 명시된 Stage8 검사 범위의 기술 blocker는 해소되었다. 최종 15개 항목의 집계·체크리스트·manifest를 별도로 확정한다. 런타임의 로컬 Stage8 자동 gate가 표시하는 `HOLD`는 외부 native 사용자 QA를 자동 주입하지 않는 정책이며, 이 외부 감사의 동결 판정을 대신하지 않는다. native 버전/FPS 미제공, 정지 화면 frame 측정, 제한된 formal coverage 등은 공개된 범위의 한계로 남긴다. full PDE나 full Atiyah–Singer 증명을 새로운 필수 조건으로 추가하지 않으며, 원본의 `PARTIAL/EXTERNAL` formal coverage 경계를 유지한다.

## 기준 문서와 판정 규칙

- 원본 `MathScope_v0.3.1_Master_Implementation_Checklist_KO.pdf`: A gate p16, B gate p19, C gate p23, D gate p27, 성능·문서 p34, 최종 checklist p35.
- 원본 `MathScope_v0.3.1_A-D_통합_설계도_2026-10-07.pdf`의 Golden 정의와 상태 경계.
- 9쪽 체크포인트 `MathScope_v0.3.1_Stage8_Progress_3D_Blueprint_KO.pdf`, SHA-256 `188b4003a1d46c6f3d483e005b15901c5c8e503ebe1e425fd7935af1f8087359`.
- `PASS`: 표에 명시한 전체 범위와 증거가 실제 검증됨. `PARTIAL`: 일부 범위의 증거는 있으나 나머지는 열려 있음. `HOLD`: 검사 또는 필수 구현·환경 미완료. `FAIL`: 실행한 검사가 요구와 다르게 작동함.
- acceptance A1–D6는 이름이 비슷한 기능 목록 A1 Function Space Engine, B1 Singularity Lab 등의 번호와 다른 **gate ID**이다. 둘을 섞어 24개 acceptance gate를 삭제하지 않는다.

## 원본 24개 acceptance gate

아래 evidence 열은 **이전 체크포인트 당시의 기록**이다. 현재 Golden·revision·replay 상태는 위 최신 증거 절을 우선한다. 24개 gate의 요구·검사 범위는 그대로 유지한다.

| Gate | 원본 요구사항 | 통과에 필요한 검사 | 과거 체크포인트 증거와 당시 미완료 범위 |
|---|---|---|---|
| A1 Operator typing | bounded/unbounded, domain, adjoint 등 operator typing | domain·adjoint domain·self-adjoint 가정 누락/불일치와 정상 fixture 검사 | Stage 3 semantic guard와 reference 실행 있음. Golden operator/domain 연결은 새 실행 증거 필요 |
| A2 PDE provenance | equation/BC/IC/discretization/solver provenance | 입력·mesh·solver·tolerance·revision·hash를 번들에서 복원 | Stage 2 실제 실행·self-test 있음. Golden 원본 입력부터 replay까지 연결 필요 |
| A3 Spectrum classification | point/continuous/residual spectrum/resolvent 분리 | 서로 다른 분류의 unknown/부분 판정을 보존하고 잘못된 합치기 차단 | Stage 3 guard 범위만 확인. 유한 fixture가 일반 spectrum 분류를 완료한 것은 아님 |
| A4 Infinite vs finite | 유한 P_N T P_N에 N과 truncation 표시 | UI/API/bundle에서 유한 계산을 무한 연산자 spectrum으로 승격하지 않음 | finite badge/reference 있음. Golden 출력과 import/replay에서도 확인 필요 |
| A5 Nonlinear boundary | nonlinear equation과 linearization 분리 | L=DF(u*) 연결·가정, 선형 스펙트럼 결과가 nonlinear 전체 정리를 인증하지 않음 | NaN 수정과 finite λ1 실행 있음. 전체 Golden 선형화 chain 검사 필요 |
| A6 Reproducibility | 같은 bundle/environment 재현 | 저장된 실행 입력으로 실제 계산, 환경·수치 비교·hash·새 evidence | 이전 ZIP 구조/CRC/SHA 검사 통과. 과거 번들 실행 입력 누락 문제 때문에 새 executable replay 검사 필요 |
| B1 Projection typing | source와 representation 구분 | 원본 domain·차원·map·display·소실 정보·revision 명시 | Stage 4 및 17개 3D 모드의 metadata 있음. Golden field로 생성한 B 출력 연결 필요 |
| B2 Singularity status | numerical/theorem/formal singularity 상태 분리 | singularity 후보를 확정 증명으로 표시하지 않는 실패/정상 검사 | Stage 4 reference gate 있음. Golden actual field의 후보/uncertainty 필요 |
| B3 Fidelity vector | 서로 다른 defect·fidelity 성분 유지 | Hausdorff/topology/metric/spectral 등 계산 가능·불가를 나눔 | reference fidelity·GUDHI 비교 있음. 단일 total score로 축약 금지, Golden 성분 검사 필요 |
| B4 Lifting non-uniqueness | low-D→nD inverse problem 비유일성 | 후보와 가정·identifiability 실패를 명시 | semantic guard 범위. 일반 역구성 알고리즘이나 유일성 증명이 아님 |
| B5 Entropy semantics | Shannon/metric/topological 등 정의 분리 | 타입·공간·measure/가정을 명시하고 자동 등치하지 않음 | reference guard 범위. 모든 entropy 알고리즘 구현을 뜻하지 않음 |
| B6 Topology check | 시각 유사성과 topology equivalence 분리 | 선택한 불변량·sampling/filtration·backend·불완전성 보존 | 실제 GUDHI reference 비교 있음. Golden original/projection 비교와 scope 확인 필요 |
| C1 Dependency Graph | revision dependency와 stale 전파 | 입력 mutation 후 downstream stale, 관련 없는 증거는 보존, 재실행으로 필요한 부분만 현재화 | 기존 보수적 global invalidation 있음. 정확한 dependency 기반 incremental 갱신은 별도 검증 필요 |
| C2 AI Boundary | AI는 제안·조정만 하며 증명 승격 금지 | Copilot 생성·수정·가져오기·replay에서 formal 권한 없음 | deterministic local planner/guard 있음. 실제 AI provider 연결로 오인 금지 |
| C3 Stress Test | 실패·반례를 evidence로 보존 | mesh/parameter/coordinate/assumption stress, 실패 witness·입력·revision 저장 | reference stress 실행 있음. Golden 후보와 공유하는 stress provenance 필요 |
| C4 Symmetry Semantics | commutation/representation 가정 명시 | symmetry 여부를 그림으로 추정하지 않고 조건/행렬/근거 기록 | Stage 7 6개 cloud reference guard 통과. Golden 관련 가정의 정확한 범위 기록 필요 |
| C5 Zeta Semantics | Riemann ζ와 spectral ζ 분리 | 함수 타입/continuation/finite truncation, 영점 인증 없음 유지 | 실제 cloud 복소 ζ875점, mask3, zeroCertification NONE. 임의 spectral identity 증명 아님 |
| C6 Formal Boundary | LSP diagnostics와 final verifier 분리 | pinned source/Lean/toolchain/lock/axioms·coverage·receipt 검증, 실패 시 승격 차단 | 실제 C-014 exact slice PASS 있음. PDE 전체 formalization 미완료, imported formal은 historical |
| D1 Ellipticity semantics | ξ≠0 전체 판정과 sampled 표시 구분 | theorem/symbolic/numerical 판정 방식을 명시, near-zero 샘플 불확정 보존 | closed reference 및 수정된 adapter guard 있음. Golden principal symbol 출처와 범위 검사 필요 |
| D2 K-class display | 표시 대표와 추상 K-class 구분 | symbol representative→typed KTheorySpec 경로·외부/부분 범위 | reference metadata 있음. 3D mesh를 K-class 자체로 인증하지 않음 |
| D3 Index semantics | index 0 ≠ invertible | kernel/cokernel/index 별도, 미계산 차원 unknown, nonlinear 후보 변경 검사 | 실제 cloud nonlinear 후보 u=1에서 kernel unknown 확인. Golden 동일 입력의 index 경로 필요 |
| D4 Boundary semantics | local obstruction ≠ 모든 BC 불가능 | 경계 eligibility/obstruction/가정과 미지원·불확정 판정 | reference guard 있음. manifold/BC가 다른 예제로 대체하면 안 됨 |
| D5 Nonlinear bridge | nonlinear→linearization→symbol/K/index | nonlinear 대상에 index 정리를 직접 적용하지 않고 L의 provenance 보존 | reference adapter 가드 있음. Golden same-session A→D 연결 확인 필요 |
| D6 Formal coverage | Fredholm API ≠ 전체 Atiyah–Singer 형식화 | exact formal slice, theorem-backed 가정, external/partial coverage를 분리 | C-014 별도 exact slice. 일반 PDE/Atiyah–Singer 전체 FORMAL PASS는 없음 |

## Golden 통합 승인에 추가로 필요한 연결

- 하나의 세션 ID와 revision chain에 PDE → candidate/residual → L → finite spectrum → B representation/fidelity/topology → C hypothesis/stress/coverage → D symbol/K/index/boundary가 연결되어야 한다.
- 모든 evidence에 실행 입력 hash, 환경, adapter/version, upstream revisions, 계산 시각과 범위가 있어야 한다. branch별 독립 reference PASS를 하나의 Golden PASS로 합산하지 않는다.
- 실행 중 세션 이동/입력 mutation 뒤 도착한 응답은 현재 증거로 연결하지 않는다. 실패 응답과 취소는 이전 성공으로 대체하지 않는다.
- export/import/replay는 저장된 실행 입력을 재계산해야 한다. 원본 세션과 imported 세션은 다른 ID를 가지며 history provenance는 보존한다. 수치 replay가 unrelated/historical FORMAL PASS를 현재화해서는 안 된다.
- 오류 및 mutation 검사: 손상 ZIP, 누락 입력, 미지원 adapter, hash/환경 불일치, 변경된 candidate/λ/mesh, stale upstream, replay 실패/취소를 포함한다.

## 원본 Stage 8 체크포인트 15개 ID

원본 표의 `x`/`~`/미체크를 그대로 기록했다. “현재 범위”는 새 증거 설명이며 원본의 x를 철회하거나 전체 승인으로 확대하지 않는다.

| ID | 원본 상태 | 과거 체크포인트의 범위 / 당시 남은 조건 |
|---|---|---|
| S8-01 | x | navigation/panels 구현. 실제 IAB 클릭 확인. native Chrome·Edge 및 실제 target-device 범위는 추가 확인 |
| S8-02 | x | source/map/lost info/evidence/scope metadata. 새 Golden/LOD metadata와 revision 연계 추가 확인 |
| S8-03 | ~ | 실제 WebGL 17개 모드 확인. reference 범위만 PASS. 모든 장치·회귀·성능 승인 아님 |
| S8-04 | x | cloud mpmath complex ζ 실제 875점 확인. 영점/identity 인증 없음 |
| S8-05 | ~ | browser Euler–eta fallback 및 새 worker 경로. worker 제한/취소/CSP는 배포 UI 검사 필요 |
| S8-06 | x | ZIP protocol/CRC/SHA 구조 검사. executable numerical/formal replay와 별도 |
| S8-07 | ~ | 실제 파일 export/import 및 손상 local/central mismatch 거부 확인. 새 Golden bundle replay는 추가 확인 |
| S8-08 | x | import bridge가 새 session과 historical evidence로 격리. 새 실행의 selective 현재화 회귀 검사 필요 |
| S8-09 | x | main CI 40 tests 통과한 과거 commit 증거. 새 변경은 해당 SHA의 CI를 다시 통과해야 함 |
| S8-10 | 미체크 | Git deployment credential 복구 후 commit 03ca04af의 실제 automatic new_commit 배포 LIVE 확인. 새 최종 SHA에도 control-plane 일치 확인 필요 |
| S8-11 | 미체크 | Golden 전체 동일 세션 A→B→C→D와 mutation·replay 검증 미완료 |
| S8-12 | 미체크 | IAB desktop/mobile emulation·키보드·reduced motion 일부 완료. native Chrome/Edge/스크린리더/실제 휴대전화 미검증 |
| S8-13 | 미체크 | 기존 stationary FPS desktop30.35/mobile58.71. CPU320 약3.2ms는 사용률 아님. 새 렌더 수정 뒤 목표 장치 성능 검사 필요 |
| S8-14 | ~ | 이 user guide/요구사항 표 추가. 실제 최종 evidence·검증 PDF·전체 Spec 문서 범위 확인 필요 |
| S8-15 | 미체크 | 전체 release HOLD. 위 미완료 조건 해소 전 최종 동결 불가 |

## 성능과 사용성의 세부 범위 — 과거 구현 상태와 승인 조건

| 원본 항목 | 과거 체크포인트의 구현/패치 | 승인에 필요한 관측 |
|---|---|---|
| 3D canvas 60fps 목표 | frame telemetry, logical CSS-size/DPR cache, coalesced redraw | 정해진 장치/브라우저/주사율/viewport/LOD/data 크기에서 180frame 이상 실제 측정. 이전 저속값으로 PASS 금지 |
| large dataset progressive loading | graph는 전체 데이터를 유지하고 표시를 60-node 페이지로 제한 | graph pagination은 일반 대용량 dataset streaming이 아니다. 큰 입력·점진적 로딩·메모리 상한은 별도 미완료 |
| worker offloading | bounded local ζ875-point fallback·CPU320 sampling worker, timeout/terminate | 실제 브라우저 Worker/CSP 성공, 오류·timeout·취소와 UI responsiveness. 모든 solver의 worker화라고 확대 금지 |
| long numerical job cancellation | local worker terminate; browser request abort | 서버 job cancellation API/중단 확인은 별도. client abort를 서버 취소 PASS로 기록 금지 |
| spectrum sampling throttle | resolvent slider calculation frame coalescing | 빠른 입력 시 마지막 값 반영과 계산 횟수 상한, stale 결과 거부 |
| mesh LOD | full/compact stride2, source samples 보존, mask를 가로질러 면 생성 금지 | 실제 mode 전환, vertex/triangle 감소, 동일 source/evidence hash, pole mask 보존 |
| graph virtualization | search + bounded paginated canvas/native table, cross-page inspector | 1001노드 전체 도달 unit 검사. 실제 키보드·검색·grade/stale 필터·페이지 focus·큰 session 메모리 확인 |
| lazy tabs | active view에서 3D 초기화, 재방문 시 draw/rotation 복원 | 모든 탭 왕복 중 observer/WebGL/RAF 누수 없음, 화면 복원 |
| autosave debounce | 기존 foundation의 700ms debounce | 연속 mutation·reload에서 최신 상태 보존, 저장 실패 UX. 존재만으로 durability 인증 금지 |
| incremental revision propagation | 기존 구현은 여러 change type에서 전역 보수적 stale 처리 | dependency 연결로 필요한 downstream만 invalidation, unrelated evidence 보존·변경 범위와 재계산 증거 필요 |
| keyboard / mobile / accessible names | native controls, labels, described metadata, node table | 실제 초점순서·키보드·200% 확대·narrow viewport. 이름 존재가 screenreader 인증은 아님 |
| screen reader | DOM label smoke 및 native table 지원 패치 | Narrator/NVDA 실제 이름·역할·값·오류·상태·표/inspector 읽기 필요 |

## 배포·재현성·형식 검증의 별도 게이트

배포 control-plane의 LIVE commit과 GitHub main을 대조한다. `autoDeploy=yes`일 때 push 뒤 임의 manual deploy를 사용해 문제가 해결된 것처럼 처리하지 않는다. 실제 trigger가 `new_commit`이고 event의 `manual=false`였다는 기록과 build/runtime logs를 남긴다. `/health`에 SHA가 없으면 health 응답만으로 commit 일치를 주장하지 않는다.

2026-10-08 배포 복구에서 Python cloud3.14.3과 CI3.12.15의 차이가 관측되었다. 결과 hash를 비교할 때 환경 fingerprint를 함께 확인하며 다른 환경의 bitwise 이식성을 약속하지 않는다. pinned Lean verification은 Lean/toolchain/mathlib/lock/source/명제/axiom coverage를 별도 기록한다.

원본 최종 gate는 session create/save/load, 안정적인 IDE, 네 영역 demo, export/import, 문서, 24개 수학 gate, trust boundary, pinned formal 환경 및 coverage, numerical/proof replay와 hash 검증을 모두 요구한다. 작은 reference 예제의 통과만으로 일반 PDE solver, 모든 geometry evolution, 전체 K theory나 전면 형식화까지 구현했다고 쓰지 않는다. 미지원 범위는 roadmap으로 남기되 원본 release 요구사항의 미완료 여부를 숨기지 않는다.

## 수동 성능·접근성 기록 형식

검증자는 [사용 안내](STAGE8_USER_GUIDE.md)의 PC Chrome·Edge 절차를 실행하고 다음을 기록한다.

| 필드 | 기록할 값 |
|---|---|
| 대상 | URL, frontend version/hash, backend LIVE SHA, 날짜/시간 |
| 환경 | OS, 브라우저/버전, 실제 장치, 화면 주사율, GPU/가속 상태 |
| 표시 | viewport, DPR, zoom, LOD, mode, 데이터 크기, motion preference |
| 성능 | cold/warm, 3회 frame 수/FPS/p95/submit time, CPU sample elapsed, 중단·실패 |
| 접근성 | keyboard 경로, focus, Narrator/NVDA, 읽힌 name/role/value/status/error, table/inspector |
| 재현 | session/revision, job ID, input/output/env hashes, ZIP 파일, import/replay 결과 |
| 판정 | PASS/PARTIAL/HOLD/FAIL, 정확한 범위, 스크린샷·로그 위치, 열린 blocker |

모든 gate에 재현 가능한 증거가 채워지기 전에는 체크리스트의 마지막 체크박스를 완료하지 않는다.
