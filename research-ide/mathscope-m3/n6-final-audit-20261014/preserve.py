"""Strict final frontier; never turn nonzero conditional algebra into a PDE proof."""
import argparse,base64,json,os
from pathlib import Path
import run_job as controller
prior=controller.module('final_branch_preserver',controller.HERE.parent/'n6-finish-20261014/preserve.py')
read,write,sha=controller.read,controller.write,controller.sha
BRANCH=prior.BRANCH;ROOT='research-ide/mathscope-m3/evidence/n6-final-audit-20261014'
def verified_guard_ids(result,frontier):
    if result['latestGuardMatrixSHA256']!=read(controller.HERE/'INPUT_LOCK.json')['sourceMatrixSHA256']:raise ValueError('Different guard source frontier')
    if not result['negativeControls'] or not all(c['rejected'] for c in result['negativeControls']):raise ValueError('Guard mutation control survived')
    original={r['id']:r for r in frontier['cumulativeGlobalGuardRows']};proved=set()
    for r in result['rows']:
        if r['id'] not in frontier['remainingGlobalGuardIDs'] or r['originalGuard']!=original[r['id']]['originalGuard']:raise ValueError('Original guard changed or double counted')
        if r['globallyProved'] is not True:continue
        ev=r['evidence'];kind=r['originalGuard']['kind']
        if ev.get('sourceExistenceProved') or ev.get('wholeGlobalImageProved'):raise ValueError('Substitution/branch lemma promoted source existence')
        if kind=='ACTUAL_OPAQUE_SUBSTITUTION':
            audits=ev.get('allIndexedLocalBodyCaptureAudits')
            if audits is None or not all(v.get('pass') is True and v.get('allActualLocalBodiesChecked') is True and v.get('allStoredDerivativeScalesChecked') is True for v in audits.values()):raise ValueError('Complete indexed local-body/derivative-scale audit missing')
            if ev.get('nativeDomainListEndpointsAndIndexedDerivativeScalesAudited') is not True:raise ValueError('Repaired native domain/derivative-scale capture audit missing')
            native=ev.get('allNativeSystemCaptureAudits')
            if not isinstance(native,list) or not all(v.get('pass') is True and v.get('completeNativeDomainAndBoundRootsAudited') is True for v in native):raise ValueError('Actual native capture/domain closure not proved')
        elif kind=='POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN':
            if r['originalGuard'].get('operand')!=45 or not ev.get('exactConstant4MinusSqrt2') or ev.get('strictLowerBound')!='2':raise ValueError('Exact literal positivity proof missing')
        elif kind=='NONZERO_ACTUAL_ARGUMENT':
            if not all(ev.get(k) is True for k in ['strictActiveBranchNonzero','allRootToInversePathsGuarded','allOriginalDAGSinksConsidered']):raise ValueError('Complete active-branch denominator proof missing')
        else:raise ValueError('Unsupported followup guard family')
        proved.add(r['id'])
    if len(proved)!=result['newGloballyClosedGuards']:raise ValueError('New guard count mismatch')
    return proved
