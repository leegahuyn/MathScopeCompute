from pathlib import Path
import json, hashlib, re, datetime

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'work/m4_criteria'
def digest(p):
    p = ROOT / p
    return {'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
def put(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
def compact(s):
    return re.sub(r'\s+', '', s)

expanded = digest('recovered/pdfs/MathScope_Research_IDE_Blueprint_v1_KO(1)(20261017-114129).pdf')
concept = digest('upload/MathScope_Mathematical_IDE_설계도(3).pdf')
paper = digest('recovered/pdfs/navier-stokes(20261017-114135).pdf')
handoff = digest('recovered/pdfs/MathScope_M2_M3_M4_Handoff_2026-10-12_KO(8).pdf')
assert (concept['bytes'], concept['sha256']) == (434191, '3a97a272ef5056077b90fad0e65e8c779c94c8377a421109c042e897ee33abd0')
assert expanded['sha256'] == 'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac'
source_path = 'analysis/base/PR30-primary67-continuation/MathScopeCompute/research-ide/mathscope-m3/ORIGINAL_M3_M4_CRITERIA.json'
source = json.loads((ROOT / source_path).read_text())
assert source['sha256'] == expanded['sha256']
rows = []
for c in source['criteria']:
    if c['id'].startswith(('I3-', 'R1-')):
        page = (ROOT / f"pdf_criteria/blueprint/page-{c['page']:03}.txt").read_text()
        assert compact(c['text']) in compact(page), c['id']
        assert compact(c['title']) in compact(page), c['id']
        rows.append({**c, 'source': expanded['path'], 'source_sha256': expanded['sha256'], 'page_locator': f"PDF page {c['page']} / printed {c['page']}/99", 'verified_against_actual_pdf_page_text': True})
assert len(rows) == 16
assert len({c['id'] for c in rows}) == 16

requirements = {
'I3-01': ['Defs/Finite/Analytic/Comparison/Conditional/Open import boundary and target dependency closure', 'Unconditional target rejects user axioms, including transitive dependencies'],
'I3-02': ['Actual small finite theorem source and build outputs for the listed delta/d²/semilinear/finite-prime/Lie-bracket/lattice-holonomy targets; input/certificate fixtures', 'Positive fixture accepted, deliberately bad certificate rejected, examples distinguished from universal claims'],
'I3-03': ['Every infinite-sum derivative or continuum-limit lemma records complete hypotheses, norm, domain and quantifiers', 'Uniform convergence, interchange of limit and derivative, semigroup/spectral/stability assumptions are explicit'],
'I3-04': ['Separate paper reference adapters from exact exported Lean theorem imports', 'Only the exact actual imported declaration may carry its kernel result'],
'I3-05': ['New ProofJob on G/Delta/p/precision/coefficient/assumption changes', 'One-character source mutation rejects old PASS by source hash'],
'I3-06': ['Lean/mathlib commits, compile exit, warnings, sorry, #print axioms, target type and duration', 'Actual 0=1 by rfl negative build and UI disclosure of user-axiom dependence'],
'I3-07': ['Research-open register and scope distinctions for RH, universal BSD, general-G continuum, known/new prism comparison', 'Circular assumptions or renamed semantic interfaces cannot close a research gate'],
'I3-08': ['Student and expert views share exact claim ID and underlying declaration', 'Both retain quantifiers, assumptions, source, counterexample conditions and approximation scope'],
'R1-01': ['Clean-worker replay of point/P1/good-prime E, supported SU2/SU3/G2, heat exterior/axis profile/baseline PDE fixtures', 'Input hashes, output invariants and error ranges match an acceptance manifest'],
'R1-02': ['One-axis-at-a-time p-adic M, series J, spatial K, lattice a/L and sample-count variation', 'Predicted-error table, certified-bound checks and appropriate preregistered statistical treatment; no infinite theorem from a convergence table'],
'R1-03': ['Selectable core figure points/patches link original formula, paper locator, job, error and theorem/assumption IDs', 'One complete trace each for NS source/generated coefficients, prism comparison map and Delta state generator'],
'R1-04': ['Exact downstream invalidation under p/G/Delta/tau/cutoff/coefficient-field changes', 'In-flight edits, cancellation, resume, export/import never attach evidence from another input'],
'R1-05': ['At least one desktop and mobile; keyboard, WebGL/CPU fallback, long Korean/math, color scale and sample selection', 'No clipping, empty 3D or error overlay; documented sample-budget latency and memory limits measured on declared environment'],
'R1-06': ['Forged PASS, wrong source hash, wrong theorem type, altered prime certificate and wrong force/cutoff injected', 'Each rejected for expected reason while valid observations survive and logs explain the cause'],
'R1-07': ['Four walkthroughs: student coefficient fields, research Frobenius/local-factor audit, Delta-family comparison, NS approximation/residual comparison', 'Another person can reproduce identical inputs/results from the explanation and see meaning/open assumptions'],
'R1-08': ['Release scope/capabilities, HOLD items, tests, rollback/deployment patch and reproducibility packet', 'Only actual post-publication screen verification permits deployed-complete status'],
}
existing = {
'I3-03': ['pdf_criteria/n601_candidate_review.json', 'pdf_criteria/remaining_chain_candidate_review.json', 'work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json'],
'I3-04': ['pdf_criteria/original_8_duties_criteria.json', 'pdf_criteria/n601_candidate_review.json', 'pdf_criteria/remaining_chain_candidate_review.json'],
'R1-02': ['pdf_criteria/original_8_duties_criteria.json'],
'R1-03': ['work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json', 'work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json'],
'R1-06': ['work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json', 'work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json'],
}
for row in rows:
    row.update({
      'status': 'PREPARATION_ONLY_NOT_REASSESSED_FOR_CURRENT_RELEASE',
      'acceptance_complete': None,
      'inherited_completion': 'Not revoked. I3 basics inherited from M0 may be reused only after exact scope/source reconciliation; no duplicate completion count.',
      'required_current_evidence': requirements[row['id']],
      'existing_candidate_inputs': [digest(x) for x in existing.get(row['id'], [])],
      'existing_evidence_limit': 'These files are candidate inputs, not a current M4 acceptance run. Analytic source application is not an actual Lean kernel build; source pins are not a browser end-to-end trace; a source mutation check alone is not the complete attack suite.',
      'current_release_acceptance_run': None,
      'remaining_action': 'After M3 acceptance, reconcile inherited evidence with the exact selected release source and execute only the missing original acceptance checks.',
    })
ledger = {
'schema': 'mathscope.m4-original-acceptance-preparation.v1',
'prepared_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
'scope': 'M4 intake preparation only; no M4 implementation, kernel run, browser acceptance, publication or source mutation performed by this audit.',
'primary_source': {**expanded, 'pages': 99},
'supplementary_new_concept_source': {**concept, 'pages': 25, 'role': 'Concept/proposal requirements, not replacement M4 milestone checklist.'},
'original_m4_definition': {'page': 12, 'packages': ['I3 extension', 'R1'], 'unique_checklist_ids': 16, 'i3_overlap': 'I3 basics also occur in M0. Never add eight new duplicate items to the overall original 224 unique IDs.'},
'prerequisites': {'I3': 'I0/I1; expanded PDF p19', 'R1': 'I0-I3 and completion of P/Y/N packages selected for release; expanded PDF p67', 'current_user_order': 'M3 completion precedes M4 execution; this packet prepares the handoff.'},
'package_gates': {'I3': {'page': 19, 'required': 'At least one exact finite theorem AND one conditional analytic theorem actually pass the kernel; wrong source, circular assumptions and hash reuse are rejected.', 'version_note': 'Lean 4.34.1/mathlib v4.34.1 is the historical design starting pin, not a claim about latest versions. Actual selected environment must be locked and audited.'}, 'R1': {'page': 67, 'required': 'All mandatory checks and evidence boundaries for the selected release features pass; only that scope is released. RH/BSD/YM research gates remain separately tracked.'}},
'aggregate_status': 'CURRENT_M4_AGGREGATE_NOT_REASSESSED',
'completion_percent': None,
'completed_count': None,
'count_note': 'Unknown/currently unreviewed is not 0/16 and not no work. Historical inheritance is preserved without relabeling it as fresh acceptance.',
'baseline_m3_note': 'Prior independent review accepted N6-01/N6-07/N6-08/N7-04/N7-05 in declared analytic scope; N6-02/N7-06/N8-05 were pending at that snapshot. New numeric work must supply its own current disposition; this preparation ledger does not override it.',
'historical_evidence': [
 {'source': handoff, 'pages': [2,6,11,14], 'role': 'Historical handoff; M4 latest item-level aggregate unverified, previous worker/UI/Lean evidence only, two file-picker import gateway timeouts. Not a current release acceptance.'},
 {'source': digest('work/m4_criteria/historical_m3_m4_resume_20261013.md'), 'role': 'Extracted historical resume; reported v102 and release56 tests/browser observations remain historical source reports, not current replay.'}],
'criterion_extraction': {'source_json': digest(source_path), 'historical_source_alias': source['source'], 'verification': 'All 16 title/text strings independently matched the actual authenticated PDF page extraction after whitespace normalization; p20 and p68 rendered and visually read.'},
'criteria': rows,
}
put('M4_ACCEPTANCE_PREPARATION_LEDGER.json', ledger)
put('M4_ORIGINAL_CRITERIA.json', {'source': expanded, 'criterion_count':16, 'criteria':[{k:r[k] for k in ['id','title','text','page','source','source_sha256','page_locator','verified_against_actual_pdf_page_text']} for r in rows]})

supplement = [
 {'pages':[3,4,8], 'topic':'Object and representation contract', 'requirement':'Intrinsic, ambient and display dimensions remain distinct. Store maps, domains and exclusions. Numeric, exact, formal and reviewed evidence are distinct.', 'links':['I3-08','R1-03']},
 {'pages':[5,6,7], 'topic':'Revision and asynchronous jobs', 'requirement':'Object/representation/claim revisions follow every job. Late old jobs remain history, never current acceptance. Camera/color-only changes preserve math evidence; mathematical inputs invalidate exact downstream evidence.', 'links':['I3-05','R1-04']},
 {'pages':[9,10], 'topic':'S3 projection and exact slice', 'requirement':'Projection to three coordinates is closed B3, with two preimages in the interior and one on the boundary. Slice x4=c is S2 of radius sqrt(1-c²) for |c|<1, a point for |c|=1, empty for |c|>1. Exact slices use analytic parameterization; slab samples disclose approximation and epsilon. Check critical-value rounding and degeneracy.', 'links':['R1-03','R1-05','R1-06']},
 {'pages':[10], 'topic':'Optional stereographic view', 'requirement':'The source marks stereographic projection as a later optional feature. If implemented, disclose excluded pole and finite display clipping radius.', 'links':['R1-05'], 'proposal_status':'LATER_OPTIONAL'},
 {'pages':[11], 'topic':'Continuous observer', 'requirement':'For P_t=Pi3 R(t), R(t) in SO(N), record path/frame/sample IDs. Record rank/critical events; do not describe the original dimension as changing continuously.', 'links':['R1-03','R1-04']},
 {'pages':[12,13,14], 'topic':'Infinite-dimensional and advanced views', 'requirement':'Banach bounded functionals differ from Hilbert orthogonal projection. A finite L2 family is not the entire space. Disclose basis/quadrature/resolution/errors, coefficient conventions and representation loss; distinguish estimated/exact-finite/formal/unknown diagnostics.', 'links':['I3-03','I3-08','R1-02','R1-03']},
 {'pages':[15,16], 'topic':'Lean and claim ledger', 'requirement':'Ledger acceptance uses a separate build at pinned revision/environment with source/log/target. Audit transitive axioms and semantic correspondence; sorryAx stays incomplete. Store evidence grade, execution state and currentness separately. Algebraic radius-squared identity does not prove slice homeomorphism; kernel checks do not certify GPU rendering.', 'links':['I3-01','I3-04','I3-05','I3-06','I3-08','R1-04']},
 {'pages':[17], 'topic':'Proposed MVP scope', 'requirement':'S2, T2 in R3, S3 in R4; projection/rotation/S3 analytic slice; dimension/observation conditions; residual/overlap diagnostics; Lean panel; claim/evidence/STALE; save/export. General schemes, meshing, automatic theorem discovery/proof and cloud collaboration are deferred.', 'links':['R1-01','R1-03','R1-05','R1-07'], 'proposal_status':'CONCEPT_MVP_PROPOSAL'},
 {'pages':[17], 'topic':'Proposed user acceptance', 'requirement':'The concept proposes five test users, four completing the S3 slice-claim workflow unaided. Do not claim this has run or silently add a new original M4 checklist ID.', 'links':['R1-07'], 'proposal_status':'PROPOSED_ACCEPTANCE_NOT_CURRENT_RESULT'},
 {'pages':[20], 'topic':'Proposed performance targets', 'requirement':'After fixing reference hardware, initially target at least 30 fps for 100,000 projection/rotation samples, cached slice refresh within 100 ms, and warm short-Lean diagnostic p95 within 2 seconds. Record hardware, sample and project. These do not guarantee large-proof completion latency.', 'links':['R1-05'], 'proposal_status':'REFERENCE_HARDWARE_DEPENDENT_INITIAL_TARGETS'},
 {'pages':[20], 'topic':'Semantic and adversarial checks', 'requirement':'Test S3 ball/sphere confusion; c near ±1, |c|>1 and tiny slices; finite samples true but global statement false; changed assumptions/wrong Lean theorem; late responses, sorryAx and unapproved axioms; old evidence must not pass for a new revision.', 'links':['I3-06','I3-07','I3-08','R1-06']},
 {'pages':[18,19,21,22,24,25], 'topic':'Planning and technical choices', 'requirement':'Twelve-week staffing plan, proposed stack and research-adoption targets are proposals, not completed milestones. A universally quantified theorem need not rerun its proof on every slider change; validate the actual application assumptions. Record selected reference hardware, schemas and reviewer.', 'links':['I3-05','I3-08','R1-05','R1-07'], 'proposal_status':'DESIGN_PROPOSAL'},
]
put('CONCEPT_3D_REQUIREMENTS.json', {'source':{**concept,'pages':25}, 'role':'Supplemental concept design read in full; no M4 milestone checklist occurs here. M4 in the reference bibliography is a Milne citation label.', 'no_new_original_ids':True, 'requirements':supplement})

numeric = []
details = {
'N6-02': {
 'paper_pages':[100,108,109,110,111],
 'evaluation_target':'Same actual complete finite state, its actual implemented increment, and current full pressure after every implemented substep of a canonical cycle.',
 'mandatory_substeps':['forced correction for all supported nonzero angular harmonics, then pressure refresh','signed covariance update using the fixed original positive primary amplitudes, then pressure refresh','zero-auxiliary-mean temporal update including its actual axial cutoff remainder, then pressure refresh','fresh five-equation moment correction from current P/Jtheta/Jz, then pressure refresh'],
 'measured_outputs':['All three independently evaluated direct PDE residual components','All three decomposed residual components R_old + L_old(delta_u,delta_p) + div(delta_u tensor delta_u)','Mismatch with a declared error budget and provenance for input/output tuple and pressure roots','Retained old flat residual, new quadratic remainder and all actual cutoff terms'],
 'refresh_definition':'Paper p100: use full current wave velocities to form angular covariance Wab and gr; set P=integral_R Haar_Y(gr), pm=T0(gr-rho P); use this pressure for Etheta/Ez; use the same velocity/radial source for Jtheta/Jz. Repeat after every velocity change. Angular pressure and full auxiliary covariance cannot be dropped before their required products.',
 'moment_scope':'Final two conservation moments remain zero. The three recomputed defects equal the nonlinear remainders in (8.26)-(8.27); they are not required to vanish exactly.',
 'scope_limit':'One actual implemented complete cycle with every mandatory substep/root join tested can establish the finite implemented-cycle certificate. It does not certify numerical evaluation of all j; the original does not require literal infinite execution.',
 'not_sufficient':['A graph node ID or structure equality without actual residual evaluation','Pretemporal or fresh-initialized signed checks substituted for the post-forced/post-signed/post-temporal chain','Reusing the same residual expression on both sides as an independent direct comparison','Dropping retained old flat terms, full pressure, axial cutoff remainder or the new quadratic term'],
 'numeric_threshold':'The original specifies agreement inside an error budget, not a universal numerical tolerance or sample count. Declare domain, evaluation inputs, precision, derivative/truncation/quadrature errors and budget appropriate to the actual evaluator.'},
'N7-06': {
 'paper_pages':[116,117,118,121],
 'evaluation_target':'The same actual whole localized velocity u and whole force f, integrated over the entire fixed compact support K. Core-only energy is distinct.',
 'equations':['d(||u||_2²/2)/dt + nu ||grad u||_2² = <f,u>','At nu=1: ||u(t)||_2² + 2 integral_0^t ||grad u(s)||_2² ds <= (integral_0^t ||f(s)||_2 ds)²; paper (10.13).'],
 'measured_outputs':['Normalized energy defect and all terms/normalization definition','Independent spatial-refinement comparison, with temporal choice held fixed','Independent temporal-refinement comparison, with spatial choice held fixed','Whole-support quadrature/truncation and error budgets sufficient to interpret decrease and no contradiction with (10.13)'],
 'scope_limit':'Finite positive-tau windows and selected runs must be explicit. The analytical energy theorem alone is not the required numerical refinement comparison.',
 'not_sufficient':['Inner-only or core-only integration','A toy/model/zero extension standing in for the actual global fixture','Naming f as the full PDE residual without evaluating its actual terms and the energy/refinement quantities; defining f by that residual is itself the original construction','Assuming an analytic weighted-supremum selector is an effective numerical evaluator'],
 'numeric_threshold':'N7-06 itself gives no fixed tau list, grid, tolerance, or factor-two requirement. It requires normalized defect decrease under independent space/time refinement. State actual chosen window, tau, quadrature, tails and error budget.'},
'N8-05': {
 'paper_pages':[113,114,115,116,117],
 'evaluation_target':'Actual near-terminal construction with core radius, axial length, pulse wavelength and active cutoff orders resolved together.',
 'measured_outputs':['Baseline versus doubled spatial grid, holding other axes fixed','Baseline versus doubled Fourier cutoff, holding other axes fixed','Baseline versus doubled coefficient order, holding other axes fixed','Baseline versus doubled arithmetic precision, holding other axes fixed','Separate tail bounds for omitted contributions','On budget exceedance, last-resolved positive tau and the concrete cause'],
 'scope_limit':'The four doubled-axis comparison table and tail record apply to the declared actual run/window; finite numerical evidence cannot be relabeled as an all-order or infinite-limit theorem.',
 'not_sufficient':['Increasing all axes together','Doubling unused metadata or a parameter that cannot change the actual evaluator','Finite-stage structural equality or exact symbolic cutoff selection without evaluator outputs','Reusing periodic baseline solver tests as the whole-space paper construction'],
 'numeric_threshold':'The factor two for grid/Fourier cutoff/coefficient order/arithmetic precision is explicit in N8-05. N8-04 separately lists tau=1e-2,1e-4,1e-8,1e-12; do not transplant that separate criterion as a new N8-05-only universal gate.'},
}
for identifier, detail in details.items():
    c = next(x for x in source['criteria'] if x['id'] == identifier)
    page = (ROOT / f"pdf_criteria/blueprint/page-{c['page']:03}.txt").read_text()
    assert compact(c['text']) in compact(page)
    numeric.append({'id':identifier,'title':c['title'],'verbatim_original':c['text'],'criterion_pdf_page':c['page'],'source':expanded, **detail, 'review_disposition':'REQUIREMENTS_ONLY_NOT_A_CURRENT_IMPLEMENTATION_VERDICT'})
put('M3_REMAINING_NUMERIC_REQUIREMENTS.json', {'criterion_source':expanded,'paper_source':paper,'requirements':numeric})

md = ['# M4 원문 인수 준비', '', '현재 실행 판정이 아닌 인수 준비 초안이다. I3 확장 8개와 R1 8개를 원문에서 대조했다. 기존 승계 완료를 취소하지 않으며, 현재 미확인을 0/16 또는 0%로 표시하지 않는다. M3가 완료된 뒤 선택 릴리스의 정확한 소스에 기존 증거를 연결하고 남은 검사만 실행한다.', '', f"원문: `{expanded['path']}` · SHA256 `{expanded['sha256']}` · 99쪽. p12의 M4=I3 확장/R1이며, M0의 I3 기초와 중복 집계하지 않는다.", '', 'I3 패키지 완료 관문(p19)은 exact finite 정리 하나 이상과 조건부 analytic 정리 하나 이상의 실제 커널 통과 및 잘못된 소스·순환가정·hash 재사용 거부다. R1(p67)은 I0–I3 및 선택 릴리스에 포함한 P/Y/N 작업 완료를 선행으로 하며, 선택 범위의 모든 필수 검사와 증거 경계를 통과해야 한다.', '', '| ID | 원문 제목 | 원문 쪽 | 현재 검토 상태 |', '|---|---|---:|---|']
for r in rows: md.append(f"| {r['id']} | {r['title']} | {r['page']} | 인수 준비만 / 현재 릴리스 재판정 전 |")
md += ['', '## 항목별 원문과 필요한 현재 증거', '']
for r in rows:
    md += [f"### {r['id']} — {r['title']}", '', r['text'].replace('\n',' '), '', '현재 인수에 필요한 자료:', ''] + [f'- {x}' for x in r['required_current_evidence']] + ['']
    if r['existing_candidate_inputs']:
        md += ['이미 있는 관련 입력 자료(이 항목의 완료 판정은 아님):', ''] + [f"- `{x['path']}` · SHA256 `{x['sha256']}`" for x in r['existing_candidate_inputs']] + ['']
md += ['## 증거 승계와 범위', '', 'M3의 source-bound 해석적 정리 적용, 원문·root/hash 대조 및 negative controls는 I3-03/I3-04/R1-03/R1-06 등의 입력이 될 수 있다. 그것만으로 Lean 커널 실행, 화면의 end-to-end 연결, 전체 공격 테스트 또는 통합 릴리스 인수를 완료했다고 판정할 수 없다.', '', '16쪽 인수인계(p2,6,11,14)와 2026-10-13 재개 문서는 과거 Lean/worker/브라우저/배포의 근거와 미확인 항목을 전달한다. 이력은 보존하되 현재 release source에서 재실행·대조한 결과로 바꾸지 않는다. 이번 조사에서 현재 I3/R1 항목별 최신 acceptance manifest는 확인되지 않았다.', '', '434,191바이트의 새 25쪽 개념 설계도는 886,241바이트의 99쪽 확장 설계도와 다른 문서다. 새 문서의 S3/3D/Claim/Lean 설계, 사용성 및 성능 제안은 `CONCEPT_3D_REQUIREMENTS.json`에 원문 쪽과 제안 수준을 표시했다. 기존 16개 ID에 새 임의 ID 또는 완료율 분모를 추가하지 않는다.', '', '## 작성 범위', '', '새 PDF를 실제 열어 byte/hash/쪽수와 내용을 확인했다. 기존과 같은 handoff/paper/expanded blueprint는 기존 추출을 재사용했다. 원본 변경, M4 실행, 사이트 변경, 배포, Git commit은 하지 않았다. 수치 구현팀용 원문 요구는 `M3_REMAINING_NUMERIC_REQUIREMENTS.json`에 별도로 기록했다.', '']
(OUT / 'M4_ACCEPTANCE_PREPARATION_LEDGER.md').write_text('\n'.join(md))
md = ['# 새 25쪽 3D 개념 설계도: 출처와 적용 범위', '', f"`{concept['path']}` · {concept['bytes']} bytes · SHA256 `{concept['sha256']}` · 25쪽. 실제 첫 페이지의 제목은 Mathematical IDE / Concept Blueprint이다. 기존 99쪽 확장 설계도와 다르며 M4 원문 체크리스트를 대체하지 않는다.", '', '각 항목의 링크는 관련된 기존 M4 ID를 찾기 위한 해석적 연결이며 새 필수 ID가 아니다. 제안 목표를 현재 구현·실측 결과로 기록하지 않는다.', '']
for r in supplement:
    md += [f"## {r['topic']} — pp. {', '.join(map(str,r['pages']))}", '', r['requirement'], '', f"관련 기존 ID: {', '.join(r['links'])}. 수준: {r.get('proposal_status','DESIGN_REQUIREMENT_WITHIN_CONCEPT_SCOPE')}.", '']
(OUT / 'CONCEPT_3D_REQUIREMENTS.md').write_text('\n'.join(md))
md = ['# M3 남은 세 항목의 실제 수치 평가 요구', '', '원문 기준을 구현팀에 전달하는 메모다. 새 구현의 PASS/FAIL 판정은 포함하지 않는다. 모든 검사는 해당 실제 run/source/current state와 연결하고, 선언한 finite scope를 보존한다.', '']
for r in numeric:
    md += [f"## {r['id']} — {r['title']} (확장 설계도 p{r['criterion_pdf_page']})", '', r['verbatim_original'].replace('\n',' '), '', f"실제 평가 대상: {r['evaluation_target']}", '', '필수 출력:', ''] + ['- '+x for x in r['measured_outputs']] + ['', '수치 기준: '+r['numeric_threshold'], '', '범위: '+r['scope_limit'], '']
    if 'mandatory_substeps' in r:
        md += ['실제 complete cycle:', '']+['- '+x for x in r['mandatory_substeps']]+['',r['refresh_definition'],'',r['moment_scope'],'']
    if 'equations' in r: md += ['식:', '']+['- '+x for x in r['equations']]+['']
    md += ['충분하지 않은 근거:', '']+['- '+x for x in r['not_sufficient']]+['']
(OUT / 'M3_REMAINING_NUMERIC_REQUIREMENTS.md').write_text('\n'.join(md))
manifest = [digest(str(p.relative_to(ROOT))) for p in sorted(OUT.glob('*')) if p.is_file() and p.name != 'PREPARATION_MANIFEST.json']
put('PREPARATION_MANIFEST.json', {'outputs':manifest,'originals_unchanged':True,'visual_checks':['concept p10','concept p20','expanded p20','expanded p68'],'source_pins':[expanded,concept,paper,handoff]})
print(json.dumps({'m4_original_items':len(rows),'numeric_requirements':len(numeric),'concept_topics':len(supplement),'output_dir':str(OUT)}, ensure_ascii=False))
