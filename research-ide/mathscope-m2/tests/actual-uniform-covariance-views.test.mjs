import test from 'node:test';
import assert from 'node:assert/strict';
import {run,getExamples} from '../navier/index.mjs';
import {actualSourcePanels} from '../visualization/actual-source-panels.mjs';
import {listM2Panels,makeM2Visualization} from '../visualization/m2-views.mjs';
import {SourceBoundScene,renderObservationTable} from '../visualization/renderer.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

// Execute the current source constructor once. Do not pin a graph digest or
// reuse the old Imean point fixture as a uniform-family certificate.
const example=getExamples().find(x=>x.id==='ns-m2-actual-uniform-covariance');
assert(example);
const request=example.request,result=await run(request.kind,request.input,{precision:request.precision,budget:request.budget});
const job={id:example.id,request,result,status:result.status,inputHash:await sha256(canonicalStringify(request)),resultHash:result.resultHash};
const get=(path,source=job)=>path.replace(/\[\*\]/g,'[0]').replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],source);
const deepFreeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);for(const v of Object.values(x))deepFreeze(v);}return x;};
deepFreeze(job);
const panels=actualSourcePanels(job),panel=id=>panels.find(p=>p.id===id),d=result.results;

function tableBinding(table,source=job){
  assert.equal(table.rows.length,table.sourcePaths.length);
  assert.equal(table.rows.length,table.cellSourcePaths.length);
  assert.equal(table.exactValuesUnabridged,true);
  assert.equal(table.cellLayout.overflowWrap,'anywhere');
  table.rows.forEach((r,i)=>{
    assert.notEqual(get(table.sourcePaths[i],source),undefined,table.sourcePaths[i]);
    assert.equal(r.length,table.columns.length);
    r.forEach((v,j)=>{const path=table.cellSourcePaths[i][j];if(path)assert.deepEqual(v,get(path,source),path);});
  });
}

test('the final source route supplies ten panels with current job, input, result and source bindings',()=>{
  assert.equal(result.status,'COMPLETED',result.message);
  assert.equal(panels.length,10);assert.equal(new Set(panels.map(p=>p.id)).size,10);assert.equal(panels[0].id,'main');
  const before=canonicalStringify(job);
  assert.deepEqual(listM2Panels(job).map(p=>p.id),panels.map(p=>p.id));
  for(const p of panels){
    const view=makeM2Visualization(job,{panel:p.id});assert.equal(view.state,'READY');
    assert.equal(view.title,p.title);assert.equal(view.binding.panelId,p.id);assert.equal(view.binding.jobId,job.id);
    assert.equal(view.binding.inputHash,job.inputHash);assert.equal(view.binding.resultHash,job.resultHash);assert.equal(view.binding.sourceHash,result.sourceHash);
    assert.equal(p.binding,undefined,'the shared adapter owns source/job binding');
    assert.equal(p.sourceRoot,'result.results');
  }
  assert.equal(canonicalStringify(job),before);
});

test('every rendered point, exact table cell, matrix entry, axis and detail resolves to the retained source result',()=>{
  for(const p of panels){
    for(const mark of p.scene.points){assert(mark.pos.length===3&&mark.pos.every(Number.isFinite));assert.match(mark.sourcePath,/^result\.results\./);assert.deepEqual(mark.value,get(mark.sourcePath),mark.sourcePath);}
    for(const s of p.chart.series||[])for(const mark of s.points){assert([mark.x,mark.y].every(Number.isFinite));assert.deepEqual(mark.value,get(mark.sourcePath));}
    if(p.chart.kind==='MATRIX')p.chart.values.forEach((r,i)=>r.forEach((v,j)=>assert.deepEqual(v,get(p.chart.sourcePaths[i][j]))));
    tableBinding(p.table);p.relatedTables.forEach(t=>tableBinding(t));
    p.axisMetadata.forEach(a=>assert.notEqual(get(a.sourceField),undefined,a.sourceField));
    p.details.forEach(x=>assert.notEqual(get(x.sourcePath),undefined,x.sourcePath));
    assert.equal(p.lod.displayedPoints,p.scene.points.length);assert.equal(p.lod.changesComputation,false);
  }
});

