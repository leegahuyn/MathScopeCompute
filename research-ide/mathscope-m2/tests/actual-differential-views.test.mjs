import test from 'node:test';
import assert from 'node:assert/strict';
import {actualDifferentialPanels,actualCovarianceSensitivityPanels,actualPulseJetPanels,actualFullCurlPanels} from '../visualization/actual-differential-panels.mjs';
import * as publicVisualization from '../visualization/index.mjs';
import {listM2Panels,makeM2Visualization} from '../visualization/m2-views.mjs';
import {SourceBoundScene,renderObservationTable} from '../visualization/renderer.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

// Display-contract fixtures only. No fixture below is accepted by any actual
// source constructor or presented as executed mathematical evidence. Actual
// source construction has its separate memory-intensive tests.
const expr=rootId=>({rootId,operation:'integral',arguments:[7,11,13],valueKind:'EXACT_CONVERGENT_SOURCE_EXPRESSION'});
const base=(schema,request)=>({schema,status:'COMPLETED',pass:true,request,sourceProfile:'display-contract-fixture',
  parameterExpressionSHA256:'display-only-parameter-hash',graph:{sha256:'display-only-graph-hash',nodeCount:200000,
    canonicalBytes:30000000,compiler:'display-contract-fixture',compilerInput:request,graphIncluded:false},
  checks:[{id:'display-contract-fixture-only',pass:true}],
  scope:{fullPhysicalResidualAndFlatErrorPackageComplete:false,newLeanKernelProof:false,originalM2AcceptanceCountChanged:false},
  domain:{ellExact:'1',fixedLabel:true,exercisedMember:{certifiedBandMembership:false,determinantNonzeroCertified:false,positiveWeightsCertified:false}},
  interpretation:'Display-only fixture. Whole-source numerical evaluation and global residual are not certified.'});

function covarianceFixture(){
  const d=base('MathScope.ActualCovarianceSensitivityCertificate/1',{ellExact:'1',slowCoordinate:'R',derivativeOrder:1,terms:0});
  d.scope={...d.scope,actualSourceFirstCovarianceDerivativeConstructed:true,actualThetaZMassIntegralsDifferentiated:true,
    positiveWeightsOfExercisedMemberCertified:false,squareRootWeightsConstructed:false,actualNumericalWholeHQuadrature:false};
  d.domain.inverse='Only on det(H) != 0';
  d.integralRows=[1,-1].flatMap((sign,i)=>['theta','z','mass'].map((component,j)=>({sign,component,
    originalRoot:100+i*20+j,derivativeRoot:101+i*20+j,finiteDerivativeRoot:102+i*20+j,
    absoluteErrorRoot:150+i,lowerRoot:160+i*10+j,upperRoot:170+i*10+j,
    originalHaarRoot:21,originalCutoffRoot:22,endpointDerivatives:[0,0],productCheck:true,leibnizCheck:true})));
  d.tailRows=[1,-1].map((sign,i)=>({sign,absoluteError:150+i,coarseAbsoluteError:190+i,envelopeSquaredIntegral:200+i,
    basisNorm:210+i,basisDerivativeNorm:220+i,wholeAugmentedNorm:230+i,factorialTail:240+i,
    augmentedMatrixNorm:250+i,augmentedInitialNorm:260+i,length:270,
    formula:'4*haarFactor*B*(B+Ba)*I*exp((K+Ka)*L)*tail_N*Integral_0^L psi^2*P^2 dv',
    convergence:'For a fixed finite band the factorial tail tends to zero.',
    productProof:'Two differentiated products, each with two product errors.',
    envelopeProof:'The original envelope retains 0<P<=1 on the pulse interval.',
    sourceDerived:true,errorTendsToZero:true,fixedComparisonFloor:false,numericalWholeIntegralEnclosure:false}));
  d.inverse={matrixRoots:[[301,302],[303,304]],matrixDerivativeRoots:[[305,306],[307,308]],targetRoots:[309,310],targetDerivativeRoots:[311,312],
    determinantRoot:313,weightRoots:[314,315],weightDerivativeRoots:[316,317],identity:'y_a=H^-1(T_a-H_a*y)',domain:'det(H) != 0',squareRootsConstructed:false,rationalChecks:true};
  d.target={sourceModule:'actual-covariance-source-target.mjs',definition:'s^(-A-1/2)*T0(X,eta)',terms:{thetaShear:400,zShear:401},bothShearTermsRetained:true};
  return d;
}

