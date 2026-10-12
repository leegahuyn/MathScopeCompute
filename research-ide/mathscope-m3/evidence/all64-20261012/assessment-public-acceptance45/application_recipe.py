#!/usr/bin/env python3
"""Apply the explicitly accepted 14 original criteria; preserve all historical bytes."""
import copy
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path('/workspace/scratch/5a8728de776c/MathScopeCompute')
M3 = REPO / 'research-ide/mathscope-m3'
HISTORY = M3 / 'evidence/all64-20261012/assessment-before-public-acceptance45'
OUT = M3 / 'evidence/all64-20261012/assessment-public-acceptance45'
NOW = datetime.now(timezone.utc).isoformat()
EXPECTED = {
 'P7_PROGRESS.json':'e594d61b982342436200fe2ced619f7cf8130e12c8d60eecd5b5fc4f38542f9d',
 'P8_PROGRESS.json':'77416cc9ba5cf0fada2a13e8acf3d8459f0f17f0a8f8b70e35e2970e35d68142',
 'GAUGE_PROGRESS.json':'234d06b5349202006334d3ab4e338b93799353c90e86d26a68999d99ac1cedcf',
 'N6_PROGRESS.json':'b2b8e2ec5d1f6d209a3e491e232630d52198883c32a5d52d268fee76424315b3',
 'N7_PROGRESS.json':'993c0056ab2b5be7d87c5d8dfbc2cb06e431d5ab776d060aef5fec7c4fd11f98',
 'N8_PROGRESS.json':'51773a7dbeb342ba99986e8d85785facbacc77d0b12db95f42c699484c688507',
 'M3_ALL64_REVIEW_KO.md':'f0cf587411c89249566601768bb5dc48f6db5eabc477e8401bb8870950c9ee39',
}
PROMOTED = [*(f'P7-{i:02d}' for i in range(1,9)), 'P8-06', 'Y5-05', 'Y5-06', 'Y5-08', 'N8-06', 'N8-07']
IMMUTABLE = {
 'ORIGINAL_M3_M4_CRITERIA.json':'bfe0e57b127849a5413414c8e8340ed5592049082fd211d9172a2fce6f219156',
 'M3_REVIEW_KO.md':'c9b6644499bccb9162616c06a00174b167d884e0a11740251b98e23251fce79b',
}

def sha(data): return hashlib.sha256(data).hexdigest()
def encoded(obj): return (json.dumps(obj,ensure_ascii=False,indent=2)+'\n').encode()
def pin(path, data=None):
 path=Path(path);data=path.read_bytes() if data is None else data
 return {'path':str(path.relative_to(M3)), 'bytes':len(data), 'sha256':sha(data)}
def load(path): return json.loads(Path(path).read_bytes())
def rel(path): return str(Path(path).relative_to(M3))
def link(k): return f'[{k}]({evidence[k]["path"]})'
def replace_once(text,old,new):
 assert text.count(old)==1,(old[:100],text.count(old))
 return text.replace(old,new,1)

before={name:(M3/name).read_bytes() for name in EXPECTED}
assert all(sha(data)==EXPECTED[name] for name,data in before.items()),'A frozen input changed; stop rather than overwrite concurrent work.'
assert all(sha((M3/name).read_bytes())==digest for name,digest in IMMUTABLE.items())
old={name:json.loads(data) for name,data in before.items() if name.endswith('.json')}
new=copy.deepcopy(old)
row_before={row['id']:(name,row) for name,data in old.items() for row in data['criteria']}
rows={row['id']:(name,row) for name,data in new.items() for row in data['criteria']}
assert len(rows)==64 and sum(row['originalCriterionComplete'] for _,row in rows.values())==31
assert len(PROMOTED)==14 and all(rows[k][1]['originalCriterionComplete'] is False for k in PROMOTED)

EVIDENCE_PATHS={
 'F001':'evidence/all64-20261012/public-p7-execution-acceptance.json',
 'F002':'evidence/all64-20261012/public-api-semantic-review/review.json',
 'F003':'evidence/all64-20261012/ci-c971/receipt.json',
 'F004':'evidence/all64-20261012/ci-c971/p7-job-114802713677.log',
 'F005':'evidence/all64-20261012/public-v95/p7-ui-cases.json',
 'F006':'evidence/all64-20261012/public-v96/p7-ui-acceptance.json',
 'F007':'evidence/all64-20261012/public-v95/p8-acceptance.json',
 'F008':'p8/evidence/p7-ci-arithmetic-attempt2-38237430568/receipt.json',
 'F009':'evidence/all64-20261012/ci-529/receipt.json',
 'F010':'evidence/all64-20261012/public-v93/gauge-ui-audit.json',
 'F011':'evidence/all64-20261012/public-v93/gauge-spacing-ui-audit.json',
 'F012':'evidence/all64-20261012/public-v93/navier-flow-ui-audit.json',
 'F013':'evidence/all64-20261012/public-v93/navier-energy-ui-audit.json',
 'F014':'evidence/all64-20261012/public-v93/navier-source-archive-ui-audit.json',
 'F015':'evidence/all64-20261012/public-v97/n7-ui-acceptance.json',
 'F016':'navier/evidence/inner-growth-20261012/attempt2/receipt.json',
 'F017':'evidence/all64-20261012/public-v97/publication-http-verification.json',
 'F018':'evidence/all64-20261012/public-v96/publication-http-verification.json',
 'F019':'evidence/all64-20261012/p7-final-gate-attempt3/receipt.json',
 'F022':'navier/evidence/inner-growth-20261012/attempt2/inner-growth.json',
 'F023':'evidence/all64-20261012/public-v97/n7-exported-execution-record.json.gz',
 'F024':'evidence/all64-20261012/ci-c971/inner-growth-job-114802714578.log',
}
evidence={k:pin(M3/path) for k,path in EVIDENCE_PATHS.items()}
guard={'F001':'fcfce6149a837f947900c7b4deadf54da924fbd66bb7f94036e8416dfc106917','F003':'490e583739006ff3816e6e3d144dbaaadaf04314b468c0f721a2de7d9fb7394c','F006':'26e81693ce853beeed64947e2adee9b7fba344c1ccf1f454cb280a764978036d','F007':'fd3ac05e09edd99ef8d1b3aa6c9e5e37d7a76ad77476b374c38516281dfa87ab','F008':'e812c0d18b3f292ffc82823cd968eddcdb51050da09205677ffe4f6285713893','F015':'1e3aa6999a88c2636c15ee382aeec3c98558c9acba06e26ff03b0a84daa0d7bb','F016':'019bd3babe83d6af74dccd28bde6eb734393a454a7af60f114778f20c556ff28'}
assert all(evidence[k]['sha256']==v for k,v in guard.items())
ci=load(M3/EVIDENCE_PATHS['F003']);assert ci['status']=='PASS' and ci['successfulWorkflows']==5 and ci['successfulJobs']==7 and ci['checkoutTreeMatchesBranchHead'] is True
assert all(x['conclusion']=='success' for x in ci['workflows'])
ci_log=(M3/EVIDENCE_PATHS['F004']).read_text();assert all(s in ci_log for s in ['161 passed','233 passed','# pass 138'])
assert load(M3/EVIDENCE_PATHS['F006'])['status']=='PASS'
assert load(M3/EVIDENCE_PATHS['F015'])['pass'] is True and load(M3/EVIDENCE_PATHS['F015'])['originalCriterionComplete'] is False