test('the two zero cells certify the uniform-domain covariance identity and never a positive exercised member or PDE residual',()=>{
  const p=panel('main');assert.equal(p.kind,'MATRIX');assert.deepEqual(p.chart.values,[['0','0']]);assert.equal(p.scene.points.length,2);
  assert.equal(p.observation.kind,'ACTUAL_UNIFORM_FAMILY_GLOBAL_COVARIANCE_IDENTITY');
  assert.equal(p.observation.globalEquation730Certified,true);assert.equal(p.observation.originalN506Complete,true);
  assert.equal(d.uniformFamily.global730.scope.includes('not a numerical Navier-Stokes PDE residual'),true);
  assert.match(p.description,/수치.*PDE 잔차가 아닙니다/);
  assert.equal(d.exercisedMember.certifiedBandMembership,false);
  assert.equal(d.exercisedMember.positivityOfThisMemberCertified,false);
  assert.equal(d.exercisedMember.determinantNonzeroForThisMemberCertified,false);
  for(const view of panels){
    assert.equal(view.observation.exercisedMemberProvedInCertifiedDomain,false);
    assert.equal(view.observation.exercisedMemberPositivityCertified,false);
    assert.equal(view.observation.exercisedMemberDeterminantNonzeroCertified,false);
    assert.equal(view.observation.globalOriginalCriteriaComplete,false);
    assert.equal(view.observation.fullNavierStokesSolutionOrRegularityClaim,false);
    assert.equal(view.observation.allSlowDerivativeBoundsComputed,false);
  }
  const membership=p.relatedTables[0];
  for(const key of ['certifiedBandMembership','positivityOfThisMemberCertified','determinantNonzeroForThisMemberCertified']){
    const i=membership.sourcePaths.indexOf('result.results.exercisedMember.'+key);assert(i>=0);assert.equal(membership.rows[i][1],false);
  }
});

test('the original angular half, normalized Haar and single transverse mass remain exact expressions',()=>{
  const p=panel('uniform-covariance-normalization'),records=d.normalizationRows;
  assert.equal(p.kind,'TABLE');assert.equal(p.scene.points.length,0);
  assert.equal(records.find(x=>x.id==='angular-half').exactValue,'1/2');
  assert.equal(records.find(x=>x.id==='rectangle-jacobian').exactValue,'4-2*sqrt(2)');
  assert.equal(records.find(x=>x.id==='normalized-haar').exactValue,'1');
  assert.equal(records.find(x=>x.id==='transverse-mass').exactValue,'Integral chi_g^2 dxi');
  assert.equal(records.find(x=>x.id==='full-H-factor').exactValue,'(4-2*sqrt(2))*c_i*(Integral chi_g^2)/2');
  assert.equal(p.table.rows.length,6);assert.equal(p.table.rows[2][2],'별도 식 ID 없음');
});

test('operator marks display only stored bound exponents and exact-zero terms are not replaced by a fake exponent',()=>{
  const p=panel('uniform-covariance-operator-bounds');assert.equal(p.kind,'SERIES');assert(p.chart.series.every(s=>s.connect===false));
  const keys=['v','e','d'],expected=d.operatorBoundsRows.reduce((n,r)=>n+keys.filter(k=>Number.isFinite(r[k])).length,0);
  assert.equal(p.scene.points.length,expected);
  assert.equal(p.observation.operatorValuesNumericallyDisplayed,false);
  assert.equal(p.observation.boundBaseIsExactExpression,true);
  assert.equal(p.observation.exactZeroTermsOmittedFromExponentPlot,d.operatorBoundsRows.reduce((n,r)=>n+keys.filter(k=>r[k]===null).length,0));
  assert(p.scene.points.every(m=>Number.isSafeInteger(m.y)&&m.y>=0));
  assert(p.table.rows.some(r=>r[1]===null));assert.match(p.description,/null은 정확히 0/);
});

