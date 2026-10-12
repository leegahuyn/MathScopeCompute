/** Pure exact tables for the recorded original domain and heat exterior.
 * Archive verification belongs to the source consumer. This view keeps its
 * source ratios, positive scales, exact formulas and restricted scope.
 * It never turns source expression IDs into physical plot coordinates.
 */
const copy=value=>structuredClone(value),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_DOMAIN_EXTERIOR_VIEW'});};
const sha=/^[a-f0-9]{64}$/,integer=/^-?\d+$/;
const orders=[0,1,2,3,4];
const formulaAt=(formula,order)=>formula.replace(/j\b/g,String(order));
const domainRows=[
  {id:'permitted-source-domain',label:'원본 공통 정의역에서 선택한 qBig',ratio:'qBig / q_common',value:'1/64',
    meaning:'실행한 common6 초기 전제에 Lemma 9.7과 Proposition 9.9를 적용한 정의역'},
  {id:'cutoff-support',label:'cutoff 지지집합의 시간 상한',ratio:'q_support_bound / qBig',value:'1/4',
    meaning:'q_support ≤ qBig/4 < qBig/2'},
  {id:'strict-source-gap',label:'허용 반 정의역까지의 엄격한 여유',ratio:'(qBig/2 − q_support_bound) / qBig',value:'1/4',
    meaning:'q_support_bound = qBig/4이므로 양의 여유가 정확히 남음'}
];

