#!/usr/bin/env python3
"""Attach terminal rc2 evidence, preserving the historical 4.34.1 receipt.

This updates provenance and explanatory ledgers only. It does not modify any
numerical algorithm, original proof source, local Lean receipt, or proof guard.
The original checklist acceptance/detail text is copied without alteration.
"""
from pathlib import Path
import hashlib, json

A=Path(__file__).resolve().parent
B=A.parent
S=A/'official-audit-summary.json'
if not S.exists():raise RuntimeError('The terminal official audit has not been collected.')
s=json.loads(S.read_text())
if not s['originalInputHashesMatch'] or not s['originalTrackedSourcesUnchanged']:
    raise RuntimeError('Original source/manifest integrity gate failed.')
read=lambda p:json.loads(p.read_text())
write=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
records=read(A/'full-pinned-command-results.json')
full=next(x for x in records if x['stage']=='lake-build-full-pinned')
ns=next((x for x in reversed(records) if x['stage']=='lake-build-ns-priority-pinned'),None)
decl=next((x for x in records if x['stage']=='ns-pinned-declarations'),None)
if decl is None or decl.get('status')!='FINISHED':raise RuntimeError('The pinned declaration audit has no terminal record.')
passed=bool(s['submittedDeclarations']['passed'] and s['nsSubmissionBuild']['passed'])
whole=bool(s['wholeDefaultBuild']['passed'])
def receipt(file,stage=None):
    value={'file':'official-validation/'+file,'sha256':digest(A/file)}
    if stage is not None:value['stage']=stage
    return value
nsCompact={k:s['nsSubmissionBuild'][k] for k in ['target','exitCode','passed','staticLocalSourceDependencyCount','reportedLakeJobs']}
nsCompact['log']=receipt(s['nsSubmissionBuild']['log'])
nsCompact['commandReceipt']=receipt('full-pinned-command-results.json','lake-build-ns-priority-pinned')
declarationCompact={k:s['submittedDeclarations'][k] for k in [
    'names','entrySourceSHA256','exitCode','kernelCommandAccepted','passed',
    'axiomClosureRecordedForBothTargets','permittedAxioms','unpermittedAxioms','axioms',
    'originalSourceFile','sourceURL','sourceSHA256','oleanSHA256','oleanSizeBytes']}
declarationCompact['exactNormalTypes']=s['submittedDeclarations']['typesAndAxiomsOutput'].split("\n'NavierStokes.Comparator.",1)[0].strip()
declarationCompact['sourceCopy']=receipt('OfficialComparatorSolution.lean')
declarationCompact['entrySource']=receipt('PinnedDeclarations.lean')
declarationCompact['log']=receipt('ns-pinned-declarations.log')
declarationCompact['commandReceipt']=receipt('full-pinned-command-results.json','ns-pinned-declarations')
comparatorCompact={k:s['comparator'][k] for k in ['status','passed','exitCode','reachedComparatorProcess','blocker','configSHA256','guardBypassUsed','alternateWeakerPathCountedAsSuccess']}
comparatorCompact['commandReceipt']=receipt('comparator-pinned-guarded.json')
comparatorCompact['log']=receipt('comparator-pinned-guarded.log')
comparatorCompact['independentEnvironment']=receipt('comparator-environment-independent.json')
remainingCompact={k:{field:value[field] for field in ['sourceModules','oleanArtifactsPresent','oleanArtifactsMissing']}
                  for k,value in s['remainingBuildScope'].items()
                  if isinstance(value,dict) and 'sourceModules' in value}