test('reference columns carry their positive symbolic error and the actual inverse keeps the negative physical orientation',()=>{
  const p=panel('uniform-covariance-columns');assert.deepEqual(p.chart.values,[[1,1],[-1,1]]);
  assert.equal(p.observation.displayIsReferenceMatrix,true);assert.equal(p.observation.actualHMatrixEntriesNumericallyDisplayed,false);
  assert(p.table.rows.every(r=>r[3]==='kappa/128'));
  assert.equal(d.uniformFamily.columns.determinantNormalizedLower,'15/8');
  const c=d.uniformFamily.columns,mass=p.relatedTables[0];
  assert.equal(c.actualMassLowerRoot,d.graph.rootIds.actualColumnMassLower);
  assert.notEqual(c.actualMassLowerRoot,c.gaussianMassCoefficientRoot);
  assert.match(c.actualMassLowerFormula,/haarFactor.*gaussianMassCoefficient.*sqrt\(Ls\)/);
  for(const key of ['actualMassLowerRoot','actualMassLowerFormula','gaussianMassCoefficientRoot']){
    const i=mass.sourcePaths.indexOf('result.results.uniformFamily.columns.'+key);assert(i>=0);assert.deepEqual(mass.rows[i][1],c[key]);
  }
  assert.equal(d.uniformFamily.columns.physicalDeterminantSign,'negative');
  assert.match(d.uniformFamily.columns.physicalOrientation,/\|det\(H\)\|/);
  assert.equal(panel('uniform-covariance-inverse').scene.points.length,0,'source root IDs must not become numeric weight marks');
  for(const r of d.inverseRows){assert.equal(r.normalizedLower,'kappa/64');assert.equal(r.normalizedUpper,'2');assert.equal(r.exercisedMemberPositivityCertified,false);}
  assert.deepEqual(d.uniformFamily.positiveInverse.exactResidual,['0','0']);
  assert.equal(d.uniformFamily.positiveInverse.flatEndpoints,'y_plus=y_minus=0');
});

test('all six finite H integrals retain actual expression roots, nonzero tails and the false numerical-limit flags',()=>{
  const p=panel('uniform-covariance-finite-integrals');assert.equal(p.kind,'TABLE');assert.equal(p.table.totalRows,6);assert.equal(p.scene.points.length,0);
  assert.equal(d.exercisedMember.nonzeroTailRetained,true);assert.equal(d.exercisedMember.finiteTermsEqualSolution,false);
  assert.equal(d.exercisedMember.actualNumericalWholeHQuadrature,false);
  for(const r of d.finiteIntegralRows){
    assert.equal(r.terms,request.input.terms);assert.equal(r.finiteApproximationEqualsLimit,false);assert.equal(r.numericQuadratureExecuted,false);
    assert.match(r.tailFormula,/exp\(K\*L\).*\(N\+1\)!/);
    assert.notEqual(r.lowerRoot,r.upperRoot);assert.notEqual(r.approximateIntegralRoot,r.exactIntegralRoot);
    for(const k of ['approximateIntegralRoot','exactIntegralRoot','lowerRoot','upperRoot','absoluteErrorRoot','factorialTailRoot'])assert(Number.isSafeInteger(r[k])&&r[k]>=0);
  }
  assert(p.relatedTables[0].rows.some(r=>r[0]==='이번 예제가 인증 band에 포함됨을 증명'&&r[1]===false));
});