function source(result){
  if(result?.package!=='N7'||result.operation!=='source-domain-exterior-record')return null;
  const r=result.results,o=result.observations,d=r?.domain,e=r?.exterior;
  if(r?.schema!=='MathScope.N7.RecordedSourceDomainExterior/1'||r.recordedOnly!==true
      ||r.freshSourceConstructorExecuted!==false||r.archiveVerification?.pass!==true||!sha.test(r.archiveSHA256)
      ||!r.checks?.length||r.checks.some(row=>!row.pass)
      ||r.completeN6!==false||r.completeN7!==false||r.fullFinalFieldConstructed!==false
      ||r.wholeLocalizedForceConstructed!==false||r.wholeKEnergyNearTerminalComputed!==false
      ||r.globalForceExtensionConstructed!==false||r.newLeanExecuted!==false||r.wholeM3Complete!==false)
    fail('A verified recorded domain/exterior archive with its original incomplete final-field scope is required.');
  if(o?.kind!=='SOURCE_DOMAIN_AND_EXTERIOR_TERMINAL_FORCE_JETS'||!Array.isArray(o.samples)||o.samples.length
      ||!Array.isArray(o.curves)||o.curves.length||o.contract?.originalHeatExteriorRestrictionOnly!==true
      ||o.contract.fullFinalN6FieldConstructed!==false||o.contract.wholeKEnergyNearTerminalComputed!==false)
    fail('Keep the exact source formulas separate from physical velocity samples or whole-field energy.');
  if(!sha.test(r.domainArtifact?.sha256)||!sha.test(r.exteriorArtifact?.sha256)
      ||!same(o.contract.domainArtifact,r.domainArtifact)||!same(o.contract.sourceArtifact,r.exteriorArtifact)
      ||!same(o.contract.completeScalarProgram,r.fullScalarProgram)
      ||r.fullScalarProgram?.fullArtifactRetainedInRepository!==true
      ||r.fullScalarProgram.completeFormulaProgramIncludedInThisRecord!==false
      ||r.fullScalarProgram.scalarProgramSHA256!==e?.graph?.scalarProgramSHA256)
    fail('Retain the exact source artifact and full scalar-program links.');
  if(d?.initialPrerequisites?.length!==5||d.checks?.length!==12||d.checks.some(row=>!row.pass)
      ||d.constants?.domainRatio!=='1/64'||d.domainProof?.sourceTheoremAppliedToExecutedInitialPremises!==true
      ||d.domainProof.newLeanKernelProof!==false||d.domainProof.finalCorrectionSequenceExecuted!==false
      ||d.scope?.fullN6FinalPotentialsConstructed!==false||d.cutoffConclusions?.actualNonzeroFinalN6FieldValuesComputed!==false
      ||o.domain?.qBigOverCommonQStar!=='1/64'||o.domain.supportOverQBig!=='1/4'
      ||o.domain.strictHalfDomainGap!=='1/4'||o.domain.initialPrerequisiteCount!==5||o.domain.allInitialChecksPass!==true
      ||!same(o.domain.sourceTheoremPages,d.domainProof.sourcePages))
    fail('The executed source prerequisites, exact support ratios and explicit source-theorem application are required.');
  for(const key of ['initialZeroInterval','compactK','unitPlateau'])
    if(!same(o.domain[key],d.cutoffConclusions[key]))fail('A source cutoff conclusion changed in the display observations.');
  if(d.cutoffConclusions.initialZeroInterval.positiveLength!==true||d.cutoffConclusions.compactK.independentOfTime!==true
      ||d.cutoffConclusions.unitPlateau.spatialNeighborhoodFixed!==true
      ||e?.scope?.originalHeatRestrictionOnly!==true||e.scope.fullImproperPressureJetIntegralRetained!==true
      ||e.scope.wholeFinalN6FieldConstructed!==false||e.scope.wholeGlobalTerminalForceJetsConstructed!==false
      ||e.scope.wholeKEnergyNearTerminalComputed!==false||e.scope.globalForceExtensionConstructed!==false
      ||!same(o.initialZeroEnergy,e.initialZeroBranch)||!same(o.globalForceExtension,e.globalExtension)
      ||o.initialZeroEnergy.activeNearTerminalWholeKEnergyComputed!==false
      ||o.globalForceExtension.forceAfterTerminalTimeConstructed!==false)
    fail('Retain the fixed compact support and distinguish initial zero energy from unresolved active whole-K energy.');
  if(!same(e.rows?.map(row=>row.order),orders)||!same(o.forceRows?.map(row=>row.order),orders))
    fail('All five recorded exterior source derivative orders are required.');
  for(const [index,row]of e.rows.entries()){
    const view=o.forceRows[index],mid=row.midpoint;
    if(row.actualSourceAmplitudeUsed!==true||row.numericalGlobalFieldFilledIn!==false
        ||row.terminalLimitIsAwayFromSingularOrigin!==true||view.wholeGlobalJet!==false||view.tinyPositiveHRetained!==true
        ||mid?.normalizedRadial?.scale!=='S_j/r_mid>0'||mid.normalizedRadial.sign!=='STRICTLY_POSITIVE'
        ||mid.normalizedTheta?.scale!=='K_j>0'||mid.normalizedTheta.sign!=='STRICTLY_NEGATIVE'||mid.normalizedTheta.tinyHRetained!==true
        ||mid.normalizedDivergence?.scale!=='S_j>0'||mid.normalizedDivergence.sign!=='STRICTLY_NEGATIVE'
        ||view.radial!==mid.normalizedRadial.formula||view.theta!==mid.normalizedTheta.formula
        ||view.divergence!==mid.normalizedDivergence.formula||view.pressure!==row.pressureJet
        ||view.radialSign!=='POSITIVE'||view.thetaSign!=='NEGATIVE'||view.divergenceSign!=='NEGATIVE'
        ||view.pressurePoissonIdentity!==mid.originalPressurePoisson?.equation||mid.originalPressurePoisson.holdsExactly!==true)
      fail('Every force row needs its actual source amplitude, positive normalization, nonzero divergence and exact Poisson identity.');
    for(const key of ['velocityPolynomial','squarePolynomial'])
      if(!same(view[key],row.polynomials?.[key])||!Array.isArray(view[key])||!view[key].length||view[key].some(x=>!integer.test(x)))
        fail('Retain the exact polynomial coefficients of each source heat derivative.');
  }
  return {r,o,d,e};
}

