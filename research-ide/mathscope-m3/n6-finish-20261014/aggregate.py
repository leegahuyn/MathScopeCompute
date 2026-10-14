"""Merge only source-verified new proofs, preserving every original obligation."""
from __future__ import annotations
import copy, json, os
from pathlib import Path
import acceptance as original_acceptance
import run_job as controller
from guard_worker import read,write,sha as json_sha

EXPECTED=[('jet',i) for i in range(4)]+[('pde',i) for i in range(3)]+[('guard',0),('controls',0)]
def run(context,results,out):
    root,out=Path(results),Path(out);run_id=os.environ['GITHUB_RUN_ID'];commit=os.environ['GITHUB_SHA']
    previous=read(context['current_matrix_path']);original=read(context['matrix_path'])
    original_acceptance.verify_original_matrix(original)
    baseline=read(Path(context['baseline'])/'cartesian-closure-result.json')
    originals={r['requestId'] if 'requestId' in r else 'cartesian-result:'+str(r['result']):r
               for r in baseline['remainingUnresolvedRequests']}
    checkpoint=read(Path(context['baseline'])/'checkpoints/cartesian-source-checkpoint.json')
    scalar_program=checkpoint['cartesian']['scalarProgram']
    current={r['requestId']:copy.deepcopy(r) for shard in previous['stageA'] for r in shard['requests']}
    target={k for k,v in current.items() if not v['closedOnOriginalLeafDefinedDomain']}
    guards={r['id']:copy.deepcopy(r) for r in previous['stageC']['rows']}
    guard_target={k for k,v in guards.items() if not v['provedByThisWorker']}
    if len(current)!=365 or len(target)!=237 or len(guard_target)!=59:
        raise ValueError('Latest original frontier is not the pinned237jet/59guard inventory')
    progress=[];certificates=[];jet_results=[];pde_results=[];guard_result=None;seen=set();failures=[]
    for kind,shard in EXPECTED:
        folder=root/f'n6-finish-{kind}-{shard}-{run_id}';row={'kind':kind,'shard':shard,'artifact':folder.name}
        if not (folder/'receipt.json').exists():
            row['status']='MISSING_OR_TERMINATED_WITHOUT_COMPLETE_RECEIPT';failures.append(row)
            progress.append(row);continue
        e=read(folder/'execution.json')
        verification=controller.cloud.old_runner().verify_receipt(folder,commit,require_success=False)
        if e['runId']!=run_id or e['kind']!=kind or e['shard']!=shard or e['implementation']!=controller.implementation():
            raise ValueError('Mismatched code/run/worker receipt')
        row.update(status=e['executionStatus'],elapsedSeconds=e['elapsedSeconds'],maxRSSKiB=e['maxRSSKiB'],
                   receiptSHA256=verification['receiptSHA256'],failure=e.get('failure'),resumedFrom=e.get('resumedFrom'))
        for p in sorted(folder.rglob('*')):
            if p.is_file():certificates.append({'artifact':folder.name,'path':p.relative_to(folder).as_posix(),
                        'bytes':p.stat().st_size,'sha256':controller.sha(p)})
        progress.append(row)
        if e['executionStatus']!='SUCCESS':failures.append(row);continue
        if e.get('checkpointSHA256')!=context['checkpointSHA256']:raise ValueError('Worker input checkpoint differs')
        if kind=='jet':
            data=read(folder/f'jet-solve-shard-{shard}-result.json');jet_results.append(data)
            rows=data.get('rows',data.get('requests',[]))
            if data['attemptedRemainingRequests']!=len(rows):raise ValueError('Jet attempted count inconsistent')
            for item in rows:
                identity=item.get('requestId','cartesian-result:'+str(item.get('result')))
                if identity not in target or identity in seen:raise ValueError('New jet duplicated, omitted or previously closed jet recomputed')
                original_acceptance.verify_request_binding(originals[identity],item,scalar_program)
                seen.add(identity)
                before=current[identity]
                before['previousAssessmentReference']={'matrixSHA256':context['remainingSourceLock']['currentMatrixSHA256'],
                   'requestId':identity,'status':before['status']}
                before.update(item);current[identity]=before
        elif kind=='pde':
            data=read(folder/f'pde-solve-component-{shard}-result.json');pde_results.append(data)
            if data['component']!=shard or data['attemptedOriginalTerms']!=[169,197,654][shard]:
                raise ValueError('Original PDE term inventory changed')
            if data['originalSourceRoots']!={'direct':[3825257,3825259,3825261][shard],
                                           'assembled':[3825348,3825349,3825350][shard]}:
                raise ValueError('PDE source-root binding changed')
            if data['originalTermCoverageVerifier']['allOriginalTermsChecked']!=data['attemptedOriginalTerms']:
                raise ValueError('PDE original coefficient/term coverage failed')
            if not data['negativeSourceControls'] or not all(c['rejected'] for c in data['negativeSourceControls']):
                raise ValueError('PDE source mutation survived')
            if data['originalAnalyticEqualityProved'] or data['analyticallyDischargedTerms']:
                raise ValueError('A complete analytic-source theorem verifier is required before promoting original PDE equality')
        elif kind=='guard':
            guard_result=read(folder/'guard-solve-result.json');items=guard_result['rows']
            if len(items)!=59 or guard_result['attemptedRemainingGuards']!=59 or {r['id'] for r in items}!=guard_target:
                raise ValueError('Remaining59 guard inventory changed')
            for item in items:
                old=guards[item['id']]
                if item['originalGuard']!=old['originalGuard']:raise ValueError('Original source guard statement changed')
                old['remainingRoundProof']=item
                if item['globallyProved']:
                    if item.get('sourceImageOrLocalLabelAssumed') is True:raise ValueError('Local image assumption cannot discharge global guard')
                    old['provedByThisWorker']=True;old['status']=item['proofStatus']
            if guard_result['globallyClosedNewGuards']!=sum(r['globallyProved'] for r in items):
                raise ValueError('New guard count does not match proof rows')
    if len(jet_results)==4 and seen!=target:raise ValueError('The complete237-jet frontier was not attempted exactly once')
    from jet_solve import apply as apply_new_jets
    application=apply_new_jets(context,root,out)
    applied=set(application['newAppliedOriginalResults'])
    claimed={r['originalScalarResult'] for data in jet_results for r in data['rows'] if r['newClosedOnLeafDefinedDomain']}
    if claimed!=applied:raise ValueError('Every claimed new jet must independently replay and actually apply')
    for identity in target:
        row=current[identity]
        if row['result'] in applied:
            row.update(closedOnOriginalLeafDefinedDomain=True,derivativeComputed=True,
                exactParameterAndCaptureSemantics={'pass':True,'method':'complete original source capture audit and fresh-cache derivative replay during actual Cartesian substitution'},
                lemma='REPLAYED_ORIGINAL_SOURCE_DIRECTIONAL_CALCULUS',
                proof={'actualApplicationReference':'jet-solve-application-result.json','formulaArtifact':row['formulaArtifact'],
                       'originalGlobalDefinednessPremisesRetained':True},
                actualApplicationReference='jet-solve-application-result.json')
            if row.get('exactZero'):row['exactValue']='0'
    new_closed=len(applied)
    new_guards=sum(guards[i]['provedByThisWorker'] for i in guard_target)
    remaining_jets=237-new_closed;remaining_guards=59-new_guards
    summary={'schema':'MathScope.N6Remaining.Summary/1','sourceCommit':commit,'runId':run_id,
        'runURL':f'https://github.com/leegahuyn/MathScopeCompute/actions/runs/{run_id}',
        'expectedCalculationJobs':len(EXPECTED),'successfulCalculationJobs':len(EXPECTED)-len(failures),
        'reusedIdenticalCalculationJobs':sum(bool(r.get('resumedFrom')) for r in progress),
        'attemptedRemainingJets':len(seen),'newClosedJetRequestsOnLeafDefinedDomain':new_closed,
        'previouslyNewClosedJetRequests':128,'remainingJetRequestsOnLeafDefinedDomain':remaining_jets,
        'attemptedRemainingGuards':guard_result['attemptedRemainingGuards'] if guard_result else 0,
        'newGloballyProvedGuards':new_guards,'previouslyProvedGlobalGuards':35,'remainingGlobalGuards':remaining_guards,
        'attemptedOriginalPDETerms':sum(r['attemptedOriginalTerms'] for r in pde_results),
        'conditionalPDETermsByComponent':[next((r['normalizedConditionalTerms'] for r in pde_results if r['component']==i and r['independentDerivativeAndAlgebraVerifier'].get('verified') is True),None) for i in range(3)],
        'exactPDEAlgebraVerifiedComponents':[r['component'] for r in pde_results if r['independentDerivativeAndAlgebraVerifier'].get('verified') is True],
        'sourceAtomZeroProofRecordsByComponent':sum(r['strictSourceAtomsProvedZeroOnLeafDefinedDomain'] for r in pde_results),
        'originalInputTermsZeroOnLeafDomain':sum(r['originalTermsZeroOnLeafDefinedDomain'] for r in pde_results if r['independentDerivativeAndAlgebraVerifier'].get('verified') is True),
        'analyticallyDischargedPDETerms':0,'originalAnalyticPDEIdentityProved':False,
        'originalPDEInputTermsPreserved':[169,197,654],
        'N6-01':'OPEN','N6-02':'PARTIAL','M3':'56/64','original56Of64Changed':False,
        'strictInputValidation':'PASSED' if not failures else 'PARTIAL_WORKER_FAILURE',
        'publicDeploymentPerformed':False,'checkpointSHA256':context['checkpointSHA256'],'jetApplication':application}
    dependencies=[]
    for requirement in original['requirements']:
        dependencies.append({**requirement,'status':'OPEN',
          'dependencyIDs':original_acceptance.dependency_plan(requirement),
          'wholeSourceCertificateIndependentlyVerified':False})
    durable_pde=[]
    for data in pde_results:
        compact=copy.deepcopy(data);verifier=compact['independentDerivativeAndAlgebraVerifier']
        omitted={}
        for key in ['allRemainingNumeratorMonomials','denominatorFactorPolynomials','normalizedActualAtomicNodes']:
            if key in verifier:
                value=verifier.pop(key);omitted[key]={'entries':len(value),'canonicalJSONSHA256':json_sha(value)}
        compact['fullExactEvidenceArtifact']={'artifact':f'n6-finish-pde-{data["component"]}-{run_id}',
            'algebraPath':f'pde-solve-component-{data["component"]}-algebra.json',
            'originalTermCircuitPath':f'pde-solve-component-{data["component"]}-circuit.json','durableHashIndex':'CERTIFICATE_HASHES.json',
            'largeFieldsPreservedInArtifact':omitted}
        durable_pde.append(compact)
    durable_jets=[{k:v for k,v in data.items() if k!='rows'} for data in jet_results]
    matrix={'schema':'MathScope.N6Remaining.ObligationMatrix/1','sourceCommit':commit,
        'originalParentNodesSHA256':controller.cloud.PARENT,'previousFrontierSource':context['remainingSourceLock'],
        'originalIndependentCartesianRequests':original['originalIndependentCartesianRequests'],
        'originalIndependentCartesianDomainGuards':original['originalIndependentCartesianDomainGuards'],
        'B0':'7/10','C0star':'6/5','requirements':dependencies,
        'cumulativeCartesianRequests':list(current.values()),'cumulativeGlobalGuardRows':list(guards.values()),
        'remainingJetIDs':[i for i,r in current.items() if not r['closedOnOriginalLeafDefinedDomain']],
        'remainingGlobalGuardIDs':[i for i,r in guards.items() if not r['provedByThisWorker']],
        'dedicatedJetResults':durable_jets,'dedicatedPDEResults':durable_pde,'dedicatedGuardResult':guard_result,
        'cloudExecution':summary,'shardProgress':progress,
        'unconditionalCertificationPromoted':False,'allOriginalStatementsAndPreviousEvidencePreserved':True}
    write(out/'OBLIGATION_MATRIX.json',matrix);write(out/'verification-summary.json',summary)
    write(out/'shard-progress.json',progress);write(out/'CERTIFICATE_HASHES.json',certificates)
    write(out/'acceptance-result.json',{'strictInputValidation':summary['strictInputValidation'],
       'requirements':dependencies,'N6-01':'OPEN','N6-02':'PARTIAL',
       'allGlobalWMSHaarSupportPicardDomainAndCartesianPDEProofsComplete':False,
       'numericWholeOriginalDomainEnclosure':None,'workerFailures':failures})
    normalized='/'.join('미완료' if n is None else str(n) for n in summary['conditionalPDETermsByComponent'])
    report=f'''# 남은 원본 의무 전담 계산 결과

**전부 완료 또는 무조건부 인증을 주장하지 않습니다. N6-01 OPEN / N6-02 PARTIAL, M3 56/64입니다.**

실제 실행: {summary['runURL']}  
코드: `{commit}`  
이전 검증된 입력: run{context['remainingSourceLock']['currentRunId']}, matrix SHA256 `{context['remainingSourceLock']['currentMatrixSHA256']}`.

| 원본 의무 | 이번 실제 시도 | 이번 증명 | 남은 의무 |
|---|---:|---:|---:|
| Jet: 이전128개는 보존 | {len(seen)}/237 | {new_closed}개, 원본 leaf 정의역 범위 | {remaining_jets} |
| Global guard: 이전35개는 보존 | {summary['attemptedRemainingGuards']}/59 | {new_guards}개 전역 증명 | {remaining_guards} |
| PDE 원본 분자항 | {summary['attemptedOriginalPDETerms']}/1020 | 원본 해석적 항등식 인증0개 | 원본 전체 인증 미완료 |

PDE의 조건부 미분 대수 정규화 항 수는 {normalized}입니다. source leaf가 정의된 영역에서 정확히 zero로 도출한 원본 입력항은 {summary['originalInputTermsZeroOnLeafDomain']}개입니다. 원본 등록 함수 존재성·미분 교환·전역 정의역을 증명하지 않은 형식 대수 결과는 원본 해석적 PDE 인증으로 승격하지 않습니다. 정규화로 단항식 수가 늘거나 줄어도 모든 원본1020항·계수·남은 단항식·실패 이유를 보존합니다.

새 jet의 정확한 미분식·실제 원본 Cartesian 대입 overlay는 jet 작업 아티팩트에 보존합니다. 전역 image/공통 support/전체 W/M/S/Haar/Picard holomorphic 계수 노름과 전체 3D PDE/정의역·오차 enclosure는 별도의 원본 의존성으로 남아 있습니다.

계산 작업 {summary['successfulCalculationJobs']}/{len(EXPECTED)} 성공. 성공은 수학적 완전 인증과 별개입니다. 누락·실패: {json.dumps(failures,ensure_ascii=False)}.

사용자 노트북에 저장소·ZIP·계산 아티팩트를 받지 않았습니다. 표준 Ubuntu hosted runner, Python3.12/Node24, 프로세스별 주소공간5GiB/840CPU초 상한, PDE 대수 하위 프로세스420초 제한, 계산 작업18분 제한을 설정했습니다. Git의 검증된 원본 체크포인트를 재사용하고 이미 닫힌 jet128개·guard35개는 새 계산 대상에서 제외했습니다. Artifacts 보존90일, 실제 만료시각과 artifact digest는 GITHUB_OBSERVATION.json, 모든 결과/로그의 해시는 CERTIFICATE_HASHES.json에 기록합니다. main·원본 producer·원본 기준·56/64·공개 사이트는 보호하며 병합·배포하지 않았습니다.
'''
    (out/'RESULTS_KO.md').write_text(report,encoding='utf8')
    if failures:raise RuntimeError('Remaining solver worker failed; exact partial results and every open obligation preserved')
    return summary
