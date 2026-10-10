import test from 'node:test';
import assert from 'node:assert/strict';
import {actualGlobalSourceConstruction} from '../navier/actual-global-source.mjs';
import {actualGlobalPanels} from '../visualization/actual-global-panels.mjs';
import {SourceBoundScene,renderObservationTable} from '../visualization/renderer.mjs';

const makeJob=(input={},id='actual-global-source')=>({id,status:'PARTIAL',inputHash:'input-'+id,resultHash:'result-'+id,request:{kind:'ns.actual-global-source',input},result:{status:'PARTIAL',sourceHash:'retained-source-'+id,results:actualGlobalSourceConstruction(input)}});
const source=makeJob();
const get=(job,path)=>path.replace(/\[\*\]/g,'[0]').replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],job);
const deepFreeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);for(const v of Object.values(x))deepFreeze(v);}return x;};
deepFreeze(source);

function checkTable(job,t){
  assert.equal(t.rows.length,t.sourcePaths.length);assert.equal(t.rows.length,t.cellSourcePaths.length);
  assert.equal(t.exactValuesUnabridged,true);assert.equal(t.cellLayout.overflowWrap,'anywhere');
  t.rows.forEach((r,i)=>{
    assert.match(t.sourcePaths[i],/^result\.results\./);assert.notEqual(get(job,t.sourcePaths[i]),undefined,t.sourcePaths[i]);assert.equal(r.length,t.columns.length);
    r.forEach((v,j)=>{const p=t.cellSourcePaths[i][j];if(p){assert.match(p,/^result\.results\./);assert.deepEqual(v,get(job,p),p);}});
  });
}

function checkFiniteGeometry(panel){
  assert.equal(panel.scene.lines.length,0);assert.equal(panel.scene.arrows.length,0);
  for(const p of panel.scene.points){assert.equal(p.pos.length,3);assert(p.pos.every(Number.isFinite));}
  for(const s of panel.chart.series||[])for(const p of s.points){assert([p.x,p.y,p.lower,p.upper,p.midpoint].every(Number.isFinite));assert(p.lower<=p.midpoint&&p.midpoint<=p.upper);}
  assert.equal(panel.lod.displayedPoints,panel.scene.points.length);assert.equal(panel.lod.changesComputation,false);
}

test('four additive panels preserve immutable retained data and leave runtime binding to the parent',()=>{
  const before=JSON.stringify(source),panels=actualGlobalPanels(source);
  assert.deepEqual(panels.map(p=>p.id),['main','reduced-moments','modulation-remainder','outer-program']);
  for(const p of panels){
    assert(p.title&&p.description);assert(p.table.rows.length);assert.equal(p.sourceRoot,'result.results');assert.equal(p.binding,undefined);
    assert.equal(p.observation.sourceProfileId,source.result.results.profileId);assert.equal(p.observation.parameterExpressionSHA256,source.result.results.parameterExpressionSHA256);
    assert.equal(p.observation.globalOriginalCriteriaComplete,false);assert.equal(p.observation.reconstructionAllowed,false);assert.equal(p.observation.physicalDimension,0);checkFiniteGeometry(p);
  }
  assert.equal(JSON.stringify(source),before);
});

test('every displayed point, exact table cell, axis and detail resolves to its actual result field',()=>{
  for(const p of actualGlobalPanels(source)){
    for(const mark of p.scene.points){assert.match(mark.sourcePath,/^result\.results\.outerObservations\.rows\[\d+\]\.values\[\d+\]\.interval$/);assert.deepEqual(mark.value,get(source,mark.sourcePath));assert.deepEqual(mark.interval,get(source,mark.sourcePath));}
    for(const group of p.chart.series||[])for(const mark of group.points){assert.equal(mark.x,get(source,mark.xSourcePath));assert.equal(get(source,mark.sourceEtaPath),.25);assert(get(source,mark.sourceRadiusPath).product);}
    checkTable(source,p.table);for(const t of p.relatedTables)checkTable(source,t);
    for(const a of p.axisMetadata){assert.match(a.sourceField,/^result\.results\./);assert.notEqual(get(source,a.sourceField),undefined,a.sourceField);}
    for(const d of p.details)assert.notEqual(get(source,d.sourcePath),undefined,d.sourcePath);
  }
});

