/** Original blueprint p.19–20 and p.67–68. An item is not accepted by existence. */
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const M4_CRITERIA = freeze([
  { id: 'I3-01', title: '정의와 연구가설의 파일 분리', page: 20,
    requirement: 'Defs, Finite, Analytic, Comparison, Conditional, Open을 분리하고 Open은 axiom-free import 경로에서 제외한다. unconditional target의 dependency closure에 사용자 공리가 있으면 해당 등급 build가 실패해야 한다.',
    checks: ['MODULE_SEPARATION', 'UNCONDITIONAL_CLOSURE_USER_AXIOM_REJECTION'] },
  { id: 'I3-02', title: '유한 대수 정리부터 형식화', page: 20,
    requirement: 'delta identities의 허용 정밀도, d²=0, semilinear chain map, 유한 소수 구간 인증, Lie bracket, lattice holonomy를 작은 정리로 검사한다. 자체 fixture 수락과 잘못된 certificate 거부를 실행하고 숫자 예시와 전칭 정리의 범위를 구분한다.',
    checks: ['FINITE_KERNEL_TARGETS', 'WRONG_CERTIFICATE_REJECTION', 'FIXTURE_UNIVERSAL_SCOPE_DISTINCTION'] },
  { id: 'I3-03', title: '해석적 가정의 구체화', page: 20,
    requirement: '완비성, uniform convergence, 미분/극한 교환, semigroup bounds, spectral measure, stability constants의 정확한 진술을 저장한다. 무한 합의 미분과 continuum limit를 사용하는 각 lemma의 norm, 정의역, 양화 범위를 표시한다.',
    checks: ['ANALYTIC_ASSUMPTION_STATEMENTS', 'NORM_DOMAIN_QUANTIFIER_COVERAGE'] },
  { id: 'I3-04', title: '외부 비교 정리의 adapter', page: 20,
    requirement: '프리즘 비교, trace formula, BSD 알려진 경우, NS 원문 정리의 인용과 실제 Lean import를 구별한다. 문헌 링크만 있으면 THEOREM REFERENCE이며 정확한 exported Lean theorem import만 kernel 결과와 연결한다.',
    checks: ['REFERENCE_IMPORT_DISTINCTION', 'EXPORTED_TARGET_ADAPTER_AND_TYPE'] },
  { id: 'I3-05', title: '소스 생성과 재검사', page: 20,
    requirement: 'G, Δ, p, 정밀도, 계수식, 가정 변경마다 새 ProofJob을 생성하고 이전 결과를 hash 불일치로 분리한다. 기본 소스 한 글자 변경 후 과거 PASS를 재사용하지 못하는 대조를 실행한다.',
    checks: ['PARAMETER_ASSUMPTION_REBINDING', 'ONE_CHARACTER_SOURCE_MUTATION_REJECTION'] },
  { id: 'I3-06', title: '커널·공리·빌드 감사', page: 20,
    requirement: 'Lean/mathlib commit, compile exit, warnings, sorry, #print axioms, target theorem type, 소요 시간을 기록한다. 0=1을 rfl로 제출하는 통제 사례가 실패해야 하며 UI가 사용자 공리 의존성을 보여야 한다.',
    checks: ['ACTUAL_PINNED_KERNEL_EXECUTION', 'AXIOMS_TYPE_WARNINGS_SORRY_TIME_AUDIT', 'FALSE_RFL_REJECTION', 'USER_AXIOM_UI_DISCLOSURE'] },
  { id: 'I3-07', title: '연구 관문의 완료 조건', page: 20,
    requirement: 'RH global bridge, 전칭 BSD, 일반 G continuum quantum construction을 RESEARCH OPEN으로 관리한다. 알려진 prism 비교 구현의 MODEL DEVELOPMENT와 새 비교정리의 RESEARCH OPEN을 구별한다. 가정을 결론으로 다시 쓴 순환 증명과 이름뿐인 의미 인터페이스는 관문을 닫지 못한다.',
    checks: ['OPEN_RESEARCH_PRESERVATION', 'MODEL_RESEARCH_BOUNDARY', 'CIRCULAR_ASSUMPTION_REJECTION', 'SEMANTIC_ADAPTER_VALIDATION'] },
  { id: 'I3-08', title: '교육용 설명과 전문가 감사 동기화', page: 20,
    requirement: '학생 문장/예제와 연구자 Lean type/가정/출처/반례 조건은 같은 claim ID를 읽는다. 쉬운 설명도 양화사, 조건, 근사 범위를 보존한다.',
    checks: ['SHARED_CLAIM_ID', 'STUDENT_EXPERT_QUANTIFIER_CONDITION_SCOPE_PARITY'] },
  { id: 'R1-01', title: '기준 예제 전 구간 재현', page: 68,
    requirement: '점, P1, 좋은 소수의 E, SU2/SU3/G2 지원 예제, heat exterior/axis profile/기준 PDE를 clean worker에서 실행한다. 작은 fixture의 입력 hash, 출력 불변량, 오차 범위가 acceptance manifest와 일치해야 한다.',
    checks: ['CLEAN_WORKER_POINT_P1_GOOD_PRIME_E', 'CLEAN_WORKER_SU2_SU3_G2', 'CLEAN_WORKER_HEAT_AXIS_REFERENCE_PDE', 'INPUT_OUTPUT_ERROR_MANIFEST_MATCH'] },
  { id: 'R1-02', title: '정밀도와 해상도 수렴 표', page: 68,
    requirement: 'p-adic M, series J, spatial K, lattice a/L, sample count를 독립 변경하고 관측 변화와 예측 오차를 기록한다. 인증 경계 위반은 실패다. 앙상블의 사전 유의수준, autocorrelation, 독립 반복과 신뢰구간을 결정론적 보장과 구분한다. 수렴표로 무한 극한 정리를 발급하지 않는다.',
    checks: ['INDEPENDENT_M_J_K_LATTICE_SAMPLES_REFINEMENT', 'CERTIFIED_BOUND_VIOLATION_REJECTION', 'STATISTICAL_ALPHA_AUTOCORRELATION_INDEPENDENT_REPEATS', 'NO_LIMIT_THEOREM_FROM_TABLE'] },
  { id: 'R1-03', title: '출처에서 그림까지 추적', page: 68,
    requirement: '핵심 그림의 점/패치를 선택하면 원식, 논문 위치, job, 오차, theorem/assumption ID를 연다. NS 원문 식과 생성 계수, prism 비교사상, Δ state generator 각각 하나를 end-to-end 추적한다.',
    checks: ['NS_POINT_TO_ORIGINAL_EQUATION_JOB_ERROR_CLAIM', 'PRISM_POINT_TO_COMPARISON_JOB_ERROR_CLAIM', 'DELTA_POINT_TO_GENERATOR_JOB_ERROR_CLAIM'] },
  { id: 'R1-04', title: '세션·가정 변경 회귀', page: 68,
    requirement: 'p, G, Δ, τ, cutoff, 계수체 변경으로 정확한 downstream만 STALE 처리한다. 계산 중 입력 변경, 취소, 재개, export/import 뒤 다른 입력의 증거가 연결되지 않아야 한다.',
    checks: ['EXACT_DOWNSTREAM_STALE', 'IN_FLIGHT_REVISION_CANCELLATION_RESUME', 'EXPORT_IMPORT_FOREIGN_EVIDENCE_REJECTION'] },
  { id: 'R1-05', title: '화면·접근성·성능 검수', page: 68,
    requirement: '데스크톱과 모바일 각 하나 이상, 키보드, WebGL/CPU fallback, 긴 한국어/수식, 색 범위, 샘플 선택을 검사한다. 클리핑, 빈 3D, 오류 overlay가 없고 정한 표본 예산의 조작 지연/메모리 상한을 만족한다.',
    checks: ['ACTUAL_DESKTOP_MOBILE', 'KEYBOARD_WEBGL_CPU_FALLBACK', 'KOREAN_FORMULA_COLOR_SAMPLE_QA', 'NO_CLIPPING_EMPTY_3D_OVERLAY', 'RECORDED_LATENCY_MEMORY_BUDGET'] },
  { id: 'R1-06', title: '증거 경계 공격 테스트', page: 68,
    requirement: '조작 PASS, 소스 hash, theorem type, prime certificate, force/cutoff를 주입한다. 각 사례가 예상 이유로 거부되고 유효 관측은 보존되며 로그가 원인을 설명한다.',
    checks: ['FORGED_PASS_SOURCE_TYPE_REJECTION', 'PRIME_FORCE_CUTOFF_MUTATION_REJECTION', 'VALID_OBSERVATION_PRESERVED', 'READABLE_REJECTION_REASONS'] },
  { id: 'R1-07', title: '연구·교육 시나리오 완료', page: 68,
    requirement: '학생 계수체 실험, 연구 Frobenius/local-factor 감사, Δ 상태족 비교, NS 근사/잔차 비교의 네 walkthrough를 실행한다. 다른 사람이 설명만 보고 같은 입력/결과를 재현하고 의미와 미해결 가정을 확인한다.',
    checks: ['FIELD_STUDENT_WALKTHROUGH', 'FROBENIUS_LOCAL_FACTOR_RESEARCH_WALKTHROUGH', 'DELTA_FAMILY_WALKTHROUGH', 'NS_APPROXIMATION_RESIDUAL_WALKTHROUGH', 'INDEPENDENT_READER_REPRODUCTION'] },
  { id: 'R1-08', title: '범위별 릴리스 판정', page: 68,
    requirement: '명시된 지원 기능만 후보로 묶고 기존 전체 RELEASE HOLD와 모듈 상태를 구분한다. 패치, 테스트, rollback 자료를 준비하고 실제 게시 후 화면을 확인한 시점에만 배포 완료를 기록한다.',
    checks: ['DECLARED_CAPABILITIES_SCOPE', 'MODULE_STATUS_GLOBAL_HOLD_DISTINCTION', 'PATCH_TEST_ROLLBACK', 'ACTUAL_POST_PUBLICATION_SCREEN_RECEIPT'] },
]);

export const HANDOFF_BASELINE = freeze({
  blueprintSha256: 'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac',
  projectId: 29770, page: 'v0.3.1.html', publicVersion: 102,
  publicVersionHash: '22764e0e',
  publicHtmlSha256: '6189fd98be1bcd857f9b4c65f980746b15ab4dd95d64c4b2a3d1fe9655056eb9',
  publicMain: '50e3a6262faf0b4844356ce06af6fb28d83afcf8',
  historicalResumeHead: 'c45cb5ea9fe822fe05b40665d5d1974feb4bc99e',
  historicalM3OriginalAccepted: 56, historicalM3OriginalTotal: 64,
  pendingOriginalM3: ['N6-01', 'N6-02', 'N6-07', 'N6-08', 'N7-04', 'N7-05', 'N7-06', 'N8-05'],
  historicalM4FinalAcceptance: 'UNCONFIRMED',
  note: '2026-10-13 인수인계의 역사적 pin이다. 현재 원격 상태 또는 새 검사 성공을 의미하지 않는다. I3 기초는 M0에서 승계하며 M4와 중복 합산하지 않는다.',
});