criterion_refs={k:['F001','F002','F003','F004','F005','F006','F019'] for k in PROMOTED if k.startswith('P7-')}
criterion_refs.update({'P8-06':['F007','F008','F003'],'Y5-05':['F010','F011'],'Y5-06':['F010','F011'],'Y5-08':['F010','F011'],'N8-06':['F012','F013'],'N8-07':['F012','F014'],'N7-07':['F015','F016','F022','F023','F003','F024']})
reasons={
 'P7-01':'실제 공개 최소모형·Tate·good/bad factor·root number와 normalization ledger, 실행·fresh replay 및 원본 선택/내보내기를 확인했다.',
 'P7-02':'실제 complex continuation의 ball·명시적 급수/무한 tail과 strict finite Euler domain 거부를 API/UI에서 확인했다.',
 'P7-03':'유한 높이 T20/T30의 strip count·Hardy 고립·endpoint와 RH_VERIFIED_TO_T 범위가 공개 실행·표시·내보내기에 보존됐다.',
 'P7-04':'half-integer x=10.5의 prime side, smoothed 규약·상수·tail과 coarse band, 별도 unsmoothed 진단을 확인했다.',
 'P7-05':'사용자 operator/domain/assumption 등록, 유한 비교와 반례, 입력 보존/replay 및 global/RH 미승격을 확인했다.',
 'P7-06':'central parity/derivative와 독립 modular-symbol 두 경로를 실행·표시했다. 37a1 symbol zero 단독의 rank≥1과 별도 derivative의 rank1을 구분했다.',
 'P7-07':'실제 descent lower/upper·산술 rank, height/saturation/period/Sha 상태와 외부 의존성을 공개 실행·replay·원본 선택에서 확인했다.',
 'P7-08':'네 result type, 누락 inventory와 finite-field→RH 거부, universal RESEARCH_OPEN 및 opaque 가정 export 범위를 확인했다.',
 'P8-06':'실제 유효 descent upper 삭제·zero-box 변조의 source-bound CI /2와 네 browser mutation, 후속 badge 취소, 공개 replay/import·변조 거부를 확인했다.',
 'Y5-05':'공개 저장 study의 β/a/L/T·독립 t₀·target/측정값/오차와 원래 실패/동일-prefix 연장·새 chain 구별을 확인했다.',
 'Y5-06':'negative C·불가능 acosh·fit 실패, bounded vacuum 차분·finite-T/cosh 조건 및 올바른 gap 부등식이 공개 관측/선택에서 보존됐다.',
 'Y5-08':'실제 C00/독립 scale/a²/L/T 다섯 패널, 오차·matching·fit 가정·ESS 및 null/continuum 한계를 확인했다.',
 'N8-06':'고정 물리/정규화 좌표, streamline/pathline, 속도/각속도와 core/global controls를 조작하고 실제 위치·단위·색·vector scale과 replay 결속을 확인했다.',
 'N8-07':'관측별 원문/정의·numerical test·analytic/Lean 부재 표기와 source archive의 recorded-only scope, 권위 변조 거부를 확인했다.',
}
for criterion_id in PROMOTED:
 row=rows[criterion_id][1]
 row.update(status='COMPLETE_WITHIN_STATED_SCOPE' if criterion_id.startswith('Y') else 'PASS',originalCriterionComplete=True,assessedAt=NOW)
 if 'remaining' in row: row['remaining']=[]
 if 'remainingObligations' in row: row['remainingObligations']=[]
 row['evidence']=list(dict.fromkeys([*row['evidence'],*(evidence[k]['path'] for k in criterion_refs[criterion_id])]))
 row['currentReleaseAcceptance']={'assessedAt':NOW,'scope':'Original finite/tool acceptance criterion only; mathematical conjecture and whole-M3 flags are unchanged.','reason':reasons[criterion_id],'evidence':[evidence[k] for k in criterion_refs[criterion_id]],'acceptedBy':'Root after independently verified actual CI/API/public UI receipts','historicalEvidenceUnchanged':True}
 if criterion_id.startswith('P7-'): row['implementationStatus']='IMPLEMENTED_AND_VERIFIED_IN_CURRENT_CI_API_AND_PUBLIC_UI'
 if criterion_id.startswith('Y'):
  row['implementationAssessment']['publishedAcceptanceVerified']=True
  row['implementationAssessment']['publicAcceptanceEvidence']=[evidence[k] for k in criterion_refs[criterion_id]]

