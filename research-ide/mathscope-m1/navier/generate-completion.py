#!/usr/bin/env python3
from pathlib import Path
import json,hashlib,re
B=Path(__file__).resolve().parent;R=B.parents[1];repo=B/'sources/official-repo'
read=lambda p:json.loads(p.read_text())
validation=read(B/'evidence/numerical-validation.json');lean=read(B/'evidence/lean-validation.json');candidate=read(B/'evidence/leading-profile-candidate.json')
assert validation['passed']==validation['total'] and lean['status']=='KERNEL_CHECKED_COMPONENTS'
# A static import trace is distinct from a kernel check of the complete dependency closure.
imports={};seen=set();todo=['NavierStokes']
while todo:
 m=todo.pop()
 if m in seen:continue
 seen.add(m);path=repo/(m.replace('.','/')+'.lean')
 if not path.exists():continue
 deps=re.findall(r'^import\s+([A-Za-z0-9_.]+)',path.read_text(),re.M);imports[m]=deps
 todo.extend(x for x in deps if x.startswith('NavierStokes'))
trace={'repositoryCommit':lean['external']['commit'],'roots':['NavierStokes'],'sourceImportNodes':len(imports),'imports':imports,'challengeModuleReachable':any(x.startswith('ComparatorChallenges') for ds in imports.values() for x in ds),'challengePlaceholderCount':len(re.findall(r'\bsorry\b',(repo/'ComparatorChallenges/NavierStokes.lean').read_text())),'mainExports':['NavierStokes.Comparator.navier_stokes_breakdown_R3','NavierStokes.Comparator.navier_stokes_breakdown_periodic'],'rootPaths':[['NavierStokes','NavierStokes.ComparatorSolution','NavierStokes.ComparatorR3Theorem'],['NavierStokes','NavierStokes.ComparatorSolution','NavierStokes.ComparatorTheorem'],['NavierStokes','NavierStokes.PaperResults']],'grade':'STATIC_PINNED_SOURCE_TRACE_ONLY','mainComparatorKernelVerified':False}
(B/'formal-import-map.json').write_text(json.dumps(trace,ensure_ascii=False,indent=2)+'\n')
registry=[{'id':'ns-paper-main-reference','grade':'THEOREM_REFERENCE','source':'N00 Theorem1.1 p1; proof pp123-125; Corollary10.6 p125','exportedTargets':trace['mainExports'],'locallyKernelChecked':False,'reason':'Exact pinned source statements and import path read; original4.34.0-rc2 full dependency closure/Comparator was not rebuilt in M1.'}]
for r in lean['records']:
 for t in r['targets']:
  registry.append({'id':t['target'],'grade':'KERNEL_CHECKED_COMPONENT','module':r['module'],'target':t['target'],'type':t['targetType'],'axioms':t['axioms'],'customAxioms':t['customAxioms'],'sourceFile':r['sourceFile'],'sourceSha256':r['sourceSha256'],'oleanSha256':r['oleanSha256'],'logFile':'evidence/'+r['logFile'],'logSha256':r['logSha256'],'locallyKernelChecked':r['exitCode']==0,'toolchain':'Lean/mathlib4.34.1','scope':'Exact target type only; does not instantiate the full paper construction.'})
