/** Three separately normalized source interval panels. Exact source time and
 * physical scale expressions remain in the exported record, never plotted
 * as fabricated binary64 coordinates or midpoint samples.
 */
const copy=value=>structuredClone(value),fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_NEAR_TERMINAL_VIEW'});};
const rational=/^-?\d+(?:\/[1-9]\d*)?$/;
const COMPONENTS=[{name:'radial',label:'반지름 방향',quantity:'√Λ · τ^(1/2) · uᵣ'},
  {name:'azimuthal',label:'방위각 방향',quantity:'(CSelected√Λ/2) · τ^A · uθ'},
  {name:'axial',label:'축 방향',quantity:'τ^A · uz / j₀'}];

function source(result){
  if(result?.package!=='N8'||result.operation!=='source-near-terminal-record')return null;
  const r=result.results,c=r?.certificate;
  if(r?.schema!=='MathScope.N8.RecordedSourceNearTerminal/1'||r.recordedOnly!==true||r.freshSourceConstructorExecuted!==false
      ||r.archiveVerification?.pass!==true||c?.schema!=='MathScope.N8.ActualSourceNearTerminal/1')
    fail('A verified recorded original near-terminal source archive is required.');
  if(c.scope.fullN6FinalFieldConstructed!==false||c.scope.sourceFinalFieldIdentificationExternal!==true
      ||c.scope.newLeanKernelProof!==false||result.observations?.samples?.length||result.observations?.curves?.length)
    fail('The exact source scope or absence of fabricated spatial samples changed.');
  if(r.finalFieldBridge?.status!=='SOURCE_CORE_RESTRICTION_IDENTIFIED_BY_CHECKED_SUPPORT_INDUCTION'
      ||r.finalFieldBridge.domainInclusionAudit?.assertedMathematicalObstruction!==false
      ||r.finalFieldBridge.domainInclusionAudit.separateRecordedDomainProofVerified!==true
      ||r.finalFieldBridge.domainInclusionAudit.sameOriginalSourceBinding!==true
      ||r.finalFieldBridge.domainInclusionAudit.sameOriginalLocalizationQStar!==true
      ||r.finalFieldBridge.domainInclusionAudit.archiveSHA256!==r.domainPrerequisiteEvidence?.archiveSHA256
      ||r.domainPrerequisiteEvidence.finalN6FieldConstructed!==false
      ||r.finalFieldBridge.finalLocalizedCoreRestrictionIdentified!==true
      ||r.finalFieldBridge.finalLocalizedFieldIdentified!==false||r.finalFieldBridge.allFinalCorrectionClassesConstructed!==false)
    fail('The identified original core restriction and the separate all-space limitations must both remain visible.');
  const proof=r.coreRestrictionEvidence;
  if(r.newSupportProofExecuted!==true||proof?.newSupportProofExecuted!==true
      ||proof.scope?.actualInnerRestrictionIdentified!==true||proof.scope?.fullFinalN6FieldConstructed!==false
      ||proof.proofSHA256!==r.proofSHA256||!/^[a-f0-9]{64}$/.test(r.proofSHA256??'')
      ||proof.checks?.length!==8||proof.checks.some(row=>row.pass!==true)
      ||proof.supportInduction?.pass!==true
      ||result.observations?.contract?.finalCoreRestrictionIdentificationExternal!==false
      ||result.observations.contract.supportProofSHA256!==proof.proofSHA256)
    fail('The new checked support induction must identify this same original core and remain separate from the recorded source run.');
  const bridge=c.claims.finalLocalizedVelocity;
  if(bridge.status!=='EXTERNAL_SOURCE_THEOREM_IDENTIFICATION_REQUIRED'||bridge.dependencies.length!==2
      ||!bridge.dependencies.some(x=>x.includes('Proposition9.9'))||!bridge.dependencies.some(x=>x.includes('Proposition10.1')))
    fail('Preserve the historical source receipt and its original theorem dependencies.');
  if(JSON.stringify(c.rows.map(row=>row.depth))!=='[0,2,4,8,12]')fail('All recorded positive source-time depths are required.');
  for(const row of c.rows){
    if(row.tau.exactSign!=='POSITIVE'||row.tau.binary64!==null||row.samePointAndTimeForAllComponents!==true
        ||row.underflowReplacedByZero!==false||row.components.length!==3)
      fail('The three components no longer share the original exact positive source time.');
    for(const component of row.components){
      const box=component.interval;
      if(!COMPONENTS.some(item=>item.name===component.name)||!rational.test(box.lower)||!rational.test(box.upper)
          ||!rational.test(box.remainderAbsUpper)||box.midpointUsed!==false
          ||box.displayEnclosure.length!==2||!box.displayEnclosure.every(Number.isFinite)
          ||box.displayEnclosure[0]>=box.displayEnclosure[1]||component.physicalVelocity.binary64!==null)
        fail('A full exact component interval or its physical representation changed.');
      for(const stem of ['normalized_'+component.name,'physical_'+component.name]){
        const id=c.formulaProgram.roots[stem+'_'+row.depth];
        if(!Number.isInteger(id)||!c.formulaProgram.nodes[id])fail('A physical or normalized scale expression is missing.');
      }
    }
  }
  return {r,c};
}

