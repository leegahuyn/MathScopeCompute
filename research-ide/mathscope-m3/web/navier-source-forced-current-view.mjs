/** Exact source tables for one complete original forced angular current.
 * The source consumer verifies the archive; this view preserves the full
 * finite mode inventory and never interprets expression IDs as velocities.
 */
const copy=value=>structuredClone(value),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),
  sha=/^[a-f0-9]{64}$/,
  fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_FORCED_CURRENT_VIEW'});};

function source(result){
  if(result?.package!=='N6'||result.operation!=='global-forced-current-record')return null;
  const r=result.results,o=result.observations,s=r?.summary;
  if(r?.schema!=='MathScope.N6.RecordedGlobalForcedCurrent/1'||r.recordedOnly!==true||r.newExecution!==false||
      r.freshSourceConstructorExecuted!==false||r.archiveVerification?.pass!==true||!sha.test(r.archiveSHA256)||
      !r.checks?.length||r.checks.some(x=>!x.pass)||r.gate?.pass!==true||r.gate.actualCoefficientComparisons!==540||
      r.gate.actualScalarIdentities!==2320||r.gate.sourceFileCount!==9||r.sourceDependencyCapture?.fileCount!==155||
      r.originalConstructionGate?.pass!==false||r.originalConstructionGate.stoppedReason!=='OBSERVED_EXECUTION_TIME_LIMIT'||
      r.originalConstructionGate.nodeTests.required!==58||r.scope.completeGlobalCurrentCertificateRecovered!==false||
      r.scope?.completeN6!==false||r.scope.wholeM3Complete!==false||r.scope.initializedJ0!==false||
      r.scope.completeFourStepCycle!==false||r.scope.wholeIndependentPDEComparisonExecuted!==false||
      r.scope.fullMixedDerivativeClosureAudited!==false||r.scope.inputForcingUniformClassNormsCertified!==false)
    fail('A verified actual current archive must retain its unfinished whole-stage and derivative scope.');
  if(o?.kind!=='RECORDED_SOURCE_FORCED_ANGULAR_STAGES'||!same(o.samples,[])||!same(o.curves,[])||
      o.contract?.expressionNodeIdsAreNumericValues!==false||o.contract.numericVelocitySamplesGenerated!==false||
      !same(o.contract.sourceArtifact,r.artifact)||o.contract.sourceGraphSHA256!==s?.graph?.sha256||
      !sha.test(r.artifact?.sha256)||!sha.test(s.graph.sha256)||o.contract.fullArtifactURL!==r.fullArtifactURL||
      o.contract.sourceSnapshotIndexURL!==r.sourceSnapshotIndexURL||o.contract.completeGlobalCurrentCertificateRecovered!==false||
      !r.fullArtifactURL.startsWith('https://github.com/leegahuyn/MathScopeCompute/blob/'))
    fail('Retain the exact artifact and graph binding; physical samples cannot be added to a formula record.');
  if(s.templates?.length!==10||o.harmonicRows?.length!==10||o.inverseRows?.length!==20||
      s.assembly?.allOriginalSourceLabels!==81||s.assembly.signedSourceContributions!==162||
      s.assembly.exactPositiveSourceSystems!==20||s.assembly.exactNegativeConjugateSolutionRoutes!==20||
      s.assembly.allOriginalCoverMapsRetained!==true||s.assembly.all162CovarianceContributionsVerified!==true||
      r.literalAcceptance?.row!=='N6-03'||r.literalAcceptance.criteriaSatisfied!==true||
      r.literalAcceptance.uniformFourierOrVolterraTailSetToZero!==false)
    fail('Every original signed lift, whole source contribution and exact mode inventory is required.');
  for(const t of s.templates){
    const row=o.harmonicRows.find(x=>x.key===t.key),inv=o.inverseRows.filter(x=>x.key===t.key);
    if(!row||row.sign!==t.sign||row.levelDifference!==t.levelDifference||
        !same(row.inputModes,t.originalSourceRows.map(x=>x.m))||!same(row.inputModes,[-2,-1,1,2])||
        !same(row.solvedModes,[-2,-1,1,2])||!same(row.updatedVelocityModes,[-2,-1,1,2])||
        !same(row.nextResidualModes,[-4,-3,-2,-1,0,1,2,3,4])||row.maximumNextResidualAbsoluteMode!==4||
        row.discardedAngularTailBound!=='0'||row.discardedBoundScope!==t.finiteInventory.boundScope||
        row.allExactSourceCoefficientChecksPass!==true||row.exactSourceCoefficientChecks!==t.coefficientChecks.length||
        !same(inv.map(x=>x.m),[1,2])||t.coefficientVerification?.actualDirectMinusDecomposedRecomputed!==true)
      fail('An actual current mode, full coefficient comparison or finite angular error scope changed.');
    for(const f of t.forced){const view=inv.find(x=>x.m===f.m);
      if(view.conjugateMode!==-f.m||view.system!==f.system||!same(view.source,f.source)||
          !same(view.wholePath,f.wholePath)||!same(view.fullPressure,f.fullPressure)||
          !same(view.mappedVelocity,f.mappedVelocity)||!same(view.mappedPressure,f.mappedPressure)||
          !same(view.fullCurlRemainder,f.fullCurlRemainder)||view.matrixNorm!==f.limit.matrixNorm||
          view.forcingNorm!==f.limit.forcingNorm||view.intervalLength!==f.limit.intervalLength||
          view.tailFormula!==f.limit.tailFormula||view.actualSourceAndTimeDerivativeBoundBodiesConstructed!==true||
          view.fullMixedParameterClosureExecuted!==false||view.numericalNormValuesProvided!==false||
          f.wholePath.preimagesIdentified!==false||f.wholePath.checks.some(x=>!x.pass))
        fail('Retain the complete H_w source, normal pressure, mapped curl and actual limit coefficients.');
    }
  }
  if(!same(o.pressure.completeCovariance,s.mean.fullCurrentCovariance)||o.pressure.totalGlobalPressureExpression!==null||
      o.pressure.completeGlobalCurrentCertificateRecovered!==false||o.pressure.refreshedMean!==s.mean.refreshedMeanPressure||
      o.pressure.meanIncrement!==s.mean.globalMeanIncrement||o.pressure.oldNormalizedMean!==s.mean.oldNormalizedMeanPressure||
      o.pressure.newNormalizedMean!==s.mean.newNormalizedMeanPressure||o.pressure.normalizedMeanIncrement!==s.mean.normalizedMeanIncrement||
      !same(o.pressure.angularRows,s.templates.map(t=>({key:t.key,rows:t.updatedWaveRows.map(r=>({m:r.m,pressure:r.pressure}))})))||
      o.pressure.expressionReferencesOnly!==true||o.pressure.refreshedAfterActualCurrentChange!==true||
      o.limits?.length!==3||o.limits[0].kind!=='FINITE_ANGULAR_REGISTRY'||o.limits[0].bound!=='0'||
      o.limits[0].noOtherTailIsDeclaredZero!==true||o.limits[1].numericalBoundEvaluated!==false||
      o.limits[1].everyMixedParameterSourceClosureExecuted!==false||o.limits[2].bound!==null)
    fail('The refreshed pressure and separate Fourier, Volterra and mixed derivative obligations are required.');
  return {r,o,s};
}