def main():
    p=argparse.ArgumentParser();p.add_argument('--result',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    a.output.mkdir(parents=True,exist_ok=True);commit=os.environ['GITHUB_SHA'];run=os.environ['GITHUB_RUN_ID'];lock=read(controller.HERE/'INPUT_LOCK.json')
    receipt=controller.finish.cloud.old_runner().verify_receipt(a.result,commit,require_success=False)
    e=read(a.result/'execution.json')
    if e['sourceCommit']!=commit or e['runId']!=run or e['implementation']!=controller.implementation():raise ValueError('Different final audit code/run')
    frontier=controller.checked(controller.REPO/lock['sourceMatrixPath'],lock['sourceMatrixSHA256'])
    algebra=controller.checked(controller.REPO/lock['algebraMatrixPath'],lock['algebraMatrixSHA256'])
    prior_summary=controller.checked(controller.REPO/lock['algebraSummaryPath'],lock['algebraSummarySHA256'])
    if prior_summary['verifiedConditionalComponents']!=[0,1,2] or prior_summary['verifiedConditionalNumeratorTerms']!=[7492,11428,32312] or prior_summary['analyticallyDischargedOriginalPDETerms']!=0:raise ValueError('Completed exact PDE frontier changed')
    result=None;ids=set()
    if e['executionStatus']=='SUCCESS':
        if not e.get('allGuardProofControlsPassed') or not e.get('protectedSourcesUnchanged'):raise ValueError('Final guard audit controls/protected source failed')
        result=read(a.result/'guard-followup-result.json');ids=verified_guard_ids(result,frontier)
    cumulative=frontier['cumulativeGlobalGuardRows']
    if len(cumulative)!=94 or len({r['id'] for r in cumulative})!=94 or sum(r['provedByThisWorker'] is True for r in cumulative)!=52:raise ValueError('Original guard count/source frontier changed')
    if frontier['cloudExecution']['strictInputValidation']!='PASSED' or frontier['cloudExecution']['remainingJetRequestsOnLeafDefinedDomain']!=230:raise ValueError('Accepted original jet/source frontier changed')
    follow={r['id']:r for r in result['rows']} if result else {}
    for row in cumulative:
        if row['id'] in follow:
            row['finalFollowupAttempt']=follow[row['id']]
            if row['id'] in ids:row.update(provedByThisWorker=True,status=follow[row['id']]['proofStatus'],finalProofRun=run)
    remaining=[r['id'] for r in cumulative if r['provedByThisWorker'] is not True]
    summary={'schema':'MathScope.N6.FinalStrictFrontier/1','sourceCommit':commit,'runId':run,'runURL':f'https://github.com/{prior.REPO}/actions/runs/{run}',
        'strictInputValidation':'PASSED' if result else 'FINAL_GUARD_AUDIT_FAILED_RETAIN_PRIOR_52_PROOFS_ONLY',
        'originalSourceNodesSHA256':lock['originalParentSHA256'],'originalJetRequests':393,'previouslyClosedBeforeCloudTask':28,
        'additionalCloudJetsProvedAndApplied':135,'totalClosedJetRequests':163,'remainingJetRequests':230,
        'originalGlobalGuards':94,'closedGlobalGuards':94-len(remaining),'remainingGlobalGuards':len(remaining),'newRepairedFollowupGuards':len(ids),
        'originalPDEResidualTerms':[169,197,654],'originalPDETermsIndependentlyChecked':1020,
        'exactConditionalNumeratorTerms':[7492,11428,32312],'exactConditionalNumeratorZero':[False,False,False],
        'analyticallyDischargedOriginalPDETerms':0,'remainingOriginalPDETerms':1020,'wholeOriginalAnalyticPDEIdentityProved':False,
        'N6-01':'OPEN','N6-02':'PARTIAL','M3':'56/64','original56Of64Changed':False,'publicDeploymentPerformed':False,
        'jetAndInitialGuardProofRun':lock['sourceRun'],'completedExactPDEAlgebraRun':lock['algebraRun'],
        'newOpaqueProofSupersedesIncompleteEarlierDomainAudit':bool(result),'completedPDEOrSourceDerivativeJobsRepeated':False}
    matrix={'schema':'MathScope.N6.FinalScopedObligationMatrix/1','immutableSourceFrontiers':lock,'execution':summary,
        'originalUniversalRequirements':frontier['requirements'],'remainingJetIDs':frontier['remainingJetIDs'],
        'cumulativeGlobalGuardRows':cumulative,'remainingGlobalGuardIDs':remaining,'correctedGuardFollowup':result,
        'exactAlgebraByComponent':algebra['exactAlgebraByComponent'],
        'intrinsicPressureAmplitudeBridge':algebra['intrinsicPressureAmplitudeBridge'],'nativeNormPreBridge':algebra['nativeNormPreBridge'],
        'strictAllOriginalRequirementsAccepted':False,'wholeSourceAnalyticDomainWMSHaarSupportPicardAndPDEComplete':False}
    write(a.output/'verification-summary.json',summary);write(a.output/'OBLIGATION_MATRIX.json',matrix)
    write(a.output/'acceptance-result.json',{'sourceFrontiers':lock,'strictValidation':summary['strictInputValidation'],
        'sourceBindingVerified':True,'newPrimitiveGuardProofs':len(ids),'unconditionalAccepted':False,
        'reason':'Original all-order W/M/S, exact Haar moments, common full-field source image/support, native norm applicability and independent whole3D PDE/domain-error enclosures are still unproved.',
        'N6-01':'OPEN','N6-02':'PARTIAL','M3':'56/64'})
    hashes=[{'path':p.relative_to(a.result).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(a.result.rglob('*')) if p.is_file()]
    write(a.output/'CERTIFICATE_HASHES.json',{'finalAuditReceiptSHA256':receipt['receiptSHA256'],'files':hashes})
    for name in ['guard-followup-result.json','actual-structural-obstructions.json','execution.json','receipt.json','stdout.log','stderr.log']:
        if (a.result/name).is_file() and (a.result/name).stat().st_size<4*1024**2:(a.output/name).write_bytes((a.result/name).read_bytes())
    report=f'''# M3 N6 원본 클라우드 계산: 최종 엄격 판정

**전부 해결되지는 않았습니다. N6-01 OPEN / N6-02 PARTIAL, M3 56/64를 유지합니다.**

| 대상 | 작업 시작 시 남은 수 | 현재 남은 수 | 실제 계산 결과 |
|---|---:|---:|---|
| 원본 leaf-domain jet |365|230|128+7개를 정확히 증명하고 원본 Cartesian 식에 적용 |
| 전역 guard |59|{len(remaining)}|추가17+{len(ids)}개 원본 의무 증명; 전체94개 중{94-len(remaining)}개 |
| 원본 PDE 잔여항 |1020|1020|전 항 계수·원본 node를 독립 검산; 해석적 소거0개 |

PDE 전 성분의 정확한 조건부 유리식 정규화를 완료했습니다. 독립 검산한 분자 단항식은 **7492/11428/32312**, 모두 0이 아닙니다. 이는 원본1020항과 같은 세 잔여식을 다른 형태로 쓴 결과이며, PDE 해결 수로 집계하지 않았습니다. 원본 implicit root 정의식 `F=S−Z²E−T`에 대해 제3성분의 `N−Nrem=FQ`도 독립 검산했습니다. 입력654항 중327항에 S가 있고, 나머지는838항이며 역시 0이 아닙니다. 원본 계수·분모를 삭제하거나 강제로0으로 만들지 않았습니다.

유효한 원본 slow-root image에서 모든 차수 Cauchy 상계 `|∂Z^a∂T^b S|≤3 a!b!1024^(a+b)`를 도출했습니다. 원본 step 상계, 열 함수의 임의 고정 차수 미분 및 tail 상계, Qp/Qb의 전역 양수 경계, 원본 P0/g 및 Zstar 함수 동일성도 증명했습니다. 다만 원본 전체 Cartesian/Fourier/적분 인수가 그 image/공통 strip에 들어간다는 전역 증명은 남았습니다. 유효한 국소 정리의 적용 범위를 전역 인증으로 확대하지 않았습니다.

최종 guard 실행 상태: **{e['executionStatus']}**, 엄격 입력검사: **{summary['strictInputValidation']}**. native Picard `radialDomain=[0,a]`의 목록형 양 끝점과 indexed `derivativeScales`까지 실제 source를 다시 열어 capture를 검사합니다. 성공하고 모든 추가 조건을 통과한 새 증명만 채택하여 이전의 얕은 domain 검사를 대체합니다. 동일한 내용의 PDE·jet 계산은 반복하지 않았습니다. 모든 변이 검사·원본 실패 시도·남은 의무 ID/전제/증거는 기계 판정표 및 영수증에 남깁니다.

실제 native 계수 전 차수/저장 미분/limit 의미를 선택된 해석적 fixed point와 연결하는 원본 증명이 아직 완결되지 않았으므로 Picard B_rho 노름 상계를 인증하지 않았습니다. 원본 Prop9.5 j0(B0=0.7,C0*=1.2)의 전체 W/M/S, Haar 모멘트, 공통 full-field support·changing-label joins, 실제 Rayleigh 양수 envelope, 전체3D PDE 및 정의역/rounding-tail enclosure도 미해결입니다.

## 재현 및 보존

- 자식 branch: `{BRANCH}`. Draft PR30: https://github.com/{prior.REPO}/pull/30
- 원본 미분/jet/guard17 증명 성공: https://github.com/{prior.REPO}/actions/runs/{lock['sourceRun']} (12/12,56검사)
- 정확한 PDE 전 성분 검산 성공: https://github.com/{prior.REPO}/actions/runs/{lock['algebraRun']} (4/4,39검사)
- 최종 guard 정의역 재검사: {summary['runURL']}; 코드 `{commit}`
- 보존된 초기 strict 입력검사 실패: https://github.com/{prior.REPO}/actions/runs/38521462859
- 보존된 정확대수 자원 중단: https://github.com/{prior.REPO}/actions/runs/38525128679

main/원본 producer155개/기준56/64/공개 사이트를 변경하거나 병합·배포하지 않았습니다. 표준 Ubuntu24.04 hosted runner,Python3.12.10/Node24.19.0만 사용했습니다. 로컬 노트북에 저장소·ZIP·대형 아티팩트를 내려받지 않았습니다. runtime 바이너리/소스/출력 SHA256와 실제 image version을 기록했고, 제공되지 않는 전체 runner image 암호학적 digest를 있다고 주장하지 않았습니다. 큰 출력과 stdout/stderr는 GitHub Artifacts90일 보존이며, 만료 후 Git 소스/체크포인트로 재현해야 합니다. 요약·판정표·증명 영수증·certificate hash는 Git에 보존합니다.
'''
    (a.output/'RESULTS_KO.md').write_text(report,encoding='utf8')
    artifacts=prior.api(f'actions/runs/{run}/artifacts?per_page=100');jobs=prior.api(f'actions/runs/{run}/jobs?per_page=100')
    write(a.output/'GITHUB_OBSERVATION.json',{'runId':run,'sourceCommit':commit,'runURL':summary['runURL'],
        'artifacts':[{k:r.get(k) for k in ['id','name','digest','size_in_bytes','expired','expires_at']} for r in artifacts['artifacts']],
        'jobs':[{k:r.get(k) for k in ['id','name','status','conclusion','html_url']} for r in jobs['jobs']]})
    if os.environ['GITHUB_REF']!='refs/heads/'+BRANCH or prior.api('git/ref/heads/'+BRANCH)['object']['sha']!=commit:raise ValueError('Preserve only exact dedicated branch head')
    files={ROOT+'/run-'+run+'/'+p.name:p.read_bytes() for p in a.output.iterdir() if p.is_file()}
    mp='research-ide/SOURCE_TRANSLATION_MANIFEST.json';info=prior.api('contents/'+mp+'?ref='+commit)
    blob=info if info.get('encoding')=='base64' and info.get('content') else prior.api('git/blobs/'+info['sha'])
    manifest=json.loads(base64.b64decode(blob['content']));edition={r['path']:r for r in manifest['editionArtifacts']}
    for name,data in files.items():
        relative=name.removeprefix('research-ide/');edition[relative]={'path':relative,'bytes':len(data),'sha256':__import__('hashlib').sha256(data).hexdigest(),'category':'ENGLISH_GUIDE_TOOL_OR_RELEASE_PROVENANCE'}
    manifest['editionArtifacts']=[edition[k] for k in sorted(edition)];manifest['editionArtifactCount']=len(edition)
    files[mp]=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode();entries=[]
    for name,data in files.items():
        if len(data)>24*1024**2:raise ValueError('Durable compact evidence size exceeded')
        b=prior.api('git/blobs',{'encoding':'base64','content':base64.b64encode(data).decode()},'POST');entries.append({'path':name,'mode':'100644','type':'blob','sha':b['sha']})
    head=prior.api('git/commits/'+commit);tree=prior.api('git/trees',{'base_tree':head['tree']['sha'],'tree':entries},'POST')
    saved=prior.api('git/commits',{'message':f'Preserve strict final guard and original PDE frontier {run}','tree':tree['sha'],'parents':[commit]},'POST')
    prior.api('git/refs/heads/'+BRANCH,{'sha':saved['sha'],'force':False},'PATCH')
    print(json.dumps({'savedCommit':saved['sha'],'summary':summary}))
if __name__=='__main__':main()