test('the complete partition counts 81 candidate boxes once with both signs inside and never claims every candidate is active',()=>{
  const p=panel('uniform-covariance-partition');assert.equal(p.table.totalRows,81);assert.equal(d.partitionRows.length,81);
  assert.equal(new Set(d.partitionRows.map(r=>r.key)).size,81);
  assert(d.partitionRows.every(r=>r.countInGlobalSum===1&&r.signColumns.length===2&&r.signColumns[0]===1&&r.signColumns[1]===-1));
  assert.equal(p.observation.maximumPositiveBoxes,16);assert.equal(p.observation.allCandidatesAssertedActive,false);
  assert.equal(p.observation.plusMinusAreColumnsInsideBox,true);
  assert.equal(d.uniformFamily.global730.eachSlowBoxCountedOnce,true);
  assert.equal(d.uniformFamily.global730.allCrossLabelProductsVanish,true);
  const labels=p.relatedTables.find(t=>t.title.includes('실제 절대 band'));
  assert.equal(labels.totalRows,81);assert.equal(labels.rows.length,81);
  for(const [i,r] of d.partitionRows.entries()){
    const a=r.actualLabel;assert.equal(a.key,r.key);assert.equal(a.grid.length,3);assert.equal(a.colors.length,2);assert.equal(a.centers.length,2);assert.equal(a.countInGlobalSum,1);
    assert.deepEqual(labels.rows[i],[a.key,a.ell,a.Q,a.grid,a.colors,a.centers,1]);
    assert.equal(labels.cellSourcePaths[i][3],'result.results.partitionRows['+i+'].actualLabel.grid');
  }
  const actual=d.sourceProofs.actualPartitionCoordinates;
  assert.match(actual.identity,/floor/);assert.match(actual.profileCompatibility,/exactly/);assert.equal(actual.bands.length,3);
  assert(p.relatedTables.some(t=>t.sourcePaths.includes('result.results.sourceProofs.actualPartitionCoordinates.profileCompatibility')));
  assert(p.details.some(x=>x.sourcePath==='result.results.sourceProofs.actualPartitionCoordinates'));
});

test('positive source thresholds and graph roots stay symbolic while the compact result and complete panel set fit eight MiB',()=>{
  const p=panel('uniform-covariance-domain'),q=d.uniformFamily.threshold.qStar;
  assert.equal(q.operation,'exp');assert(Number.isSafeInteger(q.rootId));assert(Array.isArray(q.arguments));
  assert.equal(p.scene.points.length,0);assert.match(p.description,/q\*=2\^.*>0/);
  assert.equal(d.uniformFamily.threshold.sourceOnly,true);assert.equal(d.uniformFamily.threshold.anchorChangesThreshold,false);
  assert.equal(d.graph.graphIncluded,false);assert.equal(d.graph.nodes,undefined);assert.match(d.graph.sha256,/^[a-f0-9]{64}$/);
  const bytes=value=>new TextEncoder().encode(canonicalStringify(value)).length;
  assert(bytes(result)<8*1024*1024);assert(bytes(panels)<8*1024*1024);
  assert(d.graph.canonicalBytes>bytes(d),'the whole graph is referenced, not copied into the receipt');
  assert.equal(p.observation.exactExpressionIdsArePhysicalValues,false);assert.equal(p.observation.fullGraphDuplicatedInReceipt,false);
  assert.deepEqual(d.uniformFamily.certifiedDomain.representative.X,['Xa','Xb']);
  assert.deepEqual(d.uniformFamily.certifiedDomain.slowPoint.profileX,['Xa/2','2*Xb']);
});

test('source checks preserve the final criterion and the explicitly separate mathematical obligations',()=>{
  const p=panel('uniform-covariance-source-checks');assert.equal(p.table.totalRows,d.checks.length);assert(d.checks.length>10&&d.checks.every(r=>r.pass));
  assert.equal(d.originalCriterion.id,'N5-06');assert.equal(d.originalCriterion.status,'PASS');
  assert.equal(d.scope.exactFunctionalConstruction,true);assert.equal(d.scope.newLeanKernelProof,false);
  assert.equal(d.scope.actualNumericalWholeHQuadrature,false);assert.equal(d.scope.allSlowDerivativeBoundsComputed,false);
  const scope=p.relatedTables[0];for(const key of ['allSlowDerivativeBoundsComputed','fullNavierStokesSolutionOrRegularityClaim','newLeanKernelProof']){
    const i=scope.sourcePaths.indexOf('result.results.scope.'+key);assert(i>=0);assert.equal(scope.rows[i][1],false);
  }
});