p=new['P7_PROGRESS.json'];p.update(status='COMPLETE_WITHIN_STATED_SCOPE',assessedAt=NOW,P7AllCriteriaComplete=True,originalCriterionCompletionCount=8,nextWork='Continue the 19 remaining original N6/N7/N8 criteria. Preserve finite P7 acceptance limits, universal RH/BSD OPEN status and independent Sha/semantic-formalization obligations.')
p['currentEvidence']['currentPublicQA']={'productionAPI':evidence['F001'],'independentSemanticComparison':evidence['F002'],'currentUI01Through07':evidence['F005'],'v96AllEightCanvasAndCurrentTypedUI':evidence['F006'],'scope':'25 actual production runs plus25 separate fresh replays; current v95 numerical UI and v96 rendering/typed controls are distinct observations.'}
p['currentEvidence']['currentCI']={'receipt':evidence['F003'],'rawP7Job':evidence['F004'],'branchHeadSHA':ci['branchHeadSHA'],'actualCheckoutSHA':ci['actualPullRequestCheckoutSHA'],'checkoutTreeMatchesBranchHead':True,'APICommandPassed':161,'M3PythonCommandPassed':233,'P7JavaScriptCommandPassed':138,'countsAreSeparateObservedCommandsNotAddedAcrossRuns':True}
p['currentEvidence']['modularSymbols']['publicQA']=True
p['currentEvidence']['modularSymbols']['publicQAReceipt']=[evidence['F005'],evidence['F006']]
p['currentVisualizationAcceptance']={'receipt':evidence['F006'],'version':96,'versionHash':'088fc772','allEightTabsObserved':True,'backend':'CANVAS2D_ORTHOGRAPHIC_PROJECTION','webGLExecuted':False,'mathematicalSourceUnchanged':True}
p['currentOriginalCriteriaAssessment']={'complete':8,'total':8,'universalRHProved':False,'universalBSDProved':False,'newArithmeticLeanTheoremsProved':False,'newSemanticLeanTranslationPerformed':False}

p=new['P8_PROGRESS.json'];p.update(status='COMPLETE_WITHIN_STATED_SCOPE',wholeP8Complete=True,assessedAt=NOW,counts={'PASS':8,'PARTIAL':0},policy='Original blueprint criteria are unchanged. Expanded scope includes P7 and all64 M3 criteria. Current valid arithmetic-rank certificate mutation, source-bound successful CI packaging and actual public downstream badge/replay/import checks are accepted. Historical attempts remain immutable; recorded browser verification is not a fresh P7 process or a whole-application graph audit.')
rows['P8-06'][1]['acceptanceScope']='Bad-prime, Frobenius, truncation and comparison mutations execute in the current browser. The separate source-bound /2 CI receipt contains actual fresh P7 child runs deleting a valid arithmetic descent upper certificate and corrupting a zero box. Successful CI artifact bytes/current source hashes and public downstream badge revocation, replay/import and forged-import rejection are verified. The /1 audit, failed first /2 CI and the packaging-time publishedResultVerified=false remain historical; currentReleaseAcceptance supplies the later positive public gate. Browser replay does not claim fresh P7 execution or a whole-application claim graph.'
rows['P8-06'][1]['currentPublicMutationAcceptance']={'receipt':evidence['F007'],'browserCases':4,'recordedCICases':2,'actualP7FreshBrowserExecution':False,'wholeApplicationGraphAudited':False,'publishedResultVerified':True}

p=new['GAUGE_PROGRESS.json'];p.update(revision='m3-gauge-original24-public-accepted-20261012',originalCriteriaComplete=24,originalCriteriaIncomplete=0,allOriginalCriteriaComplete=True,releaseMeaning='All24 original finite/tool criteria have accepted actual source-bound implementation and public UI observations. Full-Haar finite SU2 and statistical assumptions remain explicit; continuum Yang-Mills and a uniform positive continuum gap remain OPEN.')
p['currentPublicAcceptance']={'assessedAt':NOW,'promotedOriginalIDs':['Y5-05','Y5-06','Y5-08'],'evidence':[evidence['F010'],evidence['F011']],'continuumClaim':'OPEN_CONTINUUM','clayProblemSolved':False}

p=new['N8_PROGRESS.json'];p.update(completedOriginalCriteria=5,assessmentRevision='m3-navier-five-original-n8-criteria-public-accepted-20261012')
rows['N8-06'][1]['acceptanceScope']='Actual finite-run observations preserve81 sample positions/vectors, fixed physical bounds, separately declared normalized periodic coordinates, fixed vector scale and common color bounds. Published v93 controls and exact selections verified instantaneous streamlines/coefficient-history particle paths, velocity/axis-dependent angular velocity (undefined on axis), and whole-box Parseval/fixed-core midpoint energy. Input/source/result and archive replay remain bound. This is the finite flow/display criterion; no original near-terminal field or complete source reconstruction is inferred. The earlier v85 liveVerification remains a historical receipt.'
for criterion_id in ['N8-06','N8-07']:
 rows[criterion_id][1]['currentLiveVerification']={'evidence':[evidence[k] for k in criterion_refs[criterion_id]],'observedVersion':93,'originalCriterionPromoted':True,'sourceReconstructionComplete':False,'analyticOrLeanProofIssued':False}

