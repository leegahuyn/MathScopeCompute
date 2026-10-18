# 새 25쪽 3D 개념 설계도: 출처와 적용 범위

`upload/MathScope_Mathematical_IDE_설계도(3).pdf` · 434191 bytes · SHA256 `3a97a272ef5056077b90fad0e65e8c779c94c8377a421109c042e897ee33abd0` · 25쪽. 실제 첫 페이지의 제목은 Mathematical IDE / Concept Blueprint이다. 기존 99쪽 확장 설계도와 다르며 M4 원문 체크리스트를 대체하지 않는다.

각 항목의 링크는 관련된 기존 M4 ID를 찾기 위한 해석적 연결이며 새 필수 ID가 아니다. 제안 목표를 현재 구현·실측 결과로 기록하지 않는다.

## Object and representation contract — pp. 3, 4, 8

Intrinsic, ambient and display dimensions remain distinct. Store maps, domains and exclusions. Numeric, exact, formal and reviewed evidence are distinct.

관련 기존 ID: I3-08, R1-03. 수준: DESIGN_REQUIREMENT_WITHIN_CONCEPT_SCOPE.

## Revision and asynchronous jobs — pp. 5, 6, 7

Object/representation/claim revisions follow every job. Late old jobs remain history, never current acceptance. Camera/color-only changes preserve math evidence; mathematical inputs invalidate exact downstream evidence.

관련 기존 ID: I3-05, R1-04. 수준: DESIGN_REQUIREMENT_WITHIN_CONCEPT_SCOPE.

## S3 projection and exact slice — pp. 9, 10

Projection to three coordinates is closed B3, with two preimages in the interior and one on the boundary. Slice x4=c is S2 of radius sqrt(1-c²) for |c|<1, a point for |c|=1, empty for |c|>1. Exact slices use analytic parameterization; slab samples disclose approximation and epsilon. Check critical-value rounding and degeneracy.

관련 기존 ID: R1-03, R1-05, R1-06. 수준: DESIGN_REQUIREMENT_WITHIN_CONCEPT_SCOPE.

## Optional stereographic view — pp. 10

The source marks stereographic projection as a later optional feature. If implemented, disclose excluded pole and finite display clipping radius.

관련 기존 ID: R1-05. 수준: LATER_OPTIONAL.

## Continuous observer — pp. 11

For P_t=Pi3 R(t), R(t) in SO(N), record path/frame/sample IDs. Record rank/critical events; do not describe the original dimension as changing continuously.

관련 기존 ID: R1-03, R1-04. 수준: DESIGN_REQUIREMENT_WITHIN_CONCEPT_SCOPE.

## Infinite-dimensional and advanced views — pp. 12, 13, 14

Banach bounded functionals differ from Hilbert orthogonal projection. A finite L2 family is not the entire space. Disclose basis/quadrature/resolution/errors, coefficient conventions and representation loss; distinguish estimated/exact-finite/formal/unknown diagnostics.

관련 기존 ID: I3-03, I3-08, R1-02, R1-03. 수준: DESIGN_REQUIREMENT_WITHIN_CONCEPT_SCOPE.

## Lean and claim ledger — pp. 15, 16

Ledger acceptance uses a separate build at pinned revision/environment with source/log/target. Audit transitive axioms and semantic correspondence; sorryAx stays incomplete. Store evidence grade, execution state and currentness separately. Algebraic radius-squared identity does not prove slice homeomorphism; kernel checks do not certify GPU rendering.

관련 기존 ID: I3-01, I3-04, I3-05, I3-06, I3-08, R1-04. 수준: DESIGN_REQUIREMENT_WITHIN_CONCEPT_SCOPE.

## Proposed MVP scope — pp. 17

S2, T2 in R3, S3 in R4; projection/rotation/S3 analytic slice; dimension/observation conditions; residual/overlap diagnostics; Lean panel; claim/evidence/STALE; save/export. General schemes, meshing, automatic theorem discovery/proof and cloud collaboration are deferred.

관련 기존 ID: R1-01, R1-03, R1-05, R1-07. 수준: CONCEPT_MVP_PROPOSAL.

## Proposed user acceptance — pp. 17

The concept proposes five test users, four completing the S3 slice-claim workflow unaided. Do not claim this has run or silently add a new original M4 checklist ID.

관련 기존 ID: R1-07. 수준: PROPOSED_ACCEPTANCE_NOT_CURRENT_RESULT.

## Proposed performance targets — pp. 20

After fixing reference hardware, initially target at least 30 fps for 100,000 projection/rotation samples, cached slice refresh within 100 ms, and warm short-Lean diagnostic p95 within 2 seconds. Record hardware, sample and project. These do not guarantee large-proof completion latency.

관련 기존 ID: R1-05. 수준: REFERENCE_HARDWARE_DEPENDENT_INITIAL_TARGETS.

## Semantic and adversarial checks — pp. 20

Test S3 ball/sphere confusion; c near ±1, |c|>1 and tiny slices; finite samples true but global statement false; changed assumptions/wrong Lean theorem; late responses, sorryAx and unapproved axioms; old evidence must not pass for a new revision.

관련 기존 ID: I3-06, I3-07, I3-08, R1-06. 수준: DESIGN_REQUIREMENT_WITHIN_CONCEPT_SCOPE.

## Planning and technical choices — pp. 18, 19, 21, 22, 24, 25

Twelve-week staffing plan, proposed stack and research-adoption targets are proposals, not completed milestones. A universally quantified theorem need not rerun its proof on every slider change; validate the actual application assumptions. Record selected reference hardware, schemas and reviewer.

관련 기존 ID: I3-05, I3-08, R1-05, R1-07. 수준: DESIGN_PROPOSAL.