const derivatives=[['R',[1,0,0]],['Z',[0,1,0]],['T',[0,0,1]],['RR',[2,0,0]],['RZ',[1,1,0]],['RT',[1,0,1]],['ZZ',[0,2,0]],['ZT',[0,1,1]],['TT',[0,0,2]]];
function jetFixture(){
  const d=base('MathScope.ActualPulseJetCertificate/1',{ellExact:'1',terms:1});
  d.scope={...d.scope,secondSlowDerivativeSupported:true,mixedSlowDerivativeSupported:true,
    sourceDerivedParameterDependentFTCNorm:true,sourceGlobalC3Bound:false};
  d.derivativeRows=[1,-1].flatMap((sign,i)=>derivatives.flatMap(([coordinate,orders],j)=>['r','theta','z'].map((component,k)=>({
    sign,component,coordinate,orders,derivativeOrder:orders.reduce((a,b)=>a+b,0),derivative:expr(1000+i*100+j*3+k),
    finiteApproximation:expr(1300+i*100+j*3+k),absoluteTail:expr(1600+i*100+j*3+k),tailFormula:'I*exp(K*L)*(K*L)^(N+1)/(N+1)!',finiteApproximationIsExact:false}))));
  d.equationRows=[1,-1].map(sign=>({sign,directions:['R','Z','T'],augmentedDimension:20,originalODE:'w_v=M*w',
    variationODE:'w_a,v=M*w_a+M_a*w',secondVariationODE:'w_ab,v=M*w_ab+M_a*w_b+M_b*w_a+M_ab*w',
    matrixRoots:[[11,12],[13,14]],matrixFirstRoots:[[[21,22],[23,24]]],matrixSecondRoots:[[[31,32],[33,34]]],
    matrixTimeRoots:[[41,42],[43,44]],endpointFormula:'d_ab t(b(a),a) with every endpoint chain term',sourceJetAuditRowCount:42,
    originalInitial:[expr(50),expr(51)],matrixNorm:expr(52),matrixFirstNorms:[expr(53),expr(54),expr(55)],
    matrixSecondNorms:[[expr(56),expr(57),expr(58)]],sourceOfNorm:'Exact parameter-dependent FTC integrals of source coefficients.'}));
  d.endpointRows=[1,-1].flatMap((sign,i)=>['initial','middle','end'].flatMap((name,j)=>derivatives.map(([coordinate,orders],k)=>({
    sign,name,time:expr(2000+j),coordinate,orders,derivativeOrder:orders.reduce((a,b)=>a+b,0),
    amplitudeDerivative:[expr(2100+i*100+j*30+k*3),expr(2101+i*100+j*30+k*3),expr(2102+i*100+j*30+k*3)],
    absoluteTail:expr(2500+i*100+j*30+k*3),composedEndpointDifferentiated:true}))));
  d.convergence={method:'PARAMETER_DEPENDENT_FTC_NORMS',terms:1,slowDerivativeOrders:[1,2],directions:['R','Z','T'],
    sourceOfNorm:'Exact FTC envelope integrals',tailFormula:'I*exp(K*L)*(K*L)^(N+1)/(N+1)!',partialSumIsExactSolution:false,numericalWholeSourceEvaluation:false};
  d.nextDependency='Global C3 bounds and physical residual / flat-error remain separate obligations.';
  return d;
}