export function buildSourceDomainExteriorPanel(result){
  const data=source(result);if(!data)return null;const {r,o,d,e}=data;
  return {id:'N7-original-source-domain-exterior',label:'원본 정의역 · heat 외곽의 종단 외력',
    domainRows:copy(domainRows),domain:copy(o.domain),
    initialPrerequisites:d.initialPrerequisites.map(row=>({id:row.id,source:row.source})),
    sourceTheoremReferences:copy(d.domainProof.references),sourceTheoremPages:copy(d.domainProof.sourcePages),
    location:'r*² = 3/8, z = 0, τ ↓ 0; 원본 반지름 cutoff의 중간 지점',
    normalizations:{sourceExponent:'A = 1/2 + h, 원본 h > 0',radius:'r* = sqrt(3/8)',sourceRadialCoordinate:'s* = r*²/2 = 3/16',
      velocityJet:'K_j = c∞ · 2^j · P_j(h) · (3/16)^(-A-j) > 0',
      squareJet:'S_j = c∞² · 2^j · D_j(h) · (3/16)^(-2A-j) > 0',
      amplitude:'c∞ = sqrt(2) · 원본 M2 heat exteriorAmplitude',
      polynomialConvention:'계수 배열은 h의 오름차순입니다. P_j=(h)_j(1+h)_j, D_j=Σ binom(j,k) P_k P_(j-k).',
      physicalScalarsReplacedByDisplayNumbers:false},
    forceRows:e.rows.map((row,index)=>({id:'exterior-order-'+row.order,order:row.order,
      radial:{formula:formulaAt(o.forceRows[index].radial,row.order),exactTemplate:o.forceRows[index].radial,
        positiveScale:formulaAt(row.midpoint.normalizedRadial.scale,row.order),sign:'POSITIVE',expression:row.midpoint.normalizedRadial.expression},
      theta:{formula:formulaAt(o.forceRows[index].theta,row.order),exactTemplate:o.forceRows[index].theta,
        positiveScale:formulaAt(row.midpoint.normalizedTheta.scale,row.order),sign:'NEGATIVE',expression:row.midpoint.normalizedTheta.expression},
      divergence:{formula:formulaAt(o.forceRows[index].divergence,row.order),exactTemplate:o.forceRows[index].divergence,
        positiveScale:formulaAt(row.midpoint.normalizedDivergence.scale,row.order),sign:'NEGATIVE',expression:row.midpoint.normalizedDivergence.expression},
      pressure:formulaAt(row.pressureJet,row.order),velocityPolynomial:copy(row.polynomials.velocityPolynomial),
      squarePolynomial:copy(row.polynomials.squarePolynomial),sourcePath:'result.results.exterior.rows['+index+']',
      exactSourceNodeIds:copy(row.expressions),wholeGlobalJet:false})),
    initialZeroEnergy:copy(o.initialZeroEnergy),globalForceExtension:copy(o.globalForceExtension),
    sourceArtifact:copy(r.exteriorArtifact),domainArtifact:copy(r.domainArtifact),fullScalarProgram:copy(r.fullScalarProgram),
    archiveSHA256:r.archiveSHA256,recordedOnly:true,freshSourceConstructorExecuted:false,
    finalFieldIdentityStatus:r.finalFieldIdentityStatus,physicalVelocitySamplesGenerated:false,
    completeN6:false,completeN7:false,wholeM3Complete:false,newLeanExecuted:false,
    notes:['아래 외력은 지정된 양의 반지름에서 원본 heat 외곽과 cutoff를 적용한 종단 극한입니다. 각 열은 표시한 양의 배율로 나눈 정확한 식입니다.',
      '매우 작은 원본 h를 그대로 유지합니다. 특히 j=0의 방위각 외력 −64h도 엄격히 음수이며 0으로 반올림하지 않습니다.',
      '압력은 무한대까지의 원래 적분 꼬리를 포함합니다. ∇·F_j는 음수이며 압력 Poisson 식에서 제거하지 않습니다.',
      '정의역 전제와 원본 정리의 적용은 별도 실행 기록으로 검증했습니다. 배경장 국소화를 최종장으로 식별하려면 아직 실행되지 않은 최종 N6 장과 Proposition 9.9·10.1의 동일성이 필요합니다.',
      '초기 시간 구간의 전체 K 에너지는 cutoff에 의해 정확히 0입니다. 종단 근처의 활동 구간 전체 에너지, 모든 위치의 외력 미분과 t>1의 전역 연장은 아직 계산되지 않았습니다.']};
}

