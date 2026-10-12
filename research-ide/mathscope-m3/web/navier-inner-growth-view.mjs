/** Presentation of the original source enclosures; no new field evaluation. */
const copy=x=>JSON.parse(JSON.stringify(x));
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_INNER_GROWTH_VIEW'});};
const rational=/^-?\d+(?:\/[1-9]\d*)?$/;

function source(result){
  if(result?.package!=='N7'||result.operation!=='inner-growth-record')return null;
  const r=result.results,c=r?.certificate;
  if(r?.schema!=='MathScope.N7.RecordedInnerGrowth/1'||r.recordedOnly!==true||r.freshSourceConstructorExecuted!==false||r.archiveVerification?.pass!==true)
    fail('The original inner path needs a verified recorded archive.');
  if(c?.schema!=='MathScope.N7.ActualInnerGrowth/1'||c.scope.originalCompleteN6FieldConstructed!==false||c.scope.sourcePaperTheoremsUsedAsExternalDependencies!==true||c.scope.newLeanKernelProof!==false)
    fail('The original source scope was changed.');
  const bridge=c.claims.originalLocalizedPath;
  if(bridge.status!=='CONDITIONAL_ON_EXTERNAL_SOURCE_THEOREM_IDENTIFICATION'||bridge.dependencies.length!==2||!bridge.dependencies.some(d=>d.includes('Proposition9.9'))||!bridge.dependencies.some(d=>d.includes('Proposition10.1')))
    fail('The external support and localization identifications are required.');
  if(result.observations?.samples?.length||result.observations?.curves?.length)
    fail('Exact source node IDs are not space or time samples.');
  if(JSON.stringify(c.rows.map(r=>r.depth))!=='[0,2,4,8,12]')fail('All five original enclosure depths are required.');
  for(const row of c.rows){
    if(!rational.test(row.interval.lower)||!rational.test(row.interval.upper)||!rational.test(row.remainderAbsUpper)
      ||row.displayEnclosure.length!==2||!row.displayEnclosure.every(Number.isFinite)||!(row.displayEnclosure[0]<row.displayEnclosure[1])
      ||row.physicalVelocity.binary64!==null||row.finiteSumMidpointUsed!==false||row.externalSourceTheoremBridgeRequired!==true)
      fail('A source enclosure or its exact physical interpretation changed.');
    for(const stem of ['tau','time','logTau','radius','velocityScale']){
      const id=c.formulaProgram.roots[stem+'_'+row.depth];
      if(!Number.isInteger(id)||!c.formulaProgram.nodes[id])fail('A full exact source expression is missing.');
    }
  }
  return {r,c};
}

export function buildInnerGrowthPanel(result){
  const data=source(result);if(!data)return null;const {r,c}=data;
  return {id:'N7-original-inner-growth',label:'원래 내부 경로 · 정규화된 속도의 엄밀 구간',
    xLabel:'관측 깊이 d · 실제 τ는 정확한 수식으로 보존',
    yLabel:'(CSelected√Λ/2) τ^A uθ',quantity:c.rows[0].normalizedQuantity,
    rows:c.rows.map(row=>({depth:row.depth,lower:row.displayEnclosure[0],upper:row.displayEnclosure[1],
      exactInterval:copy(row.interval),remainderAbsUpper:row.remainderAbsUpper,
      normalizedQuantity:row.normalizedQuantity,sourceTauNode:row.tau,
      formulaTauNode:c.formulaProgram.roots['tau_'+row.depth]})),
    notes:['막대 전체가 엄밀한 포함 구간입니다. 점의 중간값을 계산한 속도로 표시하지 않으며, 관측 깊이 사이를 보간하지 않습니다.',
      '세로축은 양의 정확한 배율로 정규화했습니다. 원래 e₀의 하한과 Cτ^(2h), 물리 속도의 배율은 정확한 수식으로 보존됩니다.',
      '원래 M2 배경의 내부 경로를 계산한 저장 자료입니다. 최종 국소장과의 동일성은 원문의 Proposition 9.9와 10.1에 의존합니다.',
      '화면과 replay는 출처를 확인합니다. 전체 N6 장 또는 새 Lean 증명을 이번 브라우저 실행에서 생성하지 않습니다.'],
    sourceArtifact:copy(r.artifact),archiveSHA256:r.archiveSHA256,formulaProgramSHA256:c.graph.scalarProgramSHA256,
    externalDependencies:copy(c.claims.originalLocalizedPath.dependencies),
    recordedOnly:true,freshSourceConstructorExecuted:false,finitePlotUsedAsBlowupProof:false,
    physicalPointSamplesGenerated:false,completeN6:false,newLeanExecuted:false};
}