(B/'formal-adapters.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
D={
'N1-01':('PASS','PASS','166쪽 첨부 SHA를 재확인하고 각 페이지 text hash와 section coverage를 저장했다.','sources.lock.json; paper-reference-map.json',[]),
'N1-02':('PASS','PASS','ν>0, zero datum, smooth compact force, fixed support, bounded L2, limsup L∞ 및 비영 발산 가능 force를 양화된 계약으로 고정했다.','theorem-contract.json; N00 p1,p118,p120,pp123-126',[]),
'N1-03':('PASS','PASS','166/166 page coverage와 경계 중첩 절, named statement, 4.6→5.5→7.5→9.6→9.9→10.1→10.3→1.1 경로를 저장했다. 10.3의 정확한 유형은 Lemma이다.','paper-reference-map.json',[]),
'N1-04':('PASS','PASS','OpenAI의 C/D·Lean 공개 주장은 ANNOUNCEMENT, Clay 공지는 INSTITUTIONAL_ANNOUNCEMENT로 분리하고 문서·조회 날짜를 기록했다.','sources.lock.json publicStatus',[]),
'N1-05':('PARTIAL','BLOCKED_ORIGINAL_FULL_BUILD','공식 commit/toolchain/manifest를 pin하고 unchanged component source를 local4.34.1에서 실제 컴파일했다.','sources.lock.json; evidence/lean-validation.json; evidence/cache-targets.log',['공식 원본4.34.0-rc2의 lake cache get/lake build 전체 재실행은 하지 않았다. 원본 N1-05 전체 수용기준을 PASS로 표시하지 않는다. M1에서 root가 승인한 범위는 좁은 component 검증이다.']),
'N1-06':('PARTIAL','BLOCKED_MAIN_COMPARATOR','Pinned 정적 import 경로와 challenge 미도달을 추적했다. 외부 Flatness/ProblemStatement 실제 import 및 로컬13개 target의 type/axioms/kernel 로그를 보존했다.','formal-import-map.json; formal-adapters.json; evidence/lean-validation.json',['C/D main theorem의 실제 #print axioms 결과 및 Comparator 실행 결과는 없다. 정적 source trace는 커널 의존성 검증을 대체하지 않는다.']),
'N1-07':('PASS','PASS','정리 참조/직접식/interval enclosure/finite fixture/nonlinear formal series/partial candidate/kernel component 등급을 분리했다. Full certified profile은 모든 job에서 false이다.','evidence-grades.json; index.mjs; evidence/numerical-validation.json',[]),
'N1-08':('PASS','PASS','성공·실패와 math gate를 분리했다. 수치 residual은 정해진 norm/영역의 일관성이며 source 반증·새 blowup 증명으로 승격하지 않는다.','README.md; index.mjs contract; evidence/numerical-validation.json',[]),
'N2-01':('PASS','PASS_FINITE_FIXTURES','실제 q root bracket, signed eta, X 역변환과 L>0 하한을 구현했다. ν=.1,1,3 및 η=-.8,0,.62의100자리 기준값과 비교했다.','coordinates.mjs; evidence/high-precision-fixtures.json; evidence/numerical-validation.json; Analytic.coordinate_denominator_positive',[]),
'N2-02':('PASS','PASS_FINITE_FIXTURES','실제 Tb/Zb와 inverse-root를 거치는7점 Cartesian FD를 비교하여6개 다항 fixture에서 정규화10^-10 기준을 통과했다.','checks.mjs coordinateChecks; numerical-validation.json',[]),
'N2-03':('PASS','PASS_FINITE_FIXTURES','√ν 좌표·속도와 ν pressure 배율을 구현했다. ν=.1,1,3 momentum FD와100자리 외곽 도함수 비교 및 독립 physical-box 적분의 ν^(5/2) 에너지 배율을 통과했다.','heat.mjs; index.mjs viscosityEnergyCheck; numerical-validation.json',[]),
'N2-04':('PASS','PASS_INTERVAL_ENCLOSURE','H 및0..4차 도함수에 outward arithmetic, exp/log bounded series, Simpson4차미분 bound, 양끝 tail, Γ normalization 전파를 구현했다. Z=0,.1,1,10의100자리값이 출력구간에 포함되며 목표반경1e-8을 만족한다.','heat.mjs; numerics.mjs; numerical-validation.json certified_heat_*',[]),
'N2-05':('PASS','PASS_FINITE_FIXTURES','적분 도함수 HODE, cylindrical heat FD, pressure 포함 Cartesian momentum 및100자리 외곽 jet 비교를 실행했다. 정규화 residual1e-9를 통과했다.','checks.mjs; high-precision-fixtures.json; numerical-validation.json',['PDE의 전체 solution-error bound는 이 검사로 얻지 않는다. 서로 다른 FD step 및330비트 기준 비교이며 모든 해상도에서 단조 수렴한다고 주장하지 않는다.']),
'N2-06':('PASS','PASS','r=0 exclusion, 임의 cInfinity normalization, z독립 외곽 단독의 R3 total energy 부재, core와 자동 접합 금지를 반환/export 계약으로 유지한다.','heat.mjs exteriorPoint; index.mjs exteriorJob; numerical-validation.json',[]),
'N2-07':('PASS','PASS_FINITE_FIXTURES','주기 TGV velocity·positive pressure·energy/enstrophy/dissipation를 실제 계산하고 ν=.1,1,3에서 FD와 역 pressure 부호 음성 대조군을 확인했다.','heat.mjs taylorGreenPoint; checks.mjs; numerical-validation.json',[]),
'N2-08':('PASS','PASS_FINITE_FIXTURES','Norm/분모/위치/FD step을 출력하고 잘못된 angular Laplacian 부호, 누락 pressure, 불일치 viscosity를 모두 검출했다. FFT와 direct convolution 및 aliasing 음성 대조군도 독립 경로로 수행했다.','checks.mjs; numerical-validation.json',[]),
'N3-01':('PARTIAL','BLOCKED_QUANTITATIVE_SELECTION','(A.6),(B.40)의 실제 상수 의존 순서·필요조건을 실행 데이터로 만들고 기본 예시의 부적합 부등식도 false로 노출했다.','radial.mjs parameterOrder; leading-profile-candidate.json',['sufficiently large/small의 정량 상수, B_k/Tsh/전이폭/복소영역 정규화/연속 Newton 작은근방을 아직 추출하지 못했다. 예시 h=.005/P*=2는 인증된 선택이 아니다.']),
'N3-02':('PARTIAL','BLOCKED_OUTER_REPAIRS','실제 smooth step과 unedited radial E schedule, terminal QODE wait, 네 예약 patch 및 log-normalized far exterior를 계산했다. 압력은 유한 log integral과 별도 오차 추정/미검증 tail 조건을 기록했다.','radial.mjs buildOuterSchedule; leading-profile-candidate.json outer',['A.8 axial Amp(η), M/J/S calibration, A.11 angular/pressure moments, A.7 heat compensation을 완료하지 않았다. 출력 pressure datum은 완성 source datum이 아니다.']),
'N3-03':('PARTIAL','EXPLICITLY_UNCERTIFIED_ALLOWED','실제 B.12-B.15 nonlinear η-jet/Cauchy-product 계수 재귀를 계산한다. f0는 별도 entire comparison이며 그 꼬리구간과4.1 값을 검증했다. 비선형 Φ는 f0와 실제로 다르고 degree4→8 잔차 감소를 관찰했다.','axis-series.mjs; numerical-validation.json; high-precision-fixtures.json',['Bρ invariant ball, contraction<1, 공통 complex Ω, nonlinear radius/tail은 미인증이다. 원본 acceptance가 허용한 미인증 상태를 명시했으며 수렴 멱급수 인증 완료로 세지 않는다.']),
'N3-04':('PARTIAL','PARTIAL_FORMAL_IDENTITY','유한 nonlinear profile의 Π primitive, V0 integral average, regular Cartesian factor를 구현했다. Solenoidal cancellation 항등식을 Lean으로 검증하고 실제 Cartesian FD 발산≈4.34e-11(normalized)을 확인했다.','axis-series.mjs evaluateAxis; checks.mjs coreReconstructionChecks; Analytic.solenoidal_reconstruction_cancellation',['무한 exact profile의 leading residual=0은 미인증이며 finite residual은 남는다. 실제 full NS residual은 axial viscosity 등을 포함해0일 필요가 없고, 이 fixture에서는≈.995이다.']),
'N3-05':('BLOCKED','BLOCKED_CONTROLLED_CONTINUATION','다섯 disjoint C∞ bump와 전체 quadratic increments,5×5 Jacobian·Newton·3201점 독립 재적분을 실행한다. 작은 planted fixture는 수치 통과했다. 실제 임시 continuation discrepancy는 수리 실패로 유지했다.','radial.mjs solveFiveMomentRepair; numerical-validation.json; leading-profile-candidate.json',['B.5 controlled continuation 대신 명시적 diagnostic continuation을 사용했다. continuous quadrature enclosure, interval Newton inclusion, uniform η derivatives가 없다. 실제 접합의 moment 조건은 충족되지 않았다.']),
'N3-06':('BLOCKED','BLOCKED_FULL_PROFILE_CONE','C.12 연산과 O(1/N) 값 변화·order-one radial derivative를 실제 측정한다. 별도 작은 parameter box 전체에서 κ>0를 interval 계산으로 인증하고 rational cone strip을 Lean으로 검증했다.','radial.mjs coneModulationFixture/certifiedConeBox; Analytic.rational_cone_strip; numerical-validation.json',['사용한 periodic primitive는 Lemma C.1의 admissible loop가 아니다. 실제 profile 전 구간 κ, 첫 patch moment restoration, 모든 η에서의 source cone realization은 인증되지 않았다.']),
'N3-07':('PARTIAL','BLOCKED_ACTUAL_STRESS_SUPPORT','Source flat-weight endpoint 연산과 네 reserved patch를 구현하고 잘못된 support·zero stress normalization을 거부한다. 끝점에서0/0을 계산하지 않는다.','radial.mjs; leading-profile-candidate.json; numerical-validation.json',['실제 T0의 annulus support/nonzero interior, n edge limit 및 edge factorization이 미인증이다. 이 상태를 source stress support의 완료로 표시하지 않는다.']),
'N3-08':('PASS','PASS_DATA_CONTRACT_ONLY','같은 parameterHash/source pin으로 profile·derivative·moment·점·outer trace를 묶고 Theorem4.6(i)-(vi) 전부에 증거/차단사유를 연결한다. 없는 cone/support/global error certificate는 null이며 full certification을 차단한다.','profile.mjs profileDataContract/theoremClauses; leading-profile-candidate.json; index.mjs',[]),
}
stages=read(R/'blueprint-work/ns-stages.json')[:3];out=[]
for stage in stages:
 for task in stage['tasks']:
  status,gate,detail,evidence,blocked=D[task['id']]
  out.append({'id':task['id'],'title':task['title'],'status':status,'implementationStatus':'IMPLEMENTED' if status=='PASS' else 'PARTIAL_IMPLEMENTATION','mathGateStatus':gate,'originalAcceptance':task['accept'],'evidence':detail,'artifacts':evidence.split('; '),'blockedConditions':blocked,'originalDetail':task['detail']})
additional=[
 {'id':'I1-03','status':'PASS_FOR_NS_SCOPE','evidence':'Interval denominator, exp/log, derivative jets, quadrature+tail+rounding propagation and finite series remainder; unsupported bits/error targets/overflow return PRECISION_REQUIRED. Candidate nonlinear jets remain explicitly uncertified.','artifacts':['numerics.mjs','heat.mjs','axis-series.mjs','numerical-validation.json']},
 {'id':'I1-07','status':'PASS_FOR_NS_SCOPE','evidence':'Actual mixed-radix3DFFT+3/2 padding versus direct finite mode convolution; physical FD versus analytic source jets; independent mpmath original integral; finite rational Lean fixture versus JS series; wrong aliasing/pressure/quadratic negatives.','artifacts':['checks.mjs','fixtures.generated.mjs','formal-adapters.json','numerical-validation.json']},
 {'id':'I3-03','status':'PASS_FOR_CONTRACT_SCOPE','evidence':'Exact norms/domains/quantifiers for Bρ completeness and contraction, uniform derivative-limit exchange, dominated heat differentiation, radius-zero Taylor, Borel cutoff seminorms, semigroup, residual stability and spectral continuum limits are recorded. Hypotheses for the full source solution are not asserted from arrays.','artifacts':['analytic-contracts.json','analytic-adapters.md','lean/MathScope/Navier/Analytic.lean']},
 {'id':'I3-04','status':'PASS_FOR_ADAPTER_SCOPE','evidence':'Theorem1.1/C-D remain THEOREM_REFERENCE. Unchanged pinned Flatness/ProblemStatement source are actually imported into13 locally kernel-checked targets, with type/axioms/log/source hashes and false-statement controls.','artifacts':['formal-adapters.json','formal-import-map.json','evidence/lean-validation.json']}
]
result={'schemaVersion':1,'milestone':'MathScope M1 N1-N3','allOriginalChecklistItemsCompleted':False,'summary':{s:sum(x['status']==s for x in out) for s in ['PASS','PARTIAL','BLOCKED']},'items':out,'crossCutting':additional,'remainingOutOfM1':['N4 all-order background and Borel reconstruction','N5 pulse/phase/covariance realization','N6 finite correction and all-order residual summation','N7 global compact force extension and comparison','N8 near-time computation and final reconstruction audit'],'finiteValidation':{'passed':validation['passed'],'total':validation['total']},'formalValidation':{'targets':sum(len(r['targets']) for r in lean['records']),'status':lean['status'],'mainSourceTheoremChecked':False},'reportingRule':'PASS denotes the stated component or explicit data contract only. N3-01/02/04/05/06/07 mathematical gates remain open; no full certified profile exists.'}
(B/'checklist-status.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
lines=['# NS M1 체크리스트 결과','',f"원본24개: PASS {result['summary']['PASS']}, PARTIAL {result['summary']['PARTIAL']}, BLOCKED {result['summary']['BLOCKED']}. 모든 원본 수용기준을 완료한 상태가 아니다.",'','| ID | 결과 | 실제 증거 | 남은 조건 |','|---|---|---|---|']
for x in out:lines.append('|'+ '|'.join([x['id'],x['status'],x['evidence'], ' / '.join(x['blockedConditions']) or '해당 유한 구성요소/계약 범위에서 없음'])+'|')
(B/'CHECKLIST.md').write_text('\n'.join(lines)+'\n')
print(result['summary'],'targets',sum(len(r['targets']) for r in lean['records']),'source import nodes',len(imports))

# Reattach terminal original-rc2 evidence while retaining original task criteria.
if (B/'official-validation/official-audit-summary.json').exists():
    import subprocess, sys
    subprocess.run([sys.executable, str(B/'official-validation/update-m1-evidence.py')], check=True)