remainingCompact['grade']='POST_BUILD_ARTIFACT_INVENTORY_ONLY'
remainingCompact['receipt']=receipt('remaining-build-scope.json')
scope={
 'schemaVersion':1,'sourceCommit':s['sourceCommit'],
 'checkedAt':decl['completedUTC'],
 'scope':'The two exact C/D exported Lean declaration types at the original pinned rc2 commit. Separate from the 14:39 Lean4.34.1 component receipt, full default build, full paper-to-formal equivalence, and numerical profile certification.',
 'toolchain':s['toolchain'],'kernelCommit':s['kernelCommit'],
 'executionProfile':s['executionProfile'],
 'nsSubmissionBuild':nsCompact,
 'submittedDeclarations':declarationCompact,
 'comparator':comparatorCompact,
 'wholeDefaultBuildPassed':whole,
 'remainingBuildScope':remainingCompact,
 'pinnedEntryKernelControls':receipt('pinned-entry-kernel-controls.json'),
 'originalTrackedSourcesUnchanged':s['originalTrackedSourcesUnchanged'],
 'completeNumericalPaperProfileCertified':False,
 'browserKernelRerun':False,
 'browserSourceValidationPromotesKernelPass':False,
 'historicalComponentAuditAutomaticallyPromoted':False,
 'numericFieldInstantiatesExistentialWitness':False,
 'auditFile':'official-validation/official-audit-summary.json',
 'auditSHA256':digest(S),
 'historicalComponentAudit':{
     'file':'evidence/lean-validation.json',
     'sha256':digest(B/'evidence/lean-validation.json'),
     'checkedAt':'2026-10-09T14:39:01.694607+00:00',
     'toolchain':'Lean/mathlib4.34.1','targetCount':13,
     'unchanged':True,
 },
}
fullScope={
 'schemaVersion':2,'attempted':True,
 'performed':whole,
 'performedMeaning':'Compatibility field: the entire original defaultTargets build completed successfully with exit 0. It does not mean merely invoking the command; attempted records that separately.',
 'wholeDefaultBuildPassed':whole,
 'requiredDefaultTargets':['NavierStokes','Euler','ComparatorChallenges'],
 'exitCode':full['exitCode'],
 'startedAt':full['startedUTC'],'completedAt':full['completedUTC'],
 'terminationReason':full['terminationReason'],
 'scope':'Original default lake build using the pinned official rc2 kernel through the separately audited explicit-path shell entry.',
 'reason':'The original default invocation was recorded and then explicitly stopped to prioritize NS C/D dependencies after unrelated Euler compilation started. Its result is not counted as whole-default success.' if not whole else 'The complete original default target set passed in the recorded explicit-path profile.',
 'vanillaCLIStatus':'ENVIRONMENT_PATH_DETECTION_FAILED',
 'vanillaCLIResults':'official-validation/official-command-results.json',
 'cacheProfile':s['cache'],
 'defaultLog':'official-validation/'+full['logFile'],
 'defaultLogSHA256':full['logSHA256'],
 'transitionRecord':'official-validation/priority-transition.json',
 'additionalPinnedDeclarationAudit':'repository.pinnedRc2Validation',
 'auditFile':'official-validation/official-audit-summary.json',
 'auditSHA256':digest(S),
}

lockPath=B/'sources.lock.json'
provPath=B/'provenance.generated.mjs'
prefix='export const provenance = '
raw=provPath.read_text()
if not raw.startswith(prefix):raise RuntimeError('Unexpected provenance module envelope.')
provenance=json.loads(raw[len(prefix):].strip().removesuffix(';'))
lock=read(lockPath)
if lock['repository']['commit']!=s['sourceCommit']:raise RuntimeError('Pinned source commit mismatch.')
snapshot=A/'pre-rc2-provenance-update.json'
if not snapshot.exists():
    write(snapshot,{'sourcesLockSHA256':digest(lockPath),'provenanceModuleSHA256':digest(provPath),
                    'historicalOriginalFullBuild':lock['repository']['originalFullBuild'],
                    'historicalLeanModuleSHA256':digest(B/'lean.generated.mjs'),
                    'scope':'Historical v49 metadata before adding the separately recorded terminal rc2 audit.'})
lock['repository']['originalFullBuild']=fullScope
lock['repository']['pinnedRc2Validation']=scope
provenance['lock']=lock
provenance['officialValidation']=scope
write(lockPath,lock)
provPath.write_text(prefix+json.dumps(provenance,ensure_ascii=False,indent=2)+';\n')

checkPath=B/'checklist-status.json'
check=read(checkPath)
before={x['id']:(x['originalAcceptance'],x['originalDetail']) for x in check['items']}
items={x['id']:x for x in check['items']}
items['N1-05'].update(
 status='PASS' if whole else 'PARTIAL',
 implementationStatus='IMPLEMENTED' if whole else 'PARTIAL_IMPLEMENTATION',
 mathGateStatus='PASS_PINNED_EXPLICIT_PATH_FULL_BUILD' if whole else 'BLOCKED_WHOLE_DEFAULT_BUILD_COMPLETION',
 evidence=f"원래 rc2 commit·manifest·공식 배포 SHA를 고정했다. 표준 CLI 환경 오류, 원래 캐시 body의 8,747개 명시 context 실행(종료 {s['cache']['exitCode']}), 원래 default 호출(종료 {full['exitCode']})과 NS C/D 선택 target(종료 {ns['exitCode'] if ns else '없음'})의 실제 명령·전체 로그·driver/공유 라이브러리 해시를 보존했다.",
 artifacts=['sources.lock.json','official-validation/official-audit-summary.json',
            'official-validation/official-command-results.json',
            'official-validation/full-pinned-command-results.json',
            'official-validation/environment-after.json',
            'official-validation/driver-build.json'],
 blockedConditions=[] if whole else [
     '원래 defaultTargets 전체 성공은 미확보이다. NS C/D를 우선하려고 Euler가 시작된 default 호출을 명시 중단했다. 선택 NS target의 결과를 Euler 포함 전체 성공으로 승격하지 않는다.',
     '표준 배포 CLI의 애플리케이션 경로 자동 탐지는 이 환경에서 실패했다. 성공 여부는 공식 rc2 커널을 그대로 사용한 별도 명시 경로 entry 프로파일로 기록한다.',
 ])
