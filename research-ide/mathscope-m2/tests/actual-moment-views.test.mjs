import test from 'node:test';
import assert from 'node:assert/strict';
import {run,validateRequest} from '../navier/index.mjs';
import {actualSourcePanels} from '../visualization/actual-source-panels.mjs';
import {makeM2Visualization} from '../visualization/m2-views.mjs';
import {SourceBoundScene} from '../visualization/renderer.mjs';

const request={kind:'ns.actual-moment-restoration',input:{terms:0,bits:128,etaOrder:2,heatIterations:0}};
const result=await run(request.kind,request.input);
const job={id:'actual-moment-source-view',request,result,status:result.status,inputHash:'actual-moment-input',resultHash:result.resultHash};
const get=path=>path.replace(/\[\*\]/g,'[0]').replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],job);
const panels=actualSourcePanels(job);
function tableBinding(table){
  assert.equal(table.rows.length,table.sourcePaths.length);
  table.rows.forEach((r,i)=>{
    assert.notEqual(get(table.sourcePaths[i]),undefined,table.sourcePaths[i]);
    assert.equal(r.length,table.columns.length);
    r.forEach((v,j)=>{const path=table.cellSourcePaths[i][j];if(path)assert.deepEqual(v,get(path),path);});
  });
}

test('all eight actual moment panels retain exact source values and source, request and result bindings',()=>{
  assert.equal(result.status,'COMPLETED',result.message);
  assert.equal(panels.length,8);assert.equal(new Set(panels.map(p=>p.id)).size,8);
  const before=JSON.stringify(job);
  for(const panel of panels){
    for(const point of panel.scene.points){assert(point.pos.every(Number.isFinite));assert.deepEqual(point.value,get(point.sourcePath),point.sourcePath);}
    tableBinding(panel.table);panel.relatedTables.forEach(tableBinding);
    panel.axisMetadata.forEach(a=>assert.notEqual(get(a.sourceField),undefined,a.sourceField));
    panel.details.forEach(d=>assert.notEqual(get(d.sourcePath),undefined,d.sourcePath));
    const view=makeM2Visualization(job,{panel:panel.id});assert.equal(view.state,'READY');
    assert.equal(view.binding.inputHash,job.inputHash);assert.equal(view.binding.resultHash,job.resultHash);
    assert.equal(view.binding.sourceHash,result.sourceHash);assert.equal(view.binding.panelId,panel.id);
  }
  assert.equal(JSON.stringify(job),before);
});

test('the support diagram distinguishes the actual first heat tail and preserves symbolic endpoint order',()=>{
  const p=panels[0];assert.equal(p.kind,'ORDERED_SUPPORTS');
  assert.deepEqual(p.chart.endpoints.map(x=>x.label),['X₋','X₊','X_b']);
  assert.deepEqual(p.chart.rows.map(x=>[x.fromIndex,x.toIndex]),[[0,2],[0,1],[0,1],[0,1]]);
  assert(p.chart.rows.every(r=>r.verified));assert.equal(p.scene.points.length,8);
  assert.equal(result.results.supportRows.filter(r=>r.evidence.heatIdentityRequired).length,1);
  assert.equal(result.results.supportRows[0].evidence.heatIdentityVerified,true);
  for(const r of result.results.supportRows){
    assert.equal(r.exactTotalResidual,'0');assert(r.evidence.innerPDEVerified&&r.evidence.sourceOrderVerified);
    assert(r.positionMeaning.includes('not physical X'));assert.equal(typeof r.fromRoot,'number');
  }
  assert.equal(p.observation.supportCoordinatesAreOrderOnly,true);
});

test('ten matrix cells are actual corrected function identities, with all incoming and correction roots retained',()=>{
  const p=panels.find(p=>p.id==='actual-moment-identities');
  assert.deepEqual(p.chart.values,[['0','0','0','0','0'],['0','0','0','0','0']]);
  p.chart.sourcePaths.flat().forEach(path=>assert.equal(get(path),'0'));
  const ms=result.results.momentIdentities;assert.equal(ms.length,10);
  for(const m of ms){
    assert.equal(m.identityProof.pass,true);assert.equal(m.identityProof.numeratorMonomials,0);
    assert(m.identityProof.denominatorMonomials>0);assert.equal(m.identityProof.analyticOperandsReplacedByNumericalValues,false);
    assert(Number.isSafeInteger(m.rawDebtRoot));assert(Number.isSafeInteger(m.correctionRoot));assert(Number.isSafeInteger(m.correctedResidualRoot));
    assert.equal(m.exactResidual,'0');assert(m.valueMeaning.includes('no numerical debt magnitude'));
  }
  assert.equal(p.table.totalRows,10);
});