export function buildNearTerminalPanel(result){
  const data=source(result);if(!data)return null;const {r,c}=data;
  return {id:'N8-original-near-terminal',label:'같은 원래 내부 경로 · 세 속도 성분의 엄밀 구간',
    xLabel:'관측 깊이 d · 실제 τ는 정확한 수식으로 보존',
    components:COMPONENTS.map(item=>({...item,rows:c.rows.map(row=>{
      const actual=row.components.find(component=>component.name===item.name);
      return {depth:row.depth,component:item.name,lower:actual.interval.displayEnclosure[0],upper:actual.interval.displayEnclosure[1],
        exactInterval:copy(actual.interval),remainderAbsUpper:actual.interval.remainderAbsUpper,
        normalizedQuantity:item.quantity,physicalPositiveScale:actual.physicalVelocity.positiveScale,
        sourceTauNode:row.tau.expression,formulaTauNode:c.formulaProgram.roots['tau_'+row.depth]};
    })})),
    rows:c.rows.map(row=>({depth:row.depth,components:copy(row.components),sourceTauNode:row.tau.expression})),
    notes:['각 방향은 서로 다른 양의 정확한 배율로 정규화했습니다. 세로축을 각각 읽으세요.',
      '막대 전체가 엄밀한 포함 구간입니다. 관측 깊이 사이의 값을 보간하거나 중간값을 실제 속도로 만들지 않습니다.',
      '원래 양의 τ와 물리 속도 배율은 정확한 수식으로 보존합니다. 0으로 반올림하지 않습니다.',
      '같은 common6/M2 배경장의 정의역은 별도 원본 실행에서 초기 전제 5개와 정의역 검사 12개를 확인한 뒤 Lemma 9.7과 Proposition 9.9를 적용했습니다. qBig/q_common=1/64와 지지집합의 1/4 비율을 정확히 유지합니다.',
      '새 지지 증명은 Xa/4<X<3Xa/4의 열린 내부 영역에서 모든 원문 보정항이 사라짐을 확인합니다. 동일한 원래 최종 장의 내부 경로에 세 성분 구간을 연결하며, 비영 환형 보정값과 전체 공간 장의 계산은 남아 있습니다.'],
    sourceArtifact:copy(r.artifact),archiveSHA256:r.archiveSHA256,formulaProgramSHA256:c.graph.scalarProgramSHA256,
    historicalTheoremDependencies:copy(c.claims.finalLocalizedVelocity.dependencies),finalFieldBridge:copy(r.finalFieldBridge),
    newSupportProofExecuted:true,supportProofSHA256:r.proofSHA256,finalLocalizedCoreRestrictionIdentified:true,recordedOnly:true,freshSourceConstructorExecuted:false,
    physicalPointSamplesGenerated:false,completeN6:false,completeN8:false,newLeanExecuted:false};
}