export function buildSourceForcedCurrentPanel(result){
  const data=source(result);if(!data)return null;const {r,o}=data;
  return {id:'N6-original-complete-forced-current',label:'원본 current의 모든 강제 각도 보정',
    harmonicRows:copy(o.harmonicRows),inverseRows:copy(o.inverseRows),pressure:copy(o.pressure),limits:copy(o.limits),
    sourceArtifact:copy(r.artifact),sourceReceipt:copy(r.receipt),fullArtifactURL:r.fullArtifactURL,
    sourceSnapshotIndexURL:r.sourceSnapshotIndexURL,originalConstructionGate:copy(r.originalConstructionGate),
    archiveSHA256:r.archiveSHA256,sourceGraphSHA256:r.summary.graph.sha256,gate:copy(r.gate),
    allOriginalLabels:81,signedSourceContributions:162,positiveSourceSystems:20,negativeConjugateRoutes:20,
    recordedOnly:true,freshSourceConstructorExecuted:false,numericalVelocitySamplesGenerated:false,
    completeN6:false,wholeM3Complete:false,initializedJ0:false,
    notes:['실제 temporal 보정, 새 압력, 다섯 moment, 새 압력으로 구성한 같은 current의 모든 비영 각도 source를 사용했습니다.',
      'H_w는 원래 정수 덮개와 두 보조 좌표 전체를 유지합니다. 양·음 모드의 법선 압력과 원래 cutoff potential의 전체 curl을 보존합니다.',
      '새 m+m′ 항은 −4부터 4까지 모두 남습니다. 표시한 절단 꼬리 0은 이 유한 각도 목록에만 적용됩니다.',
      'Volterra 급수와 보조 토러스 Fourier의 꼬리를 0으로 바꾸지 않습니다. 전체 갱신장에 대한 혼합 미분 및 균일 class 상계는 별도 검증 대상입니다.',
      '원래 58항목 통합 실행은 35분 제한으로 종료되었습니다. 저장된 11개 그래프에서 모든 역연산과 curl, 540개 지역 PDE 계수를 별도 재검증했습니다.',
      '마지막 전체 current 증명 파일은 저장되지 않았습니다. 여기에는 실제로 보존된 평균 압력과 모든 지역 각도 압력을 표시합니다. 전체 수치 장 및 이후 반복·j0 완료는 별도 검증 대상입니다.']};
}

