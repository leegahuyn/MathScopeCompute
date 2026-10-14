"""Fail-closed same-run coverage, immutable certificate index, Korean report."""
from __future__ import annotations
import copy, hashlib, json, os
from pathlib import Path
from run_job import read, write, sha, old_runner, implementation

EXPECTED=[('jet',i) for i in range(4)]+[('residual',i) for i in range(3)]+[('guard',0),('bounds',0),('controls',0)]
def aggregate(context,root,out):
    root=Path(root);run=os.environ['GITHUB_RUN_ID'];commit=os.environ['GITHUB_SHA']
    progress=[];certs=[];success=[]
    for kind,shard in EXPECTED:
        folder=root/f'n6-cloud-{kind}-{shard}-{run}'
        row={'kind':kind,'shard':shard,'artifact':folder.name}
        if not (folder/'receipt.json').exists():
            row.update(status='MISSING_OR_TERMINATED_WITHOUT_RECEIPT',attemptedCount=None,
                       reason='No complete execution receipt; available logs remain in Actions artifacts')
        else:
            verified=old_runner().verify_receipt(folder,commit,require_success=False)
            e=read(folder/'execution.json')
            if e['runId']!=run or e['kind']!=kind or e['shard']!=shard or e['implementation']!=implementation():
                raise ValueError('Same-run source/implementation/shard mismatch')
            if e['executionStatus']=='SUCCESS' and e.get('checkpointSHA256')!=context['checkpointSHA256']:
                raise ValueError('Worker used different checkpoint')
            row.update(status=e['executionStatus'],elapsedSeconds=e['elapsedSeconds'],maxRSSKiB=e['maxRSSKiB'],
                       receiptSHA256=verified['receiptSHA256'],failure=e.get('failure'),resumedFrom=e.get('resumedFrom'))
            for p in sorted(folder.rglob('*')):
                if p.is_file():certs.append({'artifact':folder.name,'path':p.relative_to(folder).as_posix(),
                      'bytes':p.stat().st_size,'sha256':sha(p)})
            if e['executionStatus']=='SUCCESS':success.append((kind,shard,folder))
        progress.append(row)
    # The mathematical checker is separate from transport integrity and remains
    # useful if one cloud job failed. Missing jobs cannot count as computed.
    from acceptance import run as strict_acceptance
    verdict=strict_acceptance(context,root,out)
    jets=[];residuals=[];guards=None;bounds=None
    for kind,shard,folder in success:
        if kind=='jet':
            data=read(folder/f'jet-results-shard-{shard}.json');jets.append(data)
            next(r for r in progress if r['kind']==kind and r['shard']==shard)['attemptedCount']=data['attemptedRequests']
        elif kind=='residual':
            data=read(folder/f'residual-component-{shard}-result.json');residuals.append(data)
            next(r for r in progress if r['kind']==kind and r['shard']==shard)['attemptedCount']=data['attemptedOriginalTerms']
        elif kind=='guard':guards=read(folder/'guard-result.json')
        elif kind=='bounds':bounds=read(folder/'global-bounds-result.json')
    attempted_jets=sum(x['attemptedRequests'] for x in jets)
    closed=sum(x['newClosedOnOriginalLeafDefinedDomains'] for x in jets)
    if len(jets)==4 and attempted_jets!=365:raise ValueError('Jet frontier coverage incomplete or duplicated')
    application=None
    if len(jets)==4:
        from jet_apply import apply as apply_jets
        application=apply_jets(context,root,out)
        slow_certificates=[p for kind,shard,folder in success if kind=='jet' for p in folder.glob('slow-root-all-orders-shard-*.json')]
        if len(slow_certificates)!=4 or len({sha(p) for p in slow_certificates})!=1:
            raise ValueError('All-order original implicit source certificates disagree')
        write(out/'slow-root-all-orders-certificate.json',read(slow_certificates[0]))
    attempted_terms=sum(x['attemptedOriginalTerms'] for x in residuals)
    normalized=[next((x['normalizedNumeratorTerms'] for x in residuals if x['component']==i),None) for i in range(3)]
    summary={'schema':'MathScope.N6Cloud.VerificationSummary/1','sourceCommit':commit,'runId':run,
             'runURL':f'https://github.com/leegahuyn/MathScopeCompute/actions/runs/{run}',
             'expectedCalculationJobs':len(EXPECTED),'successfulCalculationJobs':len(success),
             'attemptedJets':attempted_jets,'newJetsClosedOnLeafDefinedDomain':closed,
             'remainingJetsOnLeafDefinedDomain':365-closed,'unconditionalAnalyticJetsNewlyProved':sum(x.get('unconditionalAnalyticJetsProved',0) for x in jets),
             'attemptedOriginalResidualTerms':attempted_terms,'inputResidualTermsByComponent':[169,197,654],
             'normalizedResidualTermsByComponent':normalized,
             'attemptedGlobalGuards':guards['attemptedGuardCount'] if guards else 0,
             'globallyDischargedGuards':guards['globallyDischargedGuards'] if guards else 0,
             'remainingGlobalGuards':guards['remainingGlobalGuards'] if guards else 94,
             'N6-01':'OPEN','N6-02':'PARTIAL','M3':'56/64',
             'mathematicalAcceptancePromoted':False,'publicDeploymentPerformed':False,
             'sameRunCheckpointSHA256':context['checkpointSHA256'],
             'globalBoundsResultAvailable':bounds is not None}
    summary['jetApplication']=application
    if bounds:
        summary['allOrderHeatNormCalculation']={k:bounds[k] for k in ['mixedHeatDerivativeNormRows','improperHeatTailOrders','conditionalGaussianSeriesControls']}
    matrix=copy.deepcopy(read(context['matrix_path']))
    matrix.update(schema='MathScope.N6Cloud.ObligationMatrix/1',cloudExecution=summary,
                  shardProgress=progress,stageA=jets,stageB=residuals,stageC=guards,stageD=verdict,
                  globalBoundsCalculation=bounds,originalRequestsGuardsAndRequirementsPreserved=True)
    write(out/'OBLIGATION_MATRIX.json',matrix)
    write(out/'shard-progress.json',progress);write(out/'CERTIFICATE_HASHES.json',certs)
    write(out/'verification-summary.json',summary)
    residual_text='/'.join('미실행' if n is None else str(n) for n in normalized)
    missing=[f"{r['kind']}/{r['shard']}: {r['status']}" for r in progress if r['status']!='SUCCESS']
    report=f'''# N6 원본 소스 클라우드 계산 결과

**무조건부 인증은 미완료입니다. N6-01 OPEN / N6-02 PARTIAL, M3 56/64를 유지합니다.**

- 실제 실행: {summary['runURL']}
- 코드 커밋: `{commit}`; 기준 PR29: `{context['baseCommit']}`.
- 원본 parent SHA256: `{context['parentNodesSHA256']}` (3,892,594 nodes).
- 클라우드 계산 작업: {len(success)}/{len(EXPECTED)} 성공. 실행 성공은 수학적 인증과 별도입니다.
- 추가 jet 시도: {attempted_jets}/365. 원본 leaf가 정의된 영역에서 추가 계산: {closed}; 이 범위의 미계산 {365-closed}. 전역 해석적 인증으로 승격한 jet: {summary['unconditionalAnalyticJetsNewlyProved']}.
- 원본 잔여항 시도: {attempted_terms}/1020. 성분별 유한 함수 항등식 정규화 결과: {residual_text} (기준 169/197/654). 정규화 전후 표현 기저가 달라질 수 있으므로 항 수 증가·감소는 수학적 증명 완성률이 아닙니다.
- 원본 전역 guard 시도: {summary['attemptedGlobalGuards']}/94. 전역 원시식 증명 {summary['globallyDischargedGuards']}, 미해결 {summary['remainingGlobalGuards']}.
- 원본 slow implicit root의 모든 차수 상계: 원본 source image 각 점에서 `|partial_Z^a partial_T^b s| <= 3*a!*b!*1024^(a+b)`를 균일 복소 수축사상과 Cauchy 부등식으로 도출했습니다. 전체 PDE 인수가 이 image에 들어간다는 증명은 별도 미해결입니다.
- 열 함수 혼합 미분 상계 계산: {bounds['mixedHeatDerivativeNormRows'] if bounds else 0}개, 무한적분 미분 tail 상계 {bounds['improperHeatTailOrders'] if bounds else 0}개. 모든 차수 재귀식과 명시적 cutoff 정리가 유효한 ingredient 정의역에 한정됩니다.
- 전역/무한차수 추가 상계 계산 결과: {'보존됨' if bounds else '미완료'}. 원본 전체 W/M/S, Haar 모멘트, 공통 support, Rayleigh 실제 전역 envelope, Picard 실제 holomorphic 계수 노름은 독립 검증에 필요한 전제가 남아 있습니다.

각 요청의 원본 node·registry·좌표 순서·capture와 모든 잔여 단항식·실패 이유는 계산 아티팩트에 보존합니다. `CERTIFICATE_HASHES.json`은 전체 결과·stdout·stderr·음성 대조 검사 파일의 해시를 보존합니다. `OBLIGATION_MATRIX.json`은 원본 393요청·94 guard·14 전역 의무를 제거하지 않은 누적 판정표입니다.

실제 Cartesian PDE 체크포인트에 추가 적용한 jet은 {application['newAppliedExactZeroJetsOnLeafDefinedDomains'] if application else 0}개입니다. 계산된 일반식과 실제로 반영한 항목을 별도로 기록합니다.

표준 Ubuntu hosted runner만 사용했습니다. Python 3.12.10 / Node 24.19.0, 계산별 주소공간 5 GiB / CPU 840초 제한. parent 전체와 기존 mean 8/8을 다시 생성하지 않고, Git에 보존된 ZIP과 member 영수증을 검사한 공통 체크포인트를 사용했습니다. 성공 체크포인트는 동일 구현·동일 입력 해시일 때 재사용할 수 있습니다.

Artifacts 보존 요청은 90일이며 실제 만료 시각은 `GITHUB_OBSERVATION.json`을 확인합니다. 만료 뒤에는 Git에 보존한 입력/코드로 재현해야 합니다. main·원본 producer·원본 기준·공개 사이트는 변경하지 않았으며 병합·배포하지 않았습니다.

미완료 실행: {', '.join(missing) if missing else '없음'}.
'''
    (out/'RESULTS_KO.md').write_text(report,encoding='utf8')
    print(json.dumps(summary,ensure_ascii=False))
    # Keep the complete partial ledger even when infrastructure failed.
    if missing:raise RuntimeError('Some calculation shards failed or are missing; partial ledger preserved')
    return summary