test('default outer source has three unconnected series of five actual interval observations',()=>{
  const p=actualGlobalPanels(source)[0];assert.equal(p.kind,'SERIES');assert.equal(p.scene.points.length,15);assert.equal(p.table.totalRows,15);assert.equal(p.chart.series.length,3);
  assert.deepEqual(p.chart.series.map(s=>s.id),['U_over_E','M_over_XE','V_over_XE']);
  p.chart.series.forEach((s,j)=>{
    assert.equal(s.points.length,5);assert.equal(s.connect,false);assert.deepEqual(s.points.map(x=>x.x),[.5,1,2,5,9]);
    s.points.forEach((mark,i)=>{const expected=source.result.results.outerObservations.rows[i].values[j].interval;assert.deepEqual([mark.lower,mark.upper],expected);assert.equal(mark.y,expected[0]/2+expected[1]/2);});
  });
  assert.equal(p.observation.intervalBarsDrawn,false);assert.equal(p.observation.interpolationBetweenSourcePoints,false);assert.equal(p.observation.rawPhysicalFieldValueDisplayed,false);assert.equal(p.observation.globalIntegralsEvaluated,false);
});

test('historical globalSource prefixes cannot redirect source-bound marks away from the wrapper result',()=>{
  const job=structuredClone(source);for(const r of job.result.results.outerObservations.rows)for(const v of r.values)v.sourceField='forged.unrelated.value';
  job.result.results.reduction.axisBoundary.sourceField='forged.axis.value';
  for(const panel of actualGlobalPanels(job)){
    for(const p of panel.scene.points){assert(!p.sourcePath.includes('globalSource'));assert(!p.sourcePath.includes('forged'));assert.deepEqual(p.value,get(job,p.sourcePath));}
    checkTable(job,panel.table);for(const t of panel.relatedTables)checkTable(job,t);
  }
});

test('huge actual physical X remains exact and does not replace the normalized xi coordinate',()=>{
  const p=actualGlobalPanels(source)[0];assert.equal(p.observation.physicalXConvertedToBinary64,false);
  for(const mark of p.scene.points){
    const actual=source.result.results.outerObservations.rows[mark.sourceIndex];assert.equal(actual.XBinary64,null);assert.deepEqual(get(source,mark.sourceRadiusPath),actual.XExactExpression);
    assert.equal(mark.x,actual.xi);assert(mark.x>0);
  }
  assert(p.table.rows.every(r=>/^Xp\*exp\(.+\/lambda\)$/.test(r[5])));assert(p.table.rows.every(r=>r[6]==='ACTUAL_UNMODIFIED_OUTER_MAIN_PULSE'));
});

test('six reduced integral definitions never become numeric moments and retain the actual axis boundary and both signs',()=>{
  const p=actualGlobalPanels(source).find(p=>p.id==='reduced-moments');assert.equal(p.kind,'TABLE');assert.equal(p.scene.points.length,0);assert.equal(p.table.totalRows,9);
  assert.deepEqual(p.table.rows.slice(0,6).map(r=>r[0]),['Jminus1','Jzero','Hminus1','Hzero','Kminus2','Kminus1']);
  for(const [,v]of p.table.rows.slice(0,6)){assert.equal(v.actualSourceValuesEvaluated,false);assert.equal(v.smoothAtAxis,true);assert.deepEqual(v.domain,['0','Xv']);assert.equal(v.value,undefined);}
  const axis=p.table.rows[6][1];assert.deepEqual(axis.valueInterval,source.result.results.reduction.axisBoundary.valueInterval);assert.equal(axis.etaZeroExact,'-4');assert.equal(axis.positiveHAndJNotReplacedByZero,true);
  assert.match(p.table.rows[7][1].momentDebtSign,/-P/);assert.match(p.table.rows[8][1].momentDebtSign,/\+F/);
  assert.equal(p.observation.sixActualGlobalIntegralsEvaluated,false);assert.equal(p.observation.actualAxisBoundaryEvaluated,true);assert.equal(p.observation.missingIntegralValuesReplacedByZero,false);assert.equal(p.observation.actualIposInverseApplied,false);
  const zero=makeJob({eta:0},'axis-zero');
  const zeroAxis=actualGlobalPanels(zero).find(p=>p.id==='reduced-moments').table.rows[6][1];assert.deepEqual(zeroAxis.valueInterval,[-4,-4]);
});