n7=rows['N7-07'][1];n7.update(status='PARTIAL',originalCriterionComplete=False,assessedAt=NOW,assessedBy='Actual source constructor, independent Fraction check, CI artifact and public v97 scope review')
n7['evidence']=list(dict.fromkeys([*n7['evidence'],'navier/source-inner-growth.mjs','navier/source-inner-growth-evidence.mjs','web/navier-inner-growth-view.mjs',*(evidence[k]['path'] for k in criterion_refs['N7-07'])]))
n7['acceptanceScope']='The actual original M2 background inner path was reconstructed: same common source family, a fresh exact Phi(2,0)>1/2 enclosure, e0>1/(CSelected*sqrt(Lambda))>0 and an explicit all-order C*tau^(2h) remainder with positive domain/scale retained as exact expressions. Local and actual CI constructor artifacts are byte-identical. Public v97 verifies five exact outward normalized intervals, source selection, full28966-node scalar DAG export and archive replay. Identification with the final localized field remains CONDITIONAL_ON_EXTERNAL_SOURCE_THEOREM_IDENTIFICATION (Propositions9.9/10.1). The original certificate originalN7CriterionComplete=false and whole final N6 construction=false are preserved; UI success alone does not complete this original criterion.'
n7['remaining']=['Construct/apply the complete original final N6 instance and its same-source annular-support/domain identity at the Xin path; do not replace this with arbitrary sampled data.','Discharge the explicit Proposition9.9/10.1 final-localized-field identification bridge before promoting the original N7-07 criterion or an unconditional final-field growth certificate.']
n7['remainingObligations']=list(n7['remaining'])
n7['currentSourceAndPublicEvidence']={'sourceReceipt':evidence['F016'],'sourceArtifact':evidence['F022'],'latestCI':evidence['F003'],'publicUI':evidence['F015'],'fullScalarDAGExport':evidence['F023'],'sourceAndCIArtifactByteExact':True,'originalBackgroundPathExecuted':True,'strictPositiveLeadingLowerBoundVerified':True,'explicitAllOrderRemainderConstructed':True,'publicExactDepths':[0,2,4,8,12],'scalarProgramNodes':28966,'scalarProgramSHA256':'907acb6f5a875a473efc28efeb2537409928188a5be1098bda4cbb9ded75afb1','freshSourceConstructorExecutedInBrowser':False,'newLeanExecuted':False,'originalSourceCriterionComplete':False,'completeFinalN6Constructed':False,'externalFinalFieldDependencies':['Proposition9.9','Proposition10.1']}
new['N7_PROGRESS.json']['assessmentRevision']='m3-navier-original-inner-path-evidence-public-verified-final-field-bridge-partial-20261012'

# All untouched original rows and every existing mathematical limitation are immutable.
FIELDS=['id','title','text','page','source','sourceSha256']
for key,(name,row) in rows.items():
 original=row_before[key][1]
 assert {f:row.get(f) for f in FIELDS}=={f:original.get(f) for f in FIELDS},key
 if key not in PROMOTED and key!='N7-07': assert row==original,key
 for f in ['researchLimitations','scopeLimits','continuumClaim','clayProblemSolved']:
  if f in original: assert row[f]==original[f],(key,f)
assert new['N6_PROGRESS.json']==old['N6_PROGRESS.json']
for f in ['previousAssessment','previousAssessments','publicRuntime','executedRelease','continuationEvidence','browserP7Visualization']:
 assert new['P7_PROGRESS.json'][f]==old['P7_PROGRESS.json'][f],f
assert new['P8_PROGRESS.json']['previousAssessments']==old['P8_PROGRESS.json']['previousAssessments']
assert rows['P8-06'][1]['currentRecordedArithmeticMutationEvidence']==row_before['P8-06'][1]['currentRecordedArithmeticMutationEvidence']
assert rows['N8-06'][1]['liveVerification']==row_before['N8-06'][1]['liveVerification']
assert sum(row['originalCriterionComplete'] for _,row in rows.values())==45
assert all(new['P7_PROGRESS.json'][f] is False for f in ['M3AllCriteriaComplete','universalRHProved','universalBSDProved','newArithmeticLeanTheoremsProved','original64PASSPromotedToFullM3Proof'])

history={'schema':'MathScope.M3.Original64HistoricalAssessmentSnapshot/1','recordedAt':NOW,'status':'IMMUTABLE_PRE_PUBLIC_ACCEPTANCE_SNAPSHOT','counts':{'originalCriteria':64,'complete':31,'finalVerificationPending':14,'substantiveRemaining':19},'firstReportSourceBaseline':{'localCommit':'a12d95b9b466aab187d6afcca089b0ac7685dc27','sameTreeRemoteCommit':'759d1a0b35a6e1952663ee6486e8de534d7fcb66','tree':'e7a264058128f1ac3ad294220de230dc6478786d'},'scope':'The report preserves its historical184-evidence immutable snapshot. The six copied progress files are the exact immediately pre-promotion bytes; later P8 CI packaging metadata is not falsely attributed to the first report baseline.','files':[pin(M3/n,b) for n,b in before.items()],'untouchedOriginals':[pin(M3/n) for n in IMMUTABLE]}
history_bytes=encoded(history);evidence['F020']=pin(HISTORY/'manifest.json',history_bytes)
progress_bytes={n:(before[n] if n=='N6_PROGRESS.json' else encoded(p)) for n,p in new.items()}
decision={'schema':'MathScope.M3.Original64PublicAcceptanceUpdate/1','recordedAt':NOW,'status':'PASS','history':evidence['F020'],'approvedPromotions':PROMOTED,'changedButNotPromoted':['N7-07'],'before':{'complete':31,'finalVerificationPending':14,'substantiveRemaining':19},'after':{'complete':45,'finalVerificationPending':0,'substantiveRemaining':19,'originalCriteria':64},'criterionChanges':[{'id':k,'beforeStatus':row_before[k][1]['status'],'afterStatus':rows[k][1]['status'],'beforeOriginalCriterionComplete':row_before[k][1]['originalCriterionComplete'],'afterOriginalCriterionComplete':rows[k][1]['originalCriterionComplete'],'reason':reasons.get(k,'Positive original background path/error/CI/UI evidence is accepted, but the original final-field identification remains conditional; no completion promotion.'),'evidence':[evidence[f] for f in criterion_refs[k]]} for k in [*PROMOTED,'N7-07']],'currentProgress':[pin(M3/n,b) for n,b in progress_bytes.items()],'invariants':{'original64IDTitleTextPageSourceExactUnchanged':True,'nonWhitelistedRowsUnchangedExceptN707Evidence':True,'old56ReportByteExact':True,'historical184EvidenceLedgerRetained':True,'allHistoricalP7PublicRuntimeAndPreviousAssessmentsRetained':True,'researchLimitationsRetained':True,'N6ProgressUnchanged':True,'N707OriginalCriterionComplete':False,'universalRHProved':False,'universalBSDProved':False,'wholeM3Complete':False},'releaseScopes':{'latestCI':evidence['F003'],'latestP7RawJob':evidence['F004'],'latestCIBranchHead':ci['branchHeadSHA'],'actualPRCheckout':ci['actualPullRequestCheckoutSHA'],'checkoutTreeEqualsBranch':True,'productionMainCommit':'3eb8427c6031dddded7d6d1b6527221cdb292017','production25RunsAnd25FreshReplays':evidence['F001'],'productionResultComparison':{'entireResultExact':16,'buildMetadataAndVerifiedDerivedHashesOnly':9,'unexplainedDifferences':0},'v96P7CurrentTypedAndEightCanvasPanels':evidence['F006'],'v97N7ArchiveUINotFinalFieldProof':evidence['F015']},'newMathematicalCalculationsByThisMetadataUpdate':False,'newBrowserOrCIExecutionsByThisMetadataUpdate':False}
decision_bytes=encoded(decision);evidence['F021']=pin(OUT/'receipt.json',decision_bytes)