export function sourceForcedCurrentSummary(result){
  const data=source(result);if(!data)return null;const {r,o,s}=data;
  return {schema:'MathScope.N6.SourceForcedCurrentDisplaySummary/1',recordedOnly:true,
    archiveSHA256:r.archiveSHA256,receipt:copy(r.receipt),artifact:copy(r.artifact),fullArtifactURL:r.fullArtifactURL,
    sourceCapture:copy(r.sourceDependencyCapture),gate:copy(r.gate),originalConstructionGate:copy(r.originalConstructionGate),
    sourceSnapshotIndex:copy(r.sourceSnapshotIndex),sourceSnapshotIndexURL:r.sourceSnapshotIndexURL,independent:copy(r.independent),
    source:copy(s.source),graph:copy(s.graph),harmonicRows:copy(o.harmonicRows),inverseRows:copy(o.inverseRows),
    pressure:copy(o.pressure),limits:copy(o.limits),sourceChecks:copy(s.checks),
    literalAcceptance:copy(r.literalAcceptance),scope:copy(r.scope),
    integerExpressionReferencesAreSourceNodeIDs:true,numericalVelocityValues:false};
}

export function sourceForcedCurrentSelection(result,key){
  const data=source(result);if(!data)fail('This result has no recorded complete forced-current table.');
  const {r,o,s}=data,t=s.templates.find(x=>x.key===key);if(!t)fail('Choose one of the ten recorded original signed lifts.');
  return {schema:'MathScope.N6.SourceForcedCurrentSelection/1',key,sourceTemplate:copy(t),
    harmonicRow:copy(o.harmonicRows.find(x=>x.key===key)),inverseRows:copy(o.inverseRows.filter(x=>x.key===key)),
    sourceArtifact:copy(r.artifact),sourceReceipt:copy(r.receipt),archiveSHA256:r.archiveSHA256,
    sourceGraphSHA256:s.graph.sha256,runHash:result.runHash,
    sourcePath:'result.results.summary.templates['+s.templates.indexOf(t)+']',
    sourceChangedBySelection:false,selectionPersistence:'PAGE_LOCAL_ONLY; every original source row remains in every export',
    expressionIdsAreNumericalValues:false,fullMixedParameterClosureExecuted:false,
    wholeIndependentPDEComparisonExecuted:false,initializedJ0:false,completeN6:false,wholeM3Complete:false};
}