export function sourceDomainExteriorSummary(result){
  const data=source(result);if(!data)return null;const {r,o,d,e}=data;
  return {schema:'MathScope.N7.SourceDomainExteriorDisplaySummary/1',recordedOnly:true,freshSourceConstructorExecuted:false,
    archiveSHA256:r.archiveSHA256,sourceReceipt:copy(r.receipt),gate:copy(r.gate),sourceCapture:copy(r.sourceCapture),
    sourceBinding:copy(d.sourceBinding),domainArtifact:copy(r.domainArtifact),exteriorArtifact:copy(r.exteriorArtifact),
    domain:copy(o.domain),domainProof:copy(d.domainProof),domainScope:copy(d.scope),
    initialPrerequisiteIds:d.initialPrerequisites.map(row=>row.id),domainChecks:copy(d.checks),
    exteriorDomain:copy(e.domain),sourceAmplitudeFormula:e.sourceBinding.cInfinityFormula,
    forceRows:copy(o.forceRows),initialZeroEnergy:copy(o.initialZeroEnergy),globalForceExtension:copy(o.globalForceExtension),
    fullScalarProgram:copy(r.fullScalarProgram),fullExactRowsExportPath:'result.results.exterior.rows',
    allExactRowsRetainedInExport:true,exactFormulaCoordinatesNotPhysicalSamples:true,
    finalFieldIdentityStatus:r.finalFieldIdentityStatus,wholeKEnergyNearTerminalComputed:false,
    completeN6:false,completeN7:false,wholeM3Complete:false,newLeanExecuted:false};
}

export function sourceDomainExteriorSelection(result,order){
  const data=source(result);if(!data)fail('This result has no recorded source domain/exterior table.');
  if(!Number.isSafeInteger(order)||!orders.includes(order))fail('Choose one of the recorded source derivative orders 0 through 4.');
  const {r,o,e}=data,row=e.rows.find(row=>row.order===order);
  return {schema:'MathScope.N7.SourceDomainExteriorSelection/1',order,exactSourceRow:copy(row),
    observedFormulas:copy(o.forceRows.find(row=>row.order===order)),sourceBinding:copy(e.sourceBinding),
    sourceArtifact:copy(r.exteriorArtifact),domainArtifact:copy(r.domainArtifact),archiveSHA256:r.archiveSHA256,
    domainProof:copy(r.domain.domainProof),fullScalarProgram:copy(r.fullScalarProgram),runHash:result.runHash,
    sourcePath:'result.results.exterior.rows['+order+']',finalFieldIdentification:copy(e.domain.finalN6Identification),
    originalPositiveHRetained:true,positivePhysicalScalesEvaluatedAsBinary64:false,
    sourceChangedBySelection:false,selectionPersistence:'PAGE_LOCAL_ONLY; every original source row is retained in every export',
    fullFinalN6FieldConstructed:false,wholeGlobalTerminalForceJetsConstructed:false,
    wholeKEnergyNearTerminalComputed:false,globalForceExtensionConstructed:false,
    completeN7:false,wholeM3Complete:false,newLeanExecuted:false};
}

/** Semantic HTML tables, with keyboard-operable 44px row-selection controls.
 * The renderer adds no curve or chart: its values are exact source formulas.
 */