report=before['M3_ALL64_REVIEW_KO.md'].decode()
original_fences=re.findall(r'```text\n(.*?)\n```',report,re.S)
assert len(original_fences)==64
sections={n:report.split(f'## {n}. ',1)[1].split(f'## {n+1}. ',1)[0] for n in range(1,8)}
sections={n:f'## {n}. '+text for n,text in sections.items()}
section2=sections[2].replace('### 2.1 진행표 snapshot SHA','### 2.1 최초 31/14/19 보고서의 역사적 진행표 snapshot SHA',1)
section2=replace_once(section2,'SHA는 파일의 동일성을 확인한다.','위 표는 최초 보고서 baseline의 역사적 SHA이며 현재 진행표 bytes로 덮어쓰지 않았다. 승격 직전 보고서와 여섯 진행표 전체는 '+link('F020')+'에 별도로 보존했다.\n\nSHA는 파일의 동일성을 확인한다.')
section2+='### 2.2 현재 승인 후 진행표 SHA\n\n| 파일 | 현재 SHA-256 | true / 전체 |\n|---|---|---:|\n'
for name,data in new.items():
 section2+=f'| [{name}]({name}) | `{sha(progress_bytes[name])}` | {sum(r["originalCriterionComplete"] for r in data["criteria"])} / {len(data["criteria"])} |\n'
section2+='\n이 현재 표는 아래 승인14개 갱신을 반영한다. N6 파일은 이전 bytes 그대로이고 N7-07의 완료 bool은 false다.\n\n'

section3=sections[3]
section3=replace_once(section3,'CI artifact를 아직 수용하지 않았으므로 이 행은 false다.','후속 성공 CI529의 실제 artifact를 byte 검증했고 공개 v95에서 실패 단계·후속 badge 취소·replay/import를 확인하여 이제 이 행을 완료로 수용한다. 네 browser 사례와 두 recorded CI 사례를 구분하며 브라우저에서 새 P7 child를 실행했다고 하지 않는다. '+link('F008')+', '+link('F007'))
section3=replace_once(section3,'공개 UI 통과를 최종 수용할 때 source/result hash·패널 선택·warning 표시·export/fresh replay를 함께 확인해야 한다.','공개 v93에서 source/result hash·다섯 패널 선택·warning·archive replay를 확인하여 Y5-05/06/08의 마지막 표시 관문을 수용했다. 저장 chain 검증을 새 생산 chain으로 기록하지 않는다. '+link('F010')+', '+link('F011'))
section3=replace_once(section3,'새 원래 source 실행은 7개 heavy test를 실제 수행했고 모두 통과했다.','최초 보고서 baseline의 원래 source 실행은 7개 heavy test를 실제 수행했고 모두 통과했다.')
section3=replace_once(section3,'별도 periodic Galerkin branch의 Fourier, dealiasing, 시간 적분은 원문 N8-01/02/03의 수치 기준을 충족한 범위로 유지한다.','별도 periodic Galerkin branch의 Fourier, dealiasing, 시간 적분은 원문 N8-01/02/03의 수치 기준을 충족한 범위로 유지한다. v93의 실제 control/선택/출처/replay 관찰로 N8-06/07도 해당 유한 표시·claim 연결 범위에서 수용했다. '+link('F012')+', '+link('F013')+', '+link('F014'))
section3+=f'''### 3.5 수용한 현재 CI·공개 API·공개 UI

최신 실제 CI는 branch `{ci['branchHeadSHA']}`의 **5 workflow /7 job SUCCESS**다. GitHub 실제 PR checkout은 `{ci['actualPullRequestCheckoutSHA']}`이며 checkout tree가 branch tree와 정확히 같다. P7 raw log의 서로 다른 명령은 API161, M3 Python233, P7 JavaScript138 PASS다. 이전529의 JavaScript117, 이전 Y7 실행 또는 local 단위검사를 여기에 더하지 않는다. 변경되지 않은 Y7은 이번 c971에서 새 workflow를 실행하지 않았다. {link('F003')}, {link('F004')}

Render main `3eb8427c6031dddded7d6d1b6527221cdb292017`에서13 kinds의 실제25회 실행과25회 별도 fresh replay를 확인했다. Local/production 결과16개는 전체 수학 JSON이 정확히 같고, 나머지9개는 공식 PARI 빌드 metadata 및 검산된 파생 digest 차이만 남았다.92개 leaf 차이는56개 metadata·24개 재계산 hash·12개 실제 SHA 참조이며 설명되지 않은 수학값 차이는0이다.9개를 raw math hash 자체가 같다고 부르지 않는다. {link('F001')}, {link('F002')}

P7-01…07의 현재 수치 UI는 v95 기록이고, v96은8개 탭의 실제 Canvas2D 투영·선택·camera·route 복원과 현재 typed 결과/거부·비동기 시작·busy/수정입력 guard를 관찰했다.18개 UI 확인이 통과했다. WebGL이 비활성인 환경에서 실제 Canvas2D가 그렸으며 GPU를 실행했다고 하지 않는다. v96에서 과거 archive를 연 탭과 새 현재 실행을 각각 구분한다. {link('F005')}, {link('F006')}, {link('F018')}

### 3.6 N7-07: 실제 양의 하한·전체 꼬리의 진전과 남은 최종 장 의무

동일 원문 공통 family와 실제 M2 내부 장에서 Φ(2,0)>1/2의 새 정확 구간을 계산하여 e₀>1/(CSelected√Λ)>0를 얻었다. 명시적 Cτ^(2h) remainder와 양의 τ/domain을 정확 수식으로 유지하고, d=0,2,4,8,12에서 정규화 오차 반경1/2^(d+2)의 다섯 outward 구간을 내보냈다. 거대한 상수나 양의 τ를 binary64의0으로 바꾸지 않는다. 전체 scalar 수식 DAG28,966 nodes/54 roots가 공개 export에도 그대로 있다. {link('F016')}, {link('F022')}, {link('F023')}

실제 c971 CI의 원문 생성자8검사와 독립 Fraction9검사가 통과했고,150.539초·관찰 peak RSS4,441,763,840B·97개 source 불변이 기록됐다. CI의3,436,293B 수학 artifact는 local attempt2의 SHA `7a72e1ca1293ba2542ed4ed2612ad67b95df7cb31eb49cf91be004f6ae16a5fe`와 byte 동일하다. 공개 v97에서는5구간/표, native·keyboard 선택, 출처, 전체 export와 archive replay13개 확인을 통과했다. Browser replay는 이 저장 자료를 검증하며 장시간 생성자를 다시 실행하지 않는다. {link('F003')}, {link('F024')}, {link('F015')}, {link('F017')}

**N7-07은 PARTIAL/false를 유지한다.** 실제 최종 localized field와의 동일시는 원문 Proposition9.9/10.1에 조건부이고, 원본 생성자는 `originalN7CriterionComplete=false`, `originalCompleteN6FieldConstructed=false`를 남긴다. 현재 positive-bound·remainder·표시 성공을 최종 u의 무조건적 성장 증명으로 승격하지 않았다. 당초 UI 성공 뒤46개를 예상했던 작업 계획은 이 실제 scope 점검으로 정정했으며 현재 정확한 집계는45개다.

'''