test('actual C12 omission retains the original frequency and only certifies the two functional values',()=>{
  const p=actualGlobalPanels(source).find(p=>p.id==='modulation-remainder'),r=source.result.results.modulationRemainder;
  assert.equal(p.kind,'TABLE');assert.equal(p.scene.points.length,0);assert.equal(p.observation.absoluteRemainderOnly,true);assert.deepEqual(p.observation.etaDerivativeOrders,[0]);
  assert.equal(p.observation.functionalEtaDerivativeFamilyCertified,false);assert.equal(p.observation.N5PhaseOrGrowthCertificate,false);assert.equal(p.observation.preC12ValuesStillRequired,true);
  const values=p.table.rows.map(row=>row[1]);assert(values.includes(r.uniformFinalBound.exactUpper));assert(values.includes('1+ceil(R^50)'));assert(values.includes(true));
  assert.match(p.description,/절대오차/);assert.match(p.description,/도함수.*적용하지 않습니다/);assert.equal(r.scope.actualNReplacedOrAveraged,false);
  const differences=p.relatedTables[0].rows[0][1];assert.equal(differences.globalXvBoundByRRequired,false);assert.equal(differences.identicallyZeroOutsideJ,true);
});

test('outer program displays actual operand nodes without calling node IDs evaluated field values',()=>{
  const p=actualGlobalPanels(source).find(p=>p.id==='outer-program'),r=source.result.results.outerProgram;
  assert.equal(p.kind,'TABLE');assert.equal(p.scene.points.length,0);assert.equal(p.table.totalRows,20);assert.equal(p.observation.programNodeIDsAreFieldValues,false);
  p.table.rows.forEach(([name,id,node])=>{assert.equal(id,r.roots[name]);assert.deepEqual(node,r.nodes[id]);assert.equal(typeof node.op,'string');assert(Array.isArray(node.args));});
  assert.equal(p.observation.outerTailDefinitionCompiled,true);assert.equal(p.observation.outerTailIntegralsNumericallyEvaluated,false);assert.equal(p.observation.completeActualGlobalU0Compiled,false);
  const energy=p.relatedTables[0].rows.find(x=>x[0]==='짝을 이루는 A.2 reference 에너지 정규화')[1];assert.equal(energy.equalsFinalGlobalESquaredIntegral,false);
  const support=p.relatedTables[0].rows.find(x=>x[0]==='전체 axial support와 I1 이후의 실제 일치')[1];assert.equal(support.UAndMAndVIdenticallyZeroAfterXv,true);assert.equal(support.XvExpression,'Xp*exp(13/lambda)');
});

test('retained nondefault eta and unordered requested xi drive the view without using default fixtures',()=>{
  const job=makeJob({eta:-.5,xi:[.1,3,1]},'alternate'),p=actualGlobalPanels(job)[0];
  assert.equal(p.scene.points.length,9);assert.equal(p.observation.fixedEta,-.5);assert.deepEqual(p.chart.series[0].points.map(p=>p.x),[.1,3,1]);
  assert(p.chart.series[2].points.every(p=>p.upper<0));assert.notEqual(p.table.rows[0][0],'1/10','exact binary64 .1 is retained as its dyadic fraction');
  for(const panel of actualGlobalPanels(job)){checkTable(job,panel.table);for(const t of panel.relatedTables)checkTable(job,t);checkFiniteGeometry(panel);}
});

test('point and table LOD are separate source-preserving selections',()=>{
  const panels=actualGlobalPanels(source,{maxPoints:4,maxRows:3});
  for(const p of panels){assert(p.scene.points.length<=4);assert(p.table.rows.length<=3);assert.equal(p.table.truncated,p.table.totalRows>p.table.rows.length);checkFiniteGeometry(p);checkTable(source,p.table);for(const t of p.relatedTables){assert(t.rows.length<=3);checkTable(source,t);}}
  assert.equal(panels[0].lod.originalPoints,15);assert.equal(panels[0].lod.displayedPoints,4);assert.equal(panels[0].lod.invalidCoordinates,0);
  assert.deepEqual(actualGlobalPanels(source,{maxPoints:4,maxRows:3})[0].scene.points.map(p=>p.sourcePath),panels[0].scene.points.map(p=>p.sourcePath));
});