function curlFixture(){
  const d=base('MathScope.ActualFullCurlCertificate/1',{ellExact:'1',terms:0});
  d.scope={...d.scope,actualLocalFullCurlConstructed:true,exercisedBandPositiveWeightsCertified:false,actualGlobalSlowPartitionGluingComplete:false};
  d.domain.positiveWeights='Conditional on the original certified positive source domain; ell=1 membership is unproved.';
  d.curlRows=[1,-1].flatMap((sign,i)=>['r','theta','z'].map((component,j)=>({sign,component,potential:expr(3000+i*20+j),
    leading:expr(3100+i*20+j),curlRemainder:expr(3200+i*20+j),fullCoefficient:{real:expr(3100+i*20+j),imaginary:expr(3200+i*20+j)},
    weight:expr(3400+i),weightR:expr(3500+i),weightZ:expr(3600+i),transverseCutoffDerivative:expr(3700)})));
  d.divergenceRows=[1,-1].map(sign=>({sign,realExpression:expr(3800+sign),imaginaryExpression:expr(3900+sign),
    conditionalValue:[0,0],theorem:'div(curl A)=0 on the declared domain',premises:[{id:'mixed-derivative-commutation',pass:true}],domainMembershipCertified:false}));
  d.geometry={operator:'D_r=partial_R+M_i*d_r*R^(d_r-1)*partial_xi; D_z=epsilon*partial_Z',allLabelsAndRepresentativesFrozen:true};
  d.convergence={exactSourceVolterraLimitRetained:true,finiteSumSubstitutedForOriginalPulse:false,numericalWholeSourceEvaluation:false};
  d.nextDependency='Full curl alone is not a global physical residual / flat-error certificate.';
  return d;
}

const jobFor=(kind,d)=>({id:'display-fixture:'+kind,request:{kind,input:d.request},result:{status:'COMPLETED',results:d,sourceHash:'display-source-hash',scope:d.scope},
  status:'COMPLETED',inputHash:'display-input-hash',resultHash:'display-result-hash'});
const jobs=[jobFor('ns.actual-covariance-sensitivity',covarianceFixture()),jobFor('ns.actual-pulse-jet',jetFixture()),jobFor('ns.actual-full-curl',curlFixture())];
const deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(deepFreeze);}return value;};
jobs.forEach(deepFreeze);
const get=(job,path)=>path.replace(/\[(\d+)\]/g,'.$1').split('.').reduce((value,key)=>value?.[key],job);

function checkTable(job,t){
  assert.equal(t.rows.length,t.sourcePaths.length);
  assert.equal(t.rows.length,t.cellSourcePaths.length);
  assert.equal(t.exactValuesUnabridged,true);
  assert.equal(t.cellLayout.overflowWrap,'anywhere');
  t.rows.forEach((row,i)=>{
    assert.notEqual(get(job,t.sourcePaths[i]),undefined,t.sourcePaths[i]);
    assert.equal(row.length,t.columns.length);
    row.forEach((value,j)=>{if(t.cellSourcePaths[i][j])assert.deepEqual(value,get(job,t.cellSourcePaths[i][j]),t.cellSourcePaths[i][j]);});
  });
}