section4='## 4. 실제 최종 검증을 수용한14개 원문 기준\n\n승인된 정확한14개 ID만 false→true로 바꾸었다. 각 행의 수학 domain·가정·오차·연구 한계는 유지했으며, N7-07은 이 목록에 포함하지 않는다. 전체 변경과 전후SHA는 '+link('F021')+'에 기록한다.\n\n| ID | 현재 status / bool | 수용한 실제 관문 | 근거 |\n|---|---|---|---|\n'
for key in PROMOTED:
 section4+=f'| {key} | `{rows[key][1]["status"]}` / `true` | {reasons[key]} | '+', '.join(link(k) for k in criterion_refs[key])+ ' |\n'
section4+='''
### 4.1 실행 위치와 증거의 적용 범위

Hosted P7의 새 Python/GP 실행, browser Worker의 유한 mutation, 저장된 CI kernel/mutation 소비와 대규모 numerical archive 열람을 서로 구분한다. Source SHA 일치는 해당 원본 기록의 적용 가능성을 확인하며 새 kernel 증명을 발행하지 않는다. 실패한 초기 CI와 실제 publisher transport/다운로드 실패 기록도 그대로 남는다. 공개 JSON export·copy/import 성공은 브라우저 다운로드 서비스의 완료를 뜻하지 않는다.

현재 마지막 공개 관문만 기다리는 원문 행은0개다. 남은19개는 각각의 실제 source 구성·계산·증명/오차 의무를 계속 수행해야 한다.

'''
section5=sections[5]
section5=replace_once(section5,'새 UI·CI가 14개 대기 관문을 통과해도 이 19개는 자동으로 완료되지 않는다.','승인14개가 실제 UI·CI 관문을 통과했어도 이19개는 자동으로 완료되지 않는다.')
section5=replace_once(section5,'N6 8개와 N7 8개는 원래 논문 구성의 현재 source를 끝까지 조립·계산·검증하는 연쇄 의무가 남는다.','N6 8개와 N7 8개는 원래 논문 구성의 현재 source를 끝까지 조립·계산·검증하는 연쇄 의무가 남는다. N7-07은 실제 원문 내부 장의 양의 하한·명시적 꼬리·성장 implication·공개 UI/replay 근거가 보강됐지만 최종 localized field 동일시가 아직 조건부다.')
section5+='새 N6 global source와 별도 N7 localization 작업은 이 승인된45개 판정에 합산하지 않았다. 이 후속 작업은 별도의 실제 생성자·정리 적용·오차·public gate 근거가 완성될 때 다시 원문과 대조한다.\n\n'

section6=sections[6]
for package,count in {'P7':8,'P8':8,'Y5':8,'Y6':8,'Y7':8,'N6':0,'N7':0,'N8':5}.items():
 section6,n=re.subn(rf'^### {package} — \d+/8 완료$',f'### {package} — {count}/8 완료',section6,flags=re.M);assert n==1