export function nearTerminalSummary(result){
  const data=source(result);if(!data)return null;const {r,c}=data;
  return {schema:'MathScope.N8.NearTerminalDisplaySummary/1',recordedOnly:true,freshSourceConstructorExecuted:false,
    receipt:copy(r.receipt),gate:copy(r.gate),artifact:copy(r.artifact),archiveSHA256:r.archiveSHA256,
    sourceBinding:copy(c.sourceBinding),point:copy(c.point),leadingIntervals:copy(c.leading.intervals),
    definitions:copy(c.leading.definitions),normalizedVelocity:c.leading.normalizedVelocity,physicalVelocity:c.leading.physicalVelocity,
    tail:{radial:c.tail.radial,tangentialAxial:c.tail.tangentialAxial,normalization:c.tail.componentNormalization,
      sampleDefinition:c.tail.sampleDefinition,exactErrorProof:c.tail.exactErrorProof},
    decimalSamples:c.decimalSamples.map(row=>({input:row.input,cutoffState:row.cutoffState,
      displayTime:row.displayTime,displayTimeRoundedToOne:row.displayTimeRoundedToOne,
      normalizedVelocity:copy(row.normalizedVelocity),physicalVelocity:copy(row.physicalVelocity),
      exactZeroExtension:row.localizedZeroBranchEvaluated,missingSourceValuesSetToZero:row.missingSourceValuesSetToZero})),
    lastResolvedTau:copy(r.lastResolvedTau),nextRefinementLimit:copy(r.nextRefinementLimit),finalFieldBridge:copy(r.finalFieldBridge),
    coreRestrictionEvidence:{proofSHA256:r.proofSHA256,newSupportProofExecuted:true,coreIdentity:copy(r.coreRestrictionEvidence.coreIdentity),
      checks:copy(r.coreRestrictionEvidence.checks),supportCheckCount:r.coreRestrictionEvidence.supportInduction.checks.length,
      fullSupportProofExportPath:'result.results.coreRestrictionEvidence'},
    domainPrerequisiteEvidence:{archiveSHA256:r.domainPrerequisiteEvidence.archiveSHA256,
      domainArtifact:copy(r.domainPrerequisiteEvidence.domainArtifact),sourceReceipt:copy(r.domainPrerequisiteEvidence.sourceReceipt),
      sourceCapture:copy(r.domainPrerequisiteEvidence.sourceCapture),gate:copy(r.domainPrerequisiteEvidence.gate),
      domainProof:copy(r.domainPrerequisiteEvidence.domain.domainProof),fullRecordedDomainExportPath:'result.results.domainPrerequisiteEvidence',
      finalN6FieldConstructed:false},
    historicalClaims:copy(c.claims),historicalSourceScope:copy(c.scope),scope:copy(r.scope),formulaProgram:{sha256:c.graph.scalarProgramSHA256,nodeCount:c.graph.scalarNodeCount,
      roots:copy(c.formulaProgram.roots),fullProgramExportPath:'result.results.certificate.formulaProgram',allNodesRetainedInExport:true,nodesOmittedOnlyFromDOM:true}};
}

export function nearTerminalSelection(result,depth){
  const data=source(result);if(!data)fail('This result has no original near-terminal interval panels.');
  const {r,c}=data,row=c.rows.find(row=>row.depth===depth);if(!row)fail('Choose a recorded source depth.');
  const names=['h','A','D','Lambda','CSelected','j0','C','Cstar','plateau','shrinkLog',
    ...['s','tau','time','radius','commonPhysicalScale',...COMPONENTS.flatMap(item=>['normalized_'+item.name,'physical_'+item.name])].map(stem=>stem+'_'+depth)],
    roots=Object.fromEntries(names.map(name=>[name,c.formulaProgram.roots[name]]));
  return {schema:'MathScope.N8.NearTerminalSelection/1',depth,exactSourceRow:copy(row),
    sourceArtifact:copy(r.artifact),archiveSHA256:r.archiveSHA256,
    exactFormulas:{time:c.tail.sampleDefinition,normalized:c.leading.normalizedVelocity,physical:c.leading.physicalVelocity,
      originalRadialRemainder:c.tail.radial,originalAzimuthalAxialRemainder:c.tail.tangentialAxial,errorProof:c.tail.exactErrorProof},
    scalarProgram:{sha256:c.graph.scalarProgramSHA256,roots,
      sourceNodeIds:Object.fromEntries(names.map(name=>[name,c.formulaProgram.sourceNodeIds[roots[name]]])),
      fullProgramExportPath:'result.results.certificate.formulaProgram'},
    historicalFinalFieldIdentification:copy(c.claims.finalLocalizedVelocity),finalDomainInclusion:copy(r.finalFieldBridge),
    currentCoreRestriction:{proofSHA256:r.proofSHA256,identity:copy(r.coreRestrictionEvidence.coreIdentity),newSupportProofExecuted:true},recordedOnly:true,freshSourceConstructorExecuted:false,
    selectionPersistence:'PAGE_LOCAL_ONLY; every exact row remains in the exported record',sourceChangedBySelection:false,
    physicalTimeOrVelocityRoundedToBinary64:false,completeN6:false,completeN8:false,newLeanExecuted:false};
}