export function innerGrowthSummary(result){
  const data=source(result);if(!data)return null;const {r,c}=data;
  return {schema:'MathScope.N7.InnerGrowthDisplaySummary/1',recordedOnly:true,freshSourceConstructorExecuted:false,
    receipt:copy(r.receipt),gate:copy(r.gate),artifact:copy(r.artifact),archiveSHA256:r.archiveSHA256,
    sourceValidation:copy(r.sourceValidation),sourceBinding:copy(c.sourceBinding),
    point:c.point.formula,leading:{formula:c.leading.formula,
      exactCoreInterval:copy(c.leading.freshCore.phi.rows[0].actualNonlinearInterval),
      positiveScale:'eScale=2/(CSelected*sqrt(Lambda))>0',physicalLower:'1/(CSelected*sqrt(Lambda))>0'},
    remainder:{inequality:c.remainder.inequality,coefficient:'C=B_1,0+B_2,0+1/4',
      commonSequence:c.remainder.exactSourceSequence,allOrderProof:c.remainder.allOrderProof,
      observationProof:c.remainder.observationProof},
    localization:copy(c.localization),annularRestriction:copy(c.annularRestriction),
    claims:copy(c.claims),scope:copy(c.scope),
    formulaProgram:{sha256:c.graph.scalarProgramSHA256,nodeCount:c.graph.scalarNodeCount,
      roots:copy(c.formulaProgram.roots),fullProgramExportPath:'result.results.certificate.formulaProgram',
      allNodesRetainedInExport:true,nodesOmittedOnlyFromDOM:true},
    independentVerification:copy(r.independentVerification)};
}

export function innerGrowthSelection(result,depth){
  const data=source(result);if(!data)fail('This result has no original inner-path enclosures.');
  const {r,c}=data,row=c.rows.find(row=>row.depth===depth);if(!row)fail('Choose one of the recorded source depths.');
  const names=['Lambda','CSelected','h','A','D','Xin','eScale','eLower','C','normalizedRemainder','plateau','shrinkLog',
    ...['tau','time','logTau','radius','velocityScale','timeCutoffArgument','radialCutoffArgument'].map(name=>name+'_'+depth)];
  const roots=Object.fromEntries(names.map(name=>[name,c.formulaProgram.roots[name]]));
  return {schema:'MathScope.N7.InnerGrowthSelection/1',depth,exactSourceRow:copy(row),
    sourceArtifact:copy(r.artifact),archiveSHA256:r.archiveSHA256,
    exactFormulas:{tau:'tau_d=plateau*exp(-(log(1+4*C/eScale)+d*log(2))/(2*h))',
      point:c.point.formula,scaledVelocity:row.normalizedQuantity,
      physicalVelocity:'u_theta=eScale*tau_d^(-A)*intervalMultiplier',
      leading:c.leading.formula,remainder:c.remainder.inequality},
    scalarProgram:{sha256:c.graph.scalarProgramSHA256,roots,
      sourceNodeIds:copy(Object.fromEntries(names.map(name=>[name,c.formulaProgram.sourceNodeIds[roots[name]]]))),
      fullProgramExportPath:'result.results.certificate.formulaProgram'},
    externalFinalFieldIdentification:copy(c.claims.originalLocalizedPath),
    observationClaimIds:['N7-O-inner-growth'],recordedOnly:true,freshSourceConstructorExecuted:false,
    selectionPersistence:'PAGE_LOCAL_ONLY; all exact rows and the complete formula program remain in every export',
    sourceChangedBySelection:false,physicalTimeOrVelocityRoundedToBinary64:false,
    completeN6:false,newLeanExecuted:false};
}