for key in [*PROMOTED,'N7-07']:
 match=re.search(r'^#### '+key+r' — .*?(?=^#### |^### |^## |\Z)',section6,re.M|re.S);assert match
 block=match.group(0); row=rows[key][1]
 label='원문 기준 완료' if row['originalCriterionComplete'] else '실질 잔여 · 실제 내부 경로 근거 보강'
 block,n=re.subn(r'^\*\*판정:\*\* .*$',f'**판정:** {label} · `status={row["status"]}` · `originalCriterionComplete={str(row["originalCriterionComplete"]).lower()}` · 진행표 [{rows[key][0]}]({rows[key][0]}).',block,flags=re.M);assert n==1
 block,n=re.subn(r'^(\*\*연결 증거:\*\* .*)$',lambda m:m.group(1)+' 현재 수용: '+', '.join(link(k) for k in criterion_refs[key])+'.',block,flags=re.M);assert n==1
 if key in PROMOTED:
  block,n=re.subn(r'^\*\*남은 원문 합격 관문:\*\* .*$', '**남은 원문 합격 관문:** 명시된 원문 도구·유한 적용 범위의 추가 관문은 없다. 아래 연구 한계와 외부 수학 의존성은 그대로 유지한다.',block,flags=re.M);assert n==1
  block,n=re.subn(r'^(\*\*현재 구현·증거의 범위:\*\* .*)$',lambda m:m.group(1)+' '+reasons[key],block,flags=re.M);assert n==1
  block=block.replace('이전 /1 receipt는 역사 기록으로 남고, 새 CI artifact 포장과 공개 검증은 대기 중이다.','이전 /1 receipt와 실패한 첫 /2 CI는 역사 기록으로 남는다. 이후 성공 CI artifact /2 포장과 현재 공개 검증을 수용했다.')
  block=block.replace('새 공개 control 검증은 대기 중이다.','새 공개 control 검증도 수용했다.').replace('새 공개 연결을 확인해야 한다.','새 공개 연결을 확인했다.')
 else:
  block,n=re.subn(r'^\*\*현재 구현·증거의 범위:\*\* .*$', '**현재 구현·증거의 범위:** 동일 원문 공통 family와 M2 내부 장에서 fresh exact Φ(2,0)>1/2를 계산하고 e₀>1/(CSelected√Λ)>0 및 명시적 전체 Cτ^(2h) 꼬리를 구성했다. 양의 τ·거대 상수·관측 경로는 정확 scalar DAG로 보존한다. local/CI artifact의 byte 동일성과 공개5 outward 구간·원본 선택·28,966-node 전체 scalar DAG export·archive replay가 확인됐다. 최종 localized field와의 동일시는 외부 Proposition9.9/10.1 조건부이고 원본 생성자의 originalN7CriterionComplete=false는 유지한다.',block,flags=re.M);assert n==1
  block,n=re.subn(r'^\*\*남은 구성·계산:\*\* .*$', '**남은 구성·계산:** 같은 원문 complete final N6 instance와 annular support/domain을 실제 Xin 경로에 적용하여 현재 M2 내부 장과 원문 최종 u의 동일시를 완성한다.',block,flags=re.M);assert n==1
  block,n=re.subn(r'^\*\*남은 증명·오차 검증:\*\* .*$', '**남은 증명·오차 검증:** 실제 양의 e₀ 하한·명시적 all-order remainder는 얻었다. 최종 장에 이를 적용하는 Proposition9.9/10.1의 명시적 bridge 의무를 해소하기 전에는 원문 N7-07이나 무조건적 최종-field 성장 certificate를 완료로 판정하지 않는다.',block,flags=re.M);assert n==1
 section6=section6[:match.start()]+block+section6[match.end():]

section7=sections[7]
historical_ledger=re.findall(r'^\| E\d{3} \|.*$',section7,re.M);assert len(historical_ledger)==184
section7+='### 7.2 현재 최종 검증 수용의 추가 증거 원장\n\n위 E001–E184는 최초 immutable snapshot의 역사 기록이며 그대로 보존했다. 아래 F번호는 이후 실제 CI/API/UI 및 이번 판정의 byte pin이다. 서로 다른 run/checkout/실행 위치의 검사 수를 합산하지 않는다.\n\n| ID | 실제 파일 | bytes | SHA-256 |\n|---|---|---:|---|\n'
for key,item in sorted(evidence.items()):
 section7+=f'| {key} | [{item["path"]}]({item["path"]}) | {item["bytes"]} | `{item["sha256"]}` |\n'
section7+='\nF023은 원본 WebMCP export JSON4,893,994B의 lossless gzip이다. 원본 SHA `8591b0ef11439187b996251ad02d20119294bb5d50e820175dcde294b5709159`와 gzip SHA를 별도로 보존했다. 공개 DOM은 표시 요약이고 전체 scalar 수식 DAG는 이 export에 있다.\n\n'

section1='''## 1. 판정 규칙과 집계

완료 수는 각 진행표의 `originalCriterionComplete === true`만 센다. Status 문자열, 실행 완료, 테스트 개수, SHA 일치, 유한/조건부 정리의 성공을 원문 기준 완료와 같은 값으로 취급하지 않는다. 승인된14개가 실제 최종 gate를 통과했으며 나머지19개는 구성·계산·증명/오차 의무가 남아 있다.

| 묶음 | 원문 수 | 완료 | 최종 검증 대기 | 실질 잔여 | 진행표 |
|---|---:|---:|---:|---:|---|
'''
for group,count,file in [('P7',8,'P7_PROGRESS.json'),('P8',8,'P8_PROGRESS.json'),('Y5',8,'GAUGE_PROGRESS.json'),('Y6',8,'GAUGE_PROGRESS.json'),('Y7',8,'GAUGE_PROGRESS.json'),('N6',0,'N6_PROGRESS.json'),('N7',0,'N7_PROGRESS.json'),('N8',5,'N8_PROGRESS.json')]:
 section1+=f'| {group} | 8 | {count} | 0 | {8-count} | [{file}]({file}) |\n'