test('public UI routes select exact covariance, all-RZT jet and full-curl tables as the main view',()=>{
  assert.equal(publicVisualization.actualDifferentialPanels,actualDifferentialPanels);
  assert.equal(publicVisualization.actualCovarianceSensitivityPanels,actualCovarianceSensitivityPanels);
  assert.equal(publicVisualization.actualPulseJetPanels,actualPulseJetPanels);
  assert.equal(publicVisualization.actualFullCurlPanels,actualFullCurlPanels);
  for(const [i,job]of jobs.entries()){
    const before=canonicalStringify(job),panels=actualDifferentialPanels(job);
    assert.equal(panels.length,[5,4,3][i]);assert.equal(new Set(panels.map(p=>p.id)).size,panels.length);
    assert.deepEqual(listM2Panels(job).map(p=>p.id),panels.map(p=>p.id));
    for(const panel of panels){
      const view=makeM2Visualization(job,{panel:panel.id});
      assert.equal(view.state,'READY');assert.equal(view.title,panel.title);assert.equal(view.kind,'TABLE');
      assert.equal(view.binding.panelId,panel.id);assert.equal(view.binding.jobId,job.id);
      assert.equal(view.binding.inputHash,job.inputHash);assert.equal(view.binding.resultHash,job.resultHash);
      assert.equal(view.binding.sourceHash,job.result.sourceHash);assert.equal(view.binding.formalPass,false);
      assert.deepEqual(view.table.rows,panel.table.rows);
    }
    assert.equal(canonicalStringify(job),before);
  }
});

test('every exact table cell, axis, chart row and detail resolves to the retained fixture field without numeric marks',()=>{
  for(const job of jobs)for(const panel of actualDifferentialPanels(job)){
    assert.deepEqual(panel.scene,{points:[],lines:[],arrows:[],axes:[]});
    assert.equal(panel.chart.kind,'COMPARISON_TABLE');assert.equal(panel.chart.displayTransform,'EXACT_SOURCE_EXPRESSION_TO_TEXT');
    assert.equal(panel.observation.exactExpressionIdsArePhysicalValues,false);assert.equal(panel.observation.physicalDimension,0);
    assert.equal(panel.observation.numericalSensitivityQuadrature,false);assert.equal(panel.lod.changesComputation,false);
    for(const t of [panel.table,...panel.relatedTables])checkTable(job,t);
    panel.axisMetadata.forEach(a=>assert.notEqual(get(job,a.sourceField),undefined,a.sourceField));
    panel.details.forEach(d=>assert.deepEqual(d.value,get(job,d.sourcePath),d.sourcePath));
    assert.deepEqual(panel.chart.sourcePaths,panel.table.sourcePaths);
    assert.deepEqual(panel.chart.cellSourcePaths,panel.table.cellSourcePaths);
    assert.equal(panel.observation.globalOriginalCriteriaComplete,false);
    assert.equal(panel.observation.globalPhysicalResidualCertified,false);assert.equal(panel.observation.flatErrorCertified,false);
    assert.equal(panel.observation.fullNavierStokesSolutionOrRegularityClaim,false);
  }
});

test('all three components and both signs retain every first, second and mixed jet and endpoint direction',()=>{
  const job=jobs[1],panels=actualPulseJetPanels(job),main=panels[0],end=panels.find(p=>p.id==='pulse-jet-endpoints');
  assert.equal(main.table.totalRows,54);assert.equal(end.table.totalRows,54);
  assert.deepEqual(main.observation.slowDirections,['R','Z','T']);assert.deepEqual(main.observation.slowDerivativeOrders,[1,2]);
  assert.equal(main.observation.secondSlowDerivativeSupported,true);assert.equal(main.observation.mixedSlowDerivativeSupported,true);
  assert.equal(main.observation.firstSlowDerivativeOnly,false);assert.equal(main.observation.sourceGlobalC3Bound,false);
  assert.deepEqual([...new Set(main.table.rows.map(row=>row[2]))],derivatives.map(([coordinate])=>coordinate));
  assert.equal(main.table.rows.filter(row=>row[4]===2).length,36);
  for(const row of main.table.rows){assert.equal(row[9],false);assert(Number.isSafeInteger(row[5].rootId));assert(Number.isSafeInteger(row[7].rootId));}
  for(const coordinate of ['RZ','RT','ZT'])assert.equal(end.table.rows.filter(row=>row[3]===coordinate).length,6);
  assert(end.table.rows.every(row=>Number.isSafeInteger(row[7].rootId)&&row[8]===true));
  const norms=panels.find(p=>p.id==='pulse-jet-equations').relatedTables[0];
  assert(norms.rows.every(row=>Number.isSafeInteger(row[2].rootId)&&row[5].includes('FTC')));
});