export function renderSourceForcedCurrent(host,panel,{selectedKey=panel?.harmonicRows?.[0]?.key,onSelect=()=>{}}={}){
  if(panel?.id!=='N6-original-complete-forced-current'||panel.harmonicRows?.length!==10||panel.inverseRows?.length!==20||
      !panel.harmonicRows.some(x=>x.key===selectedKey)||panel.numericalVelocitySamplesGenerated!==false)
    fail('Expected every original signed lift and the exact source-only display scope.');
  const doc=host.ownerDocument,add=(tag,text,parent,attrs={})=>{
    const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;
    for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));parent?.append(node);return node;
  },section=add('section',undefined,null,{'data-source-forced-current':'exact-source-tables','aria-label':panel.label});
  add('h3',panel.label,section);
  add('p','저장된 실제 원본 재검증 · 540개 PDE 계수 · 2,320개 정확한 식 · 213개 독립 검사',section);
  add('p','81개 label · 부호별 162개 기여 · 강제 source 20개와 음의 모드 경로 20개',section);
  const scroller=add('div',undefined,section,{tabindex:0,role:'region','aria-label':'모든 원본 정수 덮개의 각도 모드 표'});
  scroller.style.overflowX='auto';
  const table=add('table',undefined,scroller,{'data-source-forced-modes':'true'});table.style.width='100%';table.style.minWidth='700px';
  add('caption','원래 source와 새 m+m′ 전체 · 표시한 0은 유한 각도 목록의 절단 꼬리에만 적용',table);
  const head=add('tr',undefined,add('thead',undefined,table));
  for(const label of ['부호 / 덮개 차이','현재 source m','보정 후 속도 m','다음 residual m','각도 절단 꼬리','원본 선택'])add('th',label,head,{scope:'col'});
  const body=add('tbody',undefined,table);
  for(const row of panel.harmonicRows){const tr=add('tr',undefined,body,{'data-source-forced-row':row.key});
    add('th',String(row.sign)+' / δ='+row.levelDifference,tr,{scope:'row'});
    for(const values of [row.inputModes,row.updatedVelocityModes,row.nextResidualModes])add('td',values.join(', '),tr);
    add('td',row.discardedAngularTailBound+' · 유한 각도 목록',tr);
    const button=add('button','원본 식',add('td',undefined,tr),{type:'button','data-source-forced-select':row.key,
      'aria-label':String(row.sign)+' 부호, 덮개 차이 '+row.levelDifference+'의 전체 source와 압력 선택',
      'aria-pressed':String(row.key===selectedKey)});button.style.minHeight='44px';button.style.minWidth='88px';
    button.addEventListener('click',()=>onSelect(row.key));
  }
  const chosen=panel.harmonicRows.find(x=>x.key===selectedKey),inverses=panel.inverseRows.filter(x=>x.key===selectedKey);
  add('h4','선택한 원본 역연산: '+String(chosen.sign)+' / δ='+chosen.levelDifference,section);
  add('p','H_w = Y + (ci_label / Tg^δ) · (w − v(Y)) · v_t. 두 보조 좌표와 원래 덮개의 배율을 모두 유지합니다.',section);
  for(const row of inverses){const detail=add('div',undefined,section,{'data-source-forced-inverse':row.m});
    add('p','m='+row.m+' 및 '+row.conjugateMode+' · 법선 source 압력 · 전체 mapped curl',detail);
    add('code','source '+JSON.stringify(row.source)+'; pressure '+JSON.stringify(row.fullPressure),detail);
    add('p','각 정수는 원본 표현식 ID입니다. 수치 장 값이나 수치 상계가 아닙니다.',detail);
  }
  add('h4','저장된 새 평균 압력과 모든 각도 압력',section);
  add('p','새 공분산의 여섯 성분으로 평균 압력을 다시 구성했습니다. 선택한 지역의 양·음 각도 압력을 모두 함께 표시합니다.',section);
  add('code','p_mean = expr #'+panel.pressure.refreshedMean+'; Δp_mean = expr #'+panel.pressure.meanIncrement+
    '; p_normalized = expr #'+panel.pressure.newNormalizedMean,
    section,{'data-source-forced-pressure':'EXPRESSION_REFERENCES_ONLY'});
  const angular=panel.pressure.angularRows.find(r=>r.key===selectedKey);
  add('code',angular.rows.map(r=>'m='+r.m+': '+JSON.stringify(r.pressure)).join('; '),section,{'data-source-forced-angular-pressure':'ALL_SIGNED_MODES'});
  add('p','최종 전체 current 증명 파일에 포함될 단일 전체 압력 ID는 이 저장 기록에서 복구하지 않았습니다.',section);
  add('h4','유지한 급수·미분 범위',section);
  add('code','Volterra tail ≤ F·L·exp(M·L)·(M·L)^N/(N+1)!',section);
  add('p','실제 계수와 시간 도함수로 만든 F·M·L 표현식을 보존합니다. 전체 혼합 파라미터 미분 및 균일 forcing class 검증은 남아 있습니다.',section);
  const notes=add('ul',undefined,section);for(const note of panel.notes)add('li',note,notes);
  add('a','전체 원본 실행 artifact 열기',section,{href:panel.fullArtifactURL,target:'_blank',rel:'noopener noreferrer',
    'data-source-forced-artifact':'full-record'});
  add('a','11개 원본 그래프와 압력·도함수 스냅샷 열기',section,{href:panel.sourceSnapshotIndexURL,target:'_blank',rel:'noopener noreferrer',
    'data-source-forced-snapshots':'complete-source-bytes'});
  add('p','원본 artifact SHA-256: '+panel.sourceArtifact.sha256,section);
  host.append(section);return section;
}
