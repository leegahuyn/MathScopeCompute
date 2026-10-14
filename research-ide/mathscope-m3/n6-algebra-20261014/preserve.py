"""Merge exact re-verification outcomes and commit compact cloud evidence only."""
import argparse,base64,hashlib,importlib.util,json,os,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import run_job as controller
spec=importlib.util.spec_from_file_location('branch_only_preserver',HERE.parent/'n6-finish-20261014/preserve.py')
prior=importlib.util.module_from_spec(spec);spec.loader.exec_module(prior)
read,write,sha=controller.read,controller.write,controller.sha
BRANCH='mathscope-m3-n6-cloud-20261014';ROOT='research-ide/mathscope-m3/evidence/n6-algebra-20261014'
def main():
    p=argparse.ArgumentParser();p.add_argument('--results',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    a.output.mkdir(parents=True,exist_ok=True);run=os.environ['GITHUB_RUN_ID'];commit=os.environ['GITHUB_SHA'];lock=read(HERE/'INPUT_LOCK.json')
    source_path=controller.REPO/lock['sourceMatrixPath']
    if sha(source_path)!=lock['sourceMatrixSHA256']:raise ValueError('Source frontier changed')
    frontier=read(source_path);rows=[];hashes=[];progress=[];guard_followup=None;clock_bridge=None;native_norm_bridge=None;root_relation=None;new_guard_ids=set()
    for i in range(3):
        folder=a.results/f'n6-algebra-{i}-{run}'
        if not (folder/'receipt.json').is_file():
            progress.append({'component':i,'status':'MISSING_COMPLETE_RECEIPT'});continue
        receipt=controller.finish.cloud.old_runner().verify_receipt(folder,commit,require_success=False)
        e=read(folder/'execution.json')
        if e['runId']!=run or e['component']!=i or e['implementation']!=controller.implementation():raise ValueError('Different re-verification run/code')
        progress.append({'component':i,'status':e['executionStatus'],'elapsedSeconds':e['elapsedSeconds'],'nodeResourceFailure':e.get('failure'),'receiptSHA256':receipt['receiptSHA256']})
        for path in sorted(folder.rglob('*')):
            if path.is_file():hashes.append({'artifact':folder.name,'path':path.relative_to(folder).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
        if (folder/'result.json').is_file():
            r=read(folder/'result.json')
            if r['component']!=i or r['originalInputTerms']!=[169,197,654][i] or r['sourceRun']!=lock['sourceRun'] or r['originalParentSHA256']!=lock['originalParentSHA256']:raise ValueError('Different exact original source residual')
            if r['sourceCoverage']['allOriginalTermsChecked']!=r['originalInputTerms'] or not all(c['rejected'] for c in r['negativeSourceControls']):raise ValueError('Original coefficient coverage failed')
            if r['originalAnalyticEqualityProved'] or r['analyticallyDischargedOriginalPDETerms']:raise ValueError('Conditional algebra cannot promote global PDE equality')
            algebra=read(folder/'exact-algebra.json')
            if r['exactConditionalAlgebraVerified']:
                if e['executionStatus']!='SUCCESS' or not algebra.get('verified') or not algebra.get('exactExportReconstructionPass') or not all(c['rejected'] for c in algebra['negativeControls']):raise ValueError('Incomplete exact algebra claimed verified')
            rows.append(r)
        if i==0:
            for name in ['original-guard-row-obstructions.json','guard-followup-result.json','actual-structural-obstructions.json',
                'native-pressure-amplitude-clock-bridge.json','native-pressure-amplitude-source-bindings.json']:
                if (folder/name).is_file():(a.output/name).write_bytes((folder/name).read_bytes())
            if e.get('supplementalProofControlsPassed') and (folder/'guard-followup-result.json').is_file():
                guard_followup=read(folder/'guard-followup-result.json')
                if guard_followup['latestGuardMatrixSHA256']!=lock['sourceMatrixSHA256'] or not all(c['rejected'] for c in guard_followup['negativeControls']):raise ValueError('Followup original guard controls/source failed')
                original_guards={r['id']:r for r in frontier['cumulativeGlobalGuardRows']}
                for r in guard_followup['rows']:
                    if r['id'] not in frontier['remainingGlobalGuardIDs'] or r['originalGuard']!=original_guards[r['id']]['originalGuard']:raise ValueError('Followup changed original guard')
                    if r['globallyProved']:
                        ev=r['evidence'];kind=r['originalGuard']['kind']
                        if ev.get('sourceExistenceProved') or ev.get('wholeGlobalImageProved'):raise ValueError('Primitive proof cannot promote original source existence')
                        if kind=='ACTUAL_OPAQUE_SUBSTITUTION':
                            capture=ev.get('allIndexedLocalBodyCaptureAudits')
                            if capture is None or not all(v.get('pass') and v.get('allActualLocalBodiesChecked') for v in capture.values()):raise ValueError('Complete indexed local-body capture audit missing')
                        elif kind=='POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN':
                            if not ev.get('exactConstant4MinusSqrt2') or ev.get('strictLowerBound')!='2' or r['originalGuard'].get('operand')!=45:raise ValueError('Exact constant positivity evidence missing')
                        elif kind=='NONZERO_ACTUAL_ARGUMENT':
                            if not all(ev.get(k) is True for k in ['strictActiveBranchNonzero','allRootToInversePathsGuarded','allOriginalDAGSinksConsidered']):raise ValueError('Whole-source active-branch denominator proof missing')
                        else:raise ValueError('Unsupported new guard proof family')
                        new_guard_ids.add(r['id'])
                if len(new_guard_ids)!=guard_followup['newGloballyClosedGuards']:raise ValueError('New guard count inconsistent')
            if (folder/'native-pressure-amplitude-clock-bridge.json').is_file():clock_bridge=read(folder/'native-pressure-amplitude-clock-bridge.json')
            if (folder/'native-recurrence-norm-bridge.json').is_file():native_norm_bridge=read(folder/'native-recurrence-norm-bridge.json')
            for name in ['native-recurrence-norm-bridge.json','native-recurrence-norm-source-bindings.json']:
                if (folder/name).is_file():(a.output/name).write_bytes((folder/name).read_bytes())
        if i==2 and (folder/'original-root-relation-result.json').is_file():
            root_relation=read(folder/'original-root-relation-result.json')
            if not e.get('originalRootRelationControlsPassed') or root_relation['originalAnalyticEqualityProved']:raise ValueError('Original root relation source controls missing')
            for cert in root_relation['components']:
                name=f'original-root-relation-component-{cert["component"]}.json'
                if cert['component']!=2 or cert['originalInputTerms']!=654 or sha(folder/name)!=cert['certificateSHA256'] or not cert['exactQuotientCertificateVerified']:raise ValueError('Original implicit equation coefficient certificate changed')
                data=read(folder/name)
                if not all(c['rejected'] for c in data['negativeControls']) or not data['independentCoefficientVerification']['verified']:raise ValueError('Original implicit equation mutation survived')
                (a.output/name).write_bytes((folder/name).read_bytes())
            write(a.output/'original-root-relation-result.json',root_relation)
    summary={'schema':'MathScope.N6.TargetedAlgebraSummary/1','sourceCommit':commit,'runId':run,'sourceDerivativeRun':lock['sourceRun'],
        'runURL':f'https://github.com/{prior.REPO}/actions/runs/{run}','originalInputTerms':[169,197,654],
        'originalTermsRechecked':sum(r['originalInputTerms'] for r in rows),'verifiedConditionalComponents':[r['component'] for r in rows if r['exactConditionalAlgebraVerified']],
        'verifiedConditionalNumeratorTerms':[next((r['verifiedConditionalNumeratorTerms'] for r in rows if r['component']==i),None) for i in range(3)],
        'originalImplicitRootQuotientNormalForm':root_relation,
        'sourceBodyDerivativesRecomputed':False,'remainingJets':frontier['cloudExecution']['remainingJetRequestsOnLeafDefinedDomain'],
        'previouslyRemainingGuards':frontier['cloudExecution']['remainingGlobalGuards'],'newFollowupGuardsClosed':len(new_guard_ids),
        'remainingGuards':frontier['cloudExecution']['remainingGlobalGuards']-len(new_guard_ids),'analyticallyDischargedOriginalPDETerms':0,
        'originalAnalyticPDEIdentityProved':False,'N6-01':'OPEN','N6-02':'PARTIAL','M3':'56/64','original56Of64Changed':False}
    write(a.output/'verification-summary.json',summary)
    write(a.output/'OBLIGATION_MATRIX.json',{'schema':'MathScope.N6.TargetedAlgebraObligations/1','sourceFrontier':lock,
        'originalUniversalRequirements':frontier['requirements'],'remainingJetIDs':frontier['remainingJetIDs'],
        'remainingGlobalGuardIDs':[i for i in frontier['remainingGlobalGuardIDs'] if i not in new_guard_ids],
        'guardFollowup':guard_followup,'intrinsicPressureAmplitudeBridge':clock_bridge,'nativeNormPreBridge':native_norm_bridge,
        'exactAlgebraByComponent':rows,'execution':summary,
        'wholeSourceAnalyticDomainWMSHaarSupportPicardAndPDEComplete':False})
    write(a.output/'CERTIFICATE_HASHES.json',hashes);write(a.output/'shard-progress.json',progress)
    counts='/'.join('미인증' if x is None else str(x) for x in summary['verifiedConditionalNumeratorTerms'])
    text=f'''# 원본 PDE 회로 재사용: 정확한 인수 보존 검산

실행: {summary['runURL']}  
코드: `{commit}`. 원본 미분 회로는 run{lock['sourceRun']}에서 생성한 SHA256 영수증을 재검증해 클라우드 안에서 재사용했습니다. 사용자 노트북에 저장소·ZIP·아티팩트를 받지 않았습니다.

원본169/197/654항,총1020항의 계수·source node·registry 결합을 다시 검사했습니다. 조건부 유리식 분자의 독립 검산 완료 항 수는 **{counts}**입니다. 이는 전개 뒤 남은 단항식 수이며 원본 PDE가0이라는 뜻이 아닙니다. 전체 단항식·분모·변이 검사·stdout/stderr·자원 중단은Artifacts와 CERTIFICATE_HASHES.json에 보존합니다.

이전의 공통 분모 전체 전개 때문에 발생한 곱셈 폭증을 피하고,각 정확한 분모 인수를 음의 정수 거듭제곱으로 유지한 유리식으로 원래 식과의 차를 검산했습니다. 원본 producer와 미분 계산을 반복하지 않았습니다. 분기 밖 피연산자·분모 정의역 같은 추가 전제는 유지하며 조건부 대수와 원본 해석적 항등식을 구분합니다.

새 jet7개를 독립 재계산·원본 Cartesian 식에 적용하고 guard17개를 증명한 이전 결과를 보존합니다. **남은 jet{summary['remainingJets']}개,guard{summary['remainingGuards']}개,원본 전역 PDE 인증 대상1020항입니다. N6-01 OPEN/N6-02 PARTIAL,M3 56/64를 유지합니다.** 원본 전역 image/공통 support,전체 W/M/S·Haar,실제 Picard 계수 노름과 source 함수 동일성,전체3D PDE/정의역·오차 enclosure는 아직 완료되지 않았습니다.

표준 Ubuntu hosted runner,Python3.12/Node24를 사용했습니다. 과금 runner·병합·배포를 사용하지 않았습니다. Artifacts 보존90일이며 실제 만료시각과 digest는 GITHUB_OBSERVATION.json에 기록합니다. 작업별 결과: `{json.dumps(progress,ensure_ascii=False)}`.
'''
    (a.output/'RESULTS_KO.md').write_text(text,encoding='utf8')
    artifacts=prior.api(f'actions/runs/{run}/artifacts?per_page=100');jobs=prior.api(f'actions/runs/{run}/jobs?per_page=100')
    write(a.output/'GITHUB_OBSERVATION.json',{'runId':run,'sourceCommit':commit,'runURL':summary['runURL'],
        'artifacts':[{k:r.get(k) for k in ['id','name','digest','size_in_bytes','expired','expires_at']} for r in artifacts['artifacts']],
        'jobs':[{k:r.get(k) for k in ['id','name','status','conclusion','html_url']} for r in jobs['jobs']]})
    if os.environ['GITHUB_REF']!='refs/heads/'+BRANCH or prior.api('git/ref/heads/'+BRANCH)['object']['sha']!=commit:raise ValueError('Preserve only on exact dedicated branch head')
    files={ROOT+'/run-'+run+'/'+p.name:p.read_bytes() for p in a.output.iterdir() if p.is_file()}
    mp='research-ide/SOURCE_TRANSLATION_MANIFEST.json';info=prior.api('contents/'+mp+'?ref='+commit)
    blob=info if info.get('encoding')=='base64' and info.get('content') else prior.api('git/blobs/'+info['sha'])
    manifest=json.loads(base64.b64decode(blob['content']));edition={r['path']:r for r in manifest['editionArtifacts']}
    for name,data in files.items():
        relative=name.removeprefix('research-ide/');edition[relative]={'path':relative,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'category':'ENGLISH_GUIDE_TOOL_OR_RELEASE_PROVENANCE'}
    manifest['editionArtifacts']=[edition[k] for k in sorted(edition)];manifest['editionArtifactCount']=len(edition)
    files[mp]=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode();entries=[]
    for name,data in files.items():
        if len(data)>12*1024**2:raise ValueError('Compact evidence size exceeded')
        b=prior.api('git/blobs',{'encoding':'base64','content':base64.b64encode(data).decode()},'POST');entries.append({'path':name,'mode':'100644','type':'blob','sha':b['sha']})
    head=prior.api('git/commits/'+commit);tree=prior.api('git/trees',{'base_tree':head['tree']['sha'],'tree':entries},'POST')
    saved=prior.api('git/commits',{'message':f'Preserve exact factored PDE re-verification {run}','tree':tree['sha'],'parents':[commit]},'POST')
    prior.api('git/refs/heads/'+BRANCH,{'sha':saved['sha'],'force':False},'PATCH')
    print(json.dumps({'savedCommit':saved['sha'],'summary':summary},ensure_ascii=False))
if __name__=='__main__':main()
