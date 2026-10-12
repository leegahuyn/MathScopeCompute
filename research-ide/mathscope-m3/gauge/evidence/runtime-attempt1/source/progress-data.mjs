// Generated from GAUGE_PROGRESS.json; original criterion completion is never inferred from an example passing.
export const GAUGE_CRITERIA_PROGRESS=[
  {
    "id": "Y5-01",
    "title": "Δ 모드와 변경 효과 선언",
    "text": "declared lower bound / units-rescaling / explicit effective model / empirical ensemble estimate의 4모드를 둔다. 합\n격: 가정 모드에서는 A와 샘플 hash가 유지되고 axiom revision만 바뀐다. Δ≤0·단위 없음·다른 모드 자료 혼합은 거부한다.",
    "page": 46,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "네 Δ 모드의 효과를 분리하고 실제 A/F·sample·original hash 보존 및 잘못된 입력 거부를 실행했다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/field-family.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y5-02",
    "title": "실제로 변하는 유효 4D 장족",
    "text": "자연단위에서 ℓ Δ=1/Δ, ρΔ=κℓΔ를 모델 규칙으로 지정한다. A Δ=ιA_BPST(ρΔ)+εℓΔ⁻¹Σcφ((x−x₀)/ℓΔ)Ta를 생성한다. 합\n격: Δ₁≠Δ₂이면 고정 관측 좌표의 A/F·길이 척도·투영이 규칙대로 변한다. ε≠0의 장은 off-shell일 수 있으며 ρΔ=κ/Δ는 양자\nYM 정리가 아니다.",
    "page": 46,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "기존 실제 행렬 Lie 기저에서 BPST와 전 기저 perturbation을 계산하고 고정 좌표 A/F·길이·밀도 변화를 확인했다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/field-family.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y5-03",
    "title": "명시적인 유효 스펙트럼 연결",
    "text": "Ej(Δ)=Δ+εj, εj≥0 및 wj≥0의 유한 모형으로 C Δ(t)=Σwj exp( −Ej t)를 만든다. ε₀=0,w₀>0이면 이 모형의 최저 에너지는\nΔ다. 합격: CΔ(t)≤exp(−Δt)Σwj를 정확한 가정 아래 검증한다. Y5-02 장과 이 스펙트럼의 연결은 model assumption ID를\n가져야 한다.",
    "page": 46,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "비음수 weight/excess를 가진 유한 지수합과 양의 bound를 계산하고 장↔스펙트럼 model assumption ID를 보존한다. Real 전칭 Lean 연결은 Y7-03의 별도 관문이다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/spectral.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y5-04",
    "title": "단위 변환과 실제 dilation 구별",
    "text": "Δphysical=(ℏc/at)(atΔ)의 단위를 고정한다. A λ(x)=λA(λx)의 고전 scaling과 단순 표시 단위 변경을 구별한다. 합격: 4D 고\n전 작용의 scaling 불변과 ρ→ρ/λ를 확인한다. quantum gap scaling은 H λ=λUHU⁻¹ 등 별도 가정 없이는 유도하지 않는다.",
    "page": 46,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "실제 dilation의 밀도×16·marginal×8·BPST 작용 불변, 같은 물리장의 표시 단위 변환, 독립 scale 입력에 대한 physical mass 환산을 실행했다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/field-family.mjs",
      "research-ide/mathscope-m3/gauge/spectral.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y5-05",
    "title": "Δ 타깃에 대한 양자 격자 앙상블족",
    "text": "PΔ(U)∝exp[−Sβ(Δ),G(U)]의 생성 규칙을 지정한다. β·a·L·T를 바꾸는 calibration table와 독립 scale-setting으로 타깃을\n찾는다. 합격: 모든 Δ 결과는 실제 새 chain 또는 검증된 재가중 경로에 연결된다. 타깃 Δ와 추정 mchannel±오차를 나란히\n표시하고 동일성을 미리 강제하지 않는다.",
    "page": 46,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PARTIAL",
    "originalCriterionComplete": false,
    "implemented": "각 target/beta에서 새 cold·Haar-hot Wilson chain, 독립 source hash, target와 실제 channel estimate를 계산했다. 두 β의 긴 실행과 통계 진단을 저장했다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/ensemble-family.mjs",
      "research-ide/mathscope-m3/gauge/evidence/ensemble-production-attempt2.json",
      "research-ide/mathscope-m3/gauge/evidence/source-production2/manifest.json"
    ],
    "remaining": [
      "물리 척도를 target와 독립적으로 실제 측정하여 목표 Δ를 찾은 calibration은 아직 없다.",
      "현재 실측 실행은 연속 SU(2) defining links이며 다른 G의 생산 ensemble adapter를 동일 결과로 대신하지 않는다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y5-06",
    "title": "상관함수와 유효질량 추정",
    "text": "전체 진공 공간을 제거한 gauge-invariant 관측 벡터의 C(t)를 측정한다. 유일한 진공이면 평균 제거를 사용하며, 주기 시간\n에는 finite-T/cosh와 operator channel을 명시한다. 합격: C(t)≤0 또는 cosh 역함수의 불가능 입력을 abs/clip으로 숨기지\n않는다. 양의 스펙트럼 가정에서 gapglobal≤Echannel≤meff 방향을 표시한다.",
    "page": 46,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PARTIAL",
    "originalCriterionComplete": false,
    "implemented": "실제 gauge-invariant 2채널 connected C, periodic cosh, block bootstrap, GEVP를 계산한다. C≤0·불가능 acosh는 null과 사유를 보존한다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/ensemble-family.mjs",
      "research-ide/mathscope-m3/gauge/spectral.mjs",
      "research-ide/mathscope-m3/gauge/evidence/ensemble-production-attempt2.json"
    ],
    "remaining": [
      "새 chain의 평균 제거는 명시한 unique-vacuum 가정에 조건부이며 독립 vacuum theorem이나 일반 degenerate-vacuum projector는 없다.",
      "유한 T와 operator overlap을 제어한 질량 plateau·전체 스펙트럼 복원은 남아 있다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y5-07",
    "title": "전달 연산자·GEVP·인증 경계",
    "text": "양의 self-adjoint T에서 En −E0=−at⁻¹log(λn/λ0)를 사용한다. GEVP는 관측량 기저와 excited-state 오염을 함께 기록한\n다. 합격: 수치 eigenvalue는 추정이다. 전체 진공 공간을 제외한 최대 λexc/λ₀≤r<1과 전체 비진공 공간의 제어가 있을 때만\n해당 모델 gap 하한 −log(r)/at를 인증한다.",
    "page": 46,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PARTIAL",
    "originalCriterionComplete": false,
    "implemented": "수치 GEVP와 모든 유한 비진공 모드를 열거하는 정확 유리수 diagonal transfer certificate를 분리했다. 전체 퇴화 진공·r·at guards와 새 discrete Lean kernel을 실행했다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/spectral.mjs",
      "research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean",
      "research-ide/mathscope-m3/gauge/evidence/lean-audit.json"
    ],
    "remaining": [
      "Real exp/log transfer-to-gap bridge의 새 Mathlib CI kernel 결과를 기다린다.",
      "4-state 모형은 별도 명시 유한 모형이며 실제 Wilson 전체 Hilbert-space transfer enclosure가 아니다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y5-08",
    "title": "한계 순서와 불확실성 비교",
    "text": "통계·operator overlap·T·L·a·표현 cutoff 오차를 구분한다. 일정 물리량 조건에서 a→0,L→∞,T→∞를 비교한다. 합격: 한\noperator channel의 양의 질량이나 유한 격자의 양의 gap을 continuum의 양의 하한으로 표시하지 않는다. 외삽 그래프에\n는 사용한 가정·fit window·데이터를 공개한다.",
    "page": 46,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PARTIAL",
    "originalCriterionComplete": false,
    "implemented": "통계·overlap·T·L·a·cutoff를 개별 오류 채널로 저장하고 limit 순서와 raw calibration rows를 내보낸다. 정당화되지 않은 extrapolation은 만들지 않는다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/ensemble-family.mjs",
      "research-ide/mathscope-m3/gauge/evidence/ensemble-production-attempt2.json"
    ],
    "remaining": [
      "같은 물리량을 맞춘 독립 scale-setting 및 a/L/T sweep, 공개 fit window를 가진 정당한 extrapolation 자료는 아직 없다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y6-01",
    "title": "원본·표현·근거를 연결",
    "text": "Original에는 A/F 또는 links/ensemble, Representation에는 slice·marginal·LOD, Evidence에는 source·오차·proof를 보\n관한다. 합격: 3D selection은 원본 4D 좌표·configuration·관측 연산자로 이동한다. 화면 mesh나 색상으로 원본의 새 물리\n상태를 생성하지 않는다.",
    "page": 48,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PENDING_UI_VERIFICATION",
    "originalCriterionComplete": false,
    "implemented": "Original/Representation/Evidence와 selection→실제 4D 좌표·A/F 재계산을 제공한다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/field-family.mjs",
      "research-ide/mathscope-m3/gauge/index.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [
      "게시 후보에서 3D selection과 원본 inspector 연결을 실제 브라우저로 검증해야 한다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y6-02",
    "title": "x ₄=c 절단",
    "text": "q(y,c), energy density, 선택된 invariant observable을 3D에 표시하고 c를 연속/격자 index로 조절한다. 합격: 기존 SU(2)\nBPST slice의 해석식을 회귀검사한다. interpolated slice는 보간 방식과 오차를 표시하고 실제 격자면과 구별한다.",
    "page": 48,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PENDING_UI_VERIFICATION",
    "originalCriterionComplete": false,
    "implemented": "x4=c 연속 절단과 SU(2) BPST 해석식을 실제 곡률 계산과 회귀 비교한다. 보간은 수행하지 않는다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/field-family.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [
      "게시 후보의 slice 조절·원본 좌표 표시를 실제 브라우저로 확인해야 한다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y6-03",
    "title": "x ₄ 방향 적분·평균 구별",
    "text": "marginal at Σn q(y,n at), 평균 (1/Nt) Σn q, 한 표본과 ensemble 평균을 서로 다른 연산자로 둔다. 합격: marginal의 단위\n가 q×length로 바뀐다. BPST 무한 방향 해석식과 finite window tail을 확인하고 at 누락·합/평균 혼동을 잡는다.",
    "page": 48,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PARTIAL",
    "originalCriterionComplete": false,
    "implemented": "실제 A/F density의 finite/infinite BPST marginal, 평균, 단위 변화, 해석적 tail formula와 수치 refinement를 계산한다. 이산 합·시간 평균·ensemble 평균을 별도 연산자로 제공한다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/field-family.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [
      "현재 이산 연산자는 저장된 scalar series를 소비하는 helper이며 전체 lattice/ensemble 3D 관측 선택 UI 연결은 아직 검증하지 않았다.",
      "표시한 tail·quadrature 값은 Float64 평가 및 refinement estimate이며 directed interval 인증은 아니다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y6-04",
    "title": "안전한 게이지 불변 기본 화면",
    "text": "plaquette energy·Wilson character·정규화된 density·correlation을 기본 채널로 둔다. A/F 성분은 gauge를 고정한 진단\n모드에 둔다. 합격: gauge transformation 전후 기본 채널은 같고 성분 채널에는 gauge ID가 보인다. gauge-dependent\narrow의 형태에서 질량 간극을 추론하지 않는다.",
    "page": 48,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PENDING_UI_VERIFICATION",
    "originalCriterionComplete": false,
    "implemented": "기본 invariant density와 gauge ID가 있는 A/F 진단을 분리하고 실제 비상수 gauge transform 전후 불변량을 비교했다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/field-family.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [
      "게시 화면의 기본 채널·gauge ID·진단 구별을 실제 브라우저로 확인해야 한다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y6-05",
    "title": "Flow와 투영된 loop의 의미 보존",
    "text": "gradient flow time을 독립 매개변수로 둔다. 4D loop를 3D에 그릴 때 원래 경로와 x ₄ 이동을 함께 보관한다. 합격: flowed\ndensity를 원본 density로 덮어쓰지 않는다. 원래 loop holonomy와 projected path에서 다시 계산한 holonomy를 동일시\n하지 않는다.",
    "page": 48,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PARTIAL",
    "originalCriterionComplete": false,
    "implemented": "독립 flow time과 원본 hash 보존을 제공하고 실제 4D loop의 x4 이동/holonomy를 평탄화 경로와 구별한다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/field-family.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [
      "양의 flow time은 정확 stationary self-dual BPST 해에만 지원한다. 일반 perturbation 또는 Wilson ensemble의 비정상 gradient-flow solver는 구현하지 않았다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y6-06",
    "title": "Δ별 상태 비교",
    "text": "같은 좌표 범위·단위·color scale로 Δ₁,Δ₂의 field family와 상관함수를 비교한다. 독립 정규화는 선택적으로 표시한다. 합격:\n색상 auto-normalization으로 가려지는 밀도 크기 차이를 확인할 수 있다. assumed/effective/estimated 상태가 모든 비교\n패널에 나타난다.",
    "page": 48,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PENDING_UI_VERIFICATION",
    "originalCriterionComplete": false,
    "implemented": "같은 물리 좌표·단위·공통 색 척도의 Δ별 실제 field 및 spectrum을 반환하고 assumed/effective/estimated 의미를 명시한다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/field-family.mjs",
      "research-ide/mathscope-m3/gauge/spectral.mjs",
      "research-ide/mathscope-m3/gauge/ensemble-family.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [
      "게시 비교 패널의 공통 scale·숫자·상태 표기를 실제 브라우저로 확인해야 한다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y6-07",
    "title": "그림에서 Lean 명제로 연결",
    "text": "관측을 선택하면 정확한 observable·domain·projection·claim type을 내보낸다. proof 후보는 fibre 조건과 reconstruction\ncertificate를 요구한다. 합격: 같은 3D 투영을 가진 다른 4D source를 반례 fixture로 제공한다. projection 그림의 동일성\n만으로 4D 성질·spectral gap을 복원하는 명제를 거부한다.",
    "page": 48,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "서로 다른 4D BPST 원본의 같은 3D density slice 반례와 정확 domain/projection 계약을 제공한다. fibre·reconstruction·전체 spectrum 방향 없이는 승격하지 않는다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/proof.mjs",
      "research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean",
      "research-ide/mathscope-m3/gauge/evidence/lean-audit.json",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y6-08",
    "title": "세션 재현·접근성·stale 확인",
    "text": "수치 테이블·키보드·색각 독립 표식과 원본 데이터를 제공한다. scene/model/proof revision을 분리하여 저장한다. 합격: 재\n열기 시 같은 source·관측·가정을 복원한다. G· Δ 모형·경계·proof source 변경은 관련 결과를 stale로 만들고 단순 카메라 이\n동은 만들지 않는다.",
    "page": 48,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PENDING_UI_VERIFICATION",
    "originalCriterionComplete": false,
    "implemented": "실제 재계산 replay, 재해시된 변조 거부, scene/model/assumption/proof stale 구별을 실행했다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/index.mjs",
      "research-ide/mathscope-m3/gauge/proof.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [
      "게시 후보의 키보드·색상 독립 표식·수치 테이블·내보내기/재열기 흐름을 실제 브라우저로 검증해야 한다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y7-01",
    "title": "기존 검증 범위를 고정",
    "text": "Core와 Mathlib scaffold의 실제 source hash·toolchain·axiom audit를 유지한다. 기존 선언형 quantum model을 full\nQFT로 오인하지 않는다. 합격: 기존 Core 10개의 axiom-free 보조정리와 사용자 axiom 의존 corollary를 분리한다.\nMathlib 표준 axiom과 사용자 YM axiom도 별도 표시한다.",
    "page": 50,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "실제 legacy 원본 Core10을 source hash 그대로 다시 컴파일하고 axiom-free 보조정리와 사용자 공리 corollary를 분리했다. 이전 Mathlib scaffold source와 기존 receipt는 같은 hash의 inherited evidence로 표시한다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/legacy/MathScopeConditionalYM_Core.lean",
      "research-ide/mathscope-m3/gauge/legacy/MathScopeConditionalYM.lean",
      "research-ide/mathscope-m3/gauge/legacy/original-validation.json",
      "research-ide/mathscope-m3/gauge/evidence/lean-audit.json",
      "research-ide/mathscope-m3/gauge/proof-data.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y7-02",
    "title": "유한 대수 인증서를 Lean에 연결",
    "text": "Y1 bracket table·Y2 embedding·Y3 path/Wilson 항등식의 정확 데이터를 import하고 kernel에서 검사한다. 합격: 생성\n기의 성공 로그 대신 Lean certificate와 source hash가 필요하다. 잘못된 Jacobi·경로 순서·embedding index fixture가 실\n제 거부된다.",
    "page": 50,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "보호된 M1 exact SU3/G2/transport/conditional 소스를 바꾸지 않고 새 공식 Lean kernel으로 재검사했다. 잘못된 Jacobi·embedding index·Wilson path를 실제 거부했다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/verify_lean.py",
      "research-ide/mathscope-m3/gauge/evidence/lean-audit.json",
      "research-ide/mathscope-m3/gauge/evidence/lean/NegativeJacobi.log",
      "research-ide/mathscope-m3/gauge/evidence/lean/NegativeEmbeddingIndex.log",
      "research-ide/mathscope-m3/gauge/evidence/lean/m1-NegativeWilson.log"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y7-03",
    "title": "유한 spectral certificate",
    "text": "유한 양의 가중치·spectral sum·전달행렬 enclosure를 각각 formalize한다. 숫자 고유값 출력과 enclosing proof를 구분한\n다. 합격: 계수 sign·at>0·r<1·비진공 subspace 조건을 빠뜨리면 해당 하한 정리를 사용할 수 없다. certificate의 모델 cutoff\n를 결론에 남긴다.",
    "page": 50,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "PENDING_REAL_KERNEL",
    "originalCriterionComplete": false,
    "implemented": "정확 유리수 geometric sum·전체 진공/ratio/spacing certificate와 10 negative controls를 실제 새 kernel으로 검사했다. Real exp/log 연결 소스와 검증 workflow를 추가했다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean",
      "research-ide/mathscope-m3/gauge/evidence/lean-audit.json",
      "research-ide/mathscope-m3/gauge/lean/RealSpectralBridge.lean",
      "research-ide/mathscope-m3/gauge/verify_real_lean.py"
    ],
    "remaining": [
      "새 Real weighted exp/log 및 전체 비진공 transfer enclosure의 실제 Mathlib compile/axiom audit/negative-control receipt가 아직 관측되지 않았다.",
      "임의 수치 Wilson eigenvalue 출력은 formal enclosure를 생성하지 않는다."
    ],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y7-04",
    "title": "사용자 존재·간극 axiom의 출처 저장",
    "text": "고정된 모델 의미·G·단위· Δ·quantifier를 갖는 가정을 등록한다. user/paper/heuristic 출처와 source revision, 의존 정리를\n기록한다. 합격: 상충하는 spectrum/Δ 가정을 감지하면 중단한다. 임의 Prop P 모두를 참으로 선언하는 식의 광범위 axiom\n은 금지하고 YM 의미 술어를 고정한다.",
    "page": 50,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "고정 수학 의미·quantifier·G·단위·Δ·출처·SHA·revision·의존 ID를 보존하고 spectrum 충돌, 광범위 공리, 잘못된 quantifier와 누락/순환 의존을 거부한다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/proof.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y7-05",
    "title": "투영 뒤 corollary의 정확한 계약",
    "text": "projection observation이 fibre-constant인지, reconstruction이 어느 집합에서 성립하는지, spectrum 전달은 어떤 포함\n가정인지 요구한다. 합격: 그림을 다시 Lean 형태로 적었다는 사실만으로 새 정리를 승인하지 않는다. conditional theorem\n에는 필요한 reconstruction/transfer 가정과 사용자 axiom 목록이 남는다.",
    "page": 50,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "fibre-constant 또는 제한 domain reconstruction과 전체 original positive spectrum inclusion의 올바른 방향을 요구한다. 사용자가 입력한 certificate 형태는 조건부 가정이며 새 proof가 아니다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/proof.mjs",
      "research-ide/mathscope-m3/gauge/lean/FiniteSpectral.lean",
      "research-ide/mathscope-m3/gauge/evidence/lean-audit.json",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y7-06",
    "title": "OS/transfer 재구성 의무 분리",
    "text": "Schwinger functions/observable algebra, regularity, Euclidean symmetry, reflection positivity, clustering·vacuum\n조건과 재구성 정리 적용을 독립 작업으로 둔다. 합격: 특정 lattice 외부 정리의 가정이 매핑되어도 continuum 재구성 완료\n로 체크하지 않는다. gauge-invariant observable의 재구성 문제를 gauge potential positivity와 구별한다.",
    "page": 50,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "observable algebra·regularity·Euclidean symmetry·reflection positivity·clustering·vacuum·reconstruction을 독립 OPEN 의무와 dependency로 관리한다. finite lattice 가정 매핑은 continuum 완료를 만들지 않는다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/contracts.mjs",
      "research-ide/mathscope-m3/gauge/proof.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y7-07",
    "title": "새 continuum YM 구성의 연구 목표",
    "text": "일정 물리량 조건의 continuum·무한 부피 극한, 비자명성, 필요한 QFT axioms, uniform positive gap을 서로 다른 proof\nobligation으로 둔다. 합격: 각 극한의 존재·모형 식별·uniform bound 근거 없이는 OPEN CONTINUUM을 유지한다. 격자\nsimulation·유효모형·사용자 존재 axiom으로 Clay 완료 상태를 만들지 않는다.",
    "page": 50,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "continuum/volume limit·nontriviality·QFT axioms·uniform gap을 별도 OPEN_CONTINUUM으로 유지한다. 이 관문은 난제 해결 상태를 잘못 생성하지 않는 동작에 대한 완료이다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/contracts.mjs",
      "research-ide/mathscope-m3/gauge/proof.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  },
  {
    "id": "Y7-08",
    "title": "최종 회귀검사와 증거 bundle",
    "text": "핀된 Lean/mathlib, no-sorry 검사, axiom audit, negative control, 소스·데이터 hash, 예측된 failure cases를 묶는다. 합\n격: 변경된 소스는 새 kernel 결과가 나올 때까지 unverified다. 보고서에는 유한 결과·조건부 결과·추정·열린 의무가 각각의\n범위와 함께 표시된다.",
    "page": 50,
    "source": "MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf",
    "sourceSha256": "f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac",
    "status": "COMPLETE_WITHIN_STATED_SCOPE",
    "originalCriterionComplete": true,
    "implemented": "핀된 Lean/mathlib, source hash, no-sorry/axiom audit, 실제 양성·음성 kernel logs와 변조/replay 검사를 묶고 변경된 source는 새 kernel 전 unverified로 처리한다. 미실행 Real bridge와 물리적 열린 조건은 별도 남긴다.",
    "evidence": [
      "research-ide/mathscope-m3/gauge/verify_lean.py",
      "research-ide/mathscope-m3/gauge/package_lean.py",
      "research-ide/mathscope-m3/gauge/evidence/lean-audit.json",
      "research-ide/mathscope-m3/gauge/proof-data.mjs",
      "research-ide/mathscope-m3/gauge/tests/gauge-m3.test.mjs"
    ],
    "remaining": [],
    "continuumClaim": "OPEN_CONTINUUM",
    "clayProblemSolved": false
  }
];