export function renderNearTerminalChart(host,panel,{selectedDepth=0,onSelect=()=>{}}={}){
  if(panel?.id!=='N8-original-near-terminal'||panel.components?.length!==3)fail('Expected three separate original component panels.');
  const doc=host.ownerDocument,ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 760 690');svg.setAttribute('role','img');svg.style.width='100%';
  svg.setAttribute('aria-label','세 속도 성분의 엄밀 구간。서로 다른 정규화 세로축。가로축은 실제 시간이 아닌 관측 깊이 d。');
  svg.setAttribute('data-near-terminal-chart','source-component-enclosures');
  const add=(tag,attrs,text,parent=svg)=>{const node=doc.createElementNS(ns,tag);for(const [name,value]of Object.entries(attrs))node.setAttribute(name,String(value));if(text!==undefined)node.textContent=text;parent.append(node);return node;};
  add('title',{},panel.label);add('desc',{},'공통 정확한 양의 τ에서 계산된 세 방향의 전체 포함 구간。선분 사이 보간이나 중간값 표시 없음。원문 연산자 지지 증명이 같은 최종 장의 내부 경로를 식별。전체 공간 장의 재구성은 미완료。');
  for(let index=0;index<panel.components.length;index++){
    const component=panel.components[index],top=24+index*215,
      lo=Math.min(...component.rows.map(row=>row.lower)),hi=Math.max(...component.rows.map(row=>row.upper)),
      span=Math.max(hi-lo,1e-12),lower=lo-.12*span,upper=hi+.12*span,
      X=depth=>100+570*depth/12,Y=value=>top+170-125*(value-lower)/(upper-lower);
    add('text',{x:100,y:top,fill:'#d9edf0','font-size':14},component.label+' · '+component.quantity);
    for(let j=0;j<=3;j++){const value=lower+(upper-lower)*j/3;
      add('line',{x1:100,x2:670,y1:Y(value),y2:Y(value),stroke:'#31505f'});
      add('text',{x:87,y:Y(value)+4,fill:'#b7ccd5','text-anchor':'end','font-size':11},Number(value.toPrecision(5)).toString());}
    for(const row of component.rows){
      const selected=row.depth===selectedDepth,color=selected?'#ffe49a':'#89e1c6',g=add('g',{'data-component':component.name,'data-depth':row.depth});
      add('line',{x1:X(row.depth),x2:X(row.depth),y1:Y(row.lower),y2:Y(row.upper),stroke:color,'stroke-width':selected?3.5:2,
        'data-source-enclosure-bar':component.name+':'+row.depth},undefined,g);
      for(const value of [row.lower,row.upper])add('line',{x1:X(row.depth)-9,x2:X(row.depth)+9,y1:Y(value),y2:Y(value),stroke:color,'stroke-width':2},undefined,g);
      const hit=add('rect',{x:X(row.depth)-22,y:top+33,width:44,height:145,fill:'transparent',role:'button',tabindex:0,
        'aria-label':component.label+' 깊이 '+row.depth+' 원본 구간 선택','aria-pressed':String(selected),'data-source-depth-select':row.depth},undefined,g);
      hit.addEventListener('click',()=>onSelect(row.depth));hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(row.depth);}});
      add('title',{},'d='+row.depth+'; ['+row.exactInterval.lower+', '+row.exactInterval.upper+']; normalized remainder ≤ '+row.remainderAbsUpper,g);
      add('text',{x:X(row.depth),y:top+190,fill:'#d9edf0','font-size':12,'text-anchor':'middle'},String(row.depth));
    }
  }
  add('text',{x:385,y:680,fill:'#bbd5df','font-size':12,'text-anchor':'middle'},panel.xLabel);
  host.append(svg);return svg;
}