section1+='| **전체** | **64** | **45** | **0** | **19** | 8개 묶음 |\n\n완료된 P7/Y7의 타입·열린 의무·성급한 권위 거부는 해당 도구 요구를 충족한 것이다. 반면 원래 특정 장의 연결을 요구하는 N6/N7은 유한 예제나 외부 가정 표기만으로 완료하지 않았다. N7-07의 실제 positive-bound·tail·public gate 성공도 최종-field bridge를 없애지 않으므로 false다.\n\n'
intro=f'''# MathScope M3 전체64개 원문 기준 누적 검토

**현재 판정은 원문 기준 완료45개, 마지막 공개 검증만 기다리는 항목0개, 실질 잔여19개다.** P7을 포함한64개가 대상이며 실제 CI·공개 API·화면의 근거로 승인된14개만 새로 완료로 올렸다. 전체64개 완료나 universal RH/BSD·continuum Yang–Mills·원래 전체 Navier 장의 증명을 주장하지 않는다.

갱신 시각: `{NOW}`. 이번 변경은 실제 수용한 관문과 진행표 상태를 동기화하는 문서/metadata 변경이다. 수학 소스·옛 실행 기록을 다시 쓰거나 새 수학 계산을 실행하지 않았다. 승인 전31/14/19 보고서와 여섯 진행표의 완전한 bytes는 {link('F020')}에 보존했다. 정확한14개 변경과 N7-07 비승격 사유는 {link('F021')}에 있다.

최초 검토 baseline은 local `a12d95b9b466aab187d6afcca089b0ac7685dc27`과 같은 tree의 remote `759d1a0b35a6e1952663ee6486e8de534d7fcb66`이다(tree `e7a264058128f1ac3ad294220de230dc6478786d`). §2.1과 E001–E184는 이 역사적 snapshot을 유지한다. 최신 CI branch는 `{ci['branchHeadSHA']}`, 실제 PR checkout은 `{ci['actualPullRequestCheckoutSHA']}`다. 현재 보고서가 과거 CI commit에 포함되어 있었다고 표시하지 않는다.

'''
section8=f'''## 8. 남은 원문19개를 계속 처리하는 기준

목표는 여전히 전체64개다. 이번45개 수용은 작업 중단 기준이 아니다. N6 8개·N7 8개·N8-04/05/08의 구체 구성과 증명/오차 의무를 별도 source-bound 실행으로 계속 처리한다.

1. 현재 실제 source·입력·정확 domain·가정·오차·원래 수식과의 연결을 먼저 고정한다. 새 N6 global source와 N7 localization 작업은 기존 완료 count에 자동 합산하지 않는다.
2. 해당 생성자와 독립 검증을 실제 실행하고 command·exit·source/artifact SHA·실패와 자원 예산을 보존한다. 임의 유한 관찰만으로 전체 원문 항등식이나 모든 차수/무한 tail 의무를 대체하지 않는다.
3. 실제 UI나 archive의 성공뿐 아니라 원문이 요구한 최종 대상의 연결까지 대조한다. 이번 N7-07처럼 생성자 criterion=false와 외부 최종-field bridge가 남으면 보강된PARTIAL로 기록한다.
4. 만족된 ID만 새로 승인하고 이전 보고서·진행표·실패 receipt를 보존한다. 원문64개와 기존56개 보고서를 고치지 않는다. 완료 count와 연구 난제·형식증명 flags는 따로 유지한다.

### 8.1 개정 기록

| 개정 | 기준 source/검증 epoch | 완료 / 대기 / 실질 잔여 | 수용 내용 |
|---|---|---|---|
| ALL64 검토1 | `a12d95b9b466aab187d6afcca089b0ac7685dc27` | **31 /14 /19** | 새 CI/API/UI 승격 없음. 전체 원문·184개 evidence를 동결. {link('F020')} |
| ALL64 공개 gate 수용2 | 실제 CI c971·Render main3eb·public v93/v95/v96/v97 | **45 /0 /19** | 승인14개만 true. N7-07 positive-bound·tail·UI/replay는 확인했지만 최종 장 bridge가 남아PARTIAL/false. {link('F021')} |

### 8.2 반드시 분리해서 유지할 현재 의미

| 질문 | 현재 답 |
|---|---|
| 원문 M3 64개가 모두 완료되었는가? | **아니다.45개 완료,19개 false다.** |
| 예전 최종 검증 대기14개는 어떻게 되었는가? | 각각의 실제 CI/API/UI 관문과 적용 scope를 확인해 수용했다. |
| N7-07의 실제 도표가 성공했는데 왜 완료가 아닌가? | 원문 내부 장의 양의 하한과 explicit remainder는 있지만 최종 localized field 동일시는 Proposition9.9/10.1 조건부다. 원본 criterion=false를 존중한다. |
| 남은19개는 모두 단순 UI 작업인가? | 아니다. 실제 source 구성·계산과 전역 증명/오차·최종 대상 연결 의무가 남는다. |
| universal RH/BSD, continuum YM 및 uniform positive gap을 증명했는가? | **아니다.** 유한·조건부·연구 타입과 OPEN 의무를 보존한다. |
| 원래 Navier 전체 장과 무조건적 최종-field blowup를 완성했는가? | **아니다.** 현재 source 진전과 exact original background 경로를 최종 완성으로 승격하지 않는다. |
| 수치 archive 화면·replay는 새 chain/장시간 생성자 실행인가? | 아니다. 해당 source/data를 검증한 저장 자료의 소비다. 실제 CI 생성자 실행과 별도로 기록한다. |
| source SHA 일치나 opaque Lean 가정 export가 새 의미 정리인가? | 아니다. source·가정·model/cutoff와 실제 kernel 범위를 따로 유지한다. |

'''
report_new=intro+section1+section2+section3+section4+section5+section6+section7+section8
assert re.findall(r'```text\n(.*?)\n```',report_new,re.S)==original_fences
assert re.findall(r'^\| E\d{3} \|.*$',report_new,re.M)==historical_ledger
assert len(re.findall(r'^#### [PNY]\d-\d{2} — ',report_new,re.M))==64
assert len(re.findall(r'^\*\*판정:\*\* .*`originalCriterionComplete=true`',report_new,re.M))==45
assert len(re.findall(r'^\*\*판정:\*\* .*`originalCriterionComplete=false`',report_new,re.M))==19

if '--apply' not in sys.argv:
 print(json.dumps({'prepared':True,'promotions':PROMOTED,'N707':'PARTIAL/false','counts':decision['after'],'changedProgress':[n for n,b in progress_bytes.items() if b!=before[n]],'reportBytes':len(report_new.encode()),'reportSHA256':sha(report_new.encode())},ensure_ascii=False,indent=2));raise SystemExit(0)

HISTORY.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
for name,data in before.items():
 dest=HISTORY/name
 assert not dest.exists() or dest.read_bytes()==data,'Never overwrite a historical snapshot.'
 dest.write_bytes(data)
(HISTORY/'manifest.json').write_bytes(history_bytes)
(OUT/'application_recipe.py').write_bytes(Path(__file__).read_bytes())
for name,data in progress_bytes.items():
 if data!=before[name]:(M3/name).write_bytes(data)
(OUT/'receipt.json').write_bytes(decision_bytes)
(M3/'M3_ALL64_REVIEW_KO.md').write_text(report_new)
assert all((HISTORY/name).read_bytes()==data for name,data in before.items())
assert all(sha((M3/name).read_bytes())==digest for name,digest in IMMUTABLE.items())
print(json.dumps({'status':'APPLIED','promoted':PROMOTED,'counts':decision['after'],'report':pin(M3/'M3_ALL64_REVIEW_KO.md'),'decision':pin(OUT/'receipt.json'),'history':pin(HISTORY/'manifest.json'),'currentProgress':[pin(M3/n) for n in progress_bytes]},ensure_ascii=False,indent=2))
