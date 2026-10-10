import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateActualCorePoint} from '../navier/actual-core-evaluator.mjs';
import {actualCorePanels} from '../visualization/actual-core-panels.mjs';
import {SourceBoundScene} from '../visualization/renderer.mjs';
import {executeDomain,validateDomainRequest} from '../core/registry.mjs';
import {validateRequest,runJob} from '../navier/index.mjs';

const request=input=>({kind:'ns.actual-core-evaluation',input});
const job=input=>({id:'actual-core',request:request(input),inputHash:'input',resultHash:'result',status:'PARTIAL',result:{status:'PARTIAL',results:evaluateActualCorePoint(input)}});
const get=(j,p)=>p.replace(/\[\*\]/g,'[0]').replace(/\[(\d+)\]/g,'.$1').split('.').reduce((o,k)=>o?.[k],j);
function sourceTable(j,t){
  assert.equal(t.rows.length,t.sourcePaths.length);assert.equal(t.rows.length,t.cellSourcePaths.length);
  for(let i=0;i<t.rows.length;i++){
    assert.notEqual(get(j,t.sourcePaths[i]),undefined,t.sourcePaths[i]);
    for(let k=0;k<t.rows[i].length;k++)if(t.cellSourcePaths[i][k])assert.deepEqual(t.rows[i][k],get(j,t.cellSourcePaths[i][k]));
  }
  assert(t.exactValuesUnabridged);assert.equal(t.cellLayout.overflowWrap,'anywhere');
}
test('all five actual core views retain exact source cells, intervals and explicit derivative normalization',()=>{
  const j=job({}),before=JSON.stringify(j),panels=actualCorePanels(j);
  assert.equal(panels.length,5);assert.deepEqual(panels.map(p=>p.scene.points.length),[9,6,6,4,0]);
  for(const p of panels){
    assert.equal(p.observation.globalOriginalCriteriaComplete,false);assert.equal(p.observation.physicalDimension,0);assert.equal(p.scene.lines.length,0);
    for(const m of p.scene.points){assert.deepEqual(m.value,get(j,m.sourcePath));assert.deepEqual(m.displayEnclosure,get(j,m.displaySourcePath));assert(m.pos.every(Number.isFinite));assert(m.lower<=m.midpoint&&m.midpoint<=m.upper);}
    for(const t of [p.table,...p.relatedTables])sourceTable(j,t);
    for(const a of p.axisMetadata){assert.notEqual(get(j,a.sourceField),undefined);for(const f of a.sourceFields||[])assert.notEqual(get(j,f),undefined);}
    for(const d of p.details)assert.notEqual(get(j,d.sourcePath),undefined);
  }
  assert.equal(JSON.stringify(j),before);
  assert.match(panels[0].axisMetadata[0].transform,/row index/);assert.match(panels[1].axisMetadata[0].transform,/component index/);
  assert.equal(panels[1].axisMetadata[1].sourceFields.length,2);
});
test('direct zero and scaled zero retain distinct source normalizations in actual U view',()=>{
  for(const kind of ['DIRECT_RATIONAL','J_SCALED','RHO_SCALED']){
    const j=job({Y:'4',eta:{kind,value:'0'}}),p=actualCorePanels(j).find(x=>x.id==='actual-core-axial-values');
    assert.equal(p.table.rows[0][1],kind==='DIRECT_RATIONAL'?'ORDINARY_ETA_DERIVATIVE':'DIVIDE_BY_POSITIVE_J0');
    assert(p.table.rows.slice(1).every(r=>r[1]==='ORDINARY_ETA_DERIVATIVE'));sourceTable(j,p.table);
  }
});
test('positive nonlinear floor survives precision changes and analytic extension is not physical collar',()=>{
  const a=job({Y:'41/10',eta:{kind:'DIRECT_RATIONAL',value:'1/4'},bits:192}),b=job({Y:'41/10',eta:{kind:'DIRECT_RATIONAL',value:'1/4'},bits:384});
  const x=a.result.results,y=b.result.results;
  assert.equal(x.domain.sourcePosition,'NATURAL_ANALYTIC_EXTENSION_FOR_B26_INPUT_ONLY');assert.equal(x.domain.B26CutoffApplied,false);
  for(let i=0;i<x.phi.rows.length;i++){assert.equal(x.phi.rows[i].positiveNonlinearErrorUpper,y.phi.rows[i].positiveNonlinearErrorUpper);assert.notEqual(x.phi.rows[i].positiveNonlinearErrorUpper,'0');}
  for(const p of actualCorePanels(a)){assert.equal(p.observation.physicalCollarEvaluated,false);sourceTable(a,p.table);}
});
test('LOD and invalid display data never change exact computations or invent finite marks',()=>{
  const j=job({}),before=JSON.stringify(j);
  for(const p of actualCorePanels(j,{maxPoints:2,maxRows:2})){assert(p.scene.points.length<=2);assert(p.table.rows.length<=2);sourceTable(j,p.table);assert.equal(p.lod.changesComputation,false);}
  assert.equal(JSON.stringify(j),before);
  j.result.results.phi.rows[2].actualNonlinearInterval.displayEnclosure=[NaN,Infinity];
  const p=actualCorePanels(j)[0];assert.equal(p.scene.points.length,8);assert.equal(p.lod.invalidCoordinates,1);assert(p.scene.points.every(x=>x.pos.every(Number.isFinite)));
  assert.deepEqual(actualCorePanels(j,{currentEditorMatches:false}),[]);assert.deepEqual(actualCorePanels({...j,status:'CANCELLED'}),[]);
});
test('all five panels produce finite CPU Canvas geometry at narrow and wide layouts',()=>{
  const old=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{const j=job({});for(const panel of actualCorePanels(j))for(const width of [360,960]){
    let count=0;const ctx=new Proxy({},{get:(t,k)=>t[k]??((...args)=>{count++;for(const a of args)if(typeof a==='number')assert(Number.isFinite(a));}),set:(t,k,v)=>(t[k]=v,true)});
    const canvas={dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height:420,left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
    const scene=new SourceBoundScene(canvas);scene.setVisualization({...panel,state:'READY',binding:{jobId:j.id,inputHash:j.inputHash,resultHash:j.resultHash}});
    assert(count>0);assert.equal(canvas.dataset.renderReady,'true');assert.equal(canvas.dataset.sourceJobId,j.id);scene.destroy();
  }}finally{if(old)globalThis.ResizeObserver=old;else delete globalThis.ResizeObserver;}
});
test('core preflight and execution agree on null containers, exact coordinate and precision contracts',async()=>{
  const bad=[request(null),request({eta:null}),request({Y:'42/10'}),request({eta:{kind:'DIRECT_RATIONAL',value:'1/0'}}),request({eta:{kind:'J_SCALED',value:'2'}}),{...request({bits:192}),precision:{mode:'DIRECTED_BIGINT',bits:256}},{...request({}),precision:{mode:'FLOAT64'}},{...request({}),budget:{maxItems:1}}];
  for(const r of bad){assert.equal(validateRequest(r).ok,false,JSON.stringify(r));const result=await runJob(r);assert(['FAILED','PRECISION_REQUIRED','BUDGET_EXCEEDED'].includes(result.status));}
  const r={...request({Y:'41/10',eta:{kind:'DIRECT_RATIONAL',value:'1/4'}}),precision:{mode:'DIRECTED_BIGINT',bits:256}};
  assert.equal((await validateDomainRequest(r)).ok,true);const v=await executeDomain(r);assert.equal(v.precisionLedger.arithmeticBits,256);assert.equal(v.results.arithmetic.bits,256);assert.equal(v.results.scope.wholeOriginalProfileEvaluatorComplete,false);
  assert.equal((await validateDomainRequest({...request({}),precision:{mode:'EXACT'}})).code,'PRECISION_REQUIRED');
});