test('source gates expose generated n2 and not-yet-generated n3, while PDE and conservation panels retain negative controls',()=>{
  assert.deepEqual(result.results.sourceGates.map(g=>g.actualNextSourceGenerated),[true,false]);
  assert(result.results.sourceGates.every(g=>g.beforeCorrectionRejected&&g.copiedReportRejected&&g.afterCorrectionAccepted&&g.pass));
  const p=panels.find(p=>p.id==='actual-moment-source-gates');
  assert(p.chart.rows[1][1].includes('다음 소스 생성 false'));
  assert.equal(panels.find(p=>p.id==='actual-moment-inner-pde').table.totalRows,12);
  assert.equal(panels.find(p=>p.id==='actual-moment-conservation').table.totalRows,4);
  for(const inner of result.results.innerProofs){assert(inner.negativeControl.correctlyRejected);assert.equal(inner.finitePicardIterateCertifiedAsSolution,false);}
  assert.equal(result.results.heatExterior.negativeControl.correctlyRejected,true);
  assert(result.results.conservation.rewriteTrace.length>0);
});

test('the compact graph and precision ledger report constructive exactness without numerical global quadrature',()=>{
  const d=result.results;assert.match(d.graph.sha256,/^[a-f0-9]{64}$/);
  assert(d.graph.nodeCount>10000);assert(d.graph.serializedProgramBytes>JSON.stringify(d).length);
  assert.equal(d.graph.graphIncludedInReceipt,false);assert.equal(d.arithmetic.observedNumericDebtValues,false);
  assert.equal(d.scope.globalSignedMomentValuesNumericallyEnclosed,false);assert.equal(d.scope.allOrdersConstructed,false);
  assert.equal(result.precisionLedger.numericalGlobalMomentQuadrature,false);assert.equal(result.precisionLedger.arithmeticBits,null);
  assert.equal(result.precisionLedger.fullResultExact,false);assert.equal(result.precisionLedger.finiteTermsAreNotTheSolution,true);
  for(const p of panels){assert.equal(p.observation.rawNumericDebtValuesDisplayed,false);assert.equal(p.observation.numericalGlobalQuadratureComplete,false);assert.equal(p.observation.globalOriginalCriteriaComplete,false);}
});

test('all actual moment panels render finite narrow and wide geometry and display every zero and support row',()=>{
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{for(const width of [360,960]){
    const calls=[],style={},ctx=new Proxy({},{get:(o,k)=>o[k]??((...a)=>{if(['moveTo','lineTo','arc','fillRect','strokeRect','fillText'].includes(k))calls.push([k,...a]);}),set:(o,k,v)=>(o[k]=v,true)});
    const canvas={style,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height:Math.max(420,parseFloat(style.minHeight)||0),left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
    const scene=new SourceBoundScene(canvas);
    for(const p of panels){
      calls.length=0;scene.setVisualization({...p,state:'READY',binding:{jobId:job.id}});assert(calls.length>0,p.id);
      for(const c of calls)for(const v of c.slice(1))if(typeof v==='number')assert(Number.isFinite(v),p.id+' '+c[0]);
      if(p.id==='main'){assert.equal(canvas.dataset.renderer,'CPU_CANVAS2D_ORDERED_SUPPORTS');assert.equal(scene.projected.length,8);for(const r of p.chart.rows)assert(calls.some(c=>c[0]==='fillText'&&c[1]===r.label));}
      if(p.id==='actual-moment-identities'){assert.equal(scene.projected.length,10);assert.equal(calls.filter(c=>c[0]==='fillText'&&c[1]==='0').length,10);}
    }
    scene.destroy();
  }}finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver;}
});

test('table budgets and stale or failed editor states preserve the actual result and hide old charts',()=>{
  const before=JSON.stringify(result),small=actualSourcePanels(job,{maxRows:3});
  assert.equal(small[1].table.totalRows,10);assert.equal(small[1].table.rows.length,3);assert(small[1].table.truncated);
  assert.equal(JSON.stringify(result),before);assert.deepEqual(actualSourcePanels(job,{currentEditorMatches:false}),[]);
  for(const status of ['FAILED','CANCELLED','UNSUPPORTED','PRECISION_REQUIRED'])assert.deepEqual(actualSourcePanels({...job,status}),[]);
});

test('preflight rejects substituted parameters, unsupported orders and numerical precision claims',()=>{
  for(const input of [{h:0},{debt:[0,0,0,0,0]},{sourceProfile:'different-profile'},{terms:3},{etaOrder:3},{heatIterations:3},{bits:15}])assert.equal(validateRequest({kind:request.kind,input}).ok,false,JSON.stringify(input));
  for(const precision of [{mode:'FLOAT64'},{mode:'FORMAL'},{mode:'DIRECTED_BIGINT'},{mode:'EXACT_CONSTRUCTIVE',bits:192}])assert.equal(validateRequest({...request,precision}).ok,false,JSON.stringify(precision));
  assert.equal(validateRequest({...request,precision:{mode:'EXACT_CONSTRUCTIVE',bits:128}}).ok,true);
  assert.equal(validateRequest({...request,budget:{maxOperations:1000}}).ok,false);
});