/** Render enclosure bars only: no midpoint markers, fitted line or false tau. */
export function renderInnerGrowthChart(host,panel,{selectedDepth=0,onSelect=()=>{}}={}){
  if(panel?.id!=='N7-original-inner-growth'||!panel.rows?.length)fail('Expected an original inner-path panel.');
  const doc=host.ownerDocument,ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 760 340');svg.setAttribute('role','img');
  svg.setAttribute('aria-label',panel.label+'。막대는 엄밀한 포함 구간이고, 가로축은 실제 시간이 아닌 관측 깊이 d입니다. 같은 원본은 아래 표에서 키보드로 선택할 수 있습니다.');
  svg.setAttribute('data-inner-growth-chart','source-enclosures');svg.style.width='100%';
  const add=(tag,attrs,text,parent=svg)=>{const node=doc.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));if(text!==undefined)node.textContent=text;parent.append(node);return node;};
  add('title',{},panel.label);add('desc',{},'정확한 원래 경로의 source-bound 포함 구간. 계산되지 않은 물리 시간이나 속도를 유한 숫자로 만들지 않습니다. 최종 국소장의 해석은 명시된 외부 원문 정리에 의존합니다.');
  const ymax=Math.max(...panel.rows.map(row=>row.upper))*1.12,X=d=>92+600*d/12,Y=v=>270-215*v/ymax;
  add('text',{x:92,y:25,fill:'#d9edf0','font-size':14},panel.yLabel);
  for(let i=0;i<=4;i++){const v=ymax*i/4;add('line',{x1:92,x2:692,y1:Y(v),y2:Y(v),stroke:'#31505f'});add('text',{x:80,y:Y(v)+4,fill:'#b7ccd5','text-anchor':'end','font-size':12},Number(v.toPrecision(4)).toString());}
  for(const row of panel.rows){
    const selected=row.depth===selectedDepth,color=selected?'#ffe49a':'#89e1c6',g=add('g',{'data-depth':row.depth,'data-enclosure-kind':'SOURCE_BOUND_EXACT_RATIONAL'});
    add('line',{x1:X(row.depth),x2:X(row.depth),y1:Y(row.lower),y2:Y(row.upper),stroke:color,'stroke-width':selected?4:2.5,'data-enclosure-bar':row.depth},undefined,g);
    for(const endpoint of [row.lower,row.upper])add('line',{x1:X(row.depth)-10,x2:X(row.depth)+10,y1:Y(endpoint),y2:Y(endpoint),stroke:color,'stroke-width':2,'data-enclosure-cap':row.depth},undefined,g);
    const hit=add('rect',{x:X(row.depth)-22,y:48,width:44,height:230,fill:'transparent',role:'button',tabindex:0,
      'aria-label':'깊이 '+row.depth+'의 정확한 원본 구간 선택','aria-pressed':String(selected),'data-depth-select':row.depth},undefined,g);
    const choose=()=>onSelect(row.depth);hit.addEventListener('click',choose);hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}});
    add('title',{},'d='+row.depth+'; exact interval=['+row.exactInterval.lower+', '+row.exactInterval.upper+']; normalized remainder ≤ '+row.remainderAbsUpper,g);
    add('text',{x:X(row.depth),y:294,fill:'#d9edf0','text-anchor':'middle','font-size':13},String(row.depth));
  }
  add('text',{x:392,y:325,fill:'#bbd5df','text-anchor':'middle','font-size':12},panel.xLabel);
  host.append(svg);return svg;
}