export function renderSourceDomainExterior(host,panel,{selectedOrder=0,onSelect=()=>{}}={}){
  if(panel?.id!=='N7-original-source-domain-exterior'||!same(panel.forceRows?.map(row=>row.order),orders)
      ||!same(panel.domainRows,domainRows)||panel.physicalVelocitySamplesGenerated!==false||!orders.includes(selectedOrder))
    fail('Expected the five exact source rows, three source ratios and a recorded derivative order.');
  const doc=host.ownerDocument,add=(tag,text,parent,attrs={})=>{
    const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;
    for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));parent?.append(node);return node;
  },section=add('section',undefined,null,{'data-source-domain-exterior':'exact-source-tables','aria-label':panel.label});
  add('h3',panel.label,section);add('p','저장된 원본 실행 기록 재검증 · 정의역 초기 전제 5개 / 검사 12개 통과',section);
  const domainTable=add('table',undefined,section,{'data-source-domain-ratios':'true'});
  domainTable.style.width='100%';add('caption','원본 정의역의 정확한 비율 · 작은 실제 시간을 소수로 대체하지 않음',domainTable);
  const head=add('tr',undefined,add('thead',undefined,domainTable));
  for(const label of ['관계','정확한 비율','값','원본 적용 범위'])add('th',label,head,{scope:'col'});
  const body=add('tbody',undefined,domainTable);
  for(const row of panel.domainRows){const tr=add('tr',undefined,body,{'data-source-domain-ratio':row.id});
    add('th',row.label,tr,{scope:'row'});add('td',row.ratio,tr);add('td',row.value,tr);add('td',row.meaning,tr);}
  add('p','고정 지지집합 K: '+panel.domain.compactK.definition+'; 단위 plateau: '+panel.domain.unitPlateau.region,section);
  add('h4','외곽 종단 외력의 정확한 정규화식',section);add('p',panel.location,section);
  for(const key of ['sourceExponent','velocityJet','squareJet','amplitude'])add('p',panel.normalizations[key],section);
  const scroller=add('div',undefined,section,{tabindex:0,role:'region','aria-label':'0차부터 4차까지의 외력식 표。필요한 경우 가로로 이동하세요。'});
  scroller.style.overflowX='auto';
  const forceTable=add('table',undefined,scroller,{'data-source-exterior-forces':'true'});forceTable.style.width='100%';forceTable.style.minWidth='760px';
  add('caption','Fr,j/(S_j/r*) > 0; Fθ,j/K_j < 0; (∇·F_j)/S_j < 0. 모든 양의 원본 배율을 유지합니다.',forceTable);
  const forceHead=add('tr',undefined,add('thead',undefined,forceTable));
  for(const label of ['차수 j','Fr,j / (S_j/r*)','Fθ,j / K_j','(∇·F_j) / S_j','원본 행 선택'])add('th',label,forceHead,{scope:'col'});
  const forceBody=add('tbody',undefined,forceTable);
  for(const row of panel.forceRows){const tr=add('tr',undefined,forceBody,{'data-source-force-order':row.order});
    add('th',String(row.order),tr,{scope:'row'});
    for(const name of ['radial','theta','divergence']){
      const cell=add('td',undefined,tr,{'data-source-force-component':name});
      add('code',row[name].formula,cell);add('span',name==='radial'?' · 양수':' · 음수',cell);
      cell.style.padding='0.6rem';
    }
    const button=add('button',row.order+'차 원본 식',add('td',undefined,tr),{type:'button','data-source-exterior-order-select':row.order,
      'aria-label':row.order+'차 외곽 종단 외력의 원본 식과 양의 배율 선택','aria-pressed':String(row.order===selectedOrder)});
    button.style.minHeight='44px';button.style.minWidth='88px';
    button.addEventListener('click',()=>onSelect(row.order));
  }
  add('p','원본 압력: p_j = −S_j/[2(2A+j)] = −∫ᵣ^∞ S_j(ρ)/ρ dρ. 고정된 유한 반지름에서 적분 꼬리 전체를 유지합니다.',section);
  add('p','초기 영 구간 '+panel.domain.initialZeroInterval.time+' 에서 전체 K 에너지·소산·외력의 일 = 0. 활동 구간의 전체 에너지 값은 아직 없습니다.',section,
    {'data-source-initial-zero-energy':'INITIAL_INTERVAL_ONLY'});
  const notes=add('ul',undefined,section);for(const note of panel.notes)add('li',note,notes);
  host.append(section);return section;
}