items['N1-06'].update(
 status='PARTIAL',implementationStatus='PARTIAL_IMPLEMENTATION',
 mathGateStatus='BLOCKED_INDEPENDENT_COMPARATOR_GUARD',
 evidence=(f"원래 rc2의 C/D 제출 target 종료 {ns['exitCode'] if ns else '없음'}, 실제 #check·#print axioms entry 종료 {decl['exitCode']}를 저장했다. "
           + ('두 exported declaration이 원래 커널에 수용되었고 공리 의존성은 개별 로그에 있다. ' if passed else 'C/D 커널 검증의 미완료/실패 범위를 실제 로그에 유지한다. ')
           + '기존 4.34.1 component 감사 13개는 동일하게 보존했다. 보호된 원래 Comparator 호출은 systemd 사용자 bus 오류로 종료 1이다.'),
 artifacts=['formal-import-map.json','formal-adapters.json','evidence/lean-validation.json',
            'official-validation/submitted-source-import-map.json',
            'official-validation/ns-pinned-declarations.log',
            'official-validation/official-audit-summary.json',
            'official-validation/comparator-pinned-guarded.json',
            'official-validation/comparator-environment-independent.json'],
 blockedConditions=[
     'Comparator의 필수 systemd RestrictAddressFamilies 보호 호출이 사용자 bus 부재로 실패했다. 독립 환경 관측은 PID1 supervisord, 활성 user manager/DBus 부재, read-only cgroup, UID0만의 매핑과 CapBnd0을 기록한다. Comparator 본체/외부 Nanoda 검사에 도달하지 못했고 가드를 완화하지 않았다.',
     'C/D exported type의 rc2 커널 수용, 독립적인 challenge 동치 Comparator 성공, 원문 전체 default 성공, 실제 수치 leading profile 인증은 별개이다.',
 ])
if not passed:
    items['N1-06']['blockedConditions'].append('실제 C/D declaration entry가 성공하지 않았으므로 커널 완료로 표시하지 않는다.')
for x in check['items']:
    assert before[x['id']]==(x['originalAcceptance'],x['originalDetail'])
check['summary']={key:sum(x['status']==key for x in check['items']) for key in ['PASS','PARTIAL','BLOCKED']}
check['formalValidation']['additionalPinnedRc2DeclarationAudit']={
    'targets':2,'passed':passed,'toolchain':s['toolchain'],
    'independentComparatorPassed':False,'wholeDefaultBuildPassed':whole,
    'auditFile':'official-validation/official-audit-summary.json'}
check['formalValidation']['officialValidation']=scope
check['formalValidation']['mainSourceTheoremCheckedScope']='The legacy boolean concerns the full paper statement as independently matched to its formalization. Exact exported C/D Lean type acceptance is recorded separately in officialValidation; Comparator remains incomplete.'
for x in check['crossCutting']:
    if x['id']=='I3-04':
        x['evidence']='원문 Theorem1.1은 정확한 가정의 THEOREM_REFERENCE로 유지한다. 기존 unchanged Flatness/ProblemStatement import와 13개 로컬4.34.1 target 감사는 보존했다. 추가 원래 rc2 C/D exported type의 실제 kernel/axioms 결과 및 차단된 Comparator를 별도 scope로 연결했다. 두 scope는 사용자 입력의 해석 가정이나 전체 수치 프로파일을 자동 인증하지 않는다.'
        x['artifacts']=list(dict.fromkeys(x['artifacts']+['official-validation/official-audit-summary.json']))
write(checkPath,check)
lines=['# NS M1 체크리스트 결과','',f"원본 24개: PASS {check['summary']['PASS']}, PARTIAL {check['summary']['PARTIAL']}, BLOCKED {check['summary']['BLOCKED']}. 모든 원본 수용기준을 완료한 상태가 아니다.",'','| ID | 결과 | 실제 증거 | 남은 조건 |','|---|---|---|---|']
for x in check['items']:
    lines.append('|'+ '|'.join([x['id'],x['status'],x['evidence'],' / '.join(x['blockedConditions']) or '해당 구성요소/계약 범위에서 없음'])+'|')
(B/'CHECKLIST.md').write_text('\n'.join(lines)+'\n')

registryPath=B/'formal-adapters.json'
registry=read(registryPath)
for entry in registry:
    if entry.get('id')=='ns-paper-main-reference':
        entry['reason']='The full paper statement remains a precise theorem reference. The two exact exported C/D Lean types have a separate terminal pinned rc2 audit; independent Comparator equivalence is environment-blocked. The historical local4.34.1 component scope is preserved.'
        entry['additionalPinnedExportAudit']=scope
write(registryPath,registry)
write(A/'m1-evidence-update.json',{
    'sourceCommit':s['sourceCommit'],'summary':check['summary'],
    'numericAlgorithmsChanged':False,'originalChecklistDetailAcceptanceChanged':False,
    'historicalLeanEvidenceSHA256':digest(B/'evidence/lean-validation.json'),
    'historicalLeanModuleSHA256':digest(B/'lean.generated.mjs'),
    'historicalLeanModuleUnchanged':digest(B/'lean.generated.mjs')==read(snapshot)['historicalLeanModuleSHA256'],
    'updatedFiles':[{ 'file':str(p.relative_to(B)), 'sha256':digest(p)} for p in
                    [lockPath,provPath,checkPath,B/'CHECKLIST.md',registryPath]],
})
print('Updated terminal rc2 provenance and N1 evidence. Numeric code and historical13-target Lean receipt unchanged.')