function fakeCanvas(width){
  const calls=[],style={},ctx=new Proxy({},{get:(o,k)=>o[k]??((...a)=>{if(['moveTo','lineTo','arc','fillRect','strokeRect','fillText'].includes(k))calls.push([k,...a]);}),set:(o,k,v)=>(o[k]=v,true)});
  return {calls,style,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height:Math.max(420,parseFloat(style.minHeight)||0),left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
}

test('all ten panels render finite mobile and desktop commands with two distinct exact global residual cells',()=>{
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{for(const width of [360,960]){
    const canvas=fakeCanvas(width),scene=new SourceBoundScene(canvas);
    for(const p of panels){
      canvas.calls.length=0;scene.setVisualization({...p,state:'READY',binding:{jobId:job.id,inputHash:job.inputHash,resultHash:job.resultHash,sourceHash:result.sourceHash}});
      assert.equal(canvas.dataset.renderReady,'true');assert.equal(canvas.dataset.sourceJobId,job.id);assert(canvas.calls.length>0,p.id);
      for(const call of canvas.calls)for(const v of call.slice(1))if(typeof v==='number')assert(Number.isFinite(v),p.id+' '+call[0]);
      for(const mark of scene.projected){assert(mark.xy.every(Number.isFinite));if(mark.sourcePath)assert.notEqual(get(mark.sourcePath),undefined,mark.sourcePath);}
      if(p.id==='main'){assert.equal(scene.projected.length,2);assert.equal(canvas.calls.filter(c=>c[0]==='fillText'&&c[1]==='0').length,2);}
    }
    scene.destroy();
  }}finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver;}
});

test('row and mark budgets preserve originals and failed or changed inputs cannot expose an earlier certified chart',()=>{
  const before=canonicalStringify(job),small=actualSourcePanels(job,{maxPoints:7,maxRows:9});
  const ops=small.find(p=>p.id==='uniform-covariance-operator-bounds');assert(ops.scene.points.length<=7);assert(ops.lod.originalPoints>7);
  const part=small.find(p=>p.id==='uniform-covariance-partition');assert.equal(part.table.totalRows,81);assert.equal(part.table.rows.length,9);assert(part.table.truncated);
  for(const p of small){tableBinding(p.table);p.relatedTables.forEach(t=>tableBinding(t));assert(p.table.rows.length<=9);}
  assert.equal(canonicalStringify(job),before);assert.deepEqual(actualSourcePanels(job,{currentEditorMatches:false}),[]);
  assert.deepEqual(actualSourcePanels({...job,result:{...result,results:{...d,pass:false}}}),[]);
  for(const status of ['FAILED','CANCELLED','UNSUPPORTED','BUDGET_EXCEEDED','PRECISION_REQUIRED']){
    const failed={...job,status};assert.deepEqual(actualSourcePanels(failed),[]);const view=makeM2Visualization(failed);assert.equal(view.kind,'STATE');assert.equal(view.scene.points.length,0);
  }
  const stale=makeM2Visualization(job,{currentRequest:{...request,input:{...request.input,terms:0}}});assert.equal(stale.state,'INPUT_CHANGED');assert.equal(stale.scene.points.length,0);
});

test('long symbolic positive scales wrap without conversion to zero or Infinity',()=>{
  // A display-only stress fixture; it is never used as a mathematical source.
  const copy=structuredClone(job),exact='exp(-('+('9'.repeat(2400))+'))';copy.result.results.normalizationRows[3].exactValue=exact;
  const p=actualSourcePanels(copy).find(p=>p.id==='uniform-covariance-normalization');
  assert.equal(p.table.rows[3][1],exact);assert.equal(p.scene.points.length,0);tableBinding(p.table,copy);
  const doc={createElement(tag){return {tagName:tag.toUpperCase(),style:{},dataset:{},children:[],append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},setAttribute(){}};}};
  const body=doc.createElement('tbody');body.ownerDocument=doc;body.closest=()=>null;
  renderObservationTable(null,body,p);assert.equal(body.children[3].children[1].textContent,exact);assert.equal(body.children[3].children[1].style.overflowWrap,'anywhere');
});