test('covariance tables preserve H_a*y, Haar/cutoff/endpoints, nonzero tails, retained P squared and conditional inverse',()=>{
  const job=jobs[0],panels=actualCovarianceSensitivityPanels(job),d=job.result.results;
  assert.equal(panels[0].table.totalRows,6);assert.equal(panels[0].relatedTables[0].totalRows,6);
  const inverse=panels.find(p=>p.id==='covariance-sensitivity-inverse');
  assert(inverse.table.rows.some(row=>row[0]==='identity'&&row[1]==='y_a=H^-1(T_a-H_a*y)'));
  assert(inverse.table.rows.some(row=>row[0]==='squareRootsConstructed'&&row[1]===false));
  assert(inverse.table.rows.some(row=>row[0]==='domain'&&row[1]==='det(H) != 0'));
  const tail=panels.find(p=>p.id==='covariance-sensitivity-tail');
  assert.equal(tail.table.totalRows,2);assert(tail.table.rows.every(row=>row[1]>0));
  assert(tail.table.rows.every(row=>row[4].includes('Integral_0^L psi^2*P^2 dv')));
  for(const p of panels){assert.equal(p.observation.positiveWeightsOfExercisedMemberCertified,false);assert.equal(p.observation.squareRootWeightsConstructed,false);}
  const scope=panels.find(p=>p.id==='covariance-sensitivity-scope');
  assert(scope.relatedTables[0].rows.some(row=>row[0]==='exercisedMember'&&row[1]===d.domain.exercisedMember));
});

test('full curl keeps the remainder and potential and does not promote divergence to global residual or positive ell=1',()=>{
  const panels=actualFullCurlPanels(jobs[2]),d=jobs[2].result.results;
  assert.equal(panels[0].table.totalRows,6);assert.equal(panels[1].table.totalRows,2);
  panels[0].table.rows.forEach((row,i)=>{assert.deepEqual(row[2],d.curlRows[i].potential);assert.deepEqual(row[4],d.curlRows[i].curlRemainder);assert.deepEqual(row[5],d.curlRows[i].fullCoefficient);});
  for(const p of panels){assert.equal(p.observation.positiveWeightDomainIsConditional,true);assert.equal(p.observation.oneFixedSlowBoxOnly,true);assert.equal(p.observation.actualGlobalSlowPartitionGluingComplete,false);assert.equal(p.observation.conditionalZeroIsUnconditionalValue,false);assert.equal(p.observation.exercisedBandPositiveWeightsCertified,false);assert.equal(p.observation.globalPhysicalResidualCertified,false);assert.equal(p.observation.flatErrorCertified,false);}
  assert(panels[1].table.rows.every(row=>row[6]===false));assert(panels[1].table.columns[3].includes('조건 아래'));
  assert(panels[2].relatedTables[0].rows.some(row=>row[0]==='positiveWeights'&&row[1].includes('ell=1 membership is unproved')));
});

test('display row budgets preserve endpoints and cell bindings while frozen full results remain unchanged',()=>{
  for(const job of jobs){
    const before=canonicalStringify(job),all=actualDifferentialPanels(job),small=actualDifferentialPanels(job,{maxRows:3});
    for(const [i,p]of small.entries()){
      assert(p.table.rows.length<=3);assert.equal(p.table.totalRows,all[i].table.totalRows);
      for(const t of [p.table,...p.relatedTables]){assert(t.rows.length<=3);checkTable(job,t);}
      if(p.table.totalRows>3){assert(p.table.truncated);assert.deepEqual(p.table.rows[0],all[i].table.rows[0]);assert.deepEqual(p.table.rows.at(-1),all[i].table.rows.at(-1));}
      const view=makeM2Visualization(job,{panel:p.id,maxRows:3});checkTable(job,view.table);
    }
    assert.equal(canonicalStringify(job),before);
  }
});