test('nonfinite or reversed intervals and coordinates are omitted instead of fabricating zeros or bridging gaps',()=>{
  const job=structuredClone(source),r=job.result.results.outerObservations.rows;
  r[0].values[1].interval=[NaN,Infinity];r[1].values[2].interval=[5,4];r[2].xi=Infinity;
  const p=actualGlobalPanels(job)[0];assert.equal(p.lod.originalPoints,15);assert.equal(p.lod.invalidCoordinates,5);assert.equal(p.scene.points.length,10);checkFiniteGeometry(p);
  assert(p.chart.series.every(s=>s.connect===false));assert(p.scene.points.every(m=>m.sourceIndex!==2));assert.match(p.table.rows[1][3],/미표시/);assert.equal(p.table.rows[5][3],5);assert.equal(p.table.rows[5][4],4);
  for(const row of r)for(const v of row.values)v.interval=[NaN,NaN];
  const none=actualGlobalPanels(job)[0];assert.equal(none.scene.points.length,0);assert.equal(none.lod.invalidCoordinates,15);assert.equal(none.table.totalRows,15);checkFiniteGeometry(none);
});

test('stale, running, failed, mismatched-kind and mismatched-schema results expose no actual-global panels',()=>{
  assert.deepEqual(actualGlobalPanels(null),[]);assert.deepEqual(actualGlobalPanels(source,{currentEditorMatches:false}),[]);
  for(const status of ['QUEUED','RUNNING','FAILED','CANCELLED','UNSUPPORTED','BUDGET_EXCEEDED','PRECISION_REQUIRED']){
    assert.deepEqual(actualGlobalPanels({...source,status}),[]);assert.deepEqual(actualGlobalPanels({...source,result:{...source.result,status}}),[]);
  }
  assert.deepEqual(actualGlobalPanels({...source,request:{kind:'ns.background-moments'}}),[]);
  assert.deepEqual(actualGlobalPanels({...source,result:{status:'PARTIAL',results:{schema:'other'}}}),[]);
  assert.deepEqual(actualGlobalPanels({...source,result:{status:'PARTIAL',results:{schema:source.result.results.schema}}}),[]);
});

function fakeCanvas(width,height){
  const calls=[],ctx=new Proxy({calls},{get(t,key){if(key in t)return t[key];return (...args)=>{assert(args.every(a=>typeof a!=='number'||Number.isFinite(a)),String(key)+' received nonfinite Canvas argument');calls.push([key,...args]);};},set(t,k,v){t[k]=v;return true;}});
  return {ctx,calls,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height,left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
}

test('all four panels render finite CPU Canvas commands and retain job binding on mobile and desktop',()=>{
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{for(const panel of actualGlobalPanels(source))for(const [width,height]of [[360,420],[960,520]]){
    const canvas=fakeCanvas(width,height),scene=new SourceBoundScene(canvas);
    scene.setVisualization({...panel,state:'READY',binding:{jobId:source.id,inputHash:source.inputHash,resultHash:source.resultHash,sourceHash:source.result.sourceHash}});
    assert.equal(canvas.dataset.renderReady,'true',panel.id);assert(canvas.calls.length);assert.match(canvas.dataset.renderer,/^CPU_CANVAS2D_/);assert.equal(canvas.dataset.sourceJobId,source.id);assert.equal(canvas.dataset.inputHash,source.inputHash);
    for(const mark of scene.projected){assert(mark.xy.every(Number.isFinite));if(mark.sourcePath)assert.notEqual(get(source,mark.sourcePath),undefined);}
    scene.destroy();
  }}finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver;}
});

test('HTML exact tables retain the full 2^-260 rational and actual AST operands without shortening',()=>{
  const doc={createElement(tag){return {tagName:tag.toUpperCase(),style:{},dataset:{},children:[],append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},setAttribute(){}};}};
  for(const id of ['modulation-remainder','outer-program']){
    const p=actualGlobalPanels(source).find(p=>p.id===id),body=doc.createElement('tbody');body.ownerDocument=doc;body.closest=()=>null;renderObservationTable(null,body,p);
    const i=id==='modulation-remainder'?2:0,j=id==='modulation-remainder'?1:2,td=body.children[i].children[j],value=p.table.rows[i][j];
    assert.equal(td.textContent,typeof value==='object'?JSON.stringify(value):String(value));assert.equal(td.style.overflowWrap,'anywhere');
    if(id==='modulation-remainder')assert(td.textContent.length>75);else assert(td.textContent.includes('smooth_piecewise'));
  }
});