test('changed inputs, failures, nonpassing certificates and malformed payloads cannot display a differential certificate',()=>{
  for(const job of jobs){
    assert.deepEqual(actualDifferentialPanels(job,{currentEditorMatches:false}),[]);
    const currentRequest={...job.request,input:{...job.request.input,terms:9}};
    assert.deepEqual(actualDifferentialPanels(job,{currentRequest}),[]);
    const stale=makeM2Visualization(job,{currentRequest});assert.equal(stale.state,'INPUT_CHANGED');assert.equal(stale.scene.points.length,0);
    for(const status of ['FAILED','CANCELLED','UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED']){
      for(const changed of [{...job,status},{...job,result:{...job.result,status}}]){
        assert.deepEqual(actualDifferentialPanels(changed),[]);
        assert.equal(makeM2Visualization(changed).kind,'STATE');
      }
    }
    for(const patch of [{pass:false},{schema:'foreign-schema'},{checks:null},{graph:null},{domain:null}]){
      assert.deepEqual(actualDifferentialPanels({...job,result:{...job.result,results:{...job.result.results,...patch}}}),[]);
    }
    assert(actualDifferentialPanels({...job,status:'PARTIAL',result:{...job.result,status:'PARTIAL'}}).length>0);
  }
  assert.deepEqual(actualDifferentialPanels(null),[]);
  assert.deepEqual(actualDifferentialPanels({...jobs[0],request:{kind:'ns.foreign'}}),[]);
});

function fakeCanvas(width){
  const calls=[],style={},ctx=new Proxy({},{get:(object,key)=>object[key]??((...args)=>{if(['moveTo','lineTo','arc','fillRect','strokeRect','fillText'].includes(key))calls.push([key,...args]);}),set:(object,key,value)=>(object[key]=value,true)});
  return {calls,style,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height:420,left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
}

test('all table panels produce finite narrow and wide canvas commands without source expression marks',()=>{
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{for(const width of [360,960]){
    const canvas=fakeCanvas(width),scene=new SourceBoundScene(canvas);
    for(const job of jobs)for(const panel of actualDifferentialPanels(job)){
      canvas.calls.length=0;scene.setVisualization(makeM2Visualization(job,{panel:panel.id}));
      assert.equal(canvas.dataset.renderReady,'true');assert.equal(canvas.dataset.sourceJobId,job.id);
      assert(canvas.calls.length>0);assert.equal(scene.projected.length,0);
      for(const call of canvas.calls)for(const value of call.slice(1))if(typeof value==='number')assert(Number.isFinite(value),panel.id+' '+call[0]);
    }
    scene.destroy();
  }}finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver;}
});

test('long symbolic expressions survive exact HTML table rendering without truncation or unsafe conversion',()=>{
  const job=structuredClone(jobs[1]),long='exp(-('+('9'.repeat(2400))+'))';
  job.result.results.derivativeRows[0].derivative={rootId:9007199254740991,operation:'sourceExpression',arguments:[long],valueKind:'EXACT_CONVERGENT_SOURCE_EXPRESSION'};
  const panel=actualPulseJetPanels(job)[0];checkTable(job,panel.table);
  assert.deepEqual(panel.table.rows[0][5],job.result.results.derivativeRows[0].derivative);
  assert(panel.chart.rows[0][5].includes(long));assert.equal(panel.scene.points.length,0);
  const doc={createElement(tag){return {tagName:tag.toUpperCase(),style:{},dataset:{},children:[],append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},setAttribute(){}};}};
  const body=doc.createElement('tbody');body.ownerDocument=doc;body.closest=()=>null;
  renderObservationTable(null,body,panel);
  assert.equal(body.children[0].children[5].textContent,JSON.stringify(job.result.results.derivativeRows[0].derivative));
  assert.equal(body.children[0].children[5].style.overflowWrap,'anywhere');
});
